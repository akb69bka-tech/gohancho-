// World edition: United Kingdom (gb) — everyday British home cooking
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// ---------- このファイル専用の部品（gb〜） ----------
const gbBlur = (p, s = 2) => `filter="url(#${p.def('gbbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const gbShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function gbOutline(p, c, r = .55){
    const id = p.def('gbOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
function gbSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
// 重なりにくく散らした位置
function gbSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('gbspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 小さな粒（色ごとに1本のpath）: グリンピース・ひき肉・刻みハーブなど
function gbGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, rx = 2, ry = 1.4, seed = 1, sy = 1, hi = 0, jitter = .3, stroke = .35 } = {}){
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
function gbHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'] } = {}){
    const R = rng(p.id + 'gbh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R(); ds[i % cols.length] += `M${f(cx - rr)},${f(cy)}l${f(rr)},${f(-rr * .8)}l${f(rr)},${f(rr * .8)}l${f(-rr * .6)},${f(rr)}Z`; }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// チャイブ・スプリングオニオンの小口切り（小さな緑の輪）
function gbChives(p, x, y, s, { n = 14, seed = 1, sy = 1, r = 1.6 } = {}){
    const R = rng(p.id + 'gbc' + seed + x);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy; const seg = `M${f(cx - r)},${f(cy)}a${r},${f(r * .85)} 0 1 0 ${f(r * 2)},0a${r},${f(r * .85)} 0 1 0 ${f(-r * 2)},0Z`; if (R() < .6) d1 += seg; else d2 += seg; }
    return `<path d="${d1}" fill="none" stroke="#4f9a34" stroke-width="1.1"/><path d="${d2}" fill="none" stroke="#7ab850" stroke-width="1.1"/>`;
}
// クリームのうず
function gbSwirl(p, x, y, R, { turns = 1.6, c = '#fffaf0', w = 4, op = .9, start = 0 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = start + t * turns * 6.28, rr = R * (.12 + t * .88); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .4)}" transform="translate(.6 .9)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// 葉（ミント）
function gbLeaf(p, x, y, L, r = 0, { c = '#3f8a33', w = .5 } = {}){
    const h = L * w / 2;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .1)},${f(-h * 1.6)} ${L / 2},0 Q${f(-L * .1)},${f(h * 1.6)} ${-L / 2},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <path d="M${f(-L * .44)},0 L${f(L * .4)},0" stroke="${lt(c, .45)}" stroke-width=".7"/>${[-.2, .05, .25].map(t => `<path d="M${f(L * t)},0 l${f(L * .1)},${f(-h * .6)} M${f(L * t)},0 l${f(L * .1)},${f(h * .6)}" stroke="${lt(c, .35)}" stroke-width=".5" opacity=".8"/>`).join('')}</g>`;
}
// コリアンダーの葉（3つに分かれた丸い葉）
function gbCoriander(p, x, y, s, r = 0, { c = '#4a9a3a' } = {}){
    const lobe = (a, k) => `<g transform="rotate(${a})"><path d="M0,${f(-s * .1)} Q${f(-s * .22 * k)},${f(-s * .3)} ${f(-s * .12 * k)},${f(-s * .48)} Q0,${f(-s * .56)} ${f(s * .12 * k)},${f(-s * .48)} Q${f(s * .22 * k)},${f(-s * .3)} 0,${f(-s * .1)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M0,${f(-s * .12)} L0,${f(-s * .46)}" stroke="${lt(c, .45)}" stroke-width=".6"/></g>`;
    return `<g ${T(x, y, r)}><path d="M0,${f(s * .35)} L0,${f(-s * .1)}" stroke="#7fb060" stroke-width="1"/>${lobe(0, 1)}${lobe(-58, .9)}${lobe(58, .9)}</g>`;
}
// マッシュポテトの面（スプーンでならした筋）
function gbMashSwirl(p, x, y, R, { c = '#f3dc9a', seed = 1, sy = 1 } = {}){
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
function gbOnionStrip(p, x, y, s, r = 0, { c = '#c9924a' } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity=".9" stroke="${dk(c, .25)}" stroke-width=".6" stroke-linejoin="round"/></g>`;
}
// バンガー（太めのポークソーセージ、こんがり焼き目）
function gbSausage(p, x, y, L, W, r = 0, { c = '#a8603a', bend = 4, seed = 1 } = {}){
    const R = rng(p.id + 'gbsg' + seed);
    const h = W / 2, b = bend;
    const d = `M${f(-L / 2 + h)},${f(-h)} Q0,${f(-h - b * 2)} ${f(L / 2 - h)},${f(-h)} A${h},${h} 0 0 1 ${f(L / 2 - h)},${f(h)} Q0,${f(h - b * 2)} ${f(-L / 2 + h)},${f(h)} A${h},${h} 0 0 1 ${f(-L / 2 + h)},${f(-h)}Z`;
    let ch = '';
    for (let i = 0; i < 5; i++) ch += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .4)}" rx="${f(L * (.06 + R() * .08))}" ry="${f(W * (.12 + R() * .12))}" fill="${dk(c, .55)}" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <g ${gbBlur(p, 1.6)}>${ch}</g>
        <path d="M${f(-L * .36)},${f(-h * .45)} Q0,${f(-h * .45 - b * 2)} ${f(L * .3)},${f(-h * .45)}" stroke="#fff" stroke-width="${f(W * .16)}" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M${f(-L * .3)},${f(h * .45)} Q0,${f(h * .45 - b * 2)} ${f(L * .34)},${f(h * .45)}" stroke="${dk(c, .35)}" stroke-width="${f(W * .12)}" fill="none" stroke-linecap="round" opacity=".35"/>
        <path d="M${f(-L / 2 + 2)},0 l-3,-1.5 M${f(L / 2 - 2)},0 l3,1.5" stroke="${dk(c, .4)}" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
// 白いホーローのパイ皿（楕円・紺のふち）
function gbEnamelDish(p, { rx = 94, ry = 76, base = '#f7f5ee', rim = '#1f3a66' } = {}){
    return `<g ${p.sh(1.8)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .14, .38, .32)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 1.6}" ry="${ry - 1.6}" fill="none" stroke="${rim}" stroke-width="3"/>
        <ellipse cx="100" cy="100" rx="${rx - 9}" ry="${ry - 9}" fill="none" stroke="${dk(base, .1)}" stroke-width="2.4" opacity=".45"/>
        <ellipse cx="100" cy="100" rx="${rx - 10}" ry="${ry - 10}" fill="${p.rg(dk(base, .03), .06, .2, .6, .62)}"/>
        <path d="M${100 - rx * .7},${100 - ry * .4} A${rx * .86},${ry * .86} 0 0 1 ${100 - rx * .22},${100 - ry * .82}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 太めのチップス（オーブンで焼いた）
function gbChip(p, x, y, L, r = 0, { c = '#e8bb4e', seed = 1, w = 9 } = {}){
    const R = rng(p.id + 'gbch' + seed + x + y);
    const h = w / 2;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-h}" width="${f(L)}" height="${w}" rx="1.8" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .38)}" stroke-width=".6"/>
        <rect x="${f(-L / 2 + 1)}" y="${f(-h + 1)}" width="${f(L - 2)}" height="${f(h * .55)}" rx="1.2" fill="${lt(c, .35)}" opacity=".7"/>
        <ellipse cx="${f((R() - .5) * L * .6)}" cy="${f(h * .3)}" rx="${f(L * .14)}" ry="${f(h * .5)}" fill="${dk(c, .4)}" opacity=".3"/>
        <rect x="${f(L / 2 - 3.2)}" y="${-h}" width="3.2" height="${w}" rx="1" fill="${dk(c, .3)}" opacity=".5"/>
        <path d="M${f(-L / 2 + 3)},${f(-h + 1.8)} L${f(L / 2 - 5)},${f(-h + 1.8)}" stroke="#fff6d8" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
// カリフラワーの小房（真上から: 白いつぶつぶの頭）
function gbFloret(p, x, y, s, r = 0, { c = '#f1e9d4', seed = 1 } = {}){
    const R = rng(p.id + 'gbfl' + seed + x + y);
    let b = '';
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.28 + R() * .4, d = i === 0 ? 0 : s * (.2 + R() * .08); b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d * .9)}" r="${f(s * (.16 + R() * .06))}" fill="${R() < .5 ? c : lt(c, .3)}" stroke="${dk(c, .22)}" stroke-width=".5"/>`; }
    let dots = '';
    for (let i = 0; i < 10; i++) dots += `<circle cx="${f((R() - .5) * s * .7)}" cy="${f((R() - .5) * s * .6)}" r=".8" fill="${dk(c, .18)}" opacity=".6"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}>${b}</g>${dots}<path d="M${f(-s * .22)},${f(-s * .18)} Q${f(-s * .05)},${f(-s * .32)} ${f(s * .14)},${f(-s * .24)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// フィッシュケーキ（パン粉をつけて揚げ焼きした丸い厚めのケーキ）
function gbFishcake(p, x, y, s, r = 0, { c = '#d9a048', seed = 1 } = {}){
    const R = rng(p.id + 'gbfc' + seed);
    const pts = ring(s / 2, 14, .07, R, 1, .94);
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .5)}" rx="${f(s * (.06 + R() * .06))}" ry="${f(s * (.04 + R() * .05))}" fill="${dk(c, .5)}" opacity="${f(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.crumb(.8)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g></g>
        <g ${gbBlur(p, 2.2)}><path d="${smooth(pts.map(([a, b]) => [a * .92, b * .92]))}" fill="none" stroke="${dk(c, .35)}" stroke-width="4.5" opacity=".55"/>${sp}</g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55, b * .55]))}" fill="${lt(c, .18)}" opacity=".35"/>
        <path d="M${f(-s * .3)},${f(-s * .18)} Q${f(-s * .08)},${f(-s * .36)} ${f(s * .18)},${f(-s * .3)}" stroke="#fff3d6" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ベイクドビーンズ（トマトソースの中の白いんげん）
function gbBeans(p, x, y, rx, ry, { seed = 1, n = 34 } = {}){
    const R = rng(p.id + 'gbbn' + seed);
    const sauce = '#cf4a1a';
    let bn = '';
    for (const [bx, by, br] of gbSpots('gbbeans' + seed, n, rx * .9, 6.2, x, y, ry / rx)){
        bn += `<g ${T(bx, by, br)}><ellipse rx="4" ry="2.9" fill="${p.g('#d4784a', .3, .25)}" stroke="#9a3e18" stroke-width=".5"/><path d="M-2.2,-1 Q-.4,-2.2 1.6,-1.2" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
    }
    return `<path ${T(x, y)} d="${smooth(ring(rx, 11, .2, R, 1, ry / rx))}" fill="${p.rg(sauce, .2, .25, .4, .36)}"/>
        <g ${p.sh(.4)}>${bn}</g>
        <path ${T(x, y)} d="${smooth(ring(rx, 11, .2, R, 1, ry / rx))}" fill="${sauce}" opacity=".22"/>
        <path d="M${f(x - rx * .5)},${f(y - ry * .3)} Q${f(x - rx * .2)},${f(y - ry * .6)} ${f(x + rx * .2)},${f(y - ry * .55)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// ジャケットポテト（皮ごと焼いて十字に切り開いたじゃがいも）
function gbJacket(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'gbjk');
    const pts = ring(1, 16, .08, R, w / 2, h / 2);
    let sp = '';
    for (let i = 0; i < 18; i++) sp += `<circle cx="${f((R() - .5) * w * .9)}" cy="${f((R() - .5) * h * .9)}" r="${f(.5 + R() * .8)}" fill="#5a3618" opacity=".45"/>`;
    const open = `M${f(-w * .3)},${f(-h * .14)} Q${f(-w * .08)},${f(-h * .3)} 0,${f(-h * .34)} Q${f(w * .08)},${f(-h * .3)} ${f(w * .3)},${f(-h * .14)} Q${f(w * .36)},0 ${f(w * .3)},${f(h * .14)} Q${f(w * .08)},${f(h * .3)} 0,${f(h * .34)} Q${f(-w * .08)},${f(h * .3)} ${f(-w * .3)},${f(h * .14)} Q${f(-w * .36)},0 ${f(-w * .3)},${f(-h * .14)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.4)}><g ${p.rough(2.4, .08)}><path d="${smooth(pts)}" fill="${p.rg('#a8743e', .3, .4, .36, .3)}" stroke="#5a3414" stroke-width="1"/></g></g>
        ${sp}
        <path d="${smooth(pts.map(([a, b]) => [a * .7 - w * .06, b * .62 - h * .1]))}" fill="#d6a868" opacity=".35"/>
        <path d="${open}" fill="#5a3618" opacity=".6" transform="translate(1.2 1.6)"/>
        <path d="${open}" fill="${p.rg('#f7ecc6', .25, .18, .4, .36)}" stroke="#c9a05a" stroke-width=".8"/>
        ${gbGrains(p, 0, 0, w * .5, { cols: ['#fff8e0', '#f1dea4'], n: 40, rx: 2.4, ry: 1.8, seed: 3, sy: .9, stroke: 0, jitter: .6 })}
        <path d="M${f(-w * .32)},${f(-h * .3)} Q${f(-w * .1)},${f(-h * .46)} ${f(w * .18)},${f(-h * .4)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// スエットのダンプリング（白っぽいふわふわの団子）
