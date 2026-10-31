// United Kingdom (gb) — hand-composed redraw of everyday British dishes (mains, sides, soups)
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// ---------- このファイル専用の部品（gb〜） ----------
const xgbBlur = (p, s = 2) => `filter="url(#${p.def('gbbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xgbShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function xgbOutline(p, c, r = .55){
    const id = p.def('xgbOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
function xgbSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
// 重なりにくく散らした位置
function xgbSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('gbspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 小さな粒（色ごとに1本のpath）: グリンピース・ひき肉・刻みハーブなど
function xgbGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, rx = 2, ry = 1.4, seed = 1, sy = 1, hi = 0, jitter = .3, stroke = .35 } = {}){
    const R = rng(p.id + 'gbg' + seed + x + y);
    const ds = cols.map(() => ''); let hs = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const ax = rx * (1 - jitter / 2 + R() * jitter), ay = ry * (1 - jitter / 2 + R() * jitter);
        ds[Math.floor(R() * cols.length)] += `M${f(gx - ax)},${f(gy)}a${f(ax)},${f(ay)} 0 1 0 ${f(ax * 2)},0a${f(ax)},${f(ay)} 0 1 0 ${f(-ax * 2)},0Z`;
        if (hi && R() < hi) hs += `M${f(gx - ax * .5)},${f(gy - ay * .35)}l${f(ax * .6)},${f(-ay * .2)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .3)}" stroke-width="${stroke}"/>`).join('') + (hs ? `<path d="${hs}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".8"/>` : '');
}
// 刻みパセリ・コリアンダー
function xgbHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'] } = {}){
    const R = rng(p.id + 'gbh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R(); ds[i % cols.length] += `M${f(cx - rr)},${f(cy)}l${f(rr)},${f(-rr * .8)}l${f(rr)},${f(rr * .8)}l${f(-rr * .6)},${f(rr)}Z`; }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// チャイブ・スプリングオニオンの小口切り（小さな緑の輪）
function xgbChives(p, x, y, s, { n = 14, seed = 1, sy = 1, r = 1.6 } = {}){
    const R = rng(p.id + 'gbc' + seed + x);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy; const seg = `M${f(cx - r)},${f(cy)}a${r},${f(r * .85)} 0 1 0 ${f(r * 2)},0a${r},${f(r * .85)} 0 1 0 ${f(-r * 2)},0Z`; if (R() < .6) d1 += seg; else d2 += seg; }
    return `<path d="${d1}" fill="none" stroke="#4f9a34" stroke-width="1.1"/><path d="${d2}" fill="none" stroke="#7ab850" stroke-width="1.1"/>`;
}
// クリームのうず
function xgbSwirl(p, x, y, R, { turns = 1.6, c = '#fffaf0', w = 4, op = .9, start = 0 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = start + t * turns * 6.28, rr = R * (.12 + t * .88); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .4)}" transform="translate(.6 .9)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// 葉（ミント）
function xgbLeaf(p, x, y, L, r = 0, { c = '#3f8a33', w = .5 } = {}){
    const h = L * w / 2;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .1)},${f(-h * 1.6)} ${L / 2},0 Q${f(-L * .1)},${f(h * 1.6)} ${-L / 2},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <path d="M${f(-L * .44)},0 L${f(L * .4)},0" stroke="${lt(c, .45)}" stroke-width=".7"/>${[-.2, .05, .25].map(t => `<path d="M${f(L * t)},0 l${f(L * .1)},${f(-h * .6)} M${f(L * t)},0 l${f(L * .1)},${f(h * .6)}" stroke="${lt(c, .35)}" stroke-width=".5" opacity=".8"/>`).join('')}</g>`;
}
// コリアンダーの葉（3つに分かれた丸い葉）
function xgbCoriander(p, x, y, s, r = 0, { c = '#4a9a3a' } = {}){
    const lobe = (a, k) => `<g transform="rotate(${a})"><path d="M0,${f(-s * .1)} Q${f(-s * .22 * k)},${f(-s * .3)} ${f(-s * .12 * k)},${f(-s * .48)} Q0,${f(-s * .56)} ${f(s * .12 * k)},${f(-s * .48)} Q${f(s * .22 * k)},${f(-s * .3)} 0,${f(-s * .1)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M0,${f(-s * .12)} L0,${f(-s * .46)}" stroke="${lt(c, .45)}" stroke-width=".6"/></g>`;
    return `<g ${T(x, y, r)}><path d="M0,${f(s * .35)} L0,${f(-s * .1)}" stroke="#7fb060" stroke-width="1"/>${lobe(0, 1)}${lobe(-58, .9)}${lobe(58, .9)}</g>`;
}
// マッシュポテトの面（スプーンでならした筋）
function xgbMashSwirl(p, x, y, R, { c = '#f3dc9a', seed = 1, sy = 1 } = {}){
    const Rn = rng(p.id + 'gbms' + seed);
    let lines = '';
    for (let i = 0; i < 6; i++){
        const rr = R * (.2 + i * .14), a0 = Rn() * 6.28, sw = 2.4 + Rn() * 1.8;
        const pts = Array.from({ length: 9 }, (_, j) => { const a = a0 + j / 8 * sw; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .92 * sy]; });
        const d = smooth(pts, false);
        lines += `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6" transform="translate(.8 1)"/><path d="${d}" stroke="${lt(c, .6)}" stroke-width="2" fill="none" stroke-linecap="round" transform="translate(-1.2 -1.4)" opacity=".95"/>`;
    }
    return `<path ${T(x, y)} d="${smooth(ring(R, 14, .12, Rn, 1, sy))}" fill="${p.rg(c, .35, .22, .4, .36)}" stroke="${dk(c, .2)}" stroke-width=".8"/>${lines}`;
}
// 玉ねぎの薄切り（飴色に炒めた）
function xgbOnionStrip(p, x, y, s, r = 0, { c = '#c9924a' } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity=".9" stroke="${dk(c, .25)}" stroke-width=".6" stroke-linejoin="round"/></g>`;
}
// バンガー（太めのポークソーセージ、こんがり焼き目）
function xgbSausage(p, x, y, L, W, r = 0, { c = '#a8603a', bend = 4, seed = 1 } = {}){
    const R = rng(p.id + 'gbsg' + seed);
    const h = W / 2, b = bend;
    const d = `M${f(-L / 2 + h)},${f(-h)} Q0,${f(-h - b * 2)} ${f(L / 2 - h)},${f(-h)} A${h},${h} 0 0 1 ${f(L / 2 - h)},${f(h)} Q0,${f(h - b * 2)} ${f(-L / 2 + h)},${f(h)} A${h},${h} 0 0 1 ${f(-L / 2 + h)},${f(-h)}Z`;
    let ch = '';
    for (let i = 0; i < 5; i++) ch += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .4)}" rx="${f(L * (.06 + R() * .08))}" ry="${f(W * (.12 + R() * .12))}" fill="${dk(c, .55)}" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <g ${xgbBlur(p, 1.6)}>${ch}</g>
        <path d="M${f(-L * .36)},${f(-h * .45)} Q0,${f(-h * .45 - b * 2)} ${f(L * .3)},${f(-h * .45)}" stroke="#fff" stroke-width="${f(W * .16)}" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M${f(-L * .3)},${f(h * .45)} Q0,${f(h * .45 - b * 2)} ${f(L * .34)},${f(h * .45)}" stroke="${dk(c, .35)}" stroke-width="${f(W * .12)}" fill="none" stroke-linecap="round" opacity=".35"/>
        <path d="M${f(-L / 2 + 2)},0 l-3,-1.5 M${f(L / 2 - 2)},0 l3,1.5" stroke="${dk(c, .4)}" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
// 白いホーローのパイ皿（楕円・紺のふち）
function xgbEnamelDish(p, { rx = 94, ry = 76, base = '#f7f5ee', rim = '#1f3a66' } = {}){
    return `<g ${p.sh(1.8)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .14, .38, .32)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 1.6}" ry="${ry - 1.6}" fill="none" stroke="${rim}" stroke-width="3"/>
        <ellipse cx="100" cy="100" rx="${rx - 9}" ry="${ry - 9}" fill="none" stroke="${dk(base, .1)}" stroke-width="2.4" opacity=".45"/>
        <ellipse cx="100" cy="100" rx="${rx - 10}" ry="${ry - 10}" fill="${p.rg(dk(base, .03), .06, .2, .6, .62)}"/>
        <path d="M${100 - rx * .7},${100 - ry * .4} A${rx * .86},${ry * .86} 0 0 1 ${100 - rx * .22},${100 - ry * .82}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 太めのチップス（オーブンで焼いた）
function xgbChip(p, x, y, L, r = 0, { c = '#e8bb4e', seed = 1, w = 9 } = {}){
    const R = rng(p.id + 'gbch' + seed + x + y);
    const h = w / 2;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-h}" width="${f(L)}" height="${w}" rx="1.8" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .38)}" stroke-width=".6"/>
        <rect x="${f(-L / 2 + 1)}" y="${f(-h + 1)}" width="${f(L - 2)}" height="${f(h * .55)}" rx="1.2" fill="${lt(c, .35)}" opacity=".7"/>
        <ellipse cx="${f((R() - .5) * L * .6)}" cy="${f(h * .3)}" rx="${f(L * .14)}" ry="${f(h * .5)}" fill="${dk(c, .4)}" opacity=".3"/>
        <rect x="${f(L / 2 - 3.2)}" y="${-h}" width="3.2" height="${w}" rx="1" fill="${dk(c, .3)}" opacity=".5"/>
        <path d="M${f(-L / 2 + 3)},${f(-h + 1.8)} L${f(L / 2 - 5)},${f(-h + 1.8)}" stroke="#fff6d8" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
// カリフラワーの小房（真上から: 白いつぶつぶの頭）
function xgbFloret(p, x, y, s, r = 0, { c = '#f1e9d4', seed = 1 } = {}){
    const R = rng(p.id + 'gbfl' + seed + x + y);
    let b = '';
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.28 + R() * .4, d = i === 0 ? 0 : s * (.2 + R() * .08); b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d * .9)}" r="${f(s * (.16 + R() * .06))}" fill="${R() < .5 ? c : lt(c, .3)}" stroke="${dk(c, .22)}" stroke-width=".5"/>`; }
    let dots = '';
    for (let i = 0; i < 10; i++) dots += `<circle cx="${f((R() - .5) * s * .7)}" cy="${f((R() - .5) * s * .6)}" r=".8" fill="${dk(c, .18)}" opacity=".6"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}>${b}</g>${dots}<path d="M${f(-s * .22)},${f(-s * .18)} Q${f(-s * .05)},${f(-s * .32)} ${f(s * .14)},${f(-s * .24)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 煮込んだ牛肉のかたまり
function xgbBeefChunk(p, x, y, s, r = 0, { c = '#6e3c1e', seed = 1 } = {}){
    const R = rng(p.id + 'gbbf' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(s * .05)} Q${f(-s * .05)},${f(-s * .1)} ${f(s * .2)},${f(s * .08)} M${f(-s * .2)},${f(s * .22)} Q${f(s * .02)},${f(s * .1)} ${f(s * .26)},${f(s * .22)}" stroke="${dk(c, .45)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-s * .28)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .34)} ${f(s * .18)},${f(-s * .24)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// サボイキャベツのざく切り（縮れて波打つ平たい葉）
function xgbSavoyLeaf(p, x, y, s, r = 0, { c = '#6aa83c', seed = 1 } = {}){
    const R = rng(p.id + 'gbsv' + seed + x + y);
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.28, rr = (i % 2 ? .86 : 1.04) * (1 - R() * .12); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .2]; });
    let vn = '';
    for (let i = 0; i < 4; i++){ const t = -s * .32 + i * s * .2; vn += `M${f(t)},0 q${f(s * .06)},${f(-s * .08)} ${f(s * .1)},${f(-s * .15)} M${f(t)},0 q${f(s * .06)},${f(s * .08)} ${f(s * .1)},${f(s * .15)}`; }
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-s * .44)},0 Q0,${f(-s * .03)} ${f(s * .44)},0" stroke="#e4f0c4" stroke-width="${f(s * .05)}" fill="none" stroke-linecap="round"/>
        <path d="${vn}" stroke="${lt(c, .45)}" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 白いご飯（バスマティ: 細長い粒）
function xgbRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.8 } = {}){
    const R = rng(p.id + 'xgbRice' + seed + x + y);
    const shape = xgbSm(ring(s / 2, 14, .07, R, 1, sy), true);
    const hi = lt(tint, .85), mid = dk(tint, .02), sd = dk(tint, .3);
    const n = Math.round(s * s / 44 * density);
    const L = [['', '', ''], ['', '', '']];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .96, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.42 + R() * .14), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const l = L[i % 2];
        if ((gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('xgbRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${f(grain * .7)}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .25)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 鶏もものひと口大（カレーの中: 焼き色と赤いソースのからみ）
function xgbChicken(p, x, y, s, r = 0, { c = '#c8662a', seed = 1 } = {}){
    const R = rng(p.id + 'gbck' + seed + x + y);
    const pts = ring(s / 2, 9, .22, R, 1.15, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(ring(s * .3, 7, .3, R, 1.1, .7).map(([a, b]) => [a + s * .08, b + s * .08]), true, .8)}" fill="#8a3010" opacity=".4"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .08)},${f(-s * .34)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 白い深皿（縁に色の線）
function xgbSoupBowl(p, rim = '#2c4c7c'){
    return K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }) + `<circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1.8" opacity=".85"/>`;
}
// バター（溶けかけ）
function xgbButter(p, x, y, s, r = 0){
    return `<path ${T(x + 2, y + 2)} d="${smooth(ring(s * .78, 9, .3, rng(p.id + 'gbbt' + x)))}" fill="#f7d75e" opacity=".45"/>
        <g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${f(s * .86)}" rx="${f(s * .22)}" fill="${p.g('#f8de72', .35, .2)}" stroke="#d9b23a" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .26)} L${f(s * .2)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/></g>`;
}
// グリンピースの小山
function xgbPeas(p, x, y, s, { n = 60, seed = 1, sy = 1 } = {}){
    return `<g ${p.sh(.4)}>${xgbGrains(p, x, y, s, { cols: ['#6fb43c', '#5ea232', '#82c44a'], n, rx: 3.6, ry: 3.4, hi: .7, seed, jitter: .15, sy })}</g>`;
}