function gbDumpling(p, x, y, s, { seed = 1, c = '#f1e6c6' } = {}){
    const R = rng(p.id + 'gbdm' + seed + x);
    return `<g ${T(x, y)}><g ${p.sh(1.1)}><path d="${smooth(ring(s / 2, 10, .12, R, 1, .94))}" fill="${p.rg(c, .3, .25, .38, .34)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>
        <g ${p.crumb(.6)}><path d="${smooth(ring(s * .36, 9, .2, R, 1, .9))}" fill="#e8c27a" opacity=".55"/></g>
        <path d="${smooth(ring(s / 2, 10, .12, rng(p.id + 'gbdm' + seed + x), 1, .94))}" fill="none" stroke="#7a4a20" stroke-width="2.4" opacity=".35" transform="translate(1 1.6) scale(.96)"/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 煮込んだ牛肉のかたまり
function gbBeefChunk(p, x, y, s, r = 0, { c = '#6e3c1e', seed = 1 } = {}){
    const R = rng(p.id + 'gbbf' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(s * .05)} Q${f(-s * .05)},${f(-s * .1)} ${f(s * .2)},${f(s * .08)} M${f(-s * .2)},${f(s * .22)} Q${f(s * .02)},${f(s * .1)} ${f(s * .26)},${f(s * .22)}" stroke="${dk(c, .45)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-s * .28)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .34)} ${f(s * .18)},${f(-s * .24)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// サボイキャベツのリボン（縮れた深緑の葉）
function gbSavoy(p, x, y, L, w, r, R, { c = '#4a8a30' } = {}){
    const pts = [0, 1, 2, 3, 4].map(i => [-L / 2 + i * L / 4, (R() - .5) * w * .6]);
    const d = gbSm(pts);
    let crin = '';
    for (let i = 0; i < 5; i++){ const t = -L / 2 + 4 + i * (L - 8) / 4; crin += `M${f(t)},${f(-w * .3)} q${f(1.5)},${f(w * .3)} 0,${f(w * .6)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .4)}" stroke-width="${f(w + 1.4)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
        <path d="${d}" stroke="${lt(c, .3)}" stroke-width="${f(w * .22)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.5 -1.2)"/>
        <path d="${d}" stroke="#eef6d6" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".75" transform="translate(0 ${f(w * .18)})"/>
        <path d="${crin}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".55"/></g>`;
}
// サボイキャベツのざく切り（縮れて波打つ平たい葉）
function gbSavoyLeaf(p, x, y, s, r = 0, { c = '#6aa83c', seed = 1 } = {}){
    const R = rng(p.id + 'gbsv' + seed + x + y);
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.28, rr = (i % 2 ? .86 : 1.04) * (1 - R() * .12); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .2]; });
    let vn = '';
    for (let i = 0; i < 4; i++){ const t = -s * .32 + i * s * .2; vn += `M${f(t)},0 q${f(s * .06)},${f(-s * .08)} ${f(s * .1)},${f(-s * .15)} M${f(t)},0 q${f(s * .06)},${f(s * .08)} ${f(s * .1)},${f(s * .15)}`; }
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-s * .44)},0 Q0,${f(-s * .03)} ${f(s * .44)},0" stroke="#e4f0c4" stroke-width="${f(s * .05)}" fill="none" stroke-linecap="round"/>
        <path d="${vn}" stroke="${lt(c, .45)}" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 食パン（厚切り・バターを塗った）
function gbBread(p, x, y, w, h, r = 0, { seed = 1, butter = true } = {}){
    const R = rng(p.id + 'gbbr' + seed);
    const shape = `M${-w / 2},${f(-h * .18)} Q${-w / 2},${f(-h / 2)} ${f(-w * .28)},${f(-h / 2)} Q${f(-w * .06)},${f(-h * .36)} 0,${f(-h * .4)} Q${f(w * .06)},${f(-h * .36)} ${f(w * .28)},${f(-h / 2)} Q${w / 2},${f(-h / 2)} ${w / 2},${f(-h * .18)} L${w / 2},${f(h * .36)} Q${w / 2},${h / 2} ${f(w * .38)},${h / 2} L${f(-w * .38)},${h / 2} Q${-w / 2},${h / 2} ${-w / 2},${f(h * .36)}Z`;
    let holes = '';
    for (let i = 0; i < 14; i++) holes += `<ellipse cx="${f((R() - .5) * w * .72)}" cy="${f((R() - .5) * h * .68)}" rx="${f(.7 + R() * 1.2)}" ry="${f(.6 + R() * .9)}" fill="#e3d2a8" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${shape}" fill="${p.g('#c88a44', .25, .3)}" stroke="#8a5620" stroke-width=".8"/></g>
        <g transform="scale(.9 .88)"><path d="${shape}" fill="${p.rg('#fbf3dc', .15, .12)}"/></g>${holes}
        ${butter ? `<path d="${smooth(ring(1, 10, .25, R, w * .32, h * .3))}" fill="#f6d868" opacity=".3"/><path d="M${f(-w * .22)},${f(-h * .1)} Q0,${f(-h * .22)} ${f(w * .2)},${f(-h * .06)}" stroke="#fff6c8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}</g>`;
}
// スパゲッティの渦
function gbPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'gbPs' + seed);
    const ol = gbOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += gbSm(pts);
    }
    const base = `<path ${T(x, y)} d="${gbSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}
// 白いご飯（バスマティ: 細長い粒）
function gbRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.8 } = {}){
    const R = rng(p.id + 'gbRice' + seed + x + y);
    const shape = gbSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('gbRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${f(grain * .7)}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .25)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 鶏もものひと口大（カレーの中: 焼き色と赤いソースのからみ）
function gbChicken(p, x, y, s, r = 0, { c = '#c8662a', seed = 1 } = {}){
    const R = rng(p.id + 'gbck' + seed + x + y);
    const pts = ring(s / 2, 9, .22, R, 1.15, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(ring(s * .3, 7, .3, R, 1.1, .7).map(([a, b]) => [a + s * .08, b + s * .08]), true, .8)}" fill="#8a3010" opacity=".4"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .08)},${f(-s * .34)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 白い深皿（縁に色の線）
function gbSoupBowl(p, rim = '#2c4c7c'){
    return K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }) + `<circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1.8" opacity=".85"/>`;
}
// バター（溶けかけ）
function gbButter(p, x, y, s, r = 0){
    return `<path ${T(x + 2, y + 2)} d="${smooth(ring(s * .78, 9, .3, rng(p.id + 'gbbt' + x)))}" fill="#f7d75e" opacity=".45"/>
        <g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${f(s * .86)}" rx="${f(s * .22)}" fill="${p.g('#f8de72', .35, .2)}" stroke="#d9b23a" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .26)} L${f(s * .2)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/></g>`;
}
// グリンピースの小山
function gbPeas(p, x, y, s, { n = 60, seed = 1, sy = 1 } = {}){
    return `<g ${p.sh(.4)}>${gbGrains(p, x, y, s, { cols: ['#6fb43c', '#5ea232', '#82c44a'], n, rx: 3.6, ry: 3.4, hi: .7, seed, jitter: .15, sy })}</g>`;
}