// ---------- x_gb で足した部品 ----------
// 両手つきの丸いキャセロール（陶器）
function xgbCasserole(p, { R = 84, glaze = '#7a4a2a', inside = '#e9dcc4', lugs = true, rimW = 7 } = {}){
    const lug = lugs ? `<g ${p.sh(1.4)}>${[-1, 1].map(s => `<rect x="${s < 0 ? 100 - R - 12 : 100 + R - 14}" y="86" width="26" height="28" rx="11" fill="${p.g(glaze, .25, .3)}" stroke="${dk(glaze, .3)}" stroke-width=".8"/>`).join('')}</g>` : '';
    return lug + `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(glaze, .25, .28, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="${lt(glaze, .35)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${R - rimW}" fill="${p.rg(inside, .1, .3, .62, .64)}"/>
        <path d="M${f(100 - R * .7)},${f(100 - R * .44)} A${f(R * .84)},${f(R * .84)} 0 0 1 ${f(100 - R * .26)},${f(100 - R * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 角の丸い長方形の焼き皿・ロースト用の天板
function xgbRectDish(p, { w = 184, h = 150, glaze = '#f2ede2', inside = null, rim = null, inset = 9, rx = 22 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2, ins = inside || dk(glaze, .04);
    return `<g ${p.sh(1.8)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${p.rg(glaze, .22, .2, .35, .3)}"/></g>
        ${rim ? `<rect x="${x + 2.5}" y="${y + 2.5}" width="${w - 5}" height="${h - 5}" rx="${rx - 2}" fill="none" stroke="${rim}" stroke-width="2.4"/>` : ''}
        <rect x="${x + inset}" y="${y + inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${rx - 6}" fill="${p.rg(ins, .06, .22, .6, .62)}"/>
        <path d="M${x + 8},${y + 36} Q${x + 8},${y + 8} ${x + 36},${y + 8}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 先が細くなる棒（脚・骨・根菜）を、なめらかな閉じた形に
function xgbLimb(x1, y1, x2, y2, w1, w2){
    const L = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / L, dy = (y2 - y1) / L, nx = -dy, ny = dx;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, wm = (w1 + w2) / 2;
    return smooth([[x1 + nx * w1, y1 + ny * w1], [mx + nx * wm, my + ny * wm], [x2 + nx * w2, y2 + ny * w2], [x2 + dx * w2, y2 + dy * w2], [x2 - nx * w2, y2 - ny * w2], [mx - nx * wm, my - ny * wm], [x1 - nx * w1, y1 - ny * w1], [x1 - dx * w1, y1 - dy * w1]], true, .9);
}
// ローストチキン丸ごと（胸を上に。脚をしばり、皮はこんがりつやつや）
function xgbRoastBird(p, x, y, L, r = 0, { c = '#c9782c' } = {}){
    const body = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283, w = 1 + .14 * Math.cos(a); return [Math.cos(a) * L * .4, Math.sin(a) * L * .31 * w]; });
    const skin = p.g(c, .32, .34);
    const drum = s => `<path d="${xgbLimb(L * .2, s * L * .24, L * .5, -s * L * .02, L * .1, L * .055)}" fill="${skin}" stroke="${dk(c, .4)}" stroke-width=".8"/>`;
    const knuckle = s => `<circle cx="${f(L * .54)}" cy="${f(-s * L * .05)}" r="${f(L * .035)}" fill="#f1e2c4" stroke="#b89a6a" stroke-width=".6"/><circle cx="${f(L * .565)}" cy="${f(-s * L * .03)}" r="${f(L * .03)}" fill="#efdcb8" stroke="#b89a6a" stroke-width=".6"/>`;
    const wing = s => `<path ${T(-L * .28, s * L * .3, s * 20)} d="${smooth(ring(L * .1, 8, .2, rng(p.id + 'wg' + s), 1.3, .7))}" fill="${p.g(dk(c, .08), .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>`;
    const thigh = s => `<ellipse cx="${f(L * .18)}" cy="${f(s * L * .25)}" rx="${f(L * .17)}" ry="${f(L * .11)}" transform="rotate(${s * 28} ${f(L * .18)} ${f(s * L * .25)})" fill="${skin}" stroke="${dk(c, .35)}" stroke-width=".6"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.6)}>${wing(-1)}${wing(1)}<path d="${smooth(body)}" fill="${skin}" stroke="${dk(c, .42)}" stroke-width=".9"/>${thigh(-1)}${thigh(1)}${drum(-1)}${drum(1)}</g>
        ${knuckle(-1)}${knuckle(1)}
        <g opacity=".85"><ellipse cx="${f(-L * .04)}" cy="${f(-L * .12)}" rx="${f(L * .29)}" ry="${f(L * .13)}" fill="${p.g(lt(c, .12), .4, .2)}"/><ellipse cx="${f(-L * .04)}" cy="${f(L * .12)}" rx="${f(L * .29)}" ry="${f(L * .13)}" fill="${p.g(c, .3, .25)}"/></g>
        <path d="M${f(-L * .34)},0 Q${f(-L * .04)},${f(-L * .015)} ${f(L * .3)},0" stroke="${dk(c, .45)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>
        <g ${xgbBlur(p, 3)}><ellipse cx="${f(L * .02)}" cy="${f(L * .2)}" rx="${f(L * .2)}" ry="${f(L * .06)}" fill="${dk(c, .45)}" opacity=".45"/><ellipse cx="${f(L * .3)}" cy="${f(L * .02)}" rx="${f(L * .07)}" ry="${f(L * .12)}" fill="${dk(c, .5)}" opacity=".4"/></g>
        <path d="M${f(-L * .26)},${f(-L * .14)} Q${f(-L * .08)},${f(-L * .24)} ${f(L * .14)},${f(-L * .19)}" stroke="#fff" stroke-width="${f(L * .03)}" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(-L * .22)},${f(L * .06)} Q${f(-L * .04)},${f(L * .02)} ${f(L * .1)},${f(L * .05)}" stroke="#fff" stroke-width="${f(L * .018)}" fill="none" stroke-linecap="round" opacity=".45"/>
        <path d="M${f(L * .4)},${f(-L * .07)} Q${f(L * .46)},0 ${f(L * .4)},${f(L * .07)}" stroke="#f3e8d0" stroke-width="1.4" fill="none" opacity=".85"/></g>`;
}
// ハーブの小枝（タイム・ローズマリー）
function xgbSprig(p, x, y, L, r = 0, { c = '#4a7a34', leaf = 2.2, n = 7 } = {}){
    let lv = '';
    for (let i = 0; i < n; i++){ const t = -L / 2 + (i + .5) * L / n, s = i % 2 ? 1 : -1; lv += `<ellipse cx="${f(t)}" cy="${f(s * leaf * .9)}" rx="${f(leaf * 1.2)}" ry="${f(leaf * .6)}" transform="rotate(${s * 30} ${f(t)} ${f(s * leaf * .9)})" fill="${i % 3 ? c : lt(c, .15)}" stroke="${dk(c, .3)}" stroke-width=".3"/>`; }
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 L${L / 2},0" stroke="${dk(c, .2)}" stroke-width=".9"/>${lv}</g>`;
}
// 半分に切って焼いたレモン
function xgbLemonHalf(p, x, y, s, { roast = .5 } = {}){
    const R = rng(p.id + 'lh' + x);
    let seg = '';
    for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283; seg += `M0,0 L${f(Math.cos(a) * s * .4)},${f(Math.sin(a) * s * .4)}`; }
    let br = '';
    for (let i = 0; i < 4; i++) br += `<ellipse cx="${f((R() - .5) * s * .5)}" cy="${f((R() - .5) * s * .5)}" rx="${f(s * (.08 + R() * .08))}" ry="${f(s * (.06 + R() * .05))}" fill="#a8641a" opacity="${f(roast * (.4 + R() * .4))}"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.7)}><circle r="${s / 2}" fill="${p.g('#efc22a', .3, .25)}" stroke="#b88a12" stroke-width=".6"/></g><circle r="${f(s * .44)}" fill="#fbf2c4"/><circle r="${f(s * .4)}" fill="${p.rg('#f6dc6a', .3, .1)}"/><path d="${seg}" stroke="#fff6d0" stroke-width="1.2"/><circle r="${f(s * .06)}" fill="#fff6d0"/>${br}</g>`;
}
// ローストビーフの薄切り（外は焼き色、中はロゼ）
function xgbBeefSlice(p, x, y, w, h, r = 0, { seed = 1, pink = '#d47c74' } = {}){
    const R = rng(p.id + 'rb' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2);
    let gr = '';
    for (let i = 0; i < 4; i++){ const yy = -h * .25 + i * h * .16; gr += `M${f(-w * .3)},${f(yy)} Q0,${f(yy - 2)} ${f(w * .3)},${f(yy + 1)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g('#7a3e1c', .2, .3)}" stroke="#4e2610" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .9, b * .86]))}" fill="${p.rg(pink, .25, .2, .45, .45)}"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .5, b * .42]))}" fill="${lt(pink, .15)}" opacity=".6"/>
        <path d="${gr}" stroke="${dk(pink, .25)}" stroke-width=".7" fill="none" opacity=".45"/>
        <path d="M${f(-w * .34)},${f(-h * .3)} Q${f(-w * .06)},${f(-h * .44)} ${f(w * .24)},${f(-h * .34)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// ヨークシャープディング（ふくらんだ縁、真ん中がくぼむ）
function xgbYorkshire(p, x, y, s, { seed = 1, c = '#d9973a' } = {}){
    const R = rng(p.id + 'yk' + seed + x);
    const out = ring(s / 2, 14, .16, R);
    const inn = ring(s * .26, 10, .3, R).map(([a, b]) => [a + s * .03, b + s * .03]);
    let peaks = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.283, d = s * (.32 + R() * .1); peaks += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * .1)}" ry="${f(s * .06)}" transform="rotate(${f(a * 57.3 + 90)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="${dk(c, .35)}" opacity=".55"/>`; }
    return `<g ${T(x, y)}><g ${p.sh(1.2)}><g ${p.rough(3, .07)}><path d="${smooth(out)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g></g>
        <g ${xgbBlur(p, 1.4)}>${peaks}</g>
        <path d="${smooth(inn)}" fill="${p.rg('#d89a48', .1, .45, .65, .66)}" stroke="${dk(c, .45)}" stroke-width="1"/>
        <path d="${smooth(inn.map(([a, b]) => [a * .8 - 1.5, b * .8 - 1.5]))}" fill="none" stroke="#7a3e10" stroke-width="2.4" opacity=".35"/>
        <path d="M${f(-s * .36)},${f(-s * .12)} Q${f(-s * .26)},${f(-s * .34)} ${f(-s * .04)},${f(-s * .4)}" stroke="#fff2cc" stroke-width="${f(s * .05)}" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 皮つきの新じゃが（ゆでてバターをからめた）
function xgbNewPotato(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'np' + seed + x + y);
    const pts = ring(s / 2, 9, .12, R, 1, .82);
    let sk = '';
    for (let i = 0; i < 4; i++) sk += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .45)}" rx="${f(s * (.08 + R() * .1))}" ry="${f(s * (.05 + R() * .05))}" fill="#c9a060" opacity=".6"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts)}" fill="${p.g('#f0d888', .35, .3)}" stroke="#b8964e" stroke-width=".7"/></g>${sk}
        <path d="M${f(-s * .26)},${f(-s * .14)} Q${f(-s * .08)},${f(-s * .3)} ${f(s * .14)},${f(-s * .26)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// グレービーのだまり（つやの線つき）
const xgbGravy = (p, x, y, s, { seed = 1, sy = .8, c = '#5a2e12', op = .95 } = {}) => K.pool(p, x, y, s, c, { seed, sy, op });
// ローストした人参（縦半分）
function xgbRoastCarrot(p, x, y, L, r = 0, { c = '#e2701e', w = 9 } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xgbLimb(-L / 2, 0, L / 2, 0, w / 2, w * .22)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M${f(-L * .4)},0 L${f(L * .38)},0" stroke="${lt(c, .3)}" stroke-width="${f(w * .25)}" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="${f(L * .05)}" cy="${f(w * .2)}" rx="${f(L * .16)}" ry="${f(w * .22)}" fill="${dk(c, .5)}" opacity=".35"/>
        <path d="M${f(-L * .36)},${f(-w * .28)} L${f(L * .1)},${f(-w * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// ポークチョップ（骨つき。外側の曲線に脂身、まっすぐな辺に骨、焼き網の跡）
function xgbChop(p, x, y, s, r = 0, { c = '#a8622c', fat = '#f0d498', seed = 1 } = {}){
    const R = rng(p.id + 'chop' + seed);
    const pts = [[-.46, .05], [-.42, -.2], [-.22, -.36], [.05, -.37], [.3, -.26], [.5, -.06], [.52, .12], [.36, .2], [.1, .2], [-.15, .26], [-.38, .24]].map(([a, b]) => [a * s + (R() - .5) * 1.5, b * s + (R() - .5) * 1.5]);
    const meat = pts.map(([a, b]) => [a * .86 - s * .02, b * .76 + s * .05]);
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `M${f(-s * .34 + i * s * .2)},${f(-s * .22)} l${f(s * .14)},${f(s * .4)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.g(fat, .3, .25)}" stroke="${dk(fat, .45)}" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .97, b * .95]))}" fill="none" stroke="#c88a3a" stroke-width="2" opacity=".55"/>
        <path d="${smooth(meat)}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="${ch}" stroke="${dk(c, .6)}" stroke-width="${f(s * .045)}" stroke-linecap="round" opacity=".5"/>
        <path d="M${f(-s * .36)},${f(s * .22)} Q${f(-s * .14)},${f(s * .26)} ${f(s * .08)},${f(s * .2)}" stroke="#f6ead0" stroke-width="${f(s * .08)}" fill="none" stroke-linecap="round"/>
        <path d="M${f(-s * .36)},${f(s * .22)} Q${f(-s * .14)},${f(s * .26)} ${f(s * .08)},${f(s * .2)}" stroke="#b8a074" stroke-width=".7" fill="none" transform="translate(.6 ${f(s * .04)})"/>
        <path d="M${f(-s * .16)},${f(-s * .18)} Q${f(s * .04)},${f(-s * .26)} ${f(s * .24)},${f(-s * .16)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ラムのカツレツ（丸い肉に脂の縁、細くなった先から骨が出る）
function xgbCutlet(p, x, y, s, r = 0, { c = '#8a4a26', seed = 1 } = {}){
    const R = rng(p.id + 'cut' + seed);
    const eye = ring(s * .27, 10, .12, R, 1.1, .92);
    const fat = `<path d="${xgbLimb(-s * .04, 0, s * .5, -s * .02, s * .34, s * .06)}" fill="${p.g('#e9c582', .3, .3)}" stroke="#a87a3a" stroke-width=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="M${f(s * .44)},${f(-s * .02)} L${f(s * .84)},${f(-s * .03)}" stroke="#f1e4c8" stroke-width="${f(s * .08)}" stroke-linecap="round"/>${fat}
        <path d="${smooth(eye.map(([a, b]) => [a + s * .02, b + s * .03]))}" fill="${p.g(c, .32, .34)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f(s * .46)},${f(-s * .04)} L${f(s * .8)},${f(-s * .05)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(-s * .18)},${f(-s * .12)} l${f(s * .16)},${f(s * .3)} M${f(-s * .02)},${f(-s * .2)} l${f(s * .16)},${f(s * .3)} M${f(s * .12)},${f(-s * .18)} l${f(s * .1)},${f(s * .22)}" stroke="${dk(c, .6)}" stroke-width="${f(s * .05)}" stroke-linecap="round" opacity=".45"/>
        <path d="M${f(-s * .18)},${f(-s * .1)} Q${f(-s * .06)},${f(-s * .24)} ${f(s * .12)},${f(-s * .2)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// パイナップルの輪切り
function xgbPineRing(p, x, y, s){
    let fib = '';
    for (let i = 0; i < 16; i++){ const a = i / 16 * 6.283; fib += `M${f(Math.cos(a) * s * .17)},${f(Math.sin(a) * s * .17)} L${f(Math.cos(a) * s * .44)},${f(Math.sin(a) * s * .44)}`; }
    return `<g ${T(x, y)}><g ${p.sh(.8)}><path d="M${-s / 2},0 a${s / 2},${s / 2} 0 1 0 ${s},0 a${s / 2},${s / 2} 0 1 0 ${-s},0Z M${f(-s * .15)},0 a${f(s * .15)},${f(s * .15)} 0 1 1 ${f(s * .3)},0 a${f(s * .15)},${f(s * .15)} 0 1 1 ${f(-s * .3)},0Z" fill-rule="evenodd" fill="${p.g('#f6cf3c', .3, .2)}" stroke="#c99a1a" stroke-width=".7"/></g>
        <path d="${fib}" stroke="#fbe58a" stroke-width=".8" opacity=".8"/><circle r="${f(s * .19)}" fill="none" stroke="#e8b52a" stroke-width="1.4"/>
        <path d="M${f(-s * .3)},${f(-s * .28)} L${f(s * .26)},${f(s * .3)} M${f(-s * .05)},${f(-s * .44)} L${f(s * .42)},${f(s * .05)}" stroke="#a8641a" stroke-width="${f(s * .06)}" stroke-linecap="round" opacity=".35"/>
        <path d="M${f(-s * .36)},${f(-s * .1)} A${f(s * .38)},${f(s * .38)} 0 0 1 ${f(-s * .08)},${f(-s * .38)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ほぐした燻製の魚（ハドック）: 角ばった身のかたまりに、層の筋
function xgbFlake(p, x, y, s, r = 0, { c = '#f4e2b0', seed = 1 } = {}){
    const R = rng(p.id + 'fl' + seed + x + y);
    const pts = ring(s / 2, 6, .3, R, 1.2, .8);
    let ln = '';
    for (let i = 0; i < 3; i++){ const t = -s * .26 + i * s * .2; ln += `M${f(t)},${f(-s * .26)} L${f(t + s * .08)},${f(s * .24)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .4, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="${ln}" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".35"/>
        <path d="M${f(-s * .3)},${f(-s * .22)} L${f(s * .1)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 小さな白いラメキン（ソース入れ）
function xgbRamekin(p, x, y, s, fill, { rim = '#f6f2ea' } = {}){
    return `<g ${p.sh(1)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(rim, .2, .15, .38, .32)}" stroke="${dk(rim, .15)}" stroke-width=".7"/></g>
        <circle cx="${x}" cy="${y}" r="${f(s * .4)}" fill="${p.rg(fill, .15, .25, .55, .58)}"/>
        <path d="M${f(x - s * .32)},${f(y - s * .1)} A${f(s * .34)},${f(s * .34)} 0 0 1 ${f(x - s * .06)},${f(y - s * .33)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}

// パイ生地の飾りの葉
function xgbPastryLeaf(p, x, y, L, r = 0, { c = '#e2a446' } = {}){
    const h = L * .26;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${-L / 2},0 Q${f(-L * .1)},${f(-h * 1.7)} ${L / 2},0 Q${f(-L * .1)},${f(h * 1.7)} ${-L / 2},0Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-L * .42)},0 L${f(L * .42)},0 ${[-.2, .05, .26].map(t => `M${f(L * t)},0 l${f(L * .12)},${f(-h * .7)} M${f(L * t)},0 l${f(L * .12)},${f(h * .7)}`).join(' ')}" stroke="${dk(c, .35)}" stroke-width=".9" fill="none" opacity=".7"/>
        <path d="M${f(-L * .3)},${f(-h * .5)} Q0,${f(-h * 1.1)} ${f(L * .25)},${f(-h * .6)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 楕円・円から扇形をすくった形（すくった口の線つき）
function xgbScooped(cx, cy, rx, ry, a1d, a2d, k = .25){
    const a1 = a1d * Math.PI / 180, a2 = a2d * Math.PI / 180, pts = [];
    for (let i = 0; i <= 36; i++){ const a = a2 + (a1 + 6.283 - a2) * i / 36; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    const P = a => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry], I = a => [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
    const [x1, y1] = P(a1), [x2, y2] = P(a2), i1 = I(a1), i2 = I(a2);
    return { top: xgbSm(pts) + ` L${f(i1[0])},${f(i1[1])} L${f(i2[0])},${f(i2[1])} Z`, cut: `M${f(x1)},${f(y1)} L${f(i1[0])},${f(i1[1])} L${f(i2[0])},${f(i2[1])} L${f(x2)},${f(y2)}` };
}

// 木のまな板（真上から）
function xgbBoard(p, { w = 184, h = 150, c = '#c99a62', r = 0 } = {}){
    const R = rng(p.id + 'board');
    let gr = '';
    for (let i = 0; i < 9; i++){ const y = -h / 2 + 10 + i * (h - 20) / 8 + (R() - .5) * 4; gr += `M${f(-w / 2 + 8)},${f(y)} C${f(-w / 4)},${f(y + (R() - .5) * 6)} ${f(w / 4)},${f(y + (R() - .5) * 6)} ${f(w / 2 - 8)},${f(y)}`; }
    return `<g ${T(100, 100, r)}><g ${p.sh(1.8)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width="1"/></g>
        <path d="${gr}" stroke="${dk(c, .22)}" stroke-width=".9" fill="none" opacity=".55"/>
        <rect x="${-w / 2 + 3}" y="${-h / 2 + 3}" width="${w - 6}" height="${h - 6}" rx="12" fill="none" stroke="${lt(c, .3)}" stroke-width="1.4" opacity=".6"/></g>`;
}
// 鋳鉄のスキレット（右に持ち手）
function xgbSkillet(p, { R = 80, cx = 94 } = {}){
    return `<g ${p.sh(2)}><path d="M${cx + R - 6},92 L196,90 Q199,100 196,110 L${cx + R - 6},108Z" fill="${p.g('#3b3533', .2, .3)}"/><circle cx="${cx}" cy="100" r="${R}" fill="${p.rg('#3b3533', .2, .3, .35, .3)}"/></g>
        <circle cx="${cx}" cy="100" r="${R - 7}" fill="${p.rg('#2a2422', .1, .2, .6, .62)}"/>
        <path d="M${cx - R * .72},${100 - R * .4} A${R * .84},${R * .84} 0 0 1 ${cx - R * .26},${100 - R * .8}" stroke="#8a8480" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// キドニービーンズ（色ごとに1本のpath）
function xgbKidneys(p, x, y, s, { n = 14, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'kb' + seed + x);
    const cols = ['#7a1e22', '#8e2a28', '#6a1a1e'], ds = ['', '', '']; let hs = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, r = R() * 6.28, c = Math.cos(r), si = Math.sin(r);
        const P = (u, v) => `${f(cx + u * c - v * si)},${f(cy + u * si + v * c)}`;
        ds[i % 3] += `M${P(-7, -1.4)}C${P(-7, -5.6)} ${P(7, -5.6)} ${P(7, -1.4)}C${P(7, 4.2)} ${P(1.4, 4.8)} ${P(0, 2.2)}C${P(-1.4, 4.8)} ${P(-7, 4.2)} ${P(-7, -1.4)}Z`;
        hs += `M${P(-4, -2.8)}L${P(1.4, -3.6)}`;
    }
    return `<g ${p.sh(.5)}>${cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".5"/>`).join('')}</g><path d="${hs}" stroke="#e8a0a0" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`;
}
// ペンネ（斜めに切った筒）
function xgbPenne(p, x, y, L, r = 0, { c = '#f2d07a' } = {}){
    const w = L * .42, q = n => f1(n);
    return `<g ${T(x, y, r)}><path d="M${q(-L / 2)},${q(-w / 2)}L${q(L / 2 - w * .4)},${q(-w / 2)}Q${q(L / 2)},${q(-w * .3)} ${q(L / 2)},${q(w / 2)}L${q(-L / 2 + w * .4)},${q(w / 2)}Q${q(-L / 2)},${q(w * .3)} ${q(-L / 2)},${q(-w / 2)}Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/><path d="M${q(-L * .34)},${q(-w * .2)}H${q(L * .22)}M${q(-L * .26)},${q(w * .14)}H${q(L * .3)}" stroke="${dk(c, .22)}" stroke-width=".7" opacity=".7"/><ellipse cx="${q(L / 2 - w * .3)}" cy="${q(w * .06)}" rx="${q(w * .2)}" ry="${q(w * .36)}" fill="${dk(c, .5)}" opacity=".75"/></g>`;
}
// トマトの輪切り（皮・果肉の壁・種のゼリー）
function xgbTomatoSlice(p, x, y, s, r = 0, { c = '#e2402c' } = {}){
    let loc = '';
    for (let i = 0; i < 5; i++){ const a = i / 5 * 6.283 + .3, a1 = a - .42, a2 = a + .42, r1 = s * .1, r2 = s * .36;
        loc += `M${f(Math.cos(a1) * r1)},${f(Math.sin(a1) * r1)} L${f(Math.cos(a1) * r2)},${f(Math.sin(a1) * r2)} A${f(r2)},${f(r2)} 0 0 1 ${f(Math.cos(a2) * r2)},${f(Math.sin(a2) * r2)} Z`; }
    let seeds = '';
    for (let i = 0; i < 5; i++){ const a = i / 5 * 6.283 + .3; seeds += `M${f(Math.cos(a) * s * .22 - .8)},${f(Math.sin(a) * s * .22)}a.8,.6 0 1 0 1.6,0a.8,.6 0 1 0 -1.6,0Z M${f(Math.cos(a + .2) * s * .3 - .8)},${f(Math.sin(a + .2) * s * .3)}a.8,.6 0 1 0 1.6,0a.8,.6 0 1 0 -1.6,0Z`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><circle r="${f(s * .45)}" fill="${p.g(lt(c, .12), .25, .1)}"/>
        <path d="${loc}" fill="#f6a070" stroke="${lt(c, .2)}" stroke-width="1" stroke-linejoin="round"/><path d="${seeds}" fill="#f8e4a0"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} A${f(s * .34)},${f(s * .34)} 0 0 1 ${f(-s * .06)},${f(-s * .34)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// パイ生地のふた（丸）: 縁はフォークで押さえ、中央に切れ目
function xgbPieLid(p, cx, cy, R, { c = '#dc9a3c' } = {}){
    let fork = '';
    for (let i = 0; i < 40; i++){ const a = i / 40 * 6.283; fork += `M${f(cx + Math.cos(a) * (R - 9))},${f(cy + Math.sin(a) * (R - 9))} L${f(cx + Math.cos(a) * (R - 2))},${f(cy + Math.sin(a) * (R - 2))}`; }
    return `<g ${p.sh(1.4)}><circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <path d="${fork}" stroke="${dk(c, .35)}" stroke-width="1.6" opacity=".6"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 10}" fill="none" stroke="${dk(c, .3)}" stroke-width="1" opacity=".5"/>
        <g ${xgbBlur(p, 4)}><circle cx="${cx + 4}" cy="${cy + 4}" r="${R * .55}" fill="${lt(c, .25)}" opacity=".55"/></g>`;
}

// ウェルシュ・レアビット用のトースト（チーズソースをのせて焼いた）
function xgbRarebitToast(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'rbt' + seed);
    const shape = `M${-w / 2},${f(-h * .18)} Q${-w / 2},${f(-h / 2)} ${f(-w * .28)},${f(-h / 2)} Q${f(-w * .06)},${f(-h * .36)} 0,${f(-h * .4)} Q${f(w * .06)},${f(-h * .36)} ${f(w * .28)},${f(-h / 2)} Q${w / 2},${f(-h / 2)} ${w / 2},${f(-h * .18)} L${w / 2},${f(h * .36)} Q${w / 2},${h / 2} ${f(w * .38)},${h / 2} L${f(-w * .38)},${h / 2} Q${-w / 2},${h / 2} ${-w / 2},${f(h * .36)}Z`;
    let sp = '';
    for (let i = 0; i < 8; i++) sp += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .66)}" rx="${f(w * (.06 + R() * .08))}" ry="${f(h * (.04 + R() * .06))}" fill="${R() < .6 ? '#a8581a' : '#7a3a10'}" opacity="${f(.45 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><path d="${shape}" fill="${p.g('#b8743a', .25, .3)}" stroke="#7a4618" stroke-width=".8"/></g>
        <g transform="scale(.9 .88)"><g ${p.crumb(.35)}><path d="${shape}" fill="${p.rg('#eeb446', .25, .2)}" stroke="#c8862a" stroke-width="1"/></g></g>
        <g ${xgbBlur(p, 2.4)}>${sp}</g>
        <path d="M${f(-w * .3)},${f(-h * .2)} Q${f(-w * .1)},${f(-h * .34)} ${f(w * .16)},${f(-h * .28)}" stroke="#fff3cc" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// パン粉をまぶして焼いた棒状のもの（グラモーガンソーセージ）
function xgbCrumbLog(p, x, y, L, W, r = 0, { c = '#d9a04a', seed = 1 } = {}){
    const R = rng(p.id + 'cl' + seed);
    let sp = '';
    for (let i = 0; i < 4; i++) sp += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .4)}" rx="${f(L * .1)}" ry="${f(W * .18)}" fill="${dk(c, .45)}" opacity=".4"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.crumb(.85)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${W / 2}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g></g>
        <g ${xgbBlur(p, 1.6)}>${sp}</g>
        <path d="M${f(-L * .36)},${f(-W * .24)} L${f(L * .3)},${f(-W * .24)}" stroke="#fff2cc" stroke-width="${f(W * .14)}" stroke-linecap="round" opacity=".6"/></g>`;
}

// ローストポテト（角のある塊、外はカリカリの濃い黄金色、角は焦げ茶）
function xgbRoastPot(p, x, y, s, r = 0, { c = '#e0a440', seed = 1 } = {}){
    const R = rng(p.id + 'rp' + seed + x + y);
    const pts = ring(s / 2, 6, .3, R, 1.15, .9);
    const facet = [pts[3], pts[4], pts[5], [0, 0]].map(([a, b]) => [a * .8 - s * .04, b * .8 - s * .04]);
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts, true, .4)}" fill="${p.g(c, .45, .45)}" stroke="${dk(c, .55)}" stroke-width=".9"/></g>
        <g ${p.crumb(.5)}><path d="${smooth(facet, true, .5)}" fill="${lt(c, .35)}" opacity=".85"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .9, b * .9]), true, .4)}" fill="none" stroke="${dk(c, .5)}" stroke-width="${f(s * .1)}" opacity=".3" transform="translate(${f(s * .05)} ${f(s * .06)})" ${xgbBlur(p, 1.2)}/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .12)},${f(-s * .28)}" stroke="#fff4d6" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// パースニップ（縦半分。はちみつで照り焼き）
function xgbParsnip(p, x, y, L, r = 0, { c = '#e6b860', w = 15 } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xgbLimb(-L / 2, 0, L / 2, 0, w / 2, w * .12)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g>
        <path d="${xgbLimb(-L * .44, 0, L * .2, 0, w * .2, w * .12)}" fill="${lt(c, .35)}" opacity=".7"/>
        <path d="M${f(-L * .48)},${f(w * .28)} Q0,${f(w * .36)} ${f(L * .4)},${f(w * .08)}" stroke="#8a4a14" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" opacity=".6" ${xgbBlur(p, 1.2)}/><ellipse cx="${f(-L * .2)}" cy="${f(-w * .05)}" rx="${f(L * .12)}" ry="${f(w * .18)}" fill="#a8641a" opacity=".35" ${xgbBlur(p, 1.2)}/>
        <path d="M${f(-L * .4)},${f(-w * .24)} L${f(L * .1)},${f(-w * .14)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>`;
}
// 芽キャベツ（半分に切った断面 or まるごと）
function xgbSprout(p, x, y, s, r = 0, { half = true, c = '#5f9e38', seed = 1 } = {}){
    const R = rng(p.id + 'spt' + seed + x);
    if (!half) return `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="${s / 2}" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(s * .2)} Q0,${f(-s * .5)} ${f(s * .32)},${f(s * .18)} M${f(-s * .14)},${f(s * .4)} Q${f(s * .1)},${f(-s * .1)} ${f(s * .42)},${f(-s * .1)}" stroke="${dk(c, .3)}" stroke-width=".9" fill="none" opacity=".7"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .16)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#fff" opacity=".5"/></g>`;
    let lay = '';
    for (let i = 1; i < 4; i++) lay += `<path d="M${f(-s * (.5 - i * .1))},${f(s * .06)} Q${f(-s * (.42 - i * .1))},${f(-s * (.44 - i * .09))} 0,${f(-s * (.46 - i * .1))} Q${f(s * (.42 - i * .1))},${f(-s * (.44 - i * .09))} ${f(s * (.5 - i * .1))},${f(s * .06)}" stroke="${i % 2 ? '#d8eaa8' : lt(c, .25)}" stroke-width="${f(s * .06)}" fill="none"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="M${-s / 2},${f(s * .1)} Q${-s / 2},${-s / 2} 0,${-s / 2} Q${s / 2},${-s / 2} ${s / 2},${f(s * .1)} Q${f(s * .3)},${f(s * .44)} 0,${f(s * .42)} Q${f(-s * .3)},${f(s * .44)} ${-s / 2},${f(s * .1)}Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .4)},${f(s * .1)} Q${f(-s * .38)},${f(-s * .38)} 0,${f(-s * .4)} Q${f(s * .38)},${f(-s * .38)} ${f(s * .4)},${f(s * .1)} Q${f(s * .2)},${f(s * .34)} 0,${f(s * .32)} Q${f(-s * .2)},${f(s * .34)} ${f(-s * .4)},${f(s * .1)}Z" fill="${p.g('#c8e08a', .3, .2)}"/>
        ${lay}<path d="M0,${f(s * .32)} L0,${f(-s * .1)}" stroke="#eef4cc" stroke-width="${f(s * .1)}" stroke-linecap="round"/>
        <path d="M${-s / 2 + 1},${f(s * .1)} Q${f(-s * .3)},${f(s * .44)} 0,${f(s * .42)}" stroke="#7a5a2a" stroke-width="${f(s * .1)}" fill="none" opacity=".35"/></g>`;
}
// 縦に切ったマッシュルーム（かさと軸の断面）
function xgbMushSlice(p, x, y, s, r = 0, { cap = '#8a5a34', flesh = '#ecd9b6', seed = 1 } = {}){
    const d = `M${f(-s * .5)},${f(s * .06)} Q${f(-s * .5)},${f(-s * .44)} 0,${f(-s * .46)} Q${f(s * .5)},${f(-s * .44)} ${f(s * .5)},${f(s * .06)} Q${f(s * .4)},${f(s * .12)} ${f(s * .17)},${f(s * .1)} L${f(s * .15)},${f(s * .42)} Q0,${f(s * .5)} ${f(-s * .15)},${f(s * .42)} L${f(-s * .17)},${f(s * .1)} Q${f(-s * .4)},${f(s * .12)} ${f(-s * .5)},${f(s * .06)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${d}" fill="${p.g(flesh, .25, .3)}" stroke="${cap}" stroke-width="${f(s * .07)}" stroke-linejoin="round"/></g>
        <path d="M${f(-s * .42)},${f(s * .02)} Q${f(-s * .42)},${f(-s * .36)} 0,${f(-s * .38)} Q${f(s * .42)},${f(-s * .36)} ${f(s * .42)},${f(s * .02)}" stroke="${dk(flesh, .2)}" stroke-width=".7" fill="none" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(s * .04)} L${f(s * .3)},${f(s * .04)}" stroke="#7a5a3a" stroke-width="${f(s * .05)}" opacity=".5"/>
        <path d="M${f(-s * .3)},${f(-s * .24)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .14)},${f(-s * .34)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 衣をつけて揚げたオニオンリング
function xgbOnionRing(p, x, y, s, r = 0, { c = '#dca246', seed = 1 } = {}){
    const w = s * .2;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.4, .12)}><g ${p.crumb(.9)}><ellipse rx="${f(s / 2 - w / 2)}" ry="${f((s / 2 - w / 2) * .86)}" fill="none" stroke="${c}" stroke-width="${f(w)}"/></g></g></g>
        <ellipse rx="${f(s / 2 - w / 2)}" ry="${f((s / 2 - w / 2) * .86)}" fill="none" stroke="${dk(c, .4)}" stroke-width="${f(w * .3)}" opacity=".35" transform="translate(${f(w * .15)} ${f(w * .2)})"/>
        <path d="M${f(-s * .36)},${f(-s * .1)} A${f(s * .4)},${f(s * .34)} 0 0 1 ${f(-s * .02)},${f(-s * .38)}" stroke="#fff2cc" stroke-width="${f(w * .25)}" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// セージと玉ねぎのスタッフィングのボール
function xgbStuffBall(p, x, y, s, { c = '#c88a3e', seed = 1 } = {}){
    const R = rng(p.id + 'stb' + seed + x + y);
    let fl = '';
    for (let i = 0; i < 5; i++) fl += `<path ${T(x + (R() - .5) * s * .6, y + (R() - .5) * s * .6, R() * 180)} d="M-1.6,0 l1.6,-1 l1.6,1 l-1.6,1Z" fill="${R() < .5 ? '#5a7a3a' : '#3f6a2a'}"/>`;
    return `<g ${p.sh(1)}><g ${p.rough(3, .12)}><g ${p.crumb(.8)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(c, .3, .4, .35, .32)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g></g></g>${fl}
        <path d="M${f(x - s * .3)},${f(y - s * .12)} Q${f(x - s * .14)},${f(y - s * .32)} ${f(x + s * .1)},${f(y - s * .3)}" stroke="#fff2cc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
}

// 斜め薄切りのランナービーンズ（平たいさや）
function xgbBeanStrip(p, x, y, L, r = 0, { c = '#5a9e36', w = 6 } = {}){
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2)},${f(w * .2)} L${f(-L / 2 + w)},${f(-w / 2)} L${f(L / 2)},${f(-w * .2)} L${f(L / 2 - w)},${f(w / 2)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f(-L * .34)},${f(-w * .1)} L${f(L * .34)},${f(-w * .02)}" stroke="${lt(c, .4)}" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
// 人参のスティック（照り）
function xgbCarrotStick(p, x, y, L, r = 0, { c = '#ec7a26', w = 9 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-L * .4)},${f(w * .05)} L${f(L * .4)},${f(w * .05)}" stroke="${lt(c, .35)}" stroke-width="${f(w * .3)}" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-L * .36)},${f(-w * .26)} L${f(L * .2)},${f(-w * .26)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// くるみ（半分）
function xgbWalnut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M0,${f(-s * .44)} Q${f(s * .5)},${f(-s * .5)} ${f(s * .46)},0 Q${f(s * .5)},${f(s * .5)} 0,${f(s * .44)} Q${f(-s * .5)},${f(s * .5)} ${f(-s * .46)},0 Q${f(-s * .5)},${f(-s * .5)} 0,${f(-s * .44)}Z" fill="${p.g('#b07a42', .3, .3)}" stroke="#6a4220" stroke-width=".6"/></g>
        <path d="M0,${f(-s * .4)} L0,${f(s * .4)} M${f(-s * .36)},${f(-s * .14)} q${f(s * .14)},${f(s * .1)} ${f(s * .3)},0 M${f(-s * .36)},${f(s * .16)} q${f(s * .14)},${f(-s * .1)} ${f(s * .3)},0 M${f(s * .06)},${f(-s * .14)} q${f(s * .14)},${f(s * .1)} ${f(s * .3)},0 M${f(s * .06)},${f(s * .16)} q${f(s * .14)},${f(-s * .1)} ${f(s * .3)},0" stroke="#6a4220" stroke-width=".9" fill="none" opacity=".75"/></g>`;
}
// リーキの輪切り（断面に同心円）
function xgbLeekRound(p, x, y, s, { c = '#e4edc4' } = {}){
    return `<g ${T(x, y)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g(c, .25, .2)}" stroke="#8ab05a" stroke-width="2"/></g><ellipse rx="${f(s * .34)}" ry="${f(s * .3)}" fill="none" stroke="#98bc6a" stroke-width="1.2"/><ellipse rx="${f(s * .18)}" ry="${f(s * .15)}" fill="none" stroke="#b0ca80" stroke-width="1"/><ellipse rx="${f(s * .06)}" ry="${f(s * .05)}" fill="#d6e4aa"/></g>`;
}
// テンダーステム・ブロッコリー（長い茎と小さな房、焼き目）
function xgbTenderstem(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'ts' + seed + x);
    let hd = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = R() * L * .08; hd += `<circle cx="${f(L * .4 + Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(L * (.06 + R() * .03))}" fill="${R() < .5 ? '#3f7a2c' : '#4f8a34'}" stroke="#2a5a1c" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${f(-L / 2)},0 Q0,${f(L * .03)} ${f(L * .36)},0" stroke="#8cbf5a" stroke-width="${f(L * .07)}" fill="none" stroke-linecap="round"/>${hd}</g>
        <path d="M${f(-L * .44)},${f(-L * .01)} Q0,0 ${f(L * .3)},${f(-L * .01)}" stroke="#c8e4a0" stroke-width="1" fill="none" opacity=".8"/>
        <ellipse cx="${f(L * .44)}" cy="${f(L * .02)}" rx="${f(L * .06)}" ry="${f(L * .04)}" fill="#2a1a0a" opacity=".45"/><ellipse cx="${f(-L * .1)}" cy="0" rx="${f(L * .06)}" ry="${f(L * .025)}" fill="#3a2a10" opacity=".35"/></g>`;
}

// スープの面（中心が明るい）
function xgbBroth(p, c, { R = 72, cx = 100, cy = 100, glow = .45 } = {}){
    return K.liquid(p, { R, c, op: 1, cx, cy, shine: false }) + `<g ${xgbBlur(p, 6)}><circle cx="${cx - 6}" cy="${cy - 8}" r="${f(R * .6)}" fill="${lt(c, .2)}" opacity="${glow}"/></g>`;
}
// 汁の上から薄くかぶせる（具を沈める）
const xgbVeil = (c, op = .3, R = 72, cx = 100, cy = 100) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" opacity="${op}"/>`;
// マグカップ（真上から、右に取っ手）
function xgbMug(p, { R = 72, cx = 90, c = '#c8402c', inside = '#f6f0e4' } = {}){
    return `<g ${p.sh(1.8)}><path d="M${cx + R - 10},76 Q${cx + R + 22},74 ${cx + R + 22},100 Q${cx + R + 22},126 ${cx + R - 10},124" stroke="${c}" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="100" r="${R}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <path d="M${cx + R - 6},82 Q${cx + R + 14},82 ${cx + R + 14},100" stroke="${lt(c, .35)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
        <circle cx="${cx}" cy="100" r="${R - 5}" fill="${p.rg(inside, .1, .3, .62, .64)}"/>
        <path d="M${f(cx - R * .72)},${f(100 - R * .4)} A${f(R * .84)},${f(R * .84)} 0 0 1 ${f(cx - R * .26)},${f(100 - R * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// クルトン（角切りのパンを焼いた）
function xgbCroutons(p, x, y, s, { n = 8, seed = 1, sz = 9 } = {}){
    const R = rng(p.id + 'crt' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, z = sz * (.8 + R() * .4); out += `<g ${T(cx, cy, R() * 90)}><rect x="${f(-z / 2)}" y="${f(-z / 2)}" width="${f(z)}" height="${f(z)}" rx="1.8" fill="${p.g('#dca04a', .35, .35)}" stroke="#94581c" stroke-width=".6"/><rect x="${f(-z / 2 + 1.5)}" y="${f(-z / 2 + 1.5)}" width="${f(z * .4)}" height="${f(z * .4)}" rx="1" fill="#f6dc9a" opacity=".8"/></g>`; }
    return `<g ${p.sh(.7)}><g ${p.crumb(.9)}>${out}</g></g>`;
}
// 丸麦・米などの小さな白い粒（汁に浮かぶ）
const xgbBarley = (p, x, y, s, { n = 50, seed = 1, c = '#efe6cc' } = {}) => xgbGrains(p, x, y, s, { cols: [c, dk(c, .08)], n, rx: 2.4, ry: 1.7, seed, jitter: .3, hi: .4, stroke: .4 });
// プルーン（半分）
function xgbPrune(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .38)}" fill="${p.g('#4a1e2a', .3, .3)}" stroke="#2a0e16" stroke-width=".6"/></g><path d="M${f(-s * .3)},0 Q0,${f(-s * .12)} ${f(s * .3)},0" stroke="#6a2a3a" stroke-width="1" fill="none"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".45"/></g>`;
}
// 細くさいた鶏肉
function xgbShredChicken(p, x, y, s, r = 0, { c = '#f0dcb8', seed = 1 } = {}){
    const R = rng(p.id + 'shc' + seed + x + y);
    const pts = Array.from({ length: 10 }, (_, i) => { const t = -s / 2 + i * s / 9, w = s * .16 * Math.sin(Math.PI * i / 9) + 1; return [t, -w + (R() - .5) * 1.4]; });
    const bot = Array.from({ length: 10 }, (_, i) => { const t = s / 2 - i * s / 9, w = s * .16 * Math.sin(Math.PI * i / 9) + 1; return [t, w + (R() - .5) * 1.4]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth([...pts, ...bot], true, .7)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g><path d="M${f(-s * .36)},0 L${f(s * .36)},${f(s * .02)} M${f(-s * .2)},${f(s * .07)} L${f(s * .26)},${f(s * .08)}" stroke="${dk(c, .15)}" stroke-width=".7" opacity=".7"/></g>`;
}
// 油の粒（スープ表面）
function xgbOilDrops(p, x, y, s, { n = 14, seed = 1, c = '#f2c860' } = {}){
    const R = rng(p.id + 'oil' + seed);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, rr = 1.6 + R() * 3.4, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr)}" ry="${f(rr * .85)}" fill="${c}" opacity=".45" stroke="${lt(c, .4)}" stroke-width=".5"/>`; }
    return out;
}
// 刻んだスウェード・角切りの根菜
function xgbDice(p, x, y, s, { n = 8, seed = 1, c = '#f0c050', sz = 8 } = {}){
    const R = rng(p.id + 'dc' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, z = sz * (.8 + R() * .4); out += `<g ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 90)}><rect x="${f(-z / 2)}" y="${f(-z / 2)}" width="${f(z)}" height="${f(z)}" rx="1.6" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g>`; }
    return `<g ${p.sh(.5)}>${out}</g>`;
}

// ---------- 料理 ----------
export default {
    // ローストチキン: 茶の線の楕円の盛り皿に、こんがり焼けた丸鶏（脚をしばって）、グレービー、焼いた人参・玉ねぎ・半割りレモン、タイム
    gb_roastchicken: p => [
        K.ovalDish(p, { rx: 96, ry: 80, base: '#f7f2e6', rim: '#7a4a26' }),
        xgbGravy(p, 96, 104, 132, { seed: 1, sy: .74, c: '#8a4a1c' }),
        `<g ${p.sh(.6)}>`, ...[[38, 100, -80], [52, 66, -40], [146, 150, 20], [56, 142, 40], [134, 50, -10], [164, 70, -70]].map(([x, y, r]) => xgbRoastCarrot(p, x, y, 32, r)), `</g>`,
        ...[[76, 46, 30], [104, 158, 10], [168, 112, -60]].map(([x, y, r]) => K.onion(p, x, y, 26, r, { c: '#c98a40', layers: 3 })),
        xgbRoastBird(p, 90, 98, 118, -6),
        xgbLemonHalf(p, 154, 132, 24), xgbLemonHalf(p, 40, 128, 20),
        xgbSprig(p, 112, 42, 30, 14), xgbSprig(p, 76, 160, 28, -24), xgbSprig(p, 160, 90, 22, 80),
        K.sprinkle(p, 92, 98, 100, { c: '#2a2420', n: 14, r: .5 }),
    ].join(''),

    // ローストビーフ: 紺の線の白い皿に、中がロゼのローストビーフの薄切り3枚、グレービー、ヨークシャープディング、人参といんげん
    gb_roastbeef: p => [
        K.plate(p, { rim: '#1f3a66' }),
        xgbGravy(p, 84, 108, 112, { seed: 2, sy: .9, c: '#5a2e12' }),
        xgbBeefSlice(p, 70, 74, 74, 48, -34, { seed: 1 }),
        xgbBeefSlice(p, 80, 100, 76, 48, -24, { seed: 2 }),
        xgbBeefSlice(p, 90, 126, 74, 46, -14, { seed: 3, pink: '#cf7068' }),
        K.glaze(p, 92, 128, 56, '#4e2610', { seed: 3, op: .55 }),
        xgbYorkshire(p, 140, 70, 50, { seed: 1 }),
        `<g ${p.sh(.6)}>`, ...[[134, 112, -60], [146, 118, -50], [158, 108, -70], [140, 128, -40], [152, 132, -55]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-13" y="-3.2" width="26" height="6.4" rx="2.4" fill="${p.g('#ec7d2a', .3, .25)}" stroke="#b8561a" stroke-width=".5"/><path d="M-10,-1.5 L8,-1.5" stroke="#fbb070" stroke-width="1" stroke-linecap="round"/></g>`), `</g>`,
        `<g ${p.sh(.6)}>`, ...[[112, 152, 8], [120, 158, 14], [128, 150, 4], [136, 156, 18], [122, 146, -4]].map(([x, y, r]) => K.greenBean(p, x, y, 30, r, { c: '#4f9a34' })), `</g>`,
        xgbButter(p, 126, 150, 8, 10),
    ].join(''),

    // トード・イン・ザ・ホール: 紺のホーローの天板いっぱいにふくらんだ黄金色のバター生地、その中に焼けたソーセージ6本
    gb_toadinhole: p => {
        const R = rng('tih');
        const sau = [[56, 74, 6], [102, 70, -4], [146, 78, 8], [56, 126, -6], [100, 130, 5], [146, 124, -8]];
        return [
            xgbRectDish(p, { w: 188, h: 156, glaze: '#24395e', inside: '#efe9dc', rim: '#f2efe6', rx: 24, inset: 8 }),
            `<g ${p.sh(1.2)}><g ${p.rough(5, .045)}><rect x="19" y="29" width="162" height="142" rx="18" fill="${p.rg('#e8b458', .25, .4, .45, .45)}" stroke="#94561c" stroke-width="1"/></g></g>`,
            `<g ${xgbBlur(p, 3)}><rect x="25" y="35" width="150" height="130" rx="16" fill="none" stroke="#a45a18" stroke-width="9" opacity=".7"/></g>`,
            `<g ${xgbBlur(p, 3)}>`, ...xgbSpots('tihb', 16, 72, 18, 100, 100, .85).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(9 + R() * 6)}" ry="${f(6 + R() * 4)}" fill="${R() < .45 ? '#f8dc90' : '#b0621c'}" opacity=".65"/>`), `</g>`,
            `<g ${p.sh(1)}>`, ...sau.map(([x, y, r], i) => `<path ${T(x, y, r)} d="${smooth(ring(1, 12, .14, rng('tihh' + i), 31, 17))}" fill="${p.g('#f2cc76', .4, .35)}" stroke="#b8742a" stroke-width=".8"/>`), `</g>`,
            ...sau.map(([x, y, r], i) => `<ellipse cx="${x + 1.5}" cy="${y + 3}" rx="23" ry="10" transform="rotate(${r} ${x} ${y})" fill="#7a3a10" opacity=".35" ${xgbBlur(p, 1.4)}/>`),
            ...sau.map(([x, y, r], i) => xgbSausage(p, x, y, 46, 19, r, { seed: i + 1, bend: 2, c: ['#9a5532', '#a65e38', '#8e4c2c'][i % 3] })),
            `<path d="M30,60 Q34,40 56,38" stroke="#fff3cc" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        ].join('');
    },

    // フィッシュパイ: クリーム色の両手の焼き皿に、こんがり焼いたマッシュポテト。左下をすくって、白いソースの中のたら・えび・グリンピースをのぞかせる
    gb_fishpie: p => {
        const cx = 100, cy = 100, Rr = 74;
        const a1 = 95 * Math.PI / 180, a2 = 185 * Math.PI / 180;
        const pts = []; for (let i = 0; i <= 36; i++){ const a = a2 + (a1 + 6.283 - a2) * i / 36; pts.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]); }
        const E = a => [cx + Math.cos(a) * Rr * .2, cy + Math.sin(a) * Rr * .2];
        const i1 = E(a1), i2 = E(a2), [x1, y1] = [cx + Math.cos(a1) * Rr, cy + Math.sin(a1) * Rr], [x2, y2] = [cx + Math.cos(a2) * Rr, cy + Math.sin(a2) * Rr];
        const top = xgbSm(pts) + ` L${f(i1[0])},${f(i1[1])} L${f(i2[0])},${f(i2[1])} Z`;
        const cut = `M${f(x1)},${f(y1)} L${f(i1[0])},${f(i1[1])} L${f(i2[0])},${f(i2[1])} L${f(x2)},${f(y2)}`;
        const clip = p.def('xgbfp', id => `<clipPath id="${id}"><path d="${top}"/></clipPath>`);
        return [
            xgbCasserole(p, { R: 84, glaze: '#ece2cc', inside: '#f6f0e2', rimW: 8 }),
            `<circle cx="100" cy="100" r="${Rr + 2}" fill="${p.rg('#f2e6c4', .2, .2)}"/>`,
            `<g ${p.sh(.5)}>`, xgbFlake(p, 50, 118, 24, 20, { c: '#faf4e4', seed: 1 }), xgbFlake(p, 76, 150, 22, -30, { c: '#f2e2b4', seed: 2 }), xgbFlake(p, 40, 102, 18, 70, { c: '#faf4e4', seed: 3 }), xgbFlake(p, 64, 136, 18, 10, { c: '#faf4e4', seed: 4 }), K.shrimp(p, 58, 104, 18, 30, { c: '#f08a68' }), K.shrimp(p, 84, 128, 18, -60, { c: '#f08a68' }), K.shrimp(p, 50, 140, 16, 100, { c: '#f08a68' }), `</g>`,
            xgbPeas(p, 66, 128, 46, { n: 10, seed: 2 }),
            xgbHerbs(p, 62, 126, 44, { n: 10 }),
            `<g ${p.sh(1.1)}><path d="${top}" fill="${p.g('#e8b44e', .25, .25)}"/></g>`,
            `<g clip-path="url(#${clip})">`, xgbMashSwirl(p, 100, 100, 76, { c: '#e6b24e', seed: 2 }),
            `<g ${xgbBlur(p, 3.4)}>`, ...[[80, 66, 14, 9], [120, 72, 16, 10], [140, 104, 14, 9], [116, 132, 15, 9], [96, 100, 11, 7], [68, 84, 10, 6], [132, 150, 10, 6]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#b05c14" opacity=".75"/>`), `</g>`,
            `<g ${xgbBlur(p, 1.2)}>`, ...[[118, 72, 6, 3.5], [138, 106, 6, 3.5], [82, 66, 5, 3], [114, 134, 6, 3]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#8a4410" opacity=".5"/>`), `</g>`,
            `</g>`,
            `<path d="${cut}" stroke="#fbeec4" stroke-width="3.2" fill="none" stroke-linejoin="round"/>`,
            `<path d="${cut}" stroke="#c4964e" stroke-width="1" fill="none" stroke-linejoin="round" transform="translate(1.4 1.4)"/>`,
            xgbHerbs(p, 112, 96, 90, { n: 12 }),
        ].join('');
    },
    // チキンとリーキのパイ: 紺の縁の白いホーローのパイ皿に、つやのあるパイ生地のふた（葉の飾り）。右下をすくって、クリームソースの鶏肉・リーキ・マッシュルームを見せる
    gb_chickenpie: p => {
        const { top, cut } = xgbScooped(100, 100, 82, 64, -8, 72);
        const clip = p.def('xgbcp', id => `<clipPath id="${id}"><path d="${top}"/></clipPath>`);
        const R = rng('xgbcp');
        return [
            xgbEnamelDish(p, { rx: 94, ry: 76 }),
            `<ellipse cx="100" cy="100" rx="80" ry="62" fill="${p.rg('#f1e0b2', .2, .2)}"/>`,
            `<g ${p.sh(.6)}>`, ...[[136, 112, 16], [116, 140, 15], [150, 128, 13], [126, 124, 14]].map(([x, y, s], i) => xgbChicken(p, x, y, s, i * 50, { c: '#ecd2a4', seed: i })),
            ...[[148, 104], [132, 146], [112, 128], [144, 140]].map(([x, y]) => `<g ${T(x, y)}><ellipse rx="6" ry="5" fill="${p.g('#d9e8b0', .2, .2)}" stroke="#7aa850" stroke-width="1.2"/><ellipse rx="3" ry="2.4" fill="none" stroke="#a8c878" stroke-width=".8"/></g>`),
            ...[[156, 118, 20], [124, 154, -30]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-7,1 Q-7,-6 0,-6 Q7,-6 7,1 L2.5,1 L2.5,6 L-2.5,6 L-2.5,1Z" fill="${p.g('#e4d2b4', .2, .25)}" stroke="#a88a62" stroke-width=".6"/></g>`), `</g>`,
            K.glaze(p, 134, 132, 44, '#fff4dc', { seed: 4, op: .35 }),
            `<g ${p.sh(1.3)}><path d="${top}" fill="${p.g('#de9c3c', .3, .3)}" stroke="#9a5a1a" stroke-width=".9"/></g>`,
            `<g clip-path="url(#${clip})">`,
            `<g ${xgbBlur(p, 4)}><ellipse cx="100" cy="100" rx="78" ry="60" fill="none" stroke="#a65c18" stroke-width="10" opacity=".55"/>`, ...xgbSpots('cpb', 9, 60, 26, 100, 100, .78).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(10 + R() * 8)}" ry="${f(6 + R() * 4)}" fill="${R() < .5 ? '#f6d07a' : '#b8681e'}" opacity=".55"/>`), `</g>`,
            `<g ${p.crumb(.5)}><ellipse cx="100" cy="100" rx="82" ry="64" fill="#e8aa48" opacity=".25"/></g>`,
            `</g>`,
            xgbPastryLeaf(p, 76, 86, 34, -30), xgbPastryLeaf(p, 98, 74, 34, 10), xgbPastryLeaf(p, 72, 110, 30, 40, { c: '#dc9a3c' }),
            `<circle cx="88" cy="96" r="4" fill="#6a3a10"/><circle cx="88" cy="96" r="4" fill="none" stroke="#f2c070" stroke-width="1.2"/>`,
            `<path d="${cut}" stroke="#fbe7b0" stroke-width="3.4" fill="none" stroke-linejoin="round"/><path d="${cut}" stroke="#c88a3a" stroke-width=".9" fill="none" stroke-linejoin="round" transform="translate(1.6 1.6)"/><path d="${cut}" stroke="#d99a42" stroke-width=".7" fill="none" stroke-dasharray="3 2" transform="translate(-1.6 -1.4)"/>`,
            `<path d="M36,86 Q46,54 82,42" stroke="#fff6dc" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
        ].join('');
    },

    // ランカシャー・ホットポット: 茶色の両手の土鍋に、薄切りのじゃがいもをうろこのように重ねて焼き、縁はこんがり。すき間から肉汁、パセリ
    gb_hotpot: p => {
        const R = rng('xgbhp');
        const rings = [[58, 14, 19], [42, 10, 19], [22, 6, 18], [0, 1, 17]];
        let sl = '';
        rings.forEach(([rad, n, s], k) => {
            for (let i = 0; i < n; i++){
                const a = i / n * 6.283 + k * .3, x = 100 + Math.cos(a) * rad, y = 100 + Math.sin(a) * rad, col = ['#e2aa52', '#ecc070', '#d8963e', '#f0cc80'][Math.floor(R() * 4)];
                const c = k === 0 ? dk(col, .12) : col;
                sl += `<g ${T(x, y, a * 57.3)}><ellipse rx="${s}" ry="${s * .9}" fill="${p.g(c, .35, .15)}" stroke="${dk(c, .5)}" stroke-width="1.6"/><ellipse rx="${s - 2}" ry="${s * .9 - 2}" fill="none" stroke="${dk(c, .25)}" stroke-width="2" opacity=".5"/><path d="M${-s * .6},${-s * .1} A${s * .62},${s * .62} 0 0 1 ${-s * .1},${-s * .6}" stroke="#fff4d8" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
            }
        });
        return [
            xgbCasserole(p, { R: 86, glaze: '#5e3a22', inside: '#4a2a14', rimW: 8 }),
            `<circle cx="100" cy="100" r="77" fill="${p.rg('#5a3014', .15, .3)}"/>`,
            `<g ${p.sh(.8)}>${sl}</g>`,
            `<g ${xgbBlur(p, 2.5)}>`, ...xgbSpots('hpb', 10, 62, 22).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(7 + R() * 5)}" ry="${f(4 + R() * 3)}" fill="#8a4a14" opacity=".45"/>`), `</g>`,
            xgbHerbs(p, 100, 100, 110, { n: 22 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .5 }),
        ].join('');
    },

    // ポークチョップとアップルソース: 緑の線の白い皿に、こんがり焼いた骨つきの厚いポークチョップ2枚、白い小鉢のアップルソース、バターをからめた新じゃがとパセリ
    gb_porkchops: p => [
        K.plate(p, { rim: '#3f6a46' }),
        xgbChop(p, 76, 80, 82, -24, { seed: 1 }),
        xgbChop(p, 88, 124, 80, 8, { seed: 2, c: '#b06c34' }),
        K.glaze(p, 84, 104, 70, '#c88a40', { seed: 2, op: .25 }),
        ...[[144, 62], [162, 92], [138, 90], [150, 116]].map(([x, y], i) => xgbNewPotato(p, x, y, 26, i * 40, { seed: i })),
        xgbHerbs(p, 150, 90, 44, { n: 14 }),
        xgbRamekin(p, 136, 146, 42, '#ecd894'),
        xgbGrains(p, 136, 146, 26, { cols: ['#f4e4a8', '#e2c47a'], n: 26, rx: 2.4, ry: 1.8, stroke: 0, jitter: .7 }),
        xgbSprig(p, 120, 84, 20, -60, { c: '#7a9a6a', leaf: 3, n: 5 }),
    ].join(''),
    // ギャモンステーキ: 白い皿に、脂の縁がついたピンクのギャモン（焼き網の跡）、上に目玉焼きと焼いたパイナップルの輪切り、グリンピースとチップス
    gb_gammon: p => {
        const R = rng('xgbgm');
        const pts = ring(1, 14, .07, R, 60, 42);
        return [
            K.plate(p, { rim: '#3a6a8a' }),
            `<g ${T(88, 92, -14)}><g ${p.sh(1.3)}><path d="${smooth(pts)}" fill="${p.g('#f2dcae', .3, .25)}" stroke="#b8803a" stroke-width="1.4"/></g>
                <path d="${smooth(pts.map(([a, b]) => [a * .92 + 1, b * .82 + 5]))}" fill="${p.rg('#e48a80', .2, .22, .45, .5)}" stroke="#b8584e" stroke-width=".7"/>
                <path d="M-40,-20 L-10,30 M-20,-30 L12,26 M2,-32 L32,18 M24,-28 L46,8" stroke="#8a3a22" stroke-width="4" stroke-linecap="round" opacity=".35" ${xgbBlur(p, 1)}/>
                <path d="M-46,-14 Q-20,-38 20,-36" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`,
            xgbPineRing(p, 120, 104, 46),
            K.friedEgg(p, 70, 86, 56, -10),
            `<g ${p.sh(.8)}>`, ...[[62, 150, -20], [76, 156, -8], [52, 136, -30], [70, 142, -14]].map(([x, y, r], i) => xgbChip(p, x, y, 40, r, { seed: i, w: 10, c: ['#e8bb4e', '#e2ad42', '#efc65c', '#dca03a'][i] })), `</g>`,
            xgbPeas(p, 132, 150, 48, { n: 40, seed: 1 }),
            xgbPeas(p, 150, 70, 36, { n: 20, seed: 2 }),
        ].join('');
    },

    // ケジャリー: 青い鉢に、カレー粉で黄色く炊いたバスマティライス、ほぐした燻製ハドック、ゆで卵、たっぷりのパセリ、レモン
    gb_kedgeree: p => [
        K.bowl(p, { glaze: '#3e6e8e', inside: '#f4efe4' }),
        xgbRice(p, 100, 100, 142, { tint: '#efd06a', seed: 1, grain: 4.4, density: 1.2 }),
        `<g ${p.sh(.5)}>`, ...[[72, 78, 26, 20], [128, 72, 24, -30], [140, 118, 26, 60], [82, 128, 24, 100], [104, 100, 22, 10], [60, 106, 20, -60], [112, 140, 20, 40]].map(([x, y, s, r], i) => xgbFlake(p, x, y, s, r, { c: i % 2 ? '#f6e6b8' : '#f2d896', seed: i })), `</g>`,
        K.eggHalf(p, 100, 68, 32, -10), K.eggHalf(p, 148, 94, 32, 30), K.eggHalf(p, 104, 130, 32, 10), K.eggHalf(p, 60, 134, 30, -20),
        xgbHerbs(p, 100, 100, 130, { n: 50, cols: ['#3f8a2c', '#5aa63c', '#2f7a22'] }),
        K.lemon(p, 148, 140, 28, -40), K.lemon(p, 58, 70, 24, 140),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 10, r: .5 }),
    ].join(''),

    // ラムチョップとミントソース: 灰青の線の白い皿に、骨を出してこんがり焼いたラムのカツレツ3本、ミントソースの小鉢、新じゃが、グリンピース
    gb_lambchops: p => [
        K.plate(p, { rim: '#5a6a72' }),
        xgbCutlet(p, 56, 72, 62, 22, { seed: 1 }),
        xgbCutlet(p, 50, 108, 62, 2, { seed: 2, c: '#7e4220' }),
        xgbCutlet(p, 60, 144, 62, -20, { seed: 3 }),
        ...[[138, 128], [156, 106], [126, 152], [150, 146]].map(([x, y], i) => xgbNewPotato(p, x, y, 26, i * 50, { seed: i })),
        xgbHerbs(p, 144, 132, 50, { n: 14 }),
        xgbRamekin(p, 140, 66, 46, '#a39a48'),
        xgbHerbs(p, 140, 66, 30, { n: 26, cols: ['#2f7a22', '#4f9a34'] }),
        `<path d="M128,58 Q134,52 142,52" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        xgbPeas(p, 108, 104, 30, { n: 12, seed: 3 }), xgbPeas(p, 106, 152, 34, { n: 16, seed: 5 }),
        `<g ${p.sh(.4)}>`, xgbLeaf(p, 116, 88, 16, -30, { c: '#3a8a30' }), xgbLeaf(p, 124, 96, 14, 40, { c: '#2f7a2a' }), `</g>`,
    ].join(''),
    // チリコンカン: テラコッタ色の鉢に、白いご飯と、牛ひき肉・キドニービーンズ・赤ピーマンの赤茶色のチリ、サワークリーム、コリアンダー
    gb_chilli: p => [
        K.bowl(p, { glaze: '#b8542a', inside: '#f3ebdc' }),
        xgbRice(p, 62, 100, 70, { sy: 1.6, seed: 1 }),
        `<g ${p.sh(.9)}><path ${T(124, 100)} d="${smooth(ring(48, 12, .12, rng('xgbch'), 1, 1.26))}" fill="${p.rg('#8e2c16', .2, .28, .4, .38)}"/></g>`,
        xgbGrains(p, 124, 100, 88, { cols: ['#6a2a14', '#7e3418', '#5a2210'], n: 130, rx: 2.6, ry: 2, seed: 1, sy: 1.26, jitter: .6, hi: .15 }),
        xgbKidneys(p, 124, 100, 78, { n: 16, sy: 1.26 }),
        `<g ${p.sh(.4)}>`, ...[[104, 70, 20], [144, 118, -30], [110, 134, 60], [146, 76, 100]].map(([x, y, r]) => K.pepperPiece(p, x, y, 13, r, { c: '#d8301e' })), `</g>`,
        K.glaze(p, 124, 100, 86, '#b8341a', { seed: 2, op: .22 }),
        `<g ${p.sh(.8)}><path ${T(128, 96)} d="${smooth(ring(13, 9, .25, rng('xgbsc')))}" fill="${p.rg('#fbf8ee', .2, .1)}" stroke="#e2dccb" stroke-width=".6"/></g>`,
        `<path d="M120,92 Q126,86 134,90" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<g ${p.sh(.4)}>`, xgbCoriander(p, 112, 112, 15, -20), xgbCoriander(p, 140, 98, 14, 50), xgbCoriander(p, 66, 66, 13, 10), `</g>`,
        xgbChives(p, 126, 100, 70, { n: 12 }),
    ].join(''),

    // コンビーフハッシュ: 鋳鉄のスキレットに、こんがり焼いた角切りじゃがいもとコンビーフ、玉ねぎ、上に目玉焼き2つ、パセリ
    gb_cornedbeefhash: p => {
        const R = rng('xgbcbh');
        const sp = xgbSpots('cbh', 42, 64, 10.5, 94, 100);
        return [
            xgbSkillet(p, { R: 82, cx: 94 }),
            `<g ${p.rough(4, .06)}><circle cx="94" cy="100" r="70" fill="${p.rg('#8a5226', .2, .3)}"/></g>`,
            `<g ${xgbBlur(p, 2)}>`, ...xgbSpots('cbhb', 16, 64, 14, 94, 100).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(6 + R() * 4)}" ry="${f(4 + R() * 3)}" fill="${R() < .5 ? '#c88a40' : '#4a2410'}" opacity=".6"/>`), `</g>`,
            `<g ${p.sh(.6)}>`, ...sp.map(([x, y, r], i) => i % 3 === 2
                ? `<path ${T(x, y, r)} d="${smooth(ring(8, 7, .45, R, 1.1, 1), true, .6)}" fill="${p.g(['#b4604c', '#9a4a3a'][i % 2], .3, .3)}" stroke="#6a2e22" stroke-width=".6"/><g ${T(x, y, r)}><path d="M-3,-2 l5,1 M-2,2 l4,1" stroke="#d89a88" stroke-width=".9" opacity=".7"/></g>`
                : `<g ${T(x, y, r)}><rect x="-6.5" y="-6" width="13" height="12" rx="3" fill="${p.g(['#e0a24a', '#d08a36', '#e8b860', '#c47a2c'][i % 4], .3, .35)}" stroke="#8a5218" stroke-width=".7"/><path d="M-4,-3.6 L3,-3.6" stroke="#fff2c8" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`), `</g>`,
            ...[[64, 120, 20], [126, 70, -40], [142, 128, 70]].map(([x, y, r]) => xgbOnionStrip(p, x, y, 16, r, { c: '#c98a40' })),
            K.friedEgg(p, 78, 82, 54, -10), K.friedEgg(p, 116, 124, 54, 20),
            xgbHerbs(p, 94, 100, 130, { n: 22 }),
            K.sprinkle(p, 94, 100, 130, { c: '#1a1410', n: 16, r: .6 }),
        ].join('');
    },

    // マカロニチーズ: 白い楕円のグラタン皿に、チェダーのソースでこんがり焼いたマカロニ、トマトの輪切り、パン粉
    gb_macaroni: p => {
        const R = rng('xgbmac');
        return [
            K.ovalDish(p, { rx: 94, ry: 78, rim: '#c9a24a', base: '#f6f1e6', deep: true }),
            `<ellipse cx="100" cy="100" rx="78" ry="62" fill="${p.rg('#eebc48', .2, .25, .4, .36)}"/>`,
            `<g ${p.sh(.4)}>`, ...xgbSpots('mac', 34, 68, 11, 100, 100, .8).map(([x, y, r]) => K.macaroni(p, x, y, 13 + R() * 3, r, { c: '#f6d270' })), `</g>`,
            `<ellipse cx="100" cy="100" rx="78" ry="62" fill="#f2c24e" opacity=".35"/>`,
            `<g ${xgbBlur(p, 3.2)}>`, ...[[60, 80, 16, 10], [104, 62, 18, 9], [142, 88, 14, 9], [74, 126, 16, 10], [122, 134, 16, 9], [100, 100, 10, 7]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#b8661a" opacity=".7"/>`), `</g>`,
            ...[[78, 84, 0], [122, 80, 30], [100, 116, 60], [62, 112, 20], [140, 116, 80]].map(([x, y, r]) => xgbTomatoSlice(p, x, y, 26, r)),
            `<g ${xgbBlur(p, 1.4)}>`, ...[[86, 92], [128, 88], [106, 124]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#7a2a10" opacity=".45"/>`), `</g>`,
            K.crumbs(p, 100, 100, 130, { n: 34, c: '#d9973c' }),
            `<path d="M42,90 Q50,68 80,58" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 12, r: .5 }),
        ].join('');
    },

    // ステーキ＆エールパイ: 茶の線の白い皿に、縁をフォークで押さえた丸いパイ。右下を切り分けて、黒ビールで煮込んだ牛肉とマッシュルームの濃いグレービーを見せる。グリンピース
    gb_steakpie: p => {
        const cx = 90, cy = 94, Rr = 66;
        const { top, cut } = xgbScooped(cx, cy, Rr, Rr, -6, 78, .06);
        const clip = p.def('xgbsp', id => `<clipPath id="${id}"><path d="${top}"/></clipPath>`);
        return [
            K.plate(p, { rim: '#6a3a1e' }),
            xgbGravy(p, 128, 130, 66, { seed: 3, c: '#4a2410', sy: .8 }),
            `<circle cx="${cx}" cy="${cy}" r="${Rr - 2}" fill="${p.rg('#4e2812', .15, .25)}"/>`,
            ...[[132, 110, 24, 10], [110, 138, 22, 60], [140, 134, 20, 120], [118, 116, 18, 30]].map(([x, y, s, r], i) => xgbBeefChunk(p, x, y, s, r, { seed: i, c: '#6a361a' })),
            `<g ${p.sh(.5)}>`, ...[[122, 124, 20], [144, 108, -30]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-7,1 Q-7,-6 0,-6 Q7,-6 7,1 L2.5,1 L2.5,6 L-2.5,6 L-2.5,1Z" fill="${p.g('#c8a882', .2, .25)}" stroke="#7a5a3a" stroke-width=".6"/></g>`), `</g>`,
            K.glaze(p, 128, 124, 40, '#3a1a08', { seed: 5, op: .45 }),
            `<g clip-path="url(#${clip})">`, xgbPieLid(p, cx, cy, Rr), `</g>`,
            `<path d="${cut}" stroke="#f6dca0" stroke-width="3.6" fill="none" stroke-linejoin="round"/><path d="${cut}" stroke="#b8782a" stroke-width=".8" fill="none" stroke-dasharray="3 2" transform="translate(1.6 1.6)"/>`,
            `<path d="M${cx - 10},${cy - 12} l12,8 M${cx - 10},${cy - 4} l12,-8" stroke="#6a3a10" stroke-width="2.4" stroke-linecap="round"/>`,
            xgbPastryLeaf(p, cx - 26, cy - 28, 26, -40), xgbPastryLeaf(p, cx + 4, cy - 34, 24, 20),
            `<path d="M${cx - 50},${cy - 14} Q${cx - 44},${cy - 44} ${cx - 16},${cy - 54}" stroke="#fff3d6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
            xgbPeas(p, 152, 56, 34, { n: 18, seed: 1 }),
            xgbPeas(p, 48, 156, 30, { n: 14, seed: 2 }),
        ].join('');
    },

    // ミンス＆タティーズ: 紺の線の白い皿に、にんじん・玉ねぎ入りの牛ひき肉のグレービー煮、バターをのせたマッシュポテト（タティーズ）
    gb_minceandtatties: p => [
        K.plate(p, { rim: '#3f5f8a' }),
        `<g ${p.sh(.9)}><path ${T(84, 112)} d="${smooth(ring(58, 12, .14, rng('xgbmt'), 1.05, .85))}" fill="${p.rg('#5e3216', .2, .25, .4, .38)}"/></g>`,
        xgbGrains(p, 84, 112, 104, { cols: ['#6e3a1e', '#8a4826', '#5a2e14'], n: 150, rx: 2.6, ry: 2, seed: 2, sy: .85, jitter: .6, hi: .2 }),
        `<g ${p.sh(.4)}>`, ...xgbSpots('mtc', 9, 46, 13, 84, 116, .8).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-3.8" y="-3.8" width="7.6" height="7.6" rx="1.4" fill="${p.g('#ef7d2a', .3, .2)}" stroke="#b8531a" stroke-width=".5"/></g>`), `</g>`,
        ...[[62, 98, 30], [100, 132, -40]].map(([x, y, r]) => xgbOnionStrip(p, x, y, 16, r, { c: '#c9924a' })),
        K.glaze(p, 84, 112, 100, '#4a2410', { seed: 2, op: .3 }),
        `<g ${p.sh(1.3)}>`, xgbMashSwirl(p, 136, 76, 40, { c: '#f4e2a8', seed: 3 }), `</g>`,
        `<path d="${smooth(ring(11, 9, .3, rng('xgbmtb')).map(([a, b]) => [a + 138, b + 74]))}" fill="#f8dc6a" opacity=".55"/>`,
        xgbButter(p, 136, 72, 12, -10),
        xgbPeas(p, 150, 130, 30, { n: 12, seed: 2 }),
        K.sprinkle(p, 136, 76, 60, { c: '#2a2420', n: 10, r: .5 }),
    ].join(''),
    // ツナのパスタベイク: 青い縁の白い角皿に、クリームソースのペンネ、ツナ、スイートコーン、とろけてこんがり焼けたチェダー
    gb_tunabake: p => {
        const R = rng('xgbtb');
        return [
            xgbRectDish(p, { w: 186, h: 152, glaze: '#f3eee2', rim: '#5a7ea0', rx: 22 }),
            `<rect x="20" y="36" width="160" height="128" rx="14" fill="${p.rg('#e2b860', .2, .3, .45, .45)}"/>`,
            `<g ${p.sh(.6)}>`, ...[...xgbSpots('tbp', 34, 80, 14, 100, 100, .76), [36, 50, 30], [164, 50, -40], [36, 150, -20], [164, 150, 50]].map(([x, y, r]) => xgbPenne(p, x, y, 27 + R() * 4, r, { c: R() < .5 ? '#f2c860' : '#e8b850' })), `</g>`,
            `<rect x="20" y="36" width="160" height="128" rx="14" fill="#f6e0a0" opacity=".25"/>`,
            `<g ${p.sh(.4)}>`, ...[[64, 70, 20], [130, 66, -20], [148, 120, 40], [80, 132, 70], [108, 100, 0], [46, 108, 30]].map(([x, y, r], i) => xgbFlake(p, x, y, 18, r, { c: '#dcb08a', seed: i })), `</g>`,
            K.corn(p, 100, 100, 140, { n: 20 }),
            `<path ${T(100, 100)} d="${smooth(ring(1, 16, .22, rng('xgbtbc'), 70, 56))}" fill="${p.rg('#eeac3a', .25, .25)}" opacity=".75"/>`,
            `<g ${p.sh(.6)}>`, ...xgbSpots('tbq', 8, 66, 30, 100, 100, .76).map(([x, y, r]) => xgbPenne(p, x, y, 27, r, { c: '#f0c25a' })), `</g>`,
            `<g ${xgbBlur(p, 2.4)}>`, ...xgbSpots('tbc', 10, 72, 22, 100, 100, .78).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(12 + R() * 7)}" ry="${f(6 + R() * 4)}" fill="${R() < .5 ? '#e8a030' : '#a8561a'}" opacity=".6"/>`), `</g>`,
            xgbHerbs(p, 100, 100, 130, { n: 16 }),
            K.sprinkle(p, 100, 100, 130, { c: '#2a2420', n: 10, r: .5 }),
        ].join('');
    },

    // ウェルシュ・レアビット: 木の板に、チェダーとエールのソースをのせてこんがり焼いた厚切りトースト2枚、ウスターソース、黒こしょう、チャイブ
    gb_rarebit: p => [
        xgbBoard(p, { w: 188, h: 156, c: '#c99a62' }),
        xgbRarebitToast(p, 72, 92, 92, 84, -10, { seed: 1 }),
        xgbRarebitToast(p, 128, 112, 92, 84, 8, { seed: 2 }),
        ...[[62, 84], [80, 100], [120, 106], [138, 120], [130, 98]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#4a1e0a" opacity=".75"/>`),
        K.sprinkle(p, 100, 102, 130, { c: '#1e1612', n: 30, r: .6 }),
        xgbChives(p, 100, 102, 110, { n: 14 }),
    ].join(''),

    // ベーコンとたまごのパイ: 黄の線の白い皿に、縁をつまんだショートクラストのパイ。卵液とベーコン・グリンピースを流し、まるごとの卵の黄身がのぞく
    gb_baconeggpie: p => {
        let crimp = '';
        for (let i = 0; i < 30; i++){ const a = i / 30 * 6.283; crimp += `<circle cx="${f(100 + Math.cos(a) * 74)}" cy="${f(100 + Math.sin(a) * 74)}" r="7" fill="${p.g('#e6b468', .3, .3)}" stroke="#a87230" stroke-width=".6"/>`; }
        const R = rng('xgbbep');
        return [
            K.plate(p, { rim: '#c9a24a' }),
            `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="79" fill="#d49a50"/>${crimp}</g>`,
            `<circle cx="100" cy="100" r="66" fill="${p.rg('#f0cf6a', .25, .2)}" stroke="#b8803a" stroke-width="1.2"/>`,
            `<g ${xgbBlur(p, 3)}>`, ...xgbSpots('bepb', 10, 56, 24).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(9 + R() * 6)}" ry="${f(6 + R() * 4)}" fill="#c8862a" opacity=".55"/>`), `</g>`,
            `<g ${p.sh(.5)}>`, ...[[70, 64, 20], [126, 70, -30], [64, 116, 70], [136, 126, 10], [100, 146, -20], [98, 80, 40]].map(([x, y, r]) => K.bacon(p, x, y, 20, 10, r)), `</g>`,
            ...[[90, 110], [128, 98], [76, 88], [112, 132], [110, 64]].map(([x, y]) => `<g ${p.sh(.6)}><ellipse cx="${x}" cy="${y}" rx="14" ry="12.5" fill="${p.rg('#fbf2d6', .2, .12)}" stroke="#e2cc94" stroke-width=".6"/></g><circle cx="${x + 1}" cy="${y + 1}" r="7.4" fill="${p.rg('#f2a21a', .3, .2, .35, .32)}" stroke="#c8800e" stroke-width=".6"/><ellipse cx="${x - 2}" cy="${y - 2}" rx="2.4" ry="1.4" fill="#fff" opacity=".7"/>`),
            xgbPeas(p, 100, 104, 110, { n: 22, seed: 4 }),
            xgbHerbs(p, 100, 100, 110, { n: 14 }),
        ].join('');
    },

    // グラモーガンソーセージ: 赤い線の白い皿に、チーズとリーキをパン粉でまとめて揚げ焼きした黄金色の棒4本、葉野菜、ミニトマト、チャツネ
    gb_glamorgan: p => {
        const R = rng('xgbgl');
        return [
            K.plate(p, { rim: '#b03a3a' }),
            ...[[140, 70, 30, '#8cc551'], [152, 104, -20, '#a9d86a'], [128, 90, 70, '#7ab843'], [146, 136, 10, '#c6e48a']].map(([x, y, r, c], i) => K.leafPiece(p, x, y, 44, r, { c, seed: i })),
            K.cherryTomato(p, 150, 120, 20), K.cherryTomato(p, 134, 62, 18), K.cherryTomato(p, 162, 90, 16),
            xgbCrumbLog(p, 76, 64, 72, 22, 30, { seed: 1 }),
            xgbCrumbLog(p, 72, 92, 76, 22, 22, { seed: 2, c: '#d4983e' }),
            xgbCrumbLog(p, 72, 120, 76, 22, 14, { seed: 3 }),
            xgbCrumbLog(p, 80, 148, 70, 22, 6, { seed: 4, c: '#dca850' }),
            xgbRamekin(p, 132, 152, 34, '#7a3a1a'),
            xgbGrains(p, 132, 152, 20, { cols: ['#5a2410', '#9a5a2a'], n: 14, rx: 2.4, ry: 1.8, stroke: 0, jitter: .7 }),
            `<g ${p.sh(.3)}>`, K.shreds(p, 76, 104, 60, { c: '#7ab850', n: 8, w: 1.4, len: .12, seed: 3 }), `</g>`,
        ].join('');
    },

    // スパイシー・ビーンバーガー: 木の板に、開いたバンズにレタス・キドニービーンズとコーン入りのパテ・トマト、横にごまつきの上のバンズ、ピクルスとトマト
    gb_beanburgers: p => {
        const R = rng('xgbbb');
        const lettuce = Array.from({ length: 24 }, (_, j) => { const a = j / 24 * 6.283, rr = (j % 2 ? 42 : 48) * (1 - R() * .08); return [80 + Math.cos(a) * rr, 108 + Math.sin(a) * rr * .96]; });
        let ses = '';
        for (let i = 0; i < 18; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 28, x = 148 + Math.cos(a) * d, y = 64 + Math.sin(a) * d; ses += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.8" ry="1" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="#fbf2d8" stroke="#c8a870" stroke-width=".3"/>`; }
        return [
            xgbBoard(p, { w: 186, h: 160, c: '#b88a56', r: -4 }),
            `<g ${p.sh(1.3)}><circle cx="80" cy="108" r="50" fill="${p.g('#d49a4a', .3, .3)}" stroke="#9a6224" stroke-width=".8"/></g>`,
            `<g ${p.sh(.6)}><path d="${smooth(lettuce)}" fill="${p.g('#8cc551', .35, .25)}" stroke="#5a8a2c" stroke-width=".7"/></g>`,
            `<g ${p.sh(1.1)}><g ${p.rough(3, .1)}><circle cx="80" cy="108" r="38" fill="${p.g('#8a4a2a', .25, .32)}" stroke="#5a2a14" stroke-width=".8"/></g></g>`,
            `<g ${p.crumb(.7)}><circle cx="80" cy="108" r="34" fill="#9a5630" opacity=".7"/></g>`,
            xgbKidneys(p, 80, 108, 54, { n: 8, seed: 2 }),
            K.corn(p, 80, 108, 54, { n: 10 }),
            xgbTomatoSlice(p, 92, 120, 36, 20),
            `<path d="M54,92 Q64,78 82,76" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`,
            `<g ${p.sh(1.4)}><circle cx="148" cy="64" r="34" fill="${p.rg('#d68a34', .3, .35, .35, .3)}" stroke="#9a5a1c" stroke-width=".8"/></g>`, ses,
            `<path d="M126,52 Q134,38 150,36" stroke="#fff3d6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
            K.leafPiece(p, 150, 140, 40, -20, { c: '#a9d86a', seed: 3 }),
            xgbTomatoSlice(p, 158, 136, 26, 40),
            ...[[132, 156], [118, 154]].map(([x, y]) => `<g ${T(x, y)}><circle r="7" fill="${p.g('#6a9a3a', .3, .25)}" stroke="#3f6a22" stroke-width=".6"/><circle r="4.4" fill="#c8d890"/></g>`),
        ].join('');
    },
    // ローストポテト: 茶の線の楕円の皿に、外はカリカリ・角が焦げ茶のローストポテト、ローズマリー、塩
    gb_roastpotatoes: p => {
        const R = rng('xgbrp');
        return [
            K.ovalDish(p, { rx: 96, ry: 80, base: '#f7f2e6', rim: '#7a4a26' }),
            ...[...xgbSpots('rp', 14, 58, 27, 100, 100, .8)].map(([x, y, r], i) => xgbRoastPot(p, x, y, 38 + R() * 8, r, { seed: i, c: ['#dc9a36', '#d08a2c', '#e6aa44', '#c8822a'][i % 4] })),
            xgbSprig(p, 70, 70, 34, 30, { c: '#4a6a3a', leaf: 2.6, n: 9 }), xgbSprig(p, 132, 130, 30, -40, { c: '#4a6a3a', leaf: 2.6, n: 8 }),
            K.sprinkle(p, 100, 100, 140, { c: '#ffffff', n: 30, r: .8 }),
        ].join('');
    },

    // ヨークシャープディング: 白い皿に、高くふくらんだヨークシャープディング4つ、ひとつにグレービーをたっぷり
    gb_yorkshire: p => [
        K.plate(p, { rim: '#1f3a66' }),
        xgbYorkshire(p, 72, 72, 66, { seed: 1 }),
        xgbYorkshire(p, 132, 74, 62, { seed: 2, c: '#d48e30' }),
        xgbYorkshire(p, 70, 132, 62, { seed: 3, c: '#dc9c40' }),
        xgbYorkshire(p, 130, 132, 66, { seed: 4 }),
        xgbGravy(p, 136, 140, 50, { seed: 5, c: '#6a3416', sy: .8 }),
        `<path ${T(133, 135)} d="${smooth(ring(19, 10, .2, rng('xgbyg')))}" fill="${p.rg('#6a3416', .2, .25)}"/>`,
        `<path d="M120,130 Q126,120 138,120" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // はちみつローストのパースニップ: 楕円の皿に、縦に切ってはちみつとマスタードで照りよく焼いたパースニップ、タイム
    gb_parsnips: p => [
        K.ovalDish(p, { rx: 96, ry: 80, base: '#f6f1e4', rim: '#4a6a3a' }),
        ...[[98, 58, 116, -8], [92, 82, 128, 4], [106, 104, 128, -6], [96, 126, 120, 6], [100, 146, 96, -4]].map(([x, y, L, r], i) => xgbParsnip(p, x, y, L, r, { w: 21, c: ['#cf913c', '#c48436', '#d89c46'][i % 3] })),
        K.glaze(p, 100, 100, 110, '#e8a83a', { seed: 1, op: .2 }),
        xgbSprig(p, 60, 112, 28, 60), xgbSprig(p, 144, 82, 26, -30), xgbSprig(p, 116, 156, 24, 10),
        K.sprinkle(p, 100, 100, 130, { c: '#2a2420', n: 12, r: .5 }),
    ].join(''),

    // 芽キャベツとベーコン: 白い鉢に、半分に切って焼いた芽キャベツとカリカリのベーコン、黒こしょう
    gb_sprouts: p => {
        const R = rng('xgbsp');
        return [
            K.bowl(p, { glaze: '#e8e2d2', inside: '#f6f0e2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#4a6a3a" stroke-width="1.8" opacity=".8"/>`,
            ...xgbSpots('spr', 16, 58, 26).map(([x, y, r], i) => xgbSprout(p, x, y, 30 + R() * 6, r, { half: i % 4 !== 3, c: ['#5f9e38', '#4a8a2c', '#6aaa40'][i % 3], seed: i })),
            `<g ${p.sh(.5)}>`, ...xgbSpots('spb', 10, 56, 18, 100, 100).map(([x, y, r]) => `<g ${T(x + 6, y + 6, r)}><rect x="-6" y="-4" width="12" height="8" rx="1.6" fill="${p.g('#b8482e', .25, .3)}" stroke="#7a2a18" stroke-width=".5"/><rect x="-5" y="-1.2" width="10" height="2.4" rx="1" fill="#f0d0b0" opacity=".9"/></g>`), `</g>`,
            K.glaze(p, 98, 98, 110, '#f6e08a', { seed: 1, op: .18 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 22, r: .6 }),
        ].join('');
    },

    // 紫キャベツの煮込み: 白い鉢に、りんごと赤玉ねぎと一緒に甘酸っぱく煮た、つやのある赤紫のキャベツの千切り
    gb_redcabbage: p => {
        const R = rng('xgbrc');
        let sh = '';
        for (let i = 0; i < 90; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 60, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d, L = 12 + R() * 10, ang = R() * 3.14, dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2, b = (R() - .5) * 6, c = ['#7a1f52', '#8e2a62', '#6a1846', '#a03a72'][i % 4];
            const d0 = `M${f1(x - dx)},${f1(y - dy)}q${f1(dx - dy * b / L)},${f1(dy + dx * b / L)} ${f1(dx * 2)},${f1(dy * 2)}`;
            sh += `<path d="${d0}" stroke="${dk(c, .35)}" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="${d0}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`; }
        return [
            K.bowl(p, { glaze: '#e8e2d2', inside: '#f6f0e2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#6a2a52" stroke-width="1.8" opacity=".8"/>`,
            `<g ${p.sh(.9)}><circle cx="100" cy="100" r="70" fill="${p.rg('#5a1640', .2, .3)}"/></g>`,
            `<g ${p.sh(.4)}>${sh}</g>`,
            `<g ${p.sh(.4)}>`, ...[[80, 82, 20], [126, 112, -30], [104, 136, 60], [130, 74, 10]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-5" y="-4" width="10" height="8" rx="1.6" fill="${p.g('#e8c88a', .3, .3)}" stroke="#a87a3a" stroke-width=".5"/></g>`), `</g>`,
            K.glaze(p, 98, 96, 120, '#c84a8a', { seed: 1, op: .18 }),
            xgbShine(100, 100, 66, .35),
        ].join('');
    },
    // チャンプ: 緑の線の白い鉢に、刻んだスプリングオニオンをたっぷり混ぜたマッシュポテト。真ん中のくぼみにバターがとける
    gb_champ: p => [
        K.bowl(p, { glaze: '#e8e2d2', inside: '#f6f0e2' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3f7a3a" stroke-width="1.8" opacity=".85"/>`,
        `<g ${p.sh(1.1)}>`, xgbMashSwirl(p, 100, 100, 70, { c: '#f4e4b0', seed: 4 }), `</g>`,
        xgbChives(p, 100, 100, 130, { n: 70, r: 2.2 }),
        `<path ${T(102, 101)} d="${smooth(ring(14, 10, .3, rng('xgbchb')))}" fill="#f6dc78" opacity=".7"/>`,
        xgbButter(p, 100, 98, 14, -12),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 12, r: .5 }),
    ].join(''),

    // バブル＆スクイーク: 鋳鉄のスキレットで、残りもののじゃがいもとキャベツを押しつけてカリッと焼いたケーキ。切り分けた線
    gb_bubble: p => {
        const R = rng('xgbbs');
        return [
            xgbSkillet(p, { R: 82, cx: 94 }),
            `<g ${p.sh(1)}><g ${p.rough(4, .05)}><circle cx="94" cy="100" r="70" fill="${p.rg('#c98c42', .2, .3)}" stroke="#7a4410" stroke-width="1"/></g></g>`,
            xgbGrains(p, 94, 100, 128, { cols: ['#e2b866', '#d4a050', '#ecc878'], n: 34, rx: 8, ry: 6, stroke: .4, jitter: .8, seed: 2 }),
            xgbGrains(p, 94, 100, 124, { cols: ['#3f7a28', '#5a9634', '#2f6420'], n: 40, rx: 6, ry: 3, stroke: .3, jitter: .7, seed: 3 }),
            `<g ${xgbBlur(p, 3)}>`, ...xgbSpots('bsb', 14, 60, 18, 94, 100).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(9 + R() * 7)}" ry="${f(6 + R() * 4)}" fill="${R() < .6 ? '#9a5414' : '#5a3010'}" opacity=".7"/>`), `</g>`,
            ...[[56, 82, 20], [124, 122, -40]].map(([x, y, r]) => xgbOnionStrip(p, x, y, 16, r, { c: '#b87a30' })),
            K.sprinkle(p, 94, 100, 130, { c: '#1a1410', n: 18, r: .6 }),
        ].join('');
    },

    // マッシーピー: 青磁の小鉢に、マローファット豆をくたくたに煮てつぶした鮮やかな緑のマッシーピー、バター
    gb_mushypeas: p => [
        K.kobachi(p, { glaze: '#8aa8b8', inside: '#eef2ea' }),
        `<g ${p.sh(.9)}><path ${T(100, 100)} d="${smooth(ring(70, 12, .08, rng('xgbmp')))}" fill="${p.rg('#7aa838', .2, .3)}"/></g>`,
        xgbGrains(p, 100, 100, 132, { cols: ['#86b444', '#6e9e30', '#94c050', '#7aa83a'], n: 130, rx: 4.4, ry: 3.4, stroke: 0, jitter: .8, seed: 1 }),
        xgbGrains(p, 100, 100, 120, { cols: ['#6aa83a', '#82bc48'], n: 14, rx: 3.8, ry: 3.4, stroke: .4, jitter: .1, seed: 2, hi: .8 }),
        K.glaze(p, 100, 100, 120, '#c8e080', { seed: 1, op: .2 }),
        `<path ${T(106, 96)} d="${smooth(ring(13, 9, .3, rng('xgbmpb')))}" fill="#f8dc6a" opacity=".55"/>`,
        xgbButter(p, 104, 94, 14, 12),
        xgbShine(100, 100, 68, .35),
    ].join(''),

    // ランナービーンズのバターあえ: 紺の線の白い鉢に、斜め薄切りにしたさやいんげん、バター、黒こしょう
    gb_runnerbeans: p => {
        const R = rng('xgbrb');
        return [
            K.bowl(p, { glaze: '#e8e2d2', inside: '#f6f0e2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#2c4c7c" stroke-width="1.8" opacity=".85"/>`,
            `<g ${p.sh(.8)}><circle cx="100" cy="100" r="66" fill="${p.rg('#4a8a2c', .15, .3)}"/></g>`,
            `<g ${p.sh(.5)}>`, ...xgbSpots('rnb', 46, 62, 10).map(([x, y, r], i) => xgbBeanStrip(p, x, y, 30 + R() * 10, r, { c: ['#5a9e36', '#4a8e2c', '#6aac40', '#549a32'][i % 4], w: 6.5 })), `</g>`,
            `<path ${T(104, 96)} d="${smooth(ring(13, 9, .3, rng('xgbrbb')))}" fill="#f8dc6a" opacity=".5"/>`, xgbButter(p, 104, 94, 13, -10),
            K.glaze(p, 98, 98, 110, '#f6e08a', { seed: 1, op: .2 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 22, r: .6 }),
        ].join('');
    },

    // にんじんのはちみつグレーズ: 白い鉢に、バターとはちみつでつやよく煮たにんじんのスティック、パセリ
    gb_carrots: p => {
        const R = rng('xgbcr');
        return [
            K.bowl(p, { glaze: '#e8e2d2', inside: '#f6f0e2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#d9742a" stroke-width="1.8" opacity=".85"/>`,
            `<g ${p.sh(.8)}><circle cx="100" cy="100" r="62" fill="${p.rg('#e8a050', .15, .3)}"/></g>`,
            `<g ${p.sh(.6)}>`, ...xgbSpots('crs', 34, 60, 12).map(([x, y, r], i) => xgbCarrotStick(p, x, y, 34 + R() * 8, r, { c: ['#ec7a26', '#e46e1e', '#f28a34'][i % 3], w: 10 })), `</g>`,
            K.glaze(p, 98, 98, 116, '#f4a03a', { seed: 1, op: .25 }),
            xgbHerbs(p, 100, 100, 120, { n: 26 }),
            xgbShine(100, 100, 64, .4),
        ].join('');
    },
    // リーキのホワイトソース: 黄の縁の白い角皿に、輪切りのリーキをとろりとしたホワイトソースで包み、チェダーをのせてこんがり
    gb_leeks: p => {
        const R = rng('xgblk');
        return [
            xgbRectDish(p, { w: 176, h: 176, glaze: '#f4f0e6', rim: '#c9a24a', rx: 26, inset: 10 }),
            `<rect x="22" y="22" width="156" height="156" rx="18" fill="${p.rg('#f2e8cc', .2, .2, .45, .45)}"/>`,
            ...xgbSpots('lk', 26, 70, 25).map(([x, y]) => xgbLeekRound(p, x, y, 32 + R() * 6, { c: R() < .5 ? '#f0f2d8' : '#e4ecc4' })),
            `<rect x="22" y="22" width="156" height="156" rx="18" fill="#f8f0da" opacity=".15"/>`,
            ...xgbSpots('lks', 7, 60, 34).map(([x, y], i) => K.pool(p, x, y, 22, '#fbf5e4', { seed: 30 + i, op: .7 })),
            `<g ${xgbBlur(p, 3.4)}>`, ...xgbSpots('lkb', 14, 66, 20).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(11 + R() * 6)}" ry="${f(8 + R() * 4)}" fill="#eeb43c" opacity=".6"/>`), `</g>`,
            `<g ${xgbBlur(p, 1.4)}>`, ...xgbSpots('lkd', 7, 60, 30).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4 + R() * 3)}" ry="${f(3 + R() * 2)}" fill="#a8601a" opacity=".5"/>`), `</g>`,
            K.sprinkle(p, 100, 100, 140, { c: '#2a2420', n: 18, r: .55 }),
            `<path d="M34,70 Q36,40 66,34" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
        ].join('');
    },

    // ビーツのピクルス: 白い小鉢に、赤紫の汁に漬けた輪切りのビーツと赤玉ねぎの薄切り
    gb_beetroot: p => {
        const R = rng('xgbbt');
        return [
            K.kobachi(p, { glaze: '#d9d2c4', inside: '#f4efe6' }),
            `<circle cx="100" cy="100" r="72" fill="${p.rg('#8a1a40', .2, .3)}"/>`,
            ...xgbSpots('bt', 11, 50, 28).map(([x, y, r], i) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${f(19 + R() * 4)}" ry="${f(17 + R() * 3)}" fill="${p.g('#9a1446', .3, .35)}" stroke="#5a0a28" stroke-width=".8"/></g><ellipse rx="13" ry="11.5" fill="none" stroke="#c03a6a" stroke-width="1.2" opacity=".75"/><ellipse rx="7" ry="6" fill="none" stroke="#c03a6a" stroke-width="1" opacity=".6"/><path d="M-12,-6 Q-4,-14 6,-12" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`),
            `<g ${p.sh(.4)}>`, ...xgbSpots('bto', 8, 56, 20).map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-10,2 Q0,-8 10,2" stroke="#d898c0" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-10,2 Q0,-8 10,2" stroke="#f6e4ee" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`), `</g>`,
            xgbShine(100, 100, 70, .45),
        ].join('');
    },

    // ウォルドーフサラダ: 白い鉢に、リトルジェムの葉を敷き、赤いりんご・セロリ・くるみをマヨネーズとヨーグルトであえて、くるみをのせる
    gb_waldorf: p => {
        const R = rng('xgbwd');
        const leaves = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283 + .2, x = 100 + Math.cos(a) * 52, y = 100 + Math.sin(a) * 52, c = ['#a9d86a', '#8cc551', '#c6e48a'][i % 3];
            const pts = Array.from({ length: 18 }, (_, j) => { const t = j / 18 * 6.283, rr = (j % 2 ? .9 : 1.04); return [Math.cos(t) * rr * 26, Math.sin(t) * rr * 15]; });
            return `<g ${T(x, y, a * 57.3)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g><path d="M-24,0 Q0,-1 24,0" stroke="${lt(c, .6)}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`; }).join('');
        return [
            K.bowl(p, { glaze: '#e8e2d2', inside: '#f6f0e2' }),
            leaves,
            `<g ${p.sh(1)}><path ${T(100, 100)} d="${smooth(ring(54, 12, .14, R))}" fill="${p.rg('#f6eed2', .2, .15)}"/></g>`,
            `<g ${p.sh(.5)}>`, ...xgbSpots('wda', 14, 46, 15).map(([x, y, r], i) => `<g ${T(x, y, r)}><rect x="-8" y="-7" width="16" height="14" rx="2" fill="${p.g('#f6eccc', .3, .2)}" stroke="#d2c08a" stroke-width=".6"/><path d="M-8,-4.5 Q-8,-7 -5.5,-7 L5.5,-7 Q8,-7 8,-4.5" stroke="${i % 2 ? '#c42a2a' : '#a81e24'}" stroke-width="3.4" fill="none"/></g>`),
            ...xgbSpots('wdc', 9, 46, 14).map(([x, y, r]) => `<g ${T(x + 3, y + 3, r)}><path d="M-6,3 A7,6 0 0 1 6,3 L3.6,3 A4.4,3.6 0 0 0 -3.6,3Z" fill="${p.g('#b8d880', .3, .25)}" stroke="#7aa84a" stroke-width=".6"/></g>`), `</g>`,
            K.glaze(p, 100, 100, 90, '#fffaf0', { seed: 2, op: .3 }),
            xgbWalnut(p, 86, 84, 20, 20), xgbWalnut(p, 118, 106, 20, -30), xgbWalnut(p, 94, 122, 18, 70), xgbWalnut(p, 120, 78, 17, 10), xgbWalnut(p, 72, 108, 16, -50),
            K.sprinkle(p, 100, 100, 90, { c: '#2a2420', n: 10, r: .5 }),
        ].join('');
    },

    // トマトと赤玉ねぎのサラダ: 白い皿に、輪切りの完熟トマトを並べ、赤玉ねぎの薄切り、パセリとチャイブ、オイルのドレッシング
    gb_tomatosalad: p => [
        K.plate(p, { rim: '#b9442c' }),
        ...[[100, 100, 0], [100, 52, 20], [140, 70, 40], [146, 116, 60], [116, 146, 80], [70, 148, 100], [52, 110, 120], [62, 66, 140], [100, 100, 30]].map(([x, y, r], i) => xgbTomatoSlice(p, x, y, i === 8 ? 44 : 50, r, { c: i % 2 ? '#e2402c' : '#d8342a' })),
        `<g ${p.sh(.4)}>`, ...[[80, 80, 20], [124, 92, -30], [104, 128, 60], [70, 120, 100], [130, 130, -60], [96, 70, 10]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-12,2 Q0,-10 12,2" stroke="#9a3a7a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-12,2 Q0,-10 12,2" stroke="#f0d4e8" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`), `</g>`,
        K.glaze(p, 100, 100, 130, '#f2d860', { seed: 1, op: .15 }),
        xgbHerbs(p, 100, 100, 130, { n: 30 }), xgbChives(p, 100, 100, 120, { n: 14 }),
        K.sprinkle(p, 100, 100, 130, { c: '#ffffff', n: 16, r: .8 }), K.sprinkle(p, 100, 100, 130, { c: '#2a2420', n: 14, r: .5 }),
    ].join(''),

    // クリームスピナッチ: 白い小鉢に、生クリームとバターで煮た濃い緑のほうれん草、クリームのうず、ナツメグとこしょう
    gb_spinach: p => [
        K.kobachi(p, { glaze: '#c9c2b2', inside: '#f4efe6' }),
        `<g ${p.sh(.9)}><path ${T(100, 100)} d="${smooth(ring(70, 12, .08, rng('xgbspn')))}" fill="${p.rg('#3f6a26', .25, .3)}"/></g>`,
        ...[[76, 76], [124, 76], [76, 124], [124, 124], [100, 100], [100, 60], [100, 140], [60, 100], [140, 100]].map(([x, y], i) => K.greens(p, x, y, 54, { c: i % 2 ? '#2f6a22' : '#3a7a2a', n: 7, seed: i, stems: '#4a7a30', sy: 1 })),
        xgbGrains(p, 100, 100, 130, { cols: ['#eef0d8', '#dce6bc'], n: 40, rx: 5, ry: 2.2, stroke: 0, jitter: .8, seed: 3 }),
        K.glaze(p, 100, 100, 120, '#e8f0c8', { seed: 1, op: .22 }),
        xgbSwirl(p, 102, 98, 26, { turns: 1.3, w: 4, c: '#fbf6e6' }),
        K.sprinkle(p, 100, 100, 110, { c: '#8a5a2a', n: 14, r: .6 }), K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 10, r: .5 }),
    ].join(''),
    // 根菜のロースト: 茶の楕円の皿に、にんじん・パースニップ・スウェード・バターナッツ・赤玉ねぎをこんがりローストして、ローズマリー
    gb_rootveg: p => {
        const R = rng('xgbrv');
        const sp = xgbSpots('rv', 30, 64, 18.5, 100, 100, .8);
        return [
            K.ovalDish(p, { rx: 96, ry: 80, base: '#f4eee0', rim: '#6a4a2a' }),
            ...sp.map(([x, y, r], i) => {
                const k = i % 5;
                if (k === 0) return xgbRoastCarrot(p, x, y, 36, r, { w: 14 });
                if (k === 1) return xgbParsnip(p, x, y, 36, r, { w: 16, c: '#dcaa52' });
                if (k === 2) return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="-10" y="-9" width="20" height="18" rx="4" fill="${p.g('#f0b848', .35, .4)}" stroke="#a8701e" stroke-width=".7"/></g><path d="M-6,-5 L4,-5" stroke="#fff4c8" stroke-width="1.4" stroke-linecap="round" opacity=".8"/><path d="M10,-9 L10,9" stroke="#8a4a14" stroke-width="2.4" opacity=".4"/></g>`;
                if (k === 3) return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="-10" y="-9" width="20" height="18" rx="4" fill="${p.g('#ec8a2a', .35, .4)}" stroke="#b05a14" stroke-width=".7"/></g><path d="M-10,-9 L-10,9" stroke="#e8c27a" stroke-width="2.4"/><path d="M-5,-5 L4,-5" stroke="#ffd8a0" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>`;
                return K.onion(p, x, y, 26, r, { c: '#9a3a6a', layers: 3 });
            }),
            `<g ${xgbBlur(p, 1.6)}>`, ...sp.map(([x, y]) => `<ellipse cx="${f(x + 4)}" cy="${f(y + 3)}" rx="5" ry="3" fill="#6a3410" opacity=".35"/>`), `</g>`,
            xgbSprig(p, 80, 66, 34, 30, { c: '#4a6a3a', leaf: 2.6, n: 9 }), xgbSprig(p, 128, 136, 30, -40, { c: '#4a6a3a', leaf: 2.6, n: 8 }),
            K.sprinkle(p, 100, 100, 140, { c: '#ffffff', n: 20, r: .8 }), K.sprinkle(p, 100, 100, 140, { c: '#2a2420', n: 14, r: .5 }),
        ].join('');
    },

    // ブロッコリーのガーリックレモン: 白い皿に、軽く焦げ目をつけたテンダーステム・ブロッコリー、にんにくの薄切り、レモン、唐辛子
    gb_broccoli: p => {
        const R = rng('xgbbr');
        return [
            K.plate(p, { rim: '#4a6a3a' }),
            ...Array.from({ length: 13 }, (_, i) => xgbTenderstem(p, 98 + (R() - .5) * 20, 52 + i * 8 + (R() - .5) * 4, 86 + R() * 12, -16 + (R() - .5) * 26 + (i % 2 ? 180 : 0), { seed: i })),
            `<g ${p.sh(.4)}>`, ...xgbSpots('brg', 10, 54, 14).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4.4" ry="3.2" fill="${p.g('#f6ecc8', .3, .2)}" stroke="#d2a860" stroke-width=".9"/></g>`), `</g>`,
            K.lemon(p, 150, 140, 34, -30),
            K.sprinkle(p, 100, 100, 120, { c: '#d42a1c', n: 18, r: .8 }),
            K.sprinkle(p, 100, 100, 120, { c: '#ffffff', n: 12, r: .7 }),
        ].join('');
    },

    // ガーリックマッシュルーム: 鋳鉄のスキレットに、バターとにんにくで焼いたブラウンマッシュルームの縦切り、パセリ、レモン
    gb_garlicmushrooms: p => {
        const R = rng('xgbgm2');
        return [
            xgbSkillet(p, { R: 82, cx: 94 }),
            `<circle cx="94" cy="100" r="72" fill="${p.rg('#8a5a26', .2, .35)}" opacity=".9"/>`,
            ...xgbSpots('gm', 17, 58, 26, 94, 100).map(([x, y, r], i) => i % 4 === 3
                ? `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="${f(14 + R() * 3)}" fill="${p.rg('#9a6a42', .3, .35, .35, .32)}" stroke="#5a3a1c" stroke-width=".7"/></g><ellipse cx="-4" cy="-5" rx="5" ry="2.6" fill="#fff" opacity=".35"/></g>`
                : xgbMushSlice(p, x, y, 30 + R() * 6, r, { cap: ['#7a4a2a', '#8a5a34', '#6a4024'][i % 3], flesh: ['#e6cfa6', '#dcc094', '#ead6b2'][i % 3] })),
            K.glaze(p, 94, 100, 120, '#e8b84a', { seed: 1, op: .2 }),
            xgbHerbs(p, 94, 100, 130, { n: 40 }),
            `<g ${p.sh(.4)}>`, ...xgbSpots('gmg', 6, 54, 20, 94, 100).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#f4e6b8" stroke="#c8a060" stroke-width=".5"/>`), `</g>`,
            K.sprinkle(p, 94, 100, 130, { c: '#1a1410', n: 12, r: .6 }),
        ].join('');
    },

    // ビール衣のオニオンリング: 木の板に紙を敷き、黄金色に揚げた大きなオニオンリングを重ね、ケチャップの小鉢
    gb_onionrings: p => [
        xgbBoard(p, { w: 184, h: 156, c: '#b88a56', r: 4 }),
        `<g ${T(96, 100, -8)}><rect x="-70" y="-60" width="140" height="120" rx="4" fill="#f6f0e2" opacity=".95"/><rect x="-70" y="-60" width="140" height="120" rx="4" fill="none" stroke="#e2d8c2" stroke-width="1"/></g>`,
        xgbOnionRing(p, 70, 72, 62, -10, { c: '#d89a3e' }),
        xgbOnionRing(p, 118, 70, 56, 20, { c: '#e0a648' }),
        xgbOnionRing(p, 64, 122, 58, 30, { c: '#dca246' }),
        xgbOnionRing(p, 110, 116, 66, -20, { c: '#d4943a' }),
        xgbOnionRing(p, 92, 96, 50, 40, { c: '#e2aa4e' }),
        xgbRamekin(p, 154, 146, 38, '#c8281a'),
        K.sprinkle(p, 92, 98, 130, { c: '#ffffff', n: 20, r: .8 }),
    ].join(''),

    // セージと玉ねぎのスタッフィング: 茶の線の白い角皿に、パン粉とソーセージミートで丸めてこんがり焼いたスタッフィングのボール、セージの葉
    gb_stuffing: p => {
        const R = rng('xgbst');
        return [
            xgbRectDish(p, { w: 178, h: 178, glaze: '#efe8da', rim: '#8a5a2a', rx: 24, inset: 10 }),
            ...[[56, 56], [100, 54], [144, 58], [54, 100], [100, 100], [146, 100], [58, 144], [100, 146], [144, 142]].map(([x, y], i) => xgbStuffBall(p, x + (R() - .5) * 4, y + (R() - .5) * 4, 42 + R() * 4, { seed: i, c: ['#c88a3e', '#bc7e34', '#d29848'][i % 3] })),
            `<g ${p.sh(.5)}>`, xgbLeaf(p, 78, 78, 22, -30, { c: '#7a9a6a', w: .45 }), xgbLeaf(p, 122, 122, 22, 30, { c: '#6a8a5a', w: .45 }), xgbLeaf(p, 124, 80, 18, 70, { c: '#7a9a6a', w: .45 }), `</g>`,
        ].join('');
    },
    // スコッチブロス: 茶の鉢に、丸麦でとろみのついた澄んだ茶色のスープ、ラム肉、にんじん・スウェードの角切り、リーキ、キャベツ、パセリ
    gb_scotchbroth: p => [
        K.bowl(p, { glaze: '#6d4a35', inside: '#efe5d3' }),
        xgbBroth(p, '#c4a064'),
        xgbBarley(p, 100, 100, 130, { n: 70, seed: 1 }),
        ...[[70, 84, 20], [132, 118, -30], [96, 136, 60], [124, 70, 10]].map(([x, y, r], i) => xgbBeefChunk(p, x, y, 18, r, { seed: i, c: '#8a5a3a' })),
        xgbDice(p, 100, 100, 120, { n: 10, seed: 1, c: '#ec7a26', sz: 8 }), xgbDice(p, 100, 100, 120, { n: 8, seed: 2, c: '#f0c050', sz: 8 }),
        ...[[84, 116], [140, 92], [62, 106]].map(([x, y]) => xgbLeekRound(p, x, y, 16)),
        `<g ${p.sh(.4)}>`, ...[[110, 80, 20], [80, 140, -40]].map(([x, y, r], i) => xgbSavoyLeaf(p, x, y, 26, r, { seed: i, c: '#5f9e38' })), `</g>`,
        xgbVeil('#c4a064', .18),
        xgbHerbs(p, 100, 100, 120, { n: 20 }),
        xgbShine(100, 100, 72, .4),
    ].join(''),

    // コッカリーキー: 紺の線の白いスープ皿に、澄んだ金色のチキンスープ、さいた鶏肉、緑のリーキ、プルーン、パセリ
    gb_cockaleekie: p => [
        xgbSoupBowl(p, '#1f3a66'),
        xgbBroth(p, '#d8b85a', { glow: .35 }),
        ...[[72, 86, 20], [128, 76, -30], [134, 120, 60], [86, 128, 10], [104, 102, 80]].map(([x, y, r], i) => xgbShredChicken(p, x, y, 26, r, { seed: i })),
        `<g ${p.sh(.4)}>`, ...[[96, 70, 10], [146, 100, 80], [66, 112, -30], [112, 140, 30], [116, 90, -60]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-12" y="-3" width="24" height="6" rx="3" fill="${p.g('#7ab048', .3, .25)}" stroke="#4a7a2a" stroke-width=".5"/><path d="M-9,-1 L9,-1" stroke="#c8e4a0" stroke-width=".9"/></g>`), `</g>`,
        ...[[84, 104], [136, 140]].map(([x, y]) => xgbLeekRound(p, x, y, 16)),
        xgbPrune(p, 118, 112, 18, 30), xgbPrune(p, 78, 70, 16, -20), xgbPrune(p, 100, 146, 16, 60),
        xgbBarley(p, 100, 100, 120, { n: 16, seed: 2, c: '#f6f0dc' }),
        xgbVeil('#d8b85a', .12),
        xgbOilDrops(p, 100, 100, 120, { n: 10, c: '#f2cc58' }),
        xgbHerbs(p, 100, 100, 110, { n: 16 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // カレン・スキンク: 灰青の線の白いスープ皿に、燻製ハドックとじゃがいもを牛乳で煮たとろりとした白いスープ、ほぐした魚、チャイブ、黒こしょう
    gb_cullenskink: p => [
        xgbSoupBowl(p, '#7a8a96'),
        xgbBroth(p, '#ece0c0', { glow: .5 }),
        xgbDice(p, 100, 100, 120, { n: 12, seed: 3, c: '#f2e6c0', sz: 14 }),
        xgbVeil('#efe4c6', .25),
        ...[[74, 82, 20], [124, 76, -30], [134, 118, 60], [84, 128, 10], [104, 102, 80], [60, 108, 40], [112, 144, -20], [146, 92, 70]].map(([x, y, r], i) => xgbFlake(p, x, y, 26, r, { c: i % 2 ? '#f2d488' : '#f6e2a8', seed: i })),
        xgbChives(p, 100, 100, 110, { n: 24 }), xgbHerbs(p, 100, 100, 100, { n: 10 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 18, r: .6 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // カウル: 灰青の釉の鉢に、脂の粒が浮く金茶色のスープ、大きめのラム肉・じゃがいも・にんじん・スウェード・たっぷりのリーキ、パセリ
    gb_cawl: p => [
        K.bowl(p, { glaze: '#4a5a6a', inside: '#efe8dc' }),
        xgbBroth(p, '#c09656'),
        ...[[72, 82, 26, 20], [128, 120, 24, -30], [104, 132, 22, 60]].map(([x, y, s, r], i) => xgbBeefChunk(p, x, y, s, r, { seed: i, c: '#8a5634' })),
        ...[[126, 78], [80, 124], [100, 96]].map(([x, y], i) => K.potato(p, x, y, 24, i * 40, { c: '#efd496', seed: i })),
        ...[[148, 100], [66, 104], [110, 64]].map(([x, y]) => K.carrotRound(p, x, y, 15, { c: '#ec7a26' })),
        ...[[92, 70], [138, 140], [58, 132], [146, 70], [118, 104], [72, 152]].map(([x, y]) => xgbLeekRound(p, x, y, 18, { c: '#dcecb0' })),
        xgbVeil('#c09656', .15),
        xgbOilDrops(p, 100, 100, 130, { n: 18, c: '#f0c050' }),
        xgbHerbs(p, 100, 100, 110, { n: 20 }),
        xgbShine(100, 100, 72, .4),
    ].join(''),

    // 豆とハムのスープ: 緑の線の白いスープ皿に、乾燥グリーンピースを煮てなめらかにしたスープ、ほぐしたハム、クルトン、黒こしょう
    gb_peaham: p => [
        xgbSoupBowl(p, '#4a6a3a'),
        xgbBroth(p, '#a6aa48', { glow: .4 }),
        xgbDice(p, 100, 100, 110, { n: 16, seed: 4, c: '#e48a84', sz: 10 }),
        `<g ${p.sh(.5)}>`, ...[[82, 84, 20], [124, 118, 60], [104, 100, 80], [140, 90, 30]].map(([x, y, r], i) => xgbShredChicken(p, x, y, 20, r, { c: '#eaa29c', seed: i })), `</g>`,
        xgbCroutons(p, 100, 100, 80, { n: 6, seed: 2, sz: 11 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 18, r: .6 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),
    // トマトのクリームスープ: 赤いマグに、なめらかなオレンジ色のトマトスープ、生クリームのうず、クルトン、パセリ
    gb_tomato: p => [
        xgbMug(p, { R: 74, cx: 90, c: '#2c4c7c' }),
        xgbBroth(p, '#d8492c', { R: 66, cx: 90 }),
        xgbSwirl(p, 90, 100, 32, { turns: 1.5, w: 4.4, c: '#fbeee0' }),
        xgbCroutons(p, 90, 100, 88, { n: 7, seed: 1, sz: 11 }),
        xgbHerbs(p, 90, 100, 100, { n: 12 }),
        K.sprinkle(p, 90, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
        xgbShine(90, 100, 66, .45),
    ].join(''),

    // マリガトーニー: 黄の釉の鉢に、カレー風味のオレンジ茶色のなめらかなスープ、さいた鶏肉、まん中にご飯ひとさじ、レモン、コリアンダー
    gb_mulligatawny: p => [
        K.bowl(p, { glaze: '#c8962e', inside: '#f4ecdc' }),
        xgbBroth(p, '#c4742a'),
        ...[[70, 84, 20], [130, 76, -30], [136, 122, 60], [78, 128, 10], [110, 140, 80], [146, 98, 120]].map(([x, y, r], i) => xgbShredChicken(p, x, y, 24, r, { c: '#e8c48a', seed: i })),
        xgbRice(p, 100, 100, 44, { seed: 2 }),
        K.lemon(p, 64, 108, 26, -80),
        `<g ${p.sh(.4)}>`, xgbCoriander(p, 118, 92, 15, -20), xgbCoriander(p, 92, 120, 14, 40), xgbCoriander(p, 120, 116, 13, 110), `</g>`,
        xgbOilDrops(p, 100, 100, 130, { n: 12, c: '#e88a2a' }),
        xgbShine(100, 100, 72, .4),
    ].join(''),

    // ブロッコリーとスティルトンのスープ: 白いスープ皿に、なめらかな緑のスープ、くずした青かびのスティルトン、小さなブロッコリー、黒こしょう
    gb_brocstilton: p => {
        const R = rng('xgbbs2');
        return [
            xgbSoupBowl(p, '#3a5a8a'),
            xgbBroth(p, '#8aa244'),
            ...[[132, 76, 22, -20], [70, 120, 20, 30], [134, 130, 18, 60]].map(([x, y, s, r]) => K.broccoli(p, x, y, s, r, { c: '#4a8a34' })),
            `<g ${p.sh(.6)}>`, xgbGrains(p, 100, 98, 54, { cols: ['#f6f0da', '#ece2c4', '#fbf8ec'], n: 34, rx: 4.2, ry: 3.2, jitter: .9, seed: 5, stroke: .4 }), `</g>`,
            K.sprinkle(p, 100, 98, 50, { c: '#4a6a80', n: 22, r: .8 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 18, r: .6 }),
            xgbShine(100, 100, 72, .45),
        ].join('');
    },

    // ローストしたバターナッツのスープ: オレンジの線の白い深皿に、鮮やかなオレンジのなめらかなスープ、生クリームのうず、かぼちゃの種、セージ
    gb_butternut: p => [
        xgbSoupBowl(p, '#d9742a'),
        xgbBroth(p, '#e8902e'),
        xgbSwirl(p, 100, 100, 38, { turns: 1.6, w: 4.4, c: '#fcf2e2' }),
        `<g ${p.sh(.4)}>`, ...xgbSpots('pep', 14, 52, 12).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="5" ry="2.8" fill="${p.g('#6a9a3a', .3, .25)}" stroke="#3f6a22" stroke-width=".5"/><path d="M-3,-.6 L3,-.6" stroke="#b8d888" stroke-width=".7"/></g>`), `</g>`,
        `<g ${p.sh(.4)}>`, xgbLeaf(p, 124, 76, 20, -30, { c: '#6a8a5a', w: .45 }), xgbLeaf(p, 76, 128, 18, 40, { c: '#7a9a6a', w: .45 }), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // カレー風味のパースニップのスープ: 茶の鉢に、淡い金色のなめらかなスープ、クリーム、カレーオイル、パースニップのチップス、唐辛子
    gb_parsnip: p => {
        const R = rng('xgbpn');
        return [
            K.bowl(p, { glaze: '#8a5a34', inside: '#f1e6d4' }),
            xgbBroth(p, '#dcb864'),
            xgbSwirl(p, 100, 100, 30, { turns: 1.3, w: 3.6, c: '#fbf4e2' }),
            ...xgbSpots('cur', 16, 60, 10).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + R() * 2)}" fill="#d2601a" opacity=".75"/>`),
            `<g ${p.sh(.7)}>`, ...[[122, 72, 20], [138, 108, -40], [72, 128, 60], [112, 136, 10], [70, 84, 100]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-12,2 Q-4,-8 6,-6 Q12,-4 12,2 Q2,0 -12,2Z" fill="${p.g('#e8b860', .4, .35)}" stroke="#a87a2a" stroke-width=".7"/><path d="M-8,-1 Q0,-6 8,-3" stroke="#a8641a" stroke-width="1" fill="none" opacity=".6"/></g>`), `</g>`,
            K.sprinkle(p, 100, 100, 110, { c: '#c42a1a', n: 14, r: .7 }),
            xgbShine(100, 100, 72, .45),
        ].join('');
    },
    // チキンと野菜のスープ: 紺の線の白いスープ皿に、金色のチキンスープ、さいた鶏肉、にんじん・じゃがいも・リーキ・セロリ・グリンピース、パセリ
    gb_chickenveg: p => [
        xgbSoupBowl(p, '#2c4c7c'),
        xgbBroth(p, '#d8b260'),
        ...[[72, 84, 20], [128, 72, -30], [134, 124, 60], [84, 130, 10]].map(([x, y, r], i) => xgbShredChicken(p, x, y, 26, r, { seed: i })),
        xgbDice(p, 100, 100, 110, { n: 9, seed: 5, c: '#f2e2b0', sz: 12 }),
        ...[[100, 70], [146, 98], [62, 108], [112, 144], [104, 108]].map(([x, y]) => K.carrotRound(p, x, y, 14, { c: '#ec7a26' })),
        ...[[118, 92], [80, 104], [140, 140]].map(([x, y]) => xgbLeekRound(p, x, y, 16)),
        xgbDice(p, 100, 100, 100, { n: 6, seed: 6, c: '#b8d880', sz: 7 }),
        xgbPeas(p, 100, 100, 110, { n: 14, seed: 3 }),
        xgbVeil('#d8b260', .12),
        xgbHerbs(p, 100, 100, 110, { n: 18 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // オックステールスープ: 茶の鉢に、牛テールを煮込んだ濃い茶色のつやのあるスープ、ほぐした肉、にんじんとセロリの角切り、パセリ
    gb_oxtail: p => [
        K.bowl(p, { glaze: '#3f2a1e', inside: '#ece2d0' }),
        xgbBroth(p, '#6a3820', { glow: .35 }),
        `<g ${p.sh(.5)}>`, ...[[76, 84, 20], [126, 78, -30], [130, 124, 60], [82, 126, 10], [104, 104, 80], [148, 100, 20], [100, 66, 50], [56, 106, 90], [106, 142, -10]].map(([x, y, r], i) => xgbShredChicken(p, x, y, 30, r, { c: '#7e4628', seed: i })), `</g>`,
        xgbDice(p, 100, 100, 120, { n: 10, seed: 7, c: '#e2701e', sz: 8 }),
        xgbDice(p, 100, 100, 110, { n: 6, seed: 8, c: '#a8c870', sz: 7 }),
        xgbVeil('#6a3820', .2),
        xgbOilDrops(p, 100, 100, 130, { n: 16, c: '#c88a3a' }),
        xgbHerbs(p, 100, 100, 100, { n: 14 }),
        xgbShine(100, 100, 72, .5),
    ].join(''),

    // クレソンのスープ: 白いスープ皿に、あざやかな緑のなめらかなスープ、クリームのうず、クレソンの葉
    gb_watercress: p => [
        xgbSoupBowl(p, '#4a8a40'),
        xgbBroth(p, '#4f9236'),
        xgbSwirl(p, 100, 100, 34, { turns: 1.5, w: 4, c: '#fbf8ec' }),
        `<g ${p.sh(.5)}>`, ...[[124, 76, -20], [76, 124, 160], [132, 126, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-14,0 L12,0" stroke="#5a8a34" stroke-width="1.4"/>${[[-8, -4], [-2, 4], [4, -4], [10, -1], [-12, 3]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3.6" fill="${p.g('#2f7a24', .3, .25)}" stroke="#1f5a18" stroke-width=".5"/>`).join('')}</g>`), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 12, r: .55 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // マッシュルームのクリームスープ: 茶の線の白いスープ皿に、ブラウンマッシュルームのなめらかなベージュのスープ、生クリーム、縦切りのマッシュルーム、パセリ
    gb_mushroom: p => [
        xgbSoupBowl(p, '#7a5a3a'),
        xgbBroth(p, '#b4977a'),
        xgbSwirl(p, 96, 104, 26, { turns: 1.3, w: 3.6, c: '#f8f0e2' }),
        ...[[126, 74, -20], [72, 124, 30], [134, 122, 60], [74, 80, -40]].map(([x, y, r], i) => xgbMushSlice(p, x, y, 26, r, { cap: '#7a4a2a', flesh: '#e6d2b0', seed: i })),
        xgbHerbs(p, 100, 100, 110, { n: 18 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 12, r: .55 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),
    // 豆とミントのスープ: 緑の線の白いスープ皿に、あざやかな黄緑のなめらかなスープ、クレームフレッシュ、ミントの葉、グリンピース
    gb_peamint: p => [
        xgbSoupBowl(p, '#3f7a3a'),
        xgbBroth(p, '#7cb240'),
        `<g ${p.sh(.7)}><path ${T(102, 98)} d="${smooth(ring(15, 9, .25, rng('xgbcf')))}" fill="${p.rg('#fbf8ee', .2, .1)}" stroke="#e2dccb" stroke-width=".6"/></g>`,
        `<path d="M94,92 Q100,86 108,88" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<g ${p.sh(.4)}>`, xgbLeaf(p, 112, 86, 20, -30, { c: '#2f7a2a' }), xgbLeaf(p, 92, 112, 18, 140, { c: '#3a8a30' }), xgbLeaf(p, 116, 108, 16, 40, { c: '#2f7a2a' }), `</g>`,
        xgbPeas(p, 100, 100, 120, { n: 14, seed: 4 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 10, r: .5 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // セロリのクリームスープ: 白いスープ皿に、淡い黄緑のなめらかなスープ、クリームのうず、刻んだセロリの葉と角切りのセロリ、クルトン
    gb_celery: p => [
        xgbSoupBowl(p, '#6a8a4a'),
        xgbBroth(p, '#c8cc8a'),
        xgbSwirl(p, 100, 100, 32, { turns: 1.4, w: 3.8, c: '#fbf8ec' }),
        xgbDice(p, 100, 100, 110, { n: 10, seed: 10, c: '#a8cc6a', sz: 7 }),
        `<g ${p.sh(.4)}>`, ...[[124, 78, -20], [76, 122, 140]].map(([x, y, r]) => `<g ${T(x, y, r)}>${[[-6, -3, -30], [0, 0, 0], [6, -3, 30]].map(([a, b, c]) => `<path transform="translate(${a} ${b}) rotate(${c})" d="M0,6 L0,-1 M-4,-2 Q0,-9 4,-2 Q0,0 -4,-2Z" fill="#5a9a34" stroke="#3a6a22" stroke-width=".6"/>`).join('')}</g>`), `</g>`,
        xgbCroutons(p, 100, 100, 80, { n: 5, seed: 3, sz: 10 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 12, r: .55 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),

    // 北アイルランドの野菜ブロス: 青い鉢に、丸麦・割り豆・レンズ豆でとろみがついた濁ったスープ、牛すね肉、にんじん・スウェード・リーキ、たっぷりのパセリ
    gb_vegbroth: p => [
        K.bowl(p, { glaze: '#3e6e8e', inside: '#f1ebdf' }),
        xgbBroth(p, '#b28a52'),
        xgbBarley(p, 100, 100, 130, { n: 50, seed: 3 }),
        xgbGrains(p, 100, 100, 130, { cols: ['#9ab448', '#d8a050'], n: 40, rx: 2.4, ry: 2, seed: 7, stroke: .3 }),
        ...[[74, 86, 20], [128, 122, -30], [118, 76, 60]].map(([x, y, r], i) => xgbBeefChunk(p, x, y, 18, r, { seed: i, c: '#7a4a2a' })),
        xgbDice(p, 100, 100, 120, { n: 10, seed: 11, c: '#ec7a26', sz: 8 }), xgbDice(p, 100, 100, 120, { n: 8, seed: 12, c: '#f0c050', sz: 8 }),
        ...[[90, 120], [140, 96], [62, 112], [104, 98]].map(([x, y]) => xgbLeekRound(p, x, y, 15)),
        xgbVeil('#b28a52', .15),
        xgbHerbs(p, 100, 100, 130, { n: 44, cols: ['#3f8a2c', '#2f7a22', '#5aa63c'] }),
        xgbShine(100, 100, 72, .4),
    ].join(''),

    // カリフラワーチーズのスープ: 両手つきのクリーム色のスープ鉢に、淡いクリーム色のなめらかなスープ、とけたチェダー、小さなカリフラワー、黒こしょう
    gb_caulicheese: p => [
        xgbCasserole(p, { R: 80, glaze: '#e8dcc2', inside: '#f6f0e2', rimW: 6 }),
        xgbBroth(p, '#ebdcae', { R: 70 }),
        ...[[130, 78, 32, 10], [72, 120, 30, 60], [130, 128, 28, -20], [70, 78, 26, 40]].map(([x, y, s, r], i) => xgbFloret(p, x, y, s, r, { seed: i })),
        `<g ${p.sh(.4)}>`, K.cheese(p, 98, 98, 44, { seed: 2, browned: .2 }), `</g>`,
        `<g ${p.sh(.3)}>`, K.shreds(p, 98, 96, 54, { c: '#f2b23a', n: 22, w: 2, len: .3, seed: 4, curve: .5 }), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 18, r: .6 }), K.sprinkle(p, 100, 100, 100, { c: '#a8642a', n: 8, r: .6 }),
        xgbShine(100, 100, 70, .45),
    ].join(''),

    // ローストした赤ピーマンとトマトのスープ: 白い深皿に、赤オレンジのなめらかなスープ、クリームのうず、焼いた赤ピーマンの細切り、バジル
    gb_redpepper: p => [
        xgbSoupBowl(p, '#b9442c'),
        xgbBroth(p, '#d8502e'),
        xgbSwirl(p, 100, 100, 32, { turns: 1.4, w: 4, c: '#fbf2e6' }),
        `<g ${p.sh(.5)}>`, ...[[126, 76, -30], [76, 126, 150], [134, 124, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-12,-3 Q0,-6 12,-3 L12,3 Q0,0 -12,3Z" fill="${p.g('#c42a1a', .3, .3)}" stroke="#7a1a10" stroke-width=".6"/><ellipse cx="-2" cy="-1" rx="4" ry="1.4" fill="#3a1a0a" opacity=".35"/></g>`), `</g>`,
        `<g ${p.sh(.4)}>`, xgbLeaf(p, 116, 104, 20, -40, { c: '#3a8a30', w: .6 }), xgbLeaf(p, 84, 84, 18, 130, { c: '#2f7a2a', w: .6 }), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 12, r: .55 }),
        xgbShine(100, 100, 72, .45),
    ].join(''),
};