// ---------- 料理 ----------
export default {
    // パンとバター: 紺の線の白い皿に、厚切りの食パン3枚（バターを塗って）とバター
    gb_staple: p => [
        K.plate(p, { rim: '#1f3a66' }),
        gbBread(p, 78, 84, 70, 64, -14, { seed: 1 }),
        gbBread(p, 104, 104, 70, 64, -8, { seed: 2 }),
        gbBread(p, 128, 124, 70, 64, -2, { seed: 3 }),
        gbButter(p, 58, 140, 18, 10),
    ].join(''),

    // シェパーズパイ: 白いホーローのパイ皿。フォークの筋をつけてこんがり焼いたマッシュポテトにチェダー。右下をすくって、ラムのひき肉とグリンピース・にんじんをのぞかせる
    gb_shepherdspie: p => {
        const rx = 78, ry = 60, cx = 100, cy = 100;
        const E = a => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
        const a1 = 12 * Math.PI / 180, a2 = 72 * Math.PI / 180;
        const pts = [];
        for (let i = 0; i <= 40; i++){ const a = a2 + (a1 + 6.283 - a2) * i / 40; pts.push(E(a)); }
        const [x1, y1] = E(a1), [x2, y2] = E(a2);
        const i1 = [cx + (x1 - cx) * .42, cy + (y1 - cy) * .42], i2 = [cx + (x2 - cx) * .42, cy + (y2 - cy) * .42];
        const top = gbSm(pts) + ` L${f(i1[0])},${f(i1[1])} L${f(i2[0])},${f(i2[1])} Z`;
        const cut = `M${f(x1)},${f(y1)} L${f(i1[0])},${f(i1[1])} L${f(i2[0])},${f(i2[1])} L${f(x2)},${f(y2)}`;
        const clip = p.def('gbspc', id => `<clipPath id="${id}"><path d="${top}"/></clipPath>`);
        let ridges = '';
        for (let i = 0; i < 13; i++){
            const yy = cy - ry + 6 + i * 9.2, j = i * 1.7;
            const d = `M18,${yy} Q40,${f(yy - 4 - Math.sin(j) * 2)} 60,${f(yy + Math.cos(j) * 1.5)} T108,${f(yy + Math.sin(j + 1) * 2)} T150,${f(yy - Math.cos(j) * 2)} T186,${yy}`;
            ridges += `<path d="${d}" stroke="#a86c22" stroke-width="2.8" fill="none" opacity=".6" transform="translate(0 2.4)"/><path d="${d}" stroke="#fbe6a8" stroke-width="2.2" fill="none" opacity=".95"/>`;
        }
        return [
            gbEnamelDish(p, { rx: 94, ry: 76 }),
            `<ellipse cx="100" cy="100" rx="${rx + 6}" ry="${ry + 6}" fill="${p.rg('#7a4a28', .15, .2)}"/>`,
            K.mince(p, 138, 124, 60, { c: '#7a4626', n: 70, seed: 2 }),
            gbPeas(p, 140, 126, 48, { n: 16, seed: 3 }),
            `<g ${p.sh(.4)}>`, ...[[150, 118, 20], [134, 136, -30], [160, 132, 50]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-3.6" y="-3.6" width="7.2" height="7.2" rx="1.4" fill="${p.g('#ef7d2a', .3, .2)}" stroke="#b8531a" stroke-width=".5"/></g>`), `</g>`,
            `<g ${p.sh(1.1)}><path d="${top}" fill="${p.g('#efc86a', .25, .25)}"/></g>`,
            `<g clip-path="url(#${clip})">`, ridges,
            `<g ${gbBlur(p, 4)}>`,
            ...[[56, 70, 18, 10], [100, 62, 22, 11], [140, 72, 16, 9], [60, 112, 20, 11], [100, 118, 16, 9], [130, 96, 14, 8], [70, 142, 14, 8], [112, 144, 14, 7]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#b0601a" opacity=".7"/>`),
            `</g>`,
            `<g ${gbBlur(p, 1.4)}>`, ...[[72, 84, 9, 6], [118, 92, 10, 6], [86, 128, 9, 5], [46, 100, 7, 5], [128, 60, 7, 4]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#e08a22" opacity=".7"/>`), `</g>`,
            `</g>`,
            `<path d="${cut}" stroke="#f6e4b6" stroke-width="3.2" fill="none" stroke-linejoin="round"/>`,
            `<path d="${cut}" stroke="#c99a52" stroke-width="1" fill="none" stroke-linejoin="round" transform="translate(1.6 1.6)"/>`,
            gbHerbs(p, 88, 92, 90, { n: 14 }),
        ].join('');
    },

    // バンガーズ＆マッシュ: 白い皿に、マッシュポテトの山、こんがり焼いたポークソーセージ3本、飴色玉ねぎのグレービー、グリンピース
    gb_bangers: p => {
        const R = rng('gbbm');
        return [
            K.plate(p, { rim: '#2c4c7c' }),
            `<g ${p.sh(1.2)}><path d="${smooth(ring(46, 12, .14, R, 1.05, .94).map(([a, b]) => [a + 82, b + 100]))}" fill="${p.rg('#f3e2a8', .32, .22, .4, .36)}" stroke="#cfae62" stroke-width=".8"/></g>`,
            `<path d="M52,104 C56,78 84,66 104,76 C118,84 114,104 100,108" stroke="#d8bb74" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/><path d="M50,102 C54,76 82,64 102,74 C116,82 112,102 98,106" stroke="#fff8e4" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".9"/>`,
            K.pool(p, 108, 112, 96, '#5a3416', { op: .92, seed: 1, sy: .76 }),
            `<circle cx="100" cy="108" r="28" fill="#7a4a22" opacity=".35"/>`,
            `<g ${p.sh(.4)}>`, ...[[80, 120, 20], [120, 128, -30], [100, 136, 60], [132, 108, 10], [70, 136, -50], [112, 98, 150]].map(([x, y, r]) => gbOnionStrip(p, x, y, 18, r)), `</g>`,
            gbSausage(p, 92, 82, 82, 20, -28, { seed: 1 }),
            gbSausage(p, 104, 98, 84, 20, -22, { seed: 2, c: '#a05a36' }),
            gbSausage(p, 116, 116, 80, 20, -18, { seed: 3, c: '#ad6440' }),
            K.glaze(p, 118, 122, 50, '#4e2a12', { seed: 3, op: .4 }),
            gbPeas(p, 148, 72, 44, { n: 26, seed: 1 }),
            gbPeas(p, 58, 140, 36, { n: 18, seed: 2 }),
            gbHerbs(p, 104, 110, 70, { n: 8 }),
        ].join('');
    },

    // フィッシュケーキ: 灰青の線の白い皿に、パン粉をつけて揚げ焼きした丸いフィッシュケーキ3つ、グリンピース、タルタルソース、レモン
    gb_fishcakes: p => [
        K.plate(p, { rim: '#9aa6ae' }),
        gbFishcake(p, 74, 84, 52, 0, { seed: 1 }),
        gbFishcake(p, 118, 72, 50, 20, { seed: 2, c: '#d49a42' }),
        gbFishcake(p, 92, 126, 52, -15, { seed: 3, c: '#dca54c' }),
        gbPeas(p, 138, 124, 52, { n: 34, seed: 1 }),
        `<g ${p.sh(.6)}><path d="${smooth(ring(13, 9, .3, rng('gbtar')).map(([a, b]) => [a * 1.2 + 142, b + 150]))}" fill="${p.rg('#fbf8ee', .2, .1)}" stroke="#e2dccb" stroke-width=".6"/></g>`,
        gbHerbs(p, 142, 150, 18, { n: 6, cols: ['#4f8a2c', '#7ab050'] }),
        `<path d="M134,146 Q140,142 146,144" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>`,
        K.lemon(p, 150, 68, 30, 40),
        gbHerbs(p, 92, 100, 90, { n: 10 }),
    ].join(''),

    // スパゲッティ・ボロネーゼ: 赤茶の線の白い皿に、スパゲッティの山、牛ひき肉のトマトソース、おろしパルメザン
    gb_spagbol: p => [
        K.plate(p, { rim: '#b9442c' }),
        gbPasta(p, 100, 102, 138, { c: '#f0d48a', w: 2.6, n: 34, sy: .9 }),
        `<g ${p.sh(.8)}><path d="${smooth(ring(40, 11, .22, rng('gbbol'), 1.1, .86).map(([a, b]) => [a + 100, b + 98]))}" fill="${p.rg('#9a3a1c', .2, .25, .4, .36)}"/></g>`,
        gbGrains(p, 100, 98, 76, { cols: ['#6e3a1e', '#8a4826', '#5a2e14'], n: 110, rx: 2.4, ry: 1.9, seed: 1, sy: .86, jitter: .6, hi: .15 }),
        `<g ${p.sh(.3)}>`, ...[[84, 86, 10], [116, 108, -30], [96, 114, 60], [112, 84, 20]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1" fill="${p.g('#ef7d2a', .3, .2)}" stroke="#b8531a" stroke-width=".4"/></g>`), `</g>`,
        K.glaze(p, 100, 98, 74, '#b8401e', { seed: 2, op: .22 }),
        ...[[72, 72, 8, 5], [128, 130, 7, 4], [66, 122, 6, 4]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#a84622" opacity=".6"/>`),
        `<g ${p.sh(.3)}>`, K.shreds(p, 100, 96, 64, { c: '#fbf3dc', n: 22, w: 1.8, len: .22, seed: 5, curve: .4 }), `</g>`,
        K.sprinkle(p, 100, 100, 90, { c: '#fbf3dc', n: 30, r: .9 }),
    ].join(''),

    // チキンティッカマサラ: 白い皿に、バスマティライスと、クリーミーなオレンジ色のカレーの中の鶏もも、生クリーム、コリアンダー
    gb_tikkamasala: p => [
        K.plate(p, { rim: '#c9bfae' }),
        gbRice(p, 64, 100, 72, { sy: 1.3, seed: 1 }),
        K.pool(p, 128, 102, 104, '#d8601e', { op: 1, seed: 1, sy: 1.15 }),
        `<circle cx="124" cy="96" r="30" fill="#ec8a3a" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[118, 74, 26, 20], [146, 90, 25, -30], [112, 104, 27, 60], [140, 124, 26, 120], [116, 134, 24, 10], [150, 110, 22, 170], [132, 100, 22, 40]].map(([x, y, s, r], i) => gbChicken(p, x, y, s, r, { seed: i + 1 })),
        `</g>`,
        K.glaze(p, 128, 104, 86, '#e8702a', { seed: 3, op: .18 }),
        `<path d="M104,84 C116,76 134,86 146,78 M108,120 C120,112 136,126 150,116" stroke="#e9a070" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/><path d="M104,84 C116,76 134,86 146,78 M108,120 C120,112 136,126 150,116" stroke="#fff6ea" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`,
        gbCoriander(p, 126, 90, 16, -20), gbCoriander(p, 138, 112, 15, 40), gbCoriander(p, 114, 118, 13, 110),
        gbHerbs(p, 128, 104, 80, { n: 12, cols: ['#3f8a2c', '#5aa63c'] }),
        gbShine(130, 104, 48, .3),
    ].join(''),

    // ビーフシチューとダンプリング: 茶の深鉢に、こっくりした牛肉のシチュー、にんじん・玉ねぎ、上にふっくらしたスエットのダンプリング
    gb_stew: p => [
        K.bowl(p, { glaze: '#7b4b2e', inside: '#e9dcc4' }),
        K.liquid(p, { R: 72, c: '#5e3416', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="44" fill="#7a4620" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[62, 92, 22, 10], [138, 70, 24, -30], [150, 118, 22, 60], [68, 138, 24, 20], [104, 150, 20, 110], [124, 136, 22, -20], [84, 62, 20, 40], [116, 92, 22, 150]].map(([x, y, s, r], i) => gbBeefChunk(p, x, y, s, r, { seed: i + 1, c: i % 3 ? '#6e3c1e' : '#7c4624' })),
        ...[[80, 110, 14], [136, 96, 13], [58, 116, 12], [100, 70, 13], [146, 144, 12], [96, 126, 12]].map(([x, y, s]) => K.carrotRound(p, x, y, s, { c: '#e9772a' })),
        ...[[120, 60, 18, 20], [72, 72, 16, -40]].map(([x, y, s, r]) => gbOnionStrip(p, x, y, s, r, { c: '#e3c48c' })),
        `</g>`,
        K.glaze(p, 100, 104, 100, '#4a2a10', { seed: 2, op: .3 }),
        gbDumpling(p, 86, 90, 36, { seed: 1 }), gbDumpling(p, 122, 112, 36, { seed: 2, c: '#f3e9cc' }), gbDumpling(p, 108, 76, 32, { seed: 3, c: '#efe3c2' }), gbDumpling(p, 84, 126, 32, { seed: 4 }),
        gbHerbs(p, 100, 100, 110, { n: 16 }),
        gbShine(100, 100, 72, .3),
    ].join(''),

    // ジャケットポテト: 紺の線の白い皿に、皮がカリッと焼けた大きなじゃがいもを十字に開き、ベイクドビーンズとおろしチェダーをたっぷり
    gb_jacket: p => [
        K.plate(p, { rim: '#2c4c7c' }),
        gbJacket(p, 100, 100, 136, 100, -18),
        gbBeans(p, 100, 100, 44, 30, { seed: 1, n: 30 }),
        `<g ${p.sh(.5)}>`, K.shreds(p, 102, 98, 70, { c: '#f2a832', n: 30, w: 2.2, len: .32, seed: 2, curve: .5 }), K.shreds(p, 98, 102, 54, { c: '#f8c04a', n: 20, w: 2, len: .3, seed: 3, curve: .5 }), `</g>`,
        gbButter(p, 86, 86, 12, -10),
        K.sprinkle(p, 100, 100, 70, { c: '#2a2420', n: 10, r: .5 }),
    ].join(''),

    // ミントのグリンピース: 緑の線の白い鉢に、つやのあるグリンピースの山、溶けるバター、ミントの葉
    gb_peas: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#4a8a40" stroke-width="1.8" opacity=".85"/>`,
        `<g ${p.sh(.7)}><circle cx="100" cy="100" r="68" fill="${p.rg('#7fb043', .15, .3)}"/></g>`,
        gbPeas(p, 100, 100, 134, { n: 150, seed: 1 }),
        K.glaze(p, 98, 98, 110, '#f6e08a', { seed: 1, op: .22 }),
        `<path d="${smooth(ring(14, 9, .3, rng('gbpb')).map(([a, b]) => [a + 106, b + 94]))}" fill="#f8dc6a" opacity=".5"/>`,
        gbButter(p, 104, 94, 14, -14),
        `<g ${p.sh(.4)}>`, gbLeaf(p, 76, 86, 18, -30, { c: '#2f7a2a' }), gbLeaf(p, 126, 116, 17, 40, { c: '#3a8a30' }), gbLeaf(p, 86, 126, 15, 100, { c: '#2f7a2a' }), gbLeaf(p, 130, 78, 14, -70, { c: '#3a8a30' }), `</g>`,
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 10, r: .5 }),
    ].join(''),

    // カリフラワーチーズ: 白い楕円のグラタン皿に、チーズソースをかけてこんがり焼いたカリフラワー
    gb_cauliflowercheese: p => {
        const R = rng('gbcc');
        return [
            K.ovalDish(p, { rx: 94, ry: 76, rim: null, base: '#f3eee4', deep: true }),
            `<ellipse cx="100" cy="100" rx="76" ry="59" fill="${p.rg('#f0cf72', .22, .22, .4, .36)}"/>`,
            `<g ${p.sh(.5)}>`, ...gbSpots('ccf', 14, 56, 23, 100, 100, .78).map(([x, y, r], i) => gbFloret(p, x, y, 36 + R() * 8, r, { seed: i })), `</g>`,
            `<ellipse cx="100" cy="100" rx="76" ry="59" fill="#f4d47a" opacity=".55"/>`,
            ...gbSpots('ccs', 10, 50, 26, 100, 100, .78).map(([x, y], i) => K.pool(p, x, y, 26, '#f6dc86', { seed: 20 + i, op: .8 })),
            `<g ${gbBlur(p, 3.6)}>`, ...[[60, 76, 16, 10], [104, 64, 18, 10], [140, 84, 14, 9], [72, 120, 18, 10], [116, 126, 16, 9], [138, 116, 12, 8], [96, 96, 12, 8]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#c47a22" opacity=".65"/>`), `</g>`,
            `<g ${gbBlur(p, 1.2)}>`, ...[[62, 76, 6, 4], [106, 64, 7, 4], [74, 122, 7, 4], [118, 126, 6, 3.5], [140, 86, 5, 3.5]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#8a4612" opacity=".55"/>`), `</g>`,
            `<ellipse cx="100" cy="100" rx="76" ry="59" fill="none" stroke="#a8702a" stroke-width="1.4" opacity=".5"/>`,
            K.crumbs(p, 100, 100, 130, { n: 26, c: '#d9973c' }),
            `<path d="M44,92 Q52,70 80,60" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 12, r: .5 }),
        ].join('');
    },

    // オーブンチップス: 紺の線の白い皿に、太めの黄金色のチップスの山、塩
    gb_chips: p => {
        const R = rng('gbchips');
        const sp = gbSpots('chp', 30, 58, 12, 100, 100, .92);
        return [
            K.plate(p, { rim: '#2c4c7c' }),
            `<g ${p.sh(.9)}>`,
            ...sp.map(([x, y, r], i) => gbChip(p, x, y, 50 + R() * 22, -30 + (R() - .5) * 100, { seed: i, w: 11, c: ['#e8bb4e', '#e2ad42', '#efc65c', '#dca03a'][i % 4] })),
            `</g>`,
            `<g ${p.sh(.9)}>`, gbChip(p, 92, 92, 64, -36, { seed: 40, w: 11, c: '#ecc054' }), gbChip(p, 110, 104, 60, 20, { seed: 41, w: 11, c: '#e6b448' }), gbChip(p, 96, 116, 56, -70, { seed: 42, w: 11, c: '#f0c860' }), `</g>`,
            K.sprinkle(p, 100, 100, 110, { c: '#ffffff', n: 26, r: .7 }),
        ].join('');
    },

    // コールスロー: 青い鉢に、マヨネーズであえた細切りの白キャベツとにんじん、赤玉ねぎ
    gb_coleslaw: p => {
        const R = rng('gbcs');
        return [
            K.bowl(p, { glaze: '#3e5f86', inside: '#f3efe6' }),
            `<g ${p.sh(1.1)}><path d="${smooth(ring(64, 12, .14, R, 1, .95).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#f1efd6', .3, .2, .4, .36)}"/></g>`,
            `<g ${p.sh(.4)}>`,
            ...(() => { let sh = ''; const cols = ['#f8f9ea', '#e6efc6', '#d4e6a6', '#fbfcf2', '#eef5d6', '#f2f2dc'];
                for (let i = 0; i < 84; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 56, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d * .94, L = 12 + R() * 8, ang = R() * 180, c = cols[Math.floor(R() * cols.length)]; const rad = ang * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * L * .4; const dd = `M${f1(x - dx)},${f1(y - dy)}q${f1(dx - dy * b / L * 2)},${f1(dy + dx * b / L * 2)} ${f1(dx * 2)},${f1(dy * 2)}`; sh += `<path d="${dd}" stroke="#c9cfa6" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${dd}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`; }
                for (let i = 0; i < 24; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 52, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d * .94, L = 12 + R() * 6, ang = R() * 180; const rad = ang * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * L * .4; const dd = `M${f1(x - dx)},${f1(y - dy)}q${f1(dx - dy * b / L * 2)},${f1(dy + dx * b / L * 2)} ${f1(dx * 2)},${f1(dy * 2)}`; sh += `<path d="${dd}" stroke="#c45a1a" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="${dd}" stroke="#ee7d2c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; }
                return [sh]; })(),
            ...[[80, 84, 20], [124, 112, -40], [96, 128, 70], [130, 74, 110]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-8,1 Q0,-4 8,1" stroke="#8a3a6a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-8,1 Q0,-4 8,1" stroke="#c77ab0" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/></g>`),
            `</g>`,
            K.glaze(p, 98, 98, 100, '#fffdf2', { seed: 1, op: .3 }),
            K.sprinkle(p, 100, 100, 92, { c: '#4a3f36', n: 14, r: .55 }),
        ].join('');
    },

    // にんじんとスウェードのマッシュ: 茶の鉢に、粗くつぶしたオレンジのマッシュ、バター、黒こしょう
    gb_carrotswede: p => [
        K.bowl(p, { glaze: '#6d4a35', inside: '#f1e6d4' }),
        `<g ${p.sh(1.1)}><path d="${smooth(ring(64, 12, .14, rng('gbcsw'), 1, .95).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#e8962e', .3, .25, .4, .36)}" stroke="#b86a1c" stroke-width=".8"/></g>`,
        gbGrains(p, 100, 100, 118, { cols: ['#f0a93c', '#e8892a', '#f4bc58', '#e29a3a'], n: 150, rx: 4, ry: 3, seed: 1, stroke: 0, jitter: .7, sy: .95 }),
        `<g ${p.sh(.3)}>`, ...gbSpots('swd', 12, 50, 16).map(([x, y, r], i) => `<g ${T(x, y, r)}><path d="${smooth(ring(5 + (i % 3), 6, .35, rng('swd' + i)))}" fill="${p.g(i % 2 ? '#f2c45a' : '#ee8c2c', .3, .2)}" stroke="${i % 2 ? '#c89a34' : '#b8601a'}" stroke-width=".5"/></g>`), `</g>`,
        `<path d="M48,104 C50,80 74,64 100,70 C120,76 124,96 110,104" stroke="#c87a22" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".5"/><path d="M46,102 C48,78 72,62 98,68 C118,74 122,94 108,102" stroke="#ffe6b0" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/>`,
        `<path d="${smooth(ring(14, 9, .3, rng('gbswb')).map(([a, b]) => [a + 108, b + 96]))}" fill="#f8dc6a" opacity=".5"/>`,
        gbButter(p, 106, 96, 15, -12),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 30, r: .6 }),
        `<path d="M50,86 Q58,62 84,52" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
    ].join(''),

    // バターでいためたサボイキャベツ: 白い鉢に、縮れた深緑のキャベツのリボン、ベーコンのかけら、バターのつや
    gb_cabbage: p => {
        const R = rng('gbcab');
        const ribs = gbSpots('cab', 24, 58, 15, 100, 100, .95).map(([x, y, r], i) => gbSavoyLeaf(p, x, y, 40 + R() * 14, r, { seed: i, c: ['#5f9e38', '#7fb64a', '#4a8a2c', '#94c45c', '#3f7a28'][i % 5] })).join('');
        return [
            K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#4a6a52" stroke-width="1.8" opacity=".85"/>`,
            `<g ${p.sh(.8)}><circle cx="100" cy="100" r="66" fill="${p.rg('#5a8a36', .15, .3)}"/></g>`,
            `<g ${p.sh(.5)}>`, ribs, `</g>`,
            `<g ${p.sh(.5)}>`, ...gbSpots('lard', 9, 50, 20).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-6" y="-4" width="12" height="8" rx="1.5" fill="${p.g('#c4573f', .25, .25)}" stroke="#8c3727" stroke-width=".5"/><rect x="-5" y="-1" width="10" height="2.2" rx=".8" fill="#f3d9c0" opacity=".9"/></g>`), `</g>`,
            K.glaze(p, 98, 98, 110, '#f6e08a', { seed: 1, op: .22 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 20, r: .6 }),
            gbShine(100, 100, 66, .3),
        ].join('');
    },

    // サイドサラダ: 白い鉢に、リトルジェムの葉、きゅうりの輪切り、トマトのくし切り、スプリングオニオン、ドレッシング
    gb_salad: p => {
        const R = rng('gbsal');
        const leaves = gbSpots('sal', 12, 52, 22).map(([x, y, r], i) => {
            const s = 46 + R() * 14, c = ['#a9d86a', '#8cc551', '#c6e48a', '#7ab843'][i % 4];
            const pts = Array.from({ length: 22 }, (_, j) => { const a = j / 22 * 6.28, rr = (j % 2 ? .9 : 1.04) * (1 - R() * .1); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s / 2 * .7]; });
            return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
                <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="${lt(c, .6)}" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
                ${[-.3, -.1, .1, .28].map((t, k) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(k % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(k % 2 ? s * .24 : -s * .24)}" stroke="${lt(c, .5)}" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
        }).join('');
        return [
            K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#2c4c7c" stroke-width="1.8" opacity=".85"/>`,
            leaves,
            `<g ${p.sh(.5)}>`, K.cucumberSlice(p, 76, 80, 20, 10, { oval: 1.05 }), K.cucumberSlice(p, 130, 118, 20, -20, { oval: 1.05 }), K.cucumberSlice(p, 72, 128, 18, 40, { oval: 1.05 }), K.cucumberSlice(p, 136, 72, 18, 0, { oval: 1.05 }), K.cucumberSlice(p, 104, 146, 17, 20, { oval: 1.05 }), `</g>`,
            K.tomatoWedge(p, 102, 76, 26, 20), K.tomatoWedge(p, 146, 98, 26, -70), K.tomatoWedge(p, 92, 130, 26, 150), K.tomatoWedge(p, 58, 100, 24, 80), K.tomatoWedge(p, 120, 110, 24, -20),
            gbChives(p, 100, 100, 110, { n: 26, r: 2 }),
            K.glaze(p, 100, 104, 100, '#f2e2a0', { seed: 3, op: .15 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .5 }),
        ].join('');
    },

    // リーキとじゃがいものスープ: 紺の線の白いスープ皿に、淡いクリーム色のなめらかなスープ、生クリーム、チャイブ、白こしょう
    gb_leekpotato: p => [
        gbSoupBowl(p, '#2c4c7c'),
        K.liquid(p, { R: 73, c: '#e4dcb0', op: 1 }),
        `<circle cx="96" cy="94" r="48" fill="#efe8c6" opacity=".5"/>`,
        gbSwirl(p, 100, 100, 34, { turns: 1.4, w: 3.8 }),
        `<g ${p.sh(.4)}>`, ...[[70, 82, 13], [132, 78, 12], [136, 126, 13], [72, 130, 12], [112, 144, 11]].map(([x, y, s]) => `<g ${T(x, y)}><ellipse rx="${s / 2}" ry="${s * .44}" fill="${p.g('#e8efc8', .2, .2)}" stroke="#9ab86a" stroke-width="1"/><ellipse rx="${s * .32}" ry="${s * .27}" fill="none" stroke="#b8cf8a" stroke-width=".9"/><ellipse rx="${s * .14}" ry="${s * .11}" fill="none" stroke="#c9da9a" stroke-width=".8"/></g>`), `</g>`,
        gbChives(p, 100, 100, 100, { n: 22 }),
        K.sprinkle(p, 100, 100, 100, { c: '#5a4a3a', n: 12, r: .5 }),
        gbShine(100, 100, 73, .45),
    ].join(''),

    // にんじんとコリアンダーのスープ: オレンジの線の白いスープ皿に、鮮やかなオレンジのなめらかなスープ、ヨーグルトのうず、コリアンダーの葉
    gb_carrotcoriander: p => [
        gbSoupBowl(p, '#d9742a'),
        K.liquid(p, { R: 73, c: '#e8842a', op: 1 }),
        `<circle cx="96" cy="94" r="48" fill="#f2a048" opacity=".45"/>`,
        gbSwirl(p, 98, 100, 36, { turns: 1.5, w: 4, c: '#fffaf2' }),
        `<g ${p.sh(.4)}>`, gbCoriander(p, 122, 82, 18, -20), gbCoriander(p, 80, 120, 17, 40), gbCoriander(p, 130, 126, 15, 120), gbCoriander(p, 76, 76, 13, -80), `</g>`,
        gbHerbs(p, 100, 100, 110, { n: 14, cols: ['#3f8a2c', '#5aa63c'] }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 14, r: .55 }),
        gbShine(100, 100, 73, .45),
    ].join(''),
};
