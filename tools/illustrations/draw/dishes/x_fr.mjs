// France (fr) — hand-composed redraws of the everyday French dishes (mains, sides, soups)
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// =========================================================
// このファイル専用の部品（xfr〜）。w_fr.mjs の部品を写して名前を変えたものと、新しく描いたもの
// =========================================================
const xfrBlur = (p, s = 2) => `filter="url(#${p.def('xfrbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xfrShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// 円（楕円）の中に重なりにくく位置を散らす
function xfrSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xfrspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

// 小さな粒をまとめて（色ごとに1本のpath）: レンズ豆・クスクス・米・パセリ
function xfrGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, rx = 2, ry = 1.4, seed = 1, sy = 1, hi = 0, jitter = .3, rot = false } = {}){
    const R = rng(p.id + 'xfg' + seed + x + y);
    const ds = cols.map(() => ''); let hs = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const ax = rx * (1 - jitter / 2 + R() * jitter), ay = ry * (1 - jitter / 2 + R() * jitter);
        const k = Math.floor(R() * cols.length);
        if (rot){
            // 細長い粒（米）: 向きをばらばらに
            const t = R() * 3.14, cx = Math.cos(t) * ax, cy = Math.sin(t) * ax, nx = -Math.sin(t) * ay, ny = Math.cos(t) * ay;
            ds[k] += `M${f(gx - cx)},${f(gy - cy)}Q${f(gx - cx * .2 + nx * 1.3)},${f(gy - cy * .2 + ny * 1.3)} ${f(gx + cx)},${f(gy + cy)}Q${f(gx - cx * .2 - nx * 1.3)},${f(gy - cy * .2 - ny * 1.3)} ${f(gx - cx)},${f(gy - cy)}Z`;
        } else ds[k] += `M${f(gx - ax)},${f(gy)}a${f(ax)},${f(ay)} 0 1 0 ${f(ax * 2)},0a${f(ax)},${f(ay)} 0 1 0 ${f(-ax * 2)},0Z`;
        if (hi && R() < hi) hs += `M${f(gx - ax * .5)},${f(gy - ay * .35)}l${f(ax * .6)},${f(-ay * .2)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".35"/>`).join('') + (hs ? `<path d="${hs}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".75"/>` : '');
}

// さいの目（上面と側面）
function xfrDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .3, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .24)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * (skin ? .38 : .2))} L${f(-h + s * .6)},${f(-h + s * (skin ? .38 : .2))}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}

// 葉（バジル・ローリエ・ミント）
function xfrLeaf(p, x, y, L, r = 0, { c = '#3f8a33', w = .42 } = {}){
    const h = L * w / 2;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .1)},${f(-h * 1.6)} ${L / 2},0 Q${f(-L * .1)},${f(h * 1.6)} ${-L / 2},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <path d="M${f(-L * .44)},0 L${f(L * .4)},0" stroke="${lt(c, .45)}" stroke-width=".7"/>${[-.2, .05, .25].map(t => `<path d="M${f(L * t)},0 l${f(L * .1)},${f(-h * .6)} M${f(L * t)},0 l${f(L * .1)},${f(h * .6)}" stroke="${lt(c, .35)}" stroke-width=".5" opacity=".8"/>`).join('')}</g>`;
}

// 薄切り玉ねぎ（煮て透き通った弧）
function xfrOnionStrip(p, x, y, s, r = 0, { c = '#f3d9a0', op = .8 } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".6" stroke-linejoin="round"/></g>`;
}

// クリームのうず
function xfrSwirl(p, x, y, R, { turns = 1.6, c = '#fffaf0', w = 4, op = .9, start = 0 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = start + t * turns * 6.28, rr = R * (.12 + t * .88); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .4)}" transform="translate(.6 .9)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}

// クルトン
function xfrCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f(-s / 2 + s * .18)}" y="${f(-s / 2 + s * .18)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}

// 刻みハーブ（パセリ）
function xfrHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'] } = {}){
    const R = rng(p.id + 'xfh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R(); ds[i % cols.length] += `M${f(cx - rr)},${f(cy)}l${f(rr)},${f(-rr * .8)}l${f(rr)},${f(rr * .8)}l${f(-rr * .6)},${f(rr)}Z`; }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// シブレット（小口切り）
function xfrChives(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'xfc' + seed + x);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; const seg = `M${f(cx - 1.6)},${f(cy)}a1.6,1.4 0 1 0 3.2,0a1.6,1.4 0 1 0 -3.2,0Z`; if (R() < .6) d1 += seg; else d2 += seg; }
    return `<path d="${d1}" fill="none" stroke="#4f9a34" stroke-width="1.1"/><path d="${d2}" fill="none" stroke="#7ab850" stroke-width="1.1"/>`;
}
// ディル
function xfrDill(p, x, y, L, r = 0){
    let d = `M${-L / 2},0 Q0,${f(-L * .06)} ${L / 2},0`;
    for (let i = 0; i < 7; i++){ const t = -L / 2 + (i + .7) * L / 8; d += `M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(-L * .16)} M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(L * .14)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#3f7f2a" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
}
// タイムの小枝
function xfrThyme(p, x, y, L, r = 0){
    const n = Math.max(3, Math.round(L / 4.5));
    let lv = '';
    for (let i = 0; i < n; i++){ const t = -L / 2 + (i + .6) * L / n; lv += `<ellipse cx="${f(t)}" cy="-1.7" rx="1.7" ry=".95" fill="#5f8a3a"/><ellipse cx="${f(t + 1)}" cy="1.7" rx="1.7" ry=".95" fill="#6e9a44"/>`; }
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 L${L / 2},0" stroke="#6a5a3a" stroke-width=".8"/>${lv}</g>`;
}
// ローズマリーの小枝
function xfrRosemary(p, x, y, L, r = 0){
    let d = '';
    const n = Math.round(L / 3.2);
    for (let i = 0; i < n; i++){ const t = -L / 2 + (i + .5) * L / n, l = 5.5 - Math.abs(i - n / 2) * .25; d += `M${f(t)},0 l${f(l * .45)},${f(-l)} M${f(t)},0 l${f(l * .45)},${f(l)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#2f5f3a" stroke-width="1.6" stroke-linecap="round"/><path d="${d}" stroke="#5a8a64" stroke-width=".6" stroke-linecap="round" transform="translate(-.3 -.3)"/><path d="M${-L / 2},0 L${L / 2},0" stroke="#5a4a2a" stroke-width="1"/></g>`;
}

// いんげん
function xfrBean(p, x, y, L, r = 0, { c = '#4f9a34', w = 4.4 } = {}){
    const h = w / 2;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .4)},${-h} ${f(-L * .3)},${-h} L${f(L * .34)},${-h} Q${f(L * .46)},${-h} ${L / 2},${f(-h * .3)} Q${f(L * .44)},${h} ${f(L * .32)},${h} L${f(-L * .3)},${h} Q${f(-L * .42)},${h} ${-L / 2},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/>
        <path d="M${f(-L * .28)},${f(-h * .4)} L${f(L * .28)},${f(-h * .4)}" stroke="${lt(c, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}

// レタスの葉
function xfrLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468', sy = .72 } = {}){
    const R = rng(p.id + 'xfl' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .1); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s / 2 * sy]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="${lt(c, .6)}" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(i % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(i % 2 ? s * .24 : -s * .24)}" stroke="${lt(c, .5)}" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}

// 骨付き鶏もも（皮目）
function xfrThigh(p, x, y, s, r = 0, { c = '#d48c3c', seed = 1, spotsOp = 1 } = {}){
    const R = rng(p.id + 'xft' + seed + x);
    const pts = ring(1, 12, .16, R, s / 2, s * .36).map(([a, b]) => [a + (a > 0 ? 0 : a * .08), b * (a > s * .2 ? .82 : 1)]);
    let spots = '';
    for (let i = 0; i < 5; i++) spots += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .4)}" rx="${f(s * (.06 + R() * .08))}" ry="${f(s * (.04 + R() * .05))}" fill="${dk(c, .5)}" opacity="${f((.22 + R() * .2) * spotsOp)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.g(c, .4, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .7 - s * .05, b * .6 - s * .06]))}" fill="${lt(c, .25)}" opacity=".45"/>
        <g ${xfrBlur(p, 1.4)}>${spots}</g>
        <path d="M${f(s * .32)},${f(-s * .1)} Q${f(s * .52)},${f(-s * .04)} ${f(s * .56)},${f(s * .04)}" stroke="#efe3c8" stroke-width="${f(s * .1)}" stroke-linecap="round" fill="none"/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .08)},${f(-s * .3)} ${f(s * .18)},${f(-s * .24)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// ソーセージ（1本・ゆるく曲がる）
function xfrSausage(p, x, y, L, W, r = 0, { c = '#b8664a', bend = 6, grill = 0 } = {}){
    const h = W / 2, b = bend;
    const d = `M${f(-L / 2 + h)},${f(-h)} Q0,${f(-h - b * 2)} ${f(L / 2 - h)},${f(-h)} A${h},${h} 0 0 1 ${f(L / 2 - h)},${f(h)} Q0,${f(h - b * 2)} ${f(-L / 2 + h)},${f(h)} A${h},${h} 0 0 1 ${f(-L / 2 + h)},${f(-h)}Z`;
    let gr = '';
    for (let i = 0; i < grill; i++){ const t = -L * .32 + i * L * .64 / Math.max(1, grill - 1); gr += `M${f(t - 2)},${f(-h * .8 - b * (1 - (2 * t / L) ** 2))} l4,${f(W * .8)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${d}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        ${gr ? `<path d="${gr}" stroke="${dk(c, .55)}" stroke-width="${f(W * .18)}" stroke-linecap="round" opacity=".55"/>` : ''}
        <path d="M${f(-L * .36)},${f(-h * .45)} Q0,${f(-h * .45 - b * 2)} ${f(L * .3)},${f(-h * .45)}" stroke="#fff" stroke-width="${f(W * .14)}" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M${f(-L * .3)},${f(h * .4)} Q0,${f(h * .4 - b * 2)} ${f(L * .34)},${f(h * .4)}" stroke="${dk(c, .3)}" stroke-width="${f(W * .12)}" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}
// ソーセージの厚い輪切り
function xfrSausageSlice(p, x, y, s, r = 0, { skin = '#a2553a', meat = '#e39a8a' } = {}){
    const R = rng(p.id + 'xfss' + x + y);
    let fat = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = R() * s * .3; fat += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.6 + R() * .7)}" fill="#f8e6dc"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g(skin, .2, .25)}" stroke="${dk(skin, .3)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.8)}" ry="${f(s * .46 - 1.8)}" fill="${p.rg(meat, .15, .15)}"/>${fat}
        <path d="M${f(-s * .28)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// マッシュルームの縦半分（かさ＋軸の断面）
function xfrMush(p, x, y, s, r = 0, { c = '#d9c3a0', cooked = true } = {}){
    const col = cooked ? mix(c, '#a87a4a', .3) : c;
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-10,-8 0,-9 Q10,-8 10,0 Q6,1 3,1 L3,8 Q0,9.4 -3,8 L-3,1 Q-6,1 -10,0Z" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .35)}" stroke-width=".6"/>
        <path d="M-8,-1 Q-7,-6 0,-7 Q7,-6 8,-1" stroke="${lt(col, .35)}" stroke-width="1" fill="none"/></g>`;
}
// マッシュルーム丸ごと（かさを上から）
function xfrMushCap(p, x, y, s, { c = '#e2cfae' } = {}){
    return `<g ${p.sh(.6)}><circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${p.rg(c, .3, .32, .36, .34)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <ellipse cx="${f(x - s * .14)}" cy="${f(y - s * .16)}" rx="${f(s * .17)}" ry="${f(s * .09)}" transform="rotate(-30 ${f(x - s * .14)} ${f(y - s * .16)})" fill="#fff" opacity=".6"/>`;
}

// 長方形のグラタン皿（白い磁器）
function xfrRectDish(p, { w = 184, h = 150, base = '#fbfaf6', rim = null } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${p.rg(base, .2, .14, .35, .3)}"/></g>
        ${rim ? `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="17" fill="none" stroke="${rim}" stroke-width="1.6"/>` : ''}
        <rect x="${x + 11}" y="${y + 11}" width="${w - 22}" height="${h - 22}" rx="12" fill="${p.rg(dk(base, .04), .05, .22, .6, .6)}"/>
        <path d="M${x + 14},${y + 34} Q${x + 14},${y + 13} ${x + 36},${y + 13}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}

// バゲットの輪切り
function xfrBreadSlice(p, x, y, s, r = 0, { toast = 0 } = {}){
    const R = rng(p.id + 'xfbs' + x + y);
    let holes = '';
    for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = R() * s * .3; holes += `<ellipse cx="${f(Math.cos(a) * d * 1.3)}" cy="${f(Math.sin(a) * d * .8)}" rx="${f(1 + R() * 1.8)}" ry="${f(.8 + R() * 1.2)}" fill="#dcc08a" opacity=".85"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${f(s * .62)}" ry="${f(s * .4)}" fill="${p.g('#c9822e', .25, .3)}" stroke="#94561c" stroke-width=".7"/></g>
        <ellipse rx="${f(s * .62 - 2.4)}" ry="${f(s * .4 - 2.4)}" fill="${p.rg(mix('#f6e7c4', '#e0a858', toast), .25, .1)}"/>${holes}</g>`;
}

// ---------- 器（新しく描いたもの） ----------
// ホーローの両手鍋（ココット）: 外は色の釉、内はクリーム
function xfrCocotte(p, { c = '#d0562a', R = 86, inside = '#f1e8d8' } = {}){
    const hd = s => `<rect x="${s < 0 ? 100 - R - 11 : 100 + R - 9}" y="86" width="20" height="28" rx="9" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${hd(-1)}${hd(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.4" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .88 + 2)}" fill="${dk(c, .3)}" opacity=".55"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="${p.rg(inside, .1, .3, .62, .64)}"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .4)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 鉄のフライパン（右下に柄）
function xfrSkillet(p, { R = 80, body = '#3d3734', handle = '#2f2a27', inner = '#2b2522', rim = '#6a625c' } = {}){
    const a = R * .66;
    return `<g ${p.sh(1.8)}><path d="M${f(100 + a)},${f(100 + a)} L190,190" stroke="${handle}" stroke-width="15" stroke-linecap="round"/><circle cx="100" cy="100" r="${R}" fill="${p.rg(body, .2, .3, .35, .3)}"/></g>
        <path d="M${f(100 + a + 14)},${f(100 + a + 14)} L186,186" stroke="${lt(handle, .25)}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <circle cx="185" cy="185" r="2.6" fill="${dk(handle, .4)}"/>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${rim}" stroke-width="1.3" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(R * .9)}" fill="${p.rg(inner, .12, .25, .62, .64)}"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .42)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
// 楕円の焼き皿（陶器・両端に耳）
function xfrOvalBaker(p, { c = '#b65a2a', inside = '#f1e2c8', rx = 90, ry = 74 } = {}){
    const ear = s => `<ellipse cx="${100 + s * (rx + 2)}" cy="100" rx="9" ry="16" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.7)}>${ear(-1)}${ear(1)}<ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 2.5}" ry="${ry - 2.5}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.3" opacity=".7"/>
        <ellipse cx="100" cy="100" rx="${f(rx * .88)}" ry="${f(ry * .86)}" fill="${p.rg(inside, .1, .28, .6, .62)}"/>
        <path d="M${f(100 - rx * .74)},${f(100 - ry * .42)} A${f(rx * .86)},${f(ry * .86)} 0 0 1 ${f(100 - rx * .3)},${f(100 - ry * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// スープ皿（白・ふちに色の線）
function xfrSoupPlate(p, { band = '#3c6a9a', base = '#fbfaf6', R = 94, well = .74 } = {}){
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 5}" fill="none" stroke="${band}" stroke-width="2" opacity=".85"/>
        <circle cx="100" cy="100" r="${f(R * well + 3)}" fill="${dk(base, .12)}" opacity=".5"/>
        <circle cx="100" cy="100" r="${f(R * well)}" fill="${p.rg(base, .08, .22, .62, .64)}"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .4)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .24)},${f(100 - R * .82)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 耳つきのスープボウル（オニオングラタン用の茶の陶器）
function xfrCrock(p, { c = '#7a4524', R = 80, inside = '#e8d6b8' } = {}){
    const ear = s => `<path transform="translate(${100 + s * (R + 4)} 100) scale(${s} 1)" d="M-8,-14 Q10,-16 13,0 Q10,16 -8,14Z" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${ear(-1)}${ear(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .28, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${lt(c, .4)}" stroke-width="1.6" opacity=".6"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="${p.rg(inside, .1, .3, .62, .64)}"/>
        <path d="M${f(100 - R * .76)},${f(100 - R * .38)} A${f(R * .88)},${f(R * .88)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .82)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 鉄のタルト型（波形のふち）
function xfrTartTin(p, R = 92){
    const pts = Array.from({ length: 60 }, (_, i) => { const a = i / 60 * 6.28, rr = R - (i % 2 ? 2.6 : 0); return [100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]; });
    return `<g ${p.sh(1.6)}><path d="${smooth(pts, true, .8)}" fill="${p.rg('#8a8682', .25, .3, .38, .32)}" stroke="#5a5652" stroke-width=".8"/></g>`;
}

// ---------- 具（新しく描いたもの） ----------
// 煮込んだ牛肉の角切り（照りのある濃い茶）
function xfrBeef(p, x, y, s, r = 0, { c = '#5e2c1c', seed = 1 } = {}){
    const R = rng(p.id + 'xbf' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.12, .9);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .65)}" fill="${p.g(c, .32, .35)}" stroke="${dk(c, .45)}" stroke-width=".8"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 - s * .06, b * .55 - s * .08]), true, .65)}" fill="${lt(c, .14)}" opacity=".55"/>
        <path d="M${f(-s * .3)},${f(s * .05)} Q${f(-s * .05)},${f(-s * .04)} ${f(s * .28)},${f(s * .08)} M${f(-s * .22)},${f(s * .22)} Q0,${f(s * .14)} ${f(s * .2)},${f(s * .24)}" stroke="${dk(c, .5)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M${f(-s * .28)},${f(-s * .16)} Q${f(-s * .08)},${f(-s * .36)} ${f(s * .18)},${f(-s * .28)}" stroke="#fff" stroke-width="${f(Math.max(1.2, s * .07))}" fill="none" stroke-linecap="round" opacity=".55"/>
        <circle cx="${f(s * .18)}" cy="${f(-s * .1)}" r="${f(s * .04)}" fill="#fff" opacity=".6"/></g>`;
}
// ラルドン（棒切りのベーコン: 赤身と脂の帯）
function xfrLardon(p, x, y, s, r = 0, { c = '#b9573a', fat = '#f2d6b8' } = {}){
    const w = s, h = s * .56;
    return `<g ${T(x, y, r)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h * .3)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/>
        <rect x="${f(-w / 2 + 1)}" y="${f(h * .02)}" width="${f(w - 2)}" height="${f(h * .36)}" rx="${f(h * .15)}" fill="${fat}" opacity=".95"/>
        <path d="M${f(-w * .3)},${f(-h * .24)} L${f(w * .2)},${f(-h * .24)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".55"/></g>`;
}
// 小玉ねぎ（グラッセ）
function xfrPearl(p, x, y, s, { c = '#ecc97e' } = {}){
    return `<g ${p.sh(.6)}><circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${p.rg(c, .35, .3, .36, .34)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <circle cx="${f(x + .5)}" cy="${f(y + .5)}" r="${f(s * .3)}" fill="none" stroke="${lt(c, .35)}" stroke-width=".8" opacity=".8"/>
        <ellipse cx="${f(x - s * .16)}" cy="${f(y - s * .18)}" rx="${f(s * .16)}" ry="${f(s * .09)}" fill="#fff" opacity=".75"/>`;
}
// 米（盛ったご飯・ピラフ）: 面＋細長い粒
function xfrRice(p, x, y, s, { sy = 1, tint = '#f7f2e2', grain = ['#ffffff', '#f1ebd9'], n = null, seed = 1 } = {}){
    const R = rng(p.id + 'xfr' + seed + x);
    const N = n || Math.round(s * s * sy / 70);
    return `<g ${p.sh(.8)}><path ${T(x, y)} d="${smooth(ring(s / 2, 12, .1, R, 1, sy))}" fill="${p.rg(tint, .3, .16, .38, .34)}"/></g>`
        + xfrGrains(p, x, y, s * .94, { cols: grain, n: N, rx: 2.8, ry: 1.25, sy, rot: true, seed, hi: .25 });
}
// にんじんの棒切り
function xfrCarrotStick(p, x, y, L, w, r = 0, { c = '#ec7b2d' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${f(w * .35)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="M${f(-L * .38)},${f(-w * .18)} L${f(L * .3)},${f(-w * .18)}" stroke="${lt(c, .45)}" stroke-width="1.1" stroke-linecap="round"/></g>`;
}
// ポロねぎの輪切り
function xfrLeekRing(p, x, y, s, { c = '#e8efc8', edge = '#9ab86a' } = {}){
    return `<g ${T(x, y)}><ellipse rx="${f(s / 2)}" ry="${f(s * .44)}" fill="${p.g(c, .2, .2)}" stroke="${edge}" stroke-width="1"/><ellipse rx="${f(s * .32)}" ry="${f(s * .27)}" fill="none" stroke="${mix(edge, c, .4)}" stroke-width=".9"/><ellipse rx="${f(s * .14)}" ry="${f(s * .11)}" fill="none" stroke="${mix(edge, c, .55)}" stroke-width=".8"/></g>`;
}
// 焼いた・ゆでたじゃがいも（大きめ）: browned で焼き目
function xfrSpud(p, x, y, s, r = 0, { c = '#ecc77c', browned = 0, seed = 1 } = {}){
    const R = rng(p.id + 'xsp' + seed + x + y);
    const pts = ring(s / 2, 8, .22, R, 1.12, .92);
    let sp = '';
    for (let i = 0; i < 3; i++) sp += `<ellipse cx="${f((R() - .3) * s * .5)}" cy="${f((R() - .3) * s * .4)}" rx="${f(s * (.12 + R() * .1))}" ry="${f(s * (.08 + R() * .06))}" fill="#a8641c" opacity="${f(browned * (.35 + R() * .3))}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        ${browned ? `<g ${xfrBlur(p, 1.6)}>${sp}</g>` : ''}
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - s * .08, b * .5 - s * .1]), true, .7)}" fill="${lt(c, .25)}" opacity=".55"/>
        <path d="M${f(-s * .26)},${f(-s * .2)} Q${f(-s * .06)},${f(-s * .36)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// にんにく（皮つきの1片）
function xfrGarlic(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-s / 2)},${f(s * .2)} Q${f(-s * .4)},${f(-s * .4)} ${f(s * .1)},${f(-s * .44)} Q${f(s * .5)},${f(-s * .3)} ${f(s / 2)},${f(s * .2)} Q0,${f(s * .44)} ${f(-s / 2)},${f(s * .2)}Z" fill="${p.g('#f3e6dc', .3, .2)}" stroke="#c9ad9a" stroke-width=".6"/></g>
        <path d="M${f(-s * .1)},${f(-s * .4)} Q${f(-s * .05)},0 ${f(-s * .2)},${f(s * .3)} M${f(s * .2)},${f(-s * .36)} Q${f(s * .16)},0 ${f(s * .2)},${f(s * .28)}" stroke="#c89aa8" stroke-width=".7" fill="none" opacity=".8"/></g>`;
}
// 半分に切ったレモン（断面）
function xfrLemonHalf(p, x, y, s){
    return `<g ${p.sh(.7)}><circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="#e8b81f"/></g><circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2 - 2)}" fill="#fbf1b0"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${f(x)},${f(y)} L${f(x + Math.cos(i * .785) * (s / 2 - 3))},${f(y + Math.sin(i * .785) * (s / 2 - 3))}" stroke="#fffbe0" stroke-width="1"/>`).join('')}
        <circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2 - 3.5)}" fill="none" stroke="#f3dc66" stroke-width="1" opacity=".6"/>`;
}
// グラタンの表面（切り抜いた形の中に、焦げ色と泡）
function xfrGratin(p, d, box, { c = '#efcf7a', brown = '#b8651c', seed = 1, n = 9, bubbles = 14, blur = 4, op = .75 } = {}){
    const R = rng(p.id + 'xgr' + seed);
    const clip = p.def('xgc' + seed, id => `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    const [bx, by, bw, bh] = box;
    let sp = '', bb = '';
    for (let i = 0; i < n; i++) sp += `<ellipse cx="${f(bx + R() * bw)}" cy="${f(by + R() * bh)}" rx="${f(6 + R() * 12)}" ry="${f(4 + R() * 7)}" fill="${brown}" opacity="${f(op * (.5 + R() * .5))}"/>`;
    for (let i = 0; i < bubbles; i++){ const cx = bx + R() * bw, cy = by + R() * bh, rr = 1.2 + R() * 2.4; bb += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="none" stroke="${dk(brown, .25)}" stroke-width=".7" opacity=".5"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .3)}" r="${f(rr * .35)}" fill="#fff" opacity=".6"/>`; }
    return `<g ${p.sh(1)}><path d="${d}" fill="${p.g(c, .25, .25)}"/></g><g clip-path="url(#${clip})"><g ${xfrBlur(p, blur)}>${sp}</g>${bb}</g>`;
}
// ムール貝（開いた殻に橙の身 / 閉じた黒い殻）
function xfrMussel(p, x, y, s, r = 0, { open = true } = {}){
    const shell = 'M-15,-1 C-11,-6 0,-9 8,-7 C14,-5 16,0 14,4 C11,8 2,9 -5,7 C-11,5 -15,2 -15,-1Z';
    if (!open) return `<g ${T(x, y, r, s / 30)}><path d="${shell}" fill="${p.g('#2f384c', .3, .3)}" stroke="#141820" stroke-width=".9"/>
        <path d="M-12,0 C-6,-5 4,-6 12,-2 M-10,3 C-3,-1 6,-1 13,2" stroke="#56627a" stroke-width=".8" fill="none" opacity=".8"/>
        <path d="M-9,-4 Q0,-8 8,-5.6" stroke="#cfd8f0" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
    return `<g ${T(x, y, r, s / 30)}><path d="${shell}" fill="#1c2130" stroke="#0e1118" stroke-width=".9"/>
        <path d="${shell}" transform="translate(.6 .3) scale(.84)" fill="${p.g('#cfd6e2', .35, .2)}"/>
        <path d="M-9,0 C-6,-4 1,-6 7,-4.6 C11,-3 12,0 10.6,2.6 C8,5.4 1,6 -4,4.6 C-8,3.4 -9.6,1.6 -9,0Z" fill="${p.g('#f0913a', .3, .25)}" stroke="#a8521c" stroke-width=".6"/>
        <path d="M-7,2.6 C-2,5 5,4.6 9.6,2" stroke="#7a3a14" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M-5,-2.2 Q1,-4.6 6,-3" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// じゃがいもの薄い輪切り（グラタン・サルラデーズ）
function xfrPotSlice(p, x, y, s, r = 0, { c = '#f2d47e', edge = '#c8862c', seed = 1 } = {}){
    const R = rng(p.id + 'xps' + seed + x + y);
    const pts = ring(s / 2, 9, .12, R, 1.15, .9);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .8)}" fill="${p.rg(c, .2, .1, .4, .4)}" stroke="${edge}" stroke-width="${f(Math.max(1, s * .08))}"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// フライドポテト（1本）
function xfrFry(p, x, y, L, r = 0, { w = 7, c = '#f0c25a' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="1.6" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-L * .4)},${f(-w * .2)} L${f(L * .3)},${f(-w * .2)}" stroke="#fff3c8" stroke-width="1.1" stroke-linecap="round" opacity=".8"/></g>`;
}
// ヒヨコ豆
function xfrChickpea(p, x, y, s){
    return `<g ${p.sh(.4)}><circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${p.rg('#e6bc72', .3, .3, .36, .34)}" stroke="#a8782e" stroke-width=".5"/></g><path d="M${f(x + s * .1)},${f(y - s * .42)} q${f(s * .14)},${f(s * .2)} ${f(s * .05)},${f(s * .36)}" stroke="#b8863a" stroke-width=".7" fill="none"/>`;
}
// 黒オリーブ
function xfrOlive(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .4)}" fill="${p.rg('#3a2a36', .25, .3, .35, .32)}" stroke="#1a1218" stroke-width=".5"/></g><ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .14)}" ry="${f(s * .07)}" fill="#fff" opacity=".6"/></g>`;
}
// 豆（えんどう・フラジョレ）。1粒ずつ: 丸か、腎臓形
function xfrPea(p, x, y, s, { c = '#6fae3a' } = {}){
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${p.rg(c, .35, .3, .36, .34)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`;
}
function xfrKidney(p, x, y, s, r = 0, { c = '#bccb8a', hl = true, simple = false } = {}){
    if (simple) return `<ellipse ${T(x, y, r)} rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${p.g(c, .35, .28)}" stroke="${dk(c, .32)}" stroke-width=".5"/>`;
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2)},0 C${f(-s / 2)},${f(-s * .36)} ${f(s * .4)},${f(-s * .4)} ${f(s / 2)},${f(-s * .04)} C${f(s * .56)},${f(s * .3)} ${f(s * .1)},${f(s * .32)} 0,${f(s * .16)} C${f(-s * .1)},${f(s * .34)} ${f(-s / 2)},${f(s * .3)} ${f(-s / 2)},0Z" fill="${p.g(c, .35, .28)}" stroke="${dk(c, .32)}" stroke-width=".5"/>
        ${hl ? `<path d="M${f(-s * .3)},${f(-s * .14)} Q0,${f(-s * .28)} ${f(s * .26)},${f(-s * .16)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/>` : ''}</g>`;
}


// ---------- スープの部品 ----------
// クレソンの小枝（丸い小葉）
function xfrCress(p, x, y, L, r = 0){
    const lv = [[-.36, -1], [-.16, 1], [.06, -1], [.26, 1], [.46, 0]].map(([t, sd], i) => `<ellipse cx="${f(L * t)}" cy="${f(sd * L * .12)}" rx="${f(L * (i === 4 ? .16 : .12))}" ry="${f(L * (i === 4 ? .13 : .1))}" fill="${p.g('#3f8a2c', .3, .25)}" stroke="#2a5e1c" stroke-width=".5"/>`).join('');
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 L${f(L * .44)},0" stroke="#6a9a3a" stroke-width="1.2"/>${lv}</g>`;
}
// アスパラガスの穂先
function xfrAsp(p, x, y, L, r = 0, { c = '#6a9a3a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f(-L / 2)},-3 L${f(L * .2)},-3.4 Q${f(L * .5)},-4 ${f(L / 2)},0 Q${f(L * .5)},4 ${f(L * .2)},3.4 L${f(-L / 2)},3 Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        ${[.2, .3, .4].map(t => `<path d="M${f(L * t)},-3.4 l${f(L * .06)},2.2 M${f(L * t)},3.4 l${f(L * .06)},-2.2" stroke="${dk(c, .3)}" stroke-width=".7" fill="none"/>`).join('')}
        <path d="M${f(-L * .2)},0 l2,-2.4 M${f(-L * .02)},0 l2,2.4" stroke="${dk(c, .25)}" stroke-width=".7"/>
        <path d="M${f(-L * .42)},-1.6 L${f(L * .1)},-1.8" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}
// 汁に浮いた油の粒
function xfrOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'xoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 白い卵の糸（トゥラン・ブイヨン）
function xfrEggWhite(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xew' + seed + x + y);
    const pts = ring(L / 2, 13, .5, R, 1, .4);
    return `<g ${T(x, y, r)}><g ${p.rough(3, .16)}><path d="${smooth(pts, true, .9)}" fill="#fbf8ee" opacity=".9" stroke="#e8e0c8" stroke-width=".6"/></g></g>`;
}
// 削ったチーズ（パルメザンの薄片）
function xfrShaving(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2)},0 Q${f(-s * .2)},${f(-s * .34)} ${f(s / 2)},${f(-s * .1)} Q${f(s * .1)},${f(s * .2)} ${f(-s / 2)},0Z" fill="${p.g('#f6e6b0', .3, .2)}" stroke="#d2b672" stroke-width=".5"/></g>`;
}

// =========================================================
// 料理
// =========================================================
const XFR = {
    // 牛肉の赤ワイン煮（凪案）: 藍のホーロー鍋に、ソースをやや明るい赤褐色にして牛肉を大きく少なめに、にんじん・薄切り玉ねぎ・ラルドン・マッシュルームを大きく明るく見せる（材料にない小玉ねぎ・パセリは描かない）
    fr_bourguignon: p => {
        const beef = xfrSpots('bourg', 7, 46, 36);
        return [
            xfrCocotte(p, { c: '#2c4c7c', inside: '#2a1a16' }),
            K.liquid(p, { R: 75, c: '#7a2820', op: 1, shine: false }),
            `<g ${p.edge('#e6a888', .8, .55)}><g ${p.sh(1.2)}>`, ...beef.map(([x, y, r], i) => xfrBeef(p, x, y, 38 + (i % 3) * 2, r, { c: i % 2 ? '#94502e' : '#a05a36' })), `</g></g>`,
            `<g ${p.edge('#7a2a08', .8, .5)}>`,
            ...[[54, 82], [144, 70], [100, 144], [66, 128], [138, 128], [104, 56], [152, 106]].map(([x, y]) => K.carrotRound(p, x, y, 20, { c: '#f27a1c' })),
            `</g>`,
            `<g ${p.sh(.6)}>`,
            ...[[78, 62, 20], [128, 98, -30], [60, 150, 60], [148, 144, 120]].map(([x, y, r]) => xfrMush(p, x, y, 24, r, { c: '#c8a070' })),
            ...[[116, 76, 30], [70, 100, -20], [120, 154, 70], [88, 90, 0]].map(([x, y, r]) => xfrLardon(p, x, y, 13, r, { c: '#b45a3a' })),
            `</g>`,
            `<g ${p.edge('#8a5a1c', .6, .5)}>`, ...[[110, 118, 20], [58, 62, -40], [138, 156, 80], [160, 124, 130], [86, 126, -10]].map(([x, y, r]) => K.onion(p, x, y, 22, r, { c: '#e8b878' })), `</g>`,
            xfrShine(100, 100, 74, .3),
        ].join('');
    },

    // ブランケット・ド・ヴォー: 白い深皿の左にご飯、右に白いクリームソースで煮た仔牛（白っぽい）、マッシュルーム、にんじん、小玉ねぎ
    fr_blanquette: p => {
        const veal = [[124, 74], [146, 104], [112, 128], [140, 140], [96, 98], [118, 102], [158, 78]];
        return [
            xfrSoupPlate(p, { band: '#c9a24a', well: .78 }),
            xfrRice(p, 62, 102, 66, { sy: 1.25, seed: 1 }),
            `<g ${p.sh(.8)}><path d="M86,42 C126,32 172,52 170,100 C170,148 130,170 92,160 C82,140 84,120 90,100 C94,80 80,60 86,42Z" fill="${p.rg('#f2e6c6', .25, .14)}" stroke="#d9c49a" stroke-width=".7"/></g>`,
            `<g ${p.sh(.7)}>`, ...veal.map(([x, y], i) => xfrBeef(p, x, y, 26, i * 47, { c: '#d9b88c', seed: i })), `</g>`,
            `<g ${p.sh(.5)}>`,
            ...[[110, 56], [154, 124], [96, 146], [132, 90], [104, 78]].map(([x, y]) => K.carrotRound(p, x, y, 13, { c: '#ef8a38' })),
            ...[[138, 58, -20], [126, 154, 30], [160, 98, 80], [98, 118, -10]].map(([x, y, r]) => xfrMush(p, x, y, 18, r, { c: '#efe2c8', cooked: false })),
            `</g>`,
            xfrPearl(p, 150, 118, 11, { c: '#f4e8c8' }), xfrPearl(p, 118, 44, 10, { c: '#f4e8c8' }),
            K.glaze(p, 128, 100, 70, '#f6ecd0', { seed: 3, op: .5 }),
            xfrHerbs(p, 128, 100, 70, { n: 12 }),
        ].join('');
    },

    // 鶏の丸焼き: 楕円の焼き皿に、こんがりした丸鶏、まわりにじゃがいも、玉ねぎ、皮つきにんにく、レモン、タイム、焼き汁
    fr_pouletroti: p => {
        const c = '#c47426', k = .92;
        const R = rng('xfrpr');
        let spots = '';
        for (let i = 0; i < 10; i++) spots += `<ellipse cx="${f((R() - .5) * 60)}" cy="${f((R() - .5) * 70)}" rx="${f(4 + R() * 7)}" ry="${f(3 + R() * 5)}" fill="#7a3e12" opacity="${f(.25 + R() * .25)}"/>`;
        const side = s => `<g transform="scale(${s} 1)">
            <path d="M-30,-24 C-46,-28 -50,-8 -42,4 C-38,8 -33,4 -31,-4Z" fill="${p.g(dk(c, .06), .3, .3)}" stroke="${dk(c, .45)}" stroke-width=".9"/>
            <path d="M-14,10 C-36,6 -42,28 -34,40 C-28,48 -16,46 -12,36 C-8,28 -6,16 -14,10Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .45)}" stroke-width=".9"/>
            <path d="M-26,38 C-24,48 -20,54 -14,57 C-10,58 -8,55 -10,51 C-13,45 -14,40 -16,35Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .45)}" stroke-width=".9"/>
            <ellipse cx="-12" cy="57" rx="3.6" ry="2.8" fill="#f3ead8" stroke="#c9b89a" stroke-width=".6"/>
            <path d="M-30,18 Q-26,12 -20,12" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
        return [
            K.ovalDish(p, { rx: 95, ry: 80, base: '#f6f1e6', rim: '#7a4a2a', deep: true }),
            K.pool(p, 100, 104, 150, '#c8862e', { op: .85, seed: 1, sy: .72 }),
            `<g ${p.sh(.8)}>`,
            ...[[40, 76, 0], [36, 118, 40], [58, 146, 80], [160, 76, 20], [164, 120, -30], [142, 148, 60], [100, 160, 10], [66, 54, -40], [134, 52, 70]].map(([x, y, r], i) => xfrSpud(p, x, y, 26 - (i % 3) * 2, r, { c: '#eab85a', browned: 1, seed: i })),
            `</g>`,
            `<g ${p.sh(1.6)}><g ${T(100, 98, 0, k)}>${side(1)}${side(-1)}<path d="M0,-46 C22,-46 36,-28 36,-4 C36,20 22,38 0,40 C-22,38 -36,20 -36,-4 C-36,-28 -22,-46 0,-46Z" fill="${p.g(c, .38, .3)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g></g>`,
            `<g ${T(100, 98, 0, k)}><g ${xfrBlur(p, 2.5)}>${spots}</g>
                <path d="M0,-42 Q2,-4 0,34" stroke="${dk(c, .35)}" stroke-width="1.6" fill="none" opacity=".4"/>
                <path d="M-24,-26 Q-14,-40 0,-40" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>
                <path d="M8,-36 Q20,-34 26,-24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>
                <path d="M-26,-6 Q-24,6 -18,14" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4"/></g>`,
            K.sprinkle(p, 100, 98, 60, { c: '#5a3010', n: 16, r: .6 }),
            K.onion(p, 150, 100, 22, 90, { c: '#d9a456', layers: 3 }), K.onion(p, 50, 100, 22, -90, { c: '#d9a456', layers: 3 }),
            xfrGarlic(p, 82, 160, 13, 20), xfrGarlic(p, 120, 46, 12, -30), xfrGarlic(p, 150, 128, 12, 60),
            xfrLemonHalf(p, 166, 98, 22),
            xfrThyme(p, 60, 128, 26, -30), xfrThyme(p, 142, 70, 24, 40),
        ].join('');
    },

    // プール・オ・リ: 灰青の鉢に、ご飯、ゆでた鶏もも2本（皮が白っぽい）、白いソース・シュプレーム、にんじん、ポロねぎ
    fr_pouleriz: p => [
        K.bowl(p, { glaze: '#5d7f98', inside: '#f3eee2' }),
        xfrRice(p, 100, 100, 152, { seed: 2, n: 170 }),
        `<g ${p.sh(.8)}><path d="${smooth(ring(46, 11, .25, rng('xfrpr2'), 1.25, .9).map(([a, b]) => [a + 100, b + 102]))}" fill="${p.rg('#f3e6c4', .25, .14)}" opacity=".95"/></g>`,
        xfrThigh(p, 82, 92, 66, -25, { c: '#e8c88e', seed: 1, spotsOp: .2 }),
        xfrThigh(p, 120, 116, 64, 160, { c: '#e4c286', seed: 2, spotsOp: .2 }),
        `<path d="M70,118 Q84,108 100,114 T130,96" stroke="#f6ecd2" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[48, 80, 70], [150, 74, -30], [62, 140, 20], [146, 142, 60], [104, 54, 10]].map(([x, y, r]) => xfrCarrotStick(p, x, y, 26, 8, r)),
        ...[[66, 54], [140, 52], [44, 114], [158, 108], [110, 156], [86, 150]].map(([x, y]) => xfrLeekRing(p, x, y, 15)),
        `</g>`,
        xfrHerbs(p, 100, 100, 100, { n: 16 }),
    ].join(''),

    // 豚のロースト: 長皿に、たこ糸で縛った焼き色のロースト、切り分けた3枚、小さなじゃがいも、にんじん、玉ねぎ、焼き汁、ローズマリー
    fr_rotiporc: p => {
        const L = 118, W = 50, c = '#b8742f';
        let strings = '';
        for (let i = 0; i < 5; i++){ const t = -L * .36 + i * L * .18; strings += `<path d="M${f(t - 2)},${-W / 2 + 1} Q${f(t + 3)},0 ${f(t - 2)},${W / 2 - 1}" stroke="#7a4a1a" stroke-width="2.6" fill="none" opacity=".35" transform="translate(1 1)"/><path d="M${f(t - 2)},${-W / 2 + 1} Q${f(t + 3)},0 ${f(t - 2)},${W / 2 - 1}" stroke="#f6efe0" stroke-width="1.8" fill="none"/>`; }
        const R = rng('xfrrp');
        let spots = '';
        for (let i = 0; i < 8; i++) spots += `<ellipse cx="${f((R() - .5) * L * .8)}" cy="${f((R() - .5) * W * .6)}" rx="${f(5 + R() * 8)}" ry="${f(3 + R() * 4)}" fill="#6a3410" opacity="${f(.3 + R() * .2)}"/>`;
        const slice = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="22" ry="17" fill="${p.g('#a8642a', .3, .3)}" stroke="#6a3a14" stroke-width=".7"/></g><ellipse cx="-.5" cy="-.5" rx="19" ry="14" fill="${p.rg('#f2dccb', .3, .12)}"/><path d="M-18,6 Q0,15 18,6" stroke="#f8efe0" stroke-width="2.4" fill="none" opacity=".9"/><path d="M-12,-6 Q-2,-10 8,-8" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
        return [
            K.longPlate(p, { w: 188, h: 150, base: '#f7f3ea', rim: '#9a7a5a' }),
            K.pool(p, 98, 104, 150, '#9a5a22', { op: .55, seed: 2, sy: .7 }),
            `<g ${p.sh(.7)}>`,
            ...[[34, 60], [34, 140], [166, 140], [156, 60], [168, 98]].map(([x, y], i) => xfrSpud(p, x, y, 24, i * 40, { c: '#e8b85a', browned: .8, seed: i })),
            ...[[60, 150, 30], [140, 52, -20], [170, 118, 80]].map(([x, y, r]) => K.carrotChunk(p, x, y, 18, r)),
            `</g>`,
            `<g ${p.sh(1.6)}><g ${T(90, 82, -8)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${W / 2 - 2}" fill="${p.g(c, .35, .35)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g></g>`,
            `<g ${T(90, 82, -8)}><g ${xfrBlur(p, 2.5)}>${spots}</g>${strings}<path d="M${-L * .4},${-W * .3} L${L * .38},${-W * .3}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/></g>`,
            slice(78, 132, -6), slice(106, 136, 4), slice(134, 128, 12),
            K.onion(p, 52, 108, 20, -40, { c: '#d9a456', layers: 3 }), K.onion(p, 160, 80, 18, 50, { c: '#d9a456', layers: 3 }),
            xfrRosemary(p, 58, 50, 34, 10), xfrThyme(p, 122, 50, 26, -10),
            xfrGarlic(p, 44, 86, 11, 30),
        ].join('');
    },

    // タルティフレット: 茶色い陶器の楕円焼き皿に、じゃがいも・ラルドン・玉ねぎのクリーム、上に半月のルブロションがとろけて焼き色
    fr_tartiflette: p => {
        const d = 'M24,100 C24,58 60,38 100,38 C140,38 176,58 176,100 C176,142 140,162 100,162 C60,162 24,142 24,100Z';
        const reb = (x, y, sz, r, seed) => {
            const R = rng(p.id + 'reb' + seed);
            const pts = ring(sz / 2, 12, .22, R, 1.2, .8);
            let bl = '';
            for (let i = 0; i < 6; i++) bl += `<ellipse cx="${f((R() - .5) * sz * .7)}" cy="${f((R() - .5) * sz * .4)}" rx="${f(3 + R() * 6)}" ry="${f(2 + R() * 4)}" fill="#9a4a12" opacity="${f(.35 + R() * .3)}"/>`;
            return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="#fbe8a8" opacity=".95"/>
                <g ${p.sh(.7)}><path d="${smooth(pts.map(([a, b]) => [a * .74, b * .72]))}" fill="${p.g('#df9a44', .3, .3)}" stroke="#a8641e" stroke-width=".7"/></g>
                <path d="${smooth(pts.map(([a, b]) => [a * .56, b * .52]))}" fill="none" stroke="#fbeed2" stroke-width="1.6" stroke-dasharray="1.2 2.6" opacity=".8"/>
                <g ${xfrBlur(p, 2)}>${bl}</g>
                <path d="M${f(-sz * .26)},${f(-sz * .12)} Q${f(-sz * .1)},${f(-sz * .24)} ${f(sz * .1)},${f(-sz * .2)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
        };
        return [
            xfrOvalBaker(p, { c: '#6e3e22', inside: '#e8d2a8', rx: 90, ry: 76 }),
            xfrGratin(p, d, [24, 38, 152, 124], { c: '#efd08a', brown: '#b8651c', seed: 1, n: 10, bubbles: 10 }),
            `<g ${p.sh(.6)}>`,
            ...xfrSpots('tarti', 12, 60, 18, 100, 100, .82).map(([x, y, r], i) => i % 2 ? xfrSpud(p, x, y, 18, r, { c: '#edc66e', browned: .7, seed: i }) : xfrLardon(p, x, y, 11, r, { c: '#a84c32' })),
            `</g>`,
            ...[[58, 66, 20], [140, 140, 200], [70, 140, 160], [134, 64, -20]].map(([x, y, r]) => xfrOnionStrip(p, x, y, 16, r, { c: '#e8c27a' })),
            reb(76, 88, 64, -20, 1), reb(128, 92, 60, 25, 2), reb(100, 128, 62, 5, 3),
            K.sprinkle(p, 100, 100, 120, { c: '#3a2410', n: 18, r: .6 }),
            xfrHerbs(p, 100, 100, 110, { n: 12 }),
        ].join('');
    },

    // トマトのファルシ: テラコッタの焼き皿に、ふたをのせて焼いたトマト6個、まわりにトマトの汁を吸ったご飯
    fr_tomatesfarcies: p => {
        const tom = (x, y, s, r) => {
            const R = rng(p.id + 'tom' + x);
            const pts = ring(s / 2, 10, .1, R);
            return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.rg('#d8321e', .25, .3, .38, .36)}" stroke="#8e1e10" stroke-width=".8"/></g>
                <path d="M${f(-s * .38)},${f(s * .1)} Q${f(-s * .2)},${f(s * .3)} ${f(s * .06)},${f(s * .4)} M${f(s * .3)},${f(-s * .2)} Q${f(s * .4)},${f(s * .02)} ${f(s * .34)},${f(s * .2)}" stroke="#8e1e10" stroke-width="1" fill="none" opacity=".5"/>
                <ellipse cx="${f(s * .02)}" cy="${f(s * .08)}" rx="${f(s * .32)}" ry="${f(s * .3)}" fill="${p.g('#7a3e22', .2, .3)}"/>
                <path d="M${f(-s * .12)},${f(s * .14)} l2,1 M${f(s * .1)},${f(s * .2)} l2,-1 M${f(s * .16)},${f(s * .02)} l1,2" stroke="#5a2a12" stroke-width="2" stroke-linecap="round" opacity=".6"/>
                <g ${p.sh(.6)}><ellipse cx="${f(-s * .08)}" cy="${f(-s * .06)}" rx="${f(s * .34)}" ry="${f(s * .3)}" fill="${p.rg('#e2402a', .3, .25, .38, .36)}" stroke="#9a2414" stroke-width=".7"/></g>
                <path d="M${f(-s * .08)},${f(-s * .06)} l-6,-2 M${f(-s * .08)},${f(-s * .06)} l5,-4 M${f(-s * .08)},${f(-s * .06)} l4,4 M${f(-s * .08)},${f(-s * .06)} l-3,5" stroke="#3f6a22" stroke-width="2" stroke-linecap="round"/>
                <path d="M${f(-s * .34)},${f(-s * .2)} Q${f(-s * .26)},${f(-s * .38)} ${f(-s * .06)},${f(-s * .38)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
                <ellipse cx="${f(s * .22)}" cy="${f(s * .22)}" rx="${f(s * .1)}" ry="${f(s * .06)}" fill="#3a1a0a" opacity=".35"/></g>`;
        };
        return [
            xfrOvalBaker(p, { c: '#b65a2a', inside: '#e8c69a', rx: 90, ry: 76 }),
            `<ellipse cx="100" cy="100" rx="78" ry="64" fill="${p.rg('#d8783a', .2, .25)}"/>`,
            xfrGrains(p, 100, 100, 154, { cols: ['#f2b67a', '#e89a5a', '#f8d2a2'], n: 120, rx: 2.8, ry: 1.2, sy: .82, rot: true, seed: 3 }),
            ...[[60, 76, 46, 0], [104, 70, 46, 60], [146, 80, 44, 130], [56, 126, 44, 200], [100, 132, 46, 280], [144, 124, 44, 40]].map(([x, y, s, r]) => tom(x, y, s, r)),
            ...[[80, 100, 30], [124, 102, 26]].map(([x, y, s], i) => K.glaze(p, x, y, s, '#c8401e', { seed: i + 4, op: .4 })),
            xfrHerbs(p, 100, 100, 140, { n: 24 }),
        ].join('');
    },

    // クロックムッシュ: 白い皿に、対角に切ったクロックムッシュ（焼き色のついたチーズとベシャメル、断面にハムとチーズ）、グリーンサラダ
    fr_croque: p => {
        const half = (dx, dy, flip) => {
            const tri = flip ? 'M-46,-46 L46,-46 L46,46Z' : 'M-46,-46 L46,46 L-46,46Z';
            const cut = 'M-44,-44 L44,44';
            return `<g ${T(84 + dx, 108 + dy, 6)}><g ${p.sh(1.4)}><path d="${tri}" fill="#c98a3a" stroke="#9a5e1e" stroke-width="5" stroke-linejoin="round"/></g>
                ${xfrGratin(p, tri, [-46, -46, 92, 92], { c: '#efc062', brown: '#a85414', seed: flip ? 2 : 3, n: 11, bubbles: 10, op: .9 })}
                <path d="${cut}" stroke="#f6e8c8" stroke-width="5" stroke-linecap="round"/><path d="${cut}" stroke="#f0a0a0" stroke-width="2" transform="translate(${flip ? 1.4 : -1.4} ${flip ? -1.4 : 1.4})"/><path d="${cut}" stroke="#f6d24a" stroke-width="1.2" transform="translate(${flip ? -1 : 1} ${flip ? 1 : -1})"/></g>`;
        };
        return [
            K.plate(p, { rim: '#3c6a9a' }),
            xfrLettuce(p, 150, 54, 44, 30, { seed: 1, c: '#8cc652' }), xfrLettuce(p, 160, 76, 36, -40, { seed: 2, c: '#b6dc6c' }), xfrLettuce(p, 136, 42, 32, 70, { seed: 3, c: '#7fbf4a' }),
            half(-9, 9, false), half(9, -9, true),
            K.sprinkle(p, 92, 104, 100, { c: '#3a2410', n: 16, r: .6 }),
        ].join('');
    },

    // シュークルート: 白い楕円の大皿に、薄い金色のザワークラウト、ストラスブール・ソーセージ、モンベリアール・ソーセージの輪切り、燻製の豚ばら、ゆでじゃがいも、ねずの実
    fr_choucroute: p => {
        const belly = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="-26" y="-15" width="52" height="30" rx="4" fill="#f1dccb" stroke="#b88a6a" stroke-width=".7"/></g>
            <rect x="-26" y="-15" width="52" height="7" rx="3" fill="${p.g('#a85a2a', .3, .3)}"/>
            <rect x="-25" y="-6" width="50" height="8" fill="${p.g('#d98a8a', .2, .2)}"/><rect x="-25" y="5" width="50" height="7" fill="${p.g('#cf7f7a', .2, .2)}"/>
            <path d="M-22,-11 L20,-11" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></g>`;
        return [
            K.ovalDish(p, { rx: 95, ry: 80, base: '#f7f3ea', rim: '#3c5a8a', deep: true }),
            `<g ${p.sh(1)}><path d="${smooth(ring(66, 12, .12, rng('xfrcc'), 1.1, .82).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#e6d48e', .25, .2)}"/></g>`,
            K.shreds(p, 100, 100, 130, { c: '#ead894', n: 66, w: 2, len: .28, seed: 1, curve: .7 }),
            K.shreds(p, 100, 100, 110, { c: '#d8c070', n: 30, w: 1.6, len: .3, seed: 2, curve: .7 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2a44', n: 10, r: 1.6 }),
            belly(70, 74, -12),
            xfrSausage(p, 100, 108, 104, 15, 22, { c: '#e2946a', bend: 3 }),
            xfrSausage(p, 92, 128, 98, 14, 18, { c: '#dc8a62', bend: 3 }),
            xfrSausageSlice(p, 140, 72, 24, 10, { skin: '#7a3e22', meat: '#d0806a' }), xfrSausageSlice(p, 152, 96, 22, -30, { skin: '#7a3e22', meat: '#d0806a' }), xfrSausageSlice(p, 122, 58, 22, 40, { skin: '#7a3e22', meat: '#d0806a' }),
            xfrSpud(p, 40, 106, 30, 10, { c: '#efd690', seed: 1 }), xfrSpud(p, 160, 128, 30, -20, { c: '#efd690', seed: 2 }), xfrSpud(p, 130, 150, 26, 40, { c: '#efd690', seed: 3 }),
            xfrHerbs(p, 50, 106, 20, { n: 6 }), xfrHerbs(p, 158, 126, 20, { n: 6 }),
        ].join('');
    },

    // オムレツ・ペイザンヌ: 鉄のフライパンに、平たく焼いた卵、角切りのじゃがいも、ラルドン、玉ねぎ、溶けたチーズ、シブレット
    fr_omelette: p => {
        const d = smooth(ring(68, 14, .05, rng('xfrom')).map(([a, b]) => [a + 100, b + 100]));
        return [
            xfrSkillet(p, { R: 82 }),
            xfrGratin(p, d, [32, 32, 136, 136], { c: '#f3c84a', brown: '#c47a1c', seed: 1, n: 12, bubbles: 0, op: .6 }),
            `<path d="${d}" fill="none" stroke="#c8892a" stroke-width="2.4" opacity=".7"/>`,
            `<g ${p.sh(.5)}>`,
            ...xfrSpots('omel', 22, 56, 15).map(([x, y, r], i) => i % 3 === 2 ? xfrLardon(p, x, y, 10, r, { c: '#b04e32' }) : xfrDice(p, x, y, 11, r, i % 3 ? '#f0d48a' : '#e9c36a')),
            `</g>`,
            ...[[70, 80, 20], [128, 120, 200], [118, 70, 80]].map(([x, y, r]) => xfrOnionStrip(p, x, y, 14, r, { c: '#e8c27a' })),
            K.shreds(p, 100, 100, 90, { c: '#f8e7a0', n: 14, w: 1.6, len: .3, seed: 3, curve: .5 }),
            xfrChives(p, 100, 100, 120, { n: 26 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 18, r: .55 }),
            `<path d="M52,74 Q62,50 88,40" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        ].join('');
    },
    // ガレット・コンプレット: 白い皿に、そば粉のガレットを四角に折り、真ん中に目玉焼き、ハム、溶けたエメンタール
    fr_galette: p => {
        const R = rng('xfrgal');
        const outer = 'M-62,-66 L62,-66 Q66,-66 66,-62 L66,62 Q66,66 62,66 L-62,66 Q-66,66 -66,62 L-66,-62 Q-66,-66 -62,-66Z';
        const hole = 'M-40,-40 Q0,-24 40,-40 Q24,0 40,40 Q0,24 -40,40 Q-24,0 -40,-40Z';
        let lace = '';
        for (let i = 0; i < 16; i++) lace += `<ellipse cx="${f((R() - .5) * 124)}" cy="${f((R() - .5) * 124)}" rx="${f(4 + R() * 9)}" ry="${f(3 + R() * 6)}" fill="${R() < .6 ? '#6e3a16' : '#d9a066'}" opacity="${f(.35 + R() * .3)}"/>`;
        let dots = '';
        for (let i = 0; i < 40; i++) dots += `M${f((R() - .5) * 126)},${f((R() - .5) * 126)}h.1`;
        return [
            K.plate(p, { rim: '#2c4c7c' }),
            `<g ${T(100, 100, 6, .9)}>`,
            `<g ${p.sh(1.6)}><path d="${outer}" fill="${p.g('#a8683a', .3, .3)}" stroke="#6e3e1a" stroke-width="1"/></g>`,
            `<g ${xfrBlur(p, 3)}>${lace}</g>`,
            `<path d="${dots}" stroke="#5a2e10" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>`,
            `<path d="M-66,-66 L-40,-40 M66,-66 L40,-40 M66,66 L40,40 M-66,66 L-40,40" stroke="#6e3e1a" stroke-width="1.2" opacity=".5"/>`,
            `<path d="${hole}" fill="${p.rg('#e9a2a0', .2, .2)}"/>`,
            `<path d="M-34,-30 Q-10,-38 20,-32 Q34,-20 30,6 Q36,30 10,32 Q-20,36 -32,20 Q-38,-6 -34,-30Z" fill="#f6d872" opacity=".95"/>`,
            `<path d="M-30,-26 Q-8,-32 16,-28" stroke="#fff3c0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`,
            K.friedEgg(p, 2, 2, 46, 20),
            `<path d="${hole}" fill="none" stroke="#7a4218" stroke-width="2.6" stroke-linejoin="round"/>`,
            `<path d="${hole}" fill="none" stroke="#d9a060" stroke-width="1" transform="translate(-1.4 -1.4)" opacity=".8"/>`,
            `<path d="M-60,-58 L50,-62" stroke="#f0c890" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,
            `</g>`,
            K.sprinkle(p, 102, 102, 40, { c: '#2a2420', n: 10, r: .55 }),
        ].join('');
    },

    // タラのパピヨット: 白い皿に、開いたクッキングシート、千切りのズッキーニとにんじんの上にタラの切り身、ミニトマト、レモンの輪切り、ディル
    fr_papillote: p => {
        const R = rng('xfrpap');
        const paper = smooth(Array.from({ length: 26 }, (_, i) => { const a = i / 26 * 6.28, rr = (i % 2 ? 1 : .94) * (1 - R() * .05); return [100 + Math.cos(a) * 86 * rr, 100 + Math.sin(a) * 74 * rr]; }), true, .7);
        const lemonSlice = (x, y, s) => `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="#efc52a"/></g><circle cx="${x}" cy="${y}" r="${s / 2 - 1.6}" fill="#fbf0a8"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${x},${y} L${f(x + Math.cos(i * .785) * (s / 2 - 2.4))},${f(y + Math.sin(i * .785) * (s / 2 - 2.4))}" stroke="#fffbe2" stroke-width=".9"/>`).join('')}`;
        const tomHalf = (x, y, s) => `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#e2382a', .25, .25)}" stroke="#a51f17" stroke-width=".6"/></g><circle cx="${x}" cy="${y}" r="${f(s * .34)}" fill="#f2725a"/><path d="M${x - s * .2},${y} Q${x - s * .1},${y - s * .14} ${x},${y} M${x},${y} Q${x + s * .1},${y + s * .14} ${x + s * .2},${y}" stroke="#f6d070" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
        let flakes = '';
        for (let i = 0; i < 6; i++){ const t = -40 + i * 16; flakes += `M${t},-15 Q${t + 6},0 ${t},15 `; }
        return [
            K.plate(p, { rim: '#9aa6ae' }),
            `<g ${p.sh(1.4)}><path d="${paper}" fill="${p.rg('#f2e8d2', .25, .18)}" stroke="#cdbb98" stroke-width="1"/></g>`,
            `<path d="${paper}" fill="none" stroke="#d6b88a" stroke-width="7" opacity=".55" transform="translate(100 100) scale(.92) translate(-100 -100)"/>`,
            `<path d="${paper}" fill="none" stroke="#fffaf0" stroke-width="2" opacity=".8" transform="translate(100 100) scale(.88) translate(-100 -100)"/>`,
            `<ellipse cx="100" cy="102" rx="66" ry="54" fill="${p.rg('#ecd690', .2, .2)}" opacity=".85"/>`,
            `<g ${p.sh(.5)}>`, K.shreds(p, 100, 102, 120, { c: '#5a9a34', n: 30, w: 2.6, len: .32, seed: 1, curve: .3 }), K.shreds(p, 100, 102, 116, { c: '#ec7b2d', n: 24, w: 2.4, len: .32, seed: 2, curve: .3 }), K.shreds(p, 100, 102, 110, { c: '#c9dc90', n: 14, w: 2.4, len: .3, seed: 3, curve: .3 }), `</g>`,
            `<g ${T(96, 100, -12)}><g ${p.sh(1.4)}><rect x="-52" y="-24" width="104" height="48" rx="20" fill="${p.g('#f8f4ea', .3, .16)}" stroke="#d9cfba" stroke-width=".8"/></g>
                <path d="${flakes}" stroke="#ddd2bc" stroke-width="1.2" fill="none" opacity=".9"/>
                <path d="M-42,-14 Q0,-24 40,-14" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>
                <rect x="-52" y="-24" width="104" height="48" rx="20" fill="none" stroke="#f0d68a" stroke-width="2.4" opacity=".5"/></g>`,
            lemonSlice(84, 96, 24), lemonSlice(112, 100, 22),
            tomHalf(46, 120, 16), tomHalf(150, 86, 16), tomHalf(140, 136, 15), tomHalf(60, 72, 15), tomHalf(126, 60, 14),
            xfrDill(p, 96, 110, 30, -20), xfrDill(p, 108, 88, 24, 40), xfrThyme(p, 66, 138, 22, 30),
            K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 14, r: .55 }),
            K.sprinkle(p, 100, 100, 110, { c: '#fff8d0', n: 12, r: 1 }),
        ].join('');
    },

    // サーモンのタリアテッレ: 白い皿に、平たいタリアテッレをクリームソースでからめ、ほぐしたサーモン、ディル、レモンの皮、黒こしょう
    fr_tagliatelles: p => {
        const salmon = (x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(ring(s / 2, 8, .22, rng(p.id + 'sal' + x), 1.1, .85), true, .6)}" fill="${p.g('#f5925e', .3, .25)}" stroke="#c45a2a" stroke-width=".7"/></g>
            <path d="M${f(-s * .34)},${f(-s * .12)} L${f(s * .3)},${f(-s * .2)} M${f(-s * .3)},${f(s * .12)} L${f(s * .34)},${f(s * .06)}" stroke="#fbd4b8" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            <path d="M${f(-s * .3)},${f(-s * .3)} Q0,${f(-s * .4)} ${f(s * .2)},${f(-s * .34)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
        return [
            K.plate(p, { rim: '#7a9a6a' }),
            K.pool(p, 100, 102, 138, '#f3e2bc', { op: .95, seed: 1, sy: .9 }),
            K.noodles(p, 100, 100, 134, { c: '#f2d48a', w: 6, n: 16, seed: 1, sy: .92 }),
            K.glaze(p, 100, 100, 100, '#faf0d6', { seed: 2, op: .35 }),
            ...[[72, 76, 0], [120, 70, 40], [138, 108, 100], [96, 104, 20], [70, 124, 70], [112, 138, -30], [60, 98, 120], [138, 136, 10], [96, 58, 60]].map(([x, y, r], i) => salmon(x, y, 22 - (i % 3) * 2, r)),
            xfrDill(p, 90, 92, 24, -30), xfrDill(p, 122, 120, 22, 50), xfrDill(p, 80, 136, 20, 10),
            K.shreds(p, 100, 100, 80, { c: '#f2d02a', n: 8, w: 1.2, len: .2, seed: 4 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .6 }),
            K.lemon(p, 156, 140, 30, -40),
        ].join('');
    },

    // サラダ・ニソワーズ: 黄色いプロヴァンスの鉢に、レタス、ツナ、ゆで卵、トマトのくし切り、黒オリーブ、いんげん、じゃがいも、バジル
    fr_nicoise: p => {
        const R = rng('xfrnic');
        let tuna = '';
        for (let i = 0; i < 12; i++){ const a = R() * 6.28, d = R() * 16; tuna += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 360)} d="${smooth(ring(8 + R() * 4, 7, .4, R, 1.3, .8))}" fill="${p.g(['#d0a27a', '#b8865e', '#e0b88e'][i % 3], .25, .25)}" stroke="#8a6448" stroke-width=".5"/>`; }
        return [
            K.bowl(p, { glaze: '#e2a828', inside: '#fbf5e6', lip: .88 }),
            `<circle cx="100" cy="100" r="81" fill="none" stroke="#2c5a8a" stroke-width="1.6" opacity=".8"/>`,
            `<circle cx="100" cy="100" r="72" fill="${p.rg('#a8d468', .25, .25)}"/>`,
            ...xfrSpots('nicl', 4, 40, 40).map(([x, y, r], i) => xfrLettuce(p, x, y, 74, r, { seed: i, c: ['#9fd060', '#7fbf4a', '#b6dc6c'][i % 3] })),
            `<g ${p.sh(.7)}>`, ...[[60, 64, -40], [66, 60, -46], [56, 70, -34], [70, 66, -50]].map(([x, y, r]) => xfrBean(p, x, y, 38, r, { w: 4.6 })), `</g>`,
            ...[[140, 70, 30], [146, 112, 100], [56, 130, -40]].map(([x, y, r]) => K.tomatoWedge(p, x, y, 26, r)),
            K.tomatoWedge(p, 104, 150, 24, 180),
            ...[[118, 54, 20], [150, 136, -10], [70, 104, 60]].map(([x, y, r], i) => xfrSpud(p, x, y, 22, r, { c: '#efd08a', seed: i })),
            `<g ${p.sh(1)}>${tuna}</g>`,
            ...[[78, 152, 20], [128, 138, -30], [42, 98, 80], [130, 88, 10]].map(([x, y, r]) => K.eggHalf(p, x, y, 26, r)),
            ...[[96, 70], [118, 116], [84, 124], [152, 92], [104, 132], [58, 86], [140, 156], [92, 40]].map(([x, y], i) => xfrOlive(p, x, y, 10, i * 40)),
            xfrLeaf(p, 108, 92, 18, -30, { c: '#3f9a33', w: .6 }), xfrLeaf(p, 92, 110, 16, 60, { c: '#4aa83a', w: .6 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .55 }),
        ].join('');
    },

    // ムール・マリニエール: 黒いホーロー鍋に、口の開いたムール貝を山盛り、白ワインとクリームの汁、エシャロット、パセリ
    fr_moules: p => {
        const spots = xfrSpots('moules', 24, 60, 19);
        return [
            xfrCocotte(p, { c: '#2c2f36', inside: '#ece2c8' }),
            K.liquid(p, { R: 75, c: '#d9c494', op: 1, shine: false }),
            `<g ${p.sh(.8)}>`, ...spots.map(([x, y, r], i) => xfrMussel(p, x, y, 32, r, { open: i % 4 !== 3 })), `</g>`,
            K.sprinkle(p, 100, 100, 130, { c: '#efe2c0', n: 16, r: 1.3 }),
            xfrHerbs(p, 100, 100, 140, { n: 46 }),
            xfrShine(100, 100, 75, .3),
        ].join('');
    },

    // 子羊のもも肉のロースト: 楕円の皿に、骨付きのジゴ（香草とにんにく）、ロゼに焼けた切り身、じゃがいも、にんにく、ローズマリー
    fr_gigot: p => {
        const c = '#8e4a22';
        const R = rng('xfrgig');
        let spots = '', gar = '';
        for (let i = 0; i < 8; i++) spots += `<ellipse cx="${f(-46 + R() * 80)}" cy="${f((R() - .5) * 46)}" rx="${f(5 + R() * 7)}" ry="${f(3 + R() * 4)}" fill="#4a2208" opacity="${f(.35 + R() * .25)}"/>`;
        for (let i = 0; i < 6; i++) gar += `<ellipse cx="${f(-40 + R() * 66)}" cy="${f((R() - .5) * 40)}" rx="2.6" ry="1.4" transform="rotate(${f(R() * 180)})" fill="#f6eedc" stroke="#c9b48a" stroke-width=".4"/>`;
        const slice = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="21" ry="15" fill="${p.g('#7a3e1a', .3, .3)}"/></g><ellipse cx="-.5" cy="-.5" rx="18" ry="12" fill="${p.rg('#e89a90', .1, .15)}"/><ellipse cx="0" cy="0" rx="11" ry="7" fill="#d26a6a" opacity=".55"/><path d="M-12,-5 Q-2,-9 8,-7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
        return [
            K.ovalDish(p, { rx: 95, ry: 80, base: '#f6f1e6', rim: '#5a7a5a', deep: true }),
            K.pool(p, 100, 104, 150, '#8a4a20', { op: .6, seed: 1, sy: .72 }),
            `<g ${p.sh(.7)}>`, ...[[38, 84], [42, 124], [164, 120], [150, 148], [64, 150], [96, 40]].map(([x, y], i) => xfrSpud(p, x, y, 26, i * 50, { c: '#e8b85a', browned: .8, seed: i })), `</g>`,
            `<g ${T(96, 80, -14)}><g ${p.sh(1.6)}><path d="M42,-5 L64,-4 L64,4 L42,5Z" fill="${p.g('#efe4cc', .3, .25)}" stroke="#bfae8c" stroke-width=".7"/><ellipse cx="66" cy="0" rx="5" ry="7.5" fill="${p.g('#f3ead6', .3, .25)}" stroke="#bfae8c" stroke-width=".7"/>
                <path d="M-58,0 C-58,-30 -30,-40 0,-34 C18,-30 30,-20 40,-10 L44,-6 L44,6 L40,10 C30,20 18,30 0,34 C-30,40 -58,30 -58,0Z" fill="${p.g(c, .35, .35)}" stroke="#4a2208" stroke-width=".9"/></g>
                <g ${xfrBlur(p, 2.5)}>${spots}</g>${gar}
                ${K.sprinkle(p, -10, 0, 70, { c: '#3f6a2a', n: 26, r: .9 })}
                <path d="M-44,-14 Q-30,-30 -4,-28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/></g>`,
            slice(80, 134, -8), slice(110, 140, 6), slice(138, 128, 18),
            xfrGarlic(p, 160, 84, 13, 30), xfrGarlic(p, 148, 64, 12, -20), xfrGarlic(p, 34, 104, 12, 60),
            xfrRosemary(p, 126, 104, 34, -20), xfrRosemary(p, 60, 52, 28, 30),
        ].join('');
    },

    // カスレ: 釉のかかった土鍋（カソール）に、焼き色のついた白いんげん、トゥールーズ・ソーセージ、鴨のコンフィ、豚肉、表面の焦げた膜
    fr_cassoulet: p => {
        const R = rng('xfrcas');
        let crust = '';
        for (let i = 0; i < 12; i++) crust += `<ellipse cx="${f(30 + R() * 140)}" cy="${f(30 + R() * 140)}" rx="${f(8 + R() * 12)}" ry="${f(5 + R() * 8)}" fill="#7a3e12" opacity="${f(.3 + R() * .3)}"/>`;
        const beans = xfrSpots('casb', 36, 66, 10.5).map(([x, y, r], i) => xfrKidney(p, x, y, 12, r, { c: i % 3 ? '#efdcb4' : '#dcae6e', hl: false })).join('');
        return [
            K.bowl(p, { glaze: '#8a4a22', inside: '#5a2e14', lip: .88 }),
            `<circle cx="100" cy="100" r="92" fill="none" stroke="#c88a52" stroke-width="2.4" opacity=".55"/>`,
            K.liquid(p, { R: 78, c: '#b8742e', op: 1, shine: false }),
            `<g ${p.sh(.5)}>${beans}</g>`,
            `<g ${xfrBlur(p, 4)}>${crust}</g>`,
            xfrThigh(p, 76, 80, 62, -30, { c: '#b8662a', seed: 1 }),
            xfrSausage(p, 120, 126, 76, 20, 30, { c: '#a85a3a', bend: 4 }),
            xfrSausageSlice(p, 138, 72, 24, 0, { skin: '#8a4428', meat: '#d08a72' }), xfrSausageSlice(p, 64, 136, 22, 30, { skin: '#8a4428', meat: '#d08a72' }),
            `<g ${p.sh(.8)}>`, xfrBeef(p, 150, 104, 24, 20, { c: '#b07a52' }), xfrBeef(p, 96, 150, 22, -40, { c: '#b07a52' }), `</g>`,
            ...[[108, 96], [52, 108], [156, 136], [120, 52]].map(([x, y], i) => xfrKidney(p, x, y, 12, i * 60, { c: '#e2b878' })),
            K.sprinkle(p, 100, 100, 140, { c: '#5a2a0a', n: 30, r: .9 }),
            xfrHerbs(p, 100, 100, 110, { n: 14 }),
            xfrShine(100, 100, 78, .3),
        ].join('');
    },

    // アンディーブのハム巻きグラタン: 白い角皿に、ハムで巻いたアンディーブ4本、ベシャメルとチーズの焼き色
    fr_endives: p => {
        const x0 = 21, y0 = 36, w = 158, h = 128;
        const d = `M${x0 + 8},${y0} H${x0 + w - 8} Q${x0 + w},${y0} ${x0 + w},${y0 + 8} V${y0 + h - 8} Q${x0 + w},${y0 + h} ${x0 + w - 8},${y0 + h} H${x0 + 8} Q${x0},${y0 + h} ${x0},${y0 + h - 8} V${y0 + 8} Q${x0},${y0} ${x0 + 8},${y0}Z`;
        const roll = y => `<g ${T(100, y, -3)}><g ${p.sh(1)}><rect x="-62" y="-14" width="124" height="28" rx="13" fill="${p.g('#eba2a2', .3, .3)}" stroke="#c87a7e" stroke-width=".7"/></g>
            <path d="M-40,-14 Q-36,0 -40,14 M-6,-14 Q-2,0 -6,14 M28,-14 Q32,0 28,14" stroke="#d48a8e" stroke-width="1" fill="none" opacity=".7"/>
            <path d="M-62,-6 Q-74,-10 -76,0 Q-74,10 -62,6Z" fill="${p.g('#e6eaa8', .3, .25)}" stroke="#b8c070" stroke-width=".6"/>
            <path d="M-72,-2 L-62,-1 M-72,3 L-62,2" stroke="#c8d080" stroke-width=".7"/>
            <path d="M-50,-12 Q4,-18 58,-11 Q64,0 58,11 Q4,18 -50,12 Q-56,0 -50,-12Z" fill="${p.g('#f6e2b0', .3, .2)}" opacity=".97"/></g>`;
        return [
            xfrRectDish(p, { w: 184, h: 150, base: '#fbfaf6', rim: '#9a3a2a' }),
            `<path d="${d}" fill="${p.rg('#f2deac', .2, .2)}"/>`,
            roll(58), roll(87), roll(116), roll(145),
            (() => { const Rr = rng('xfrend'); let sp = '', bb = ''; for (let i = 0; i < 18; i++) sp += `<ellipse cx="${f(x0 + 16 + Rr() * (w - 30))}" cy="${f(y0 + 10 + Rr() * (h - 20))}" rx="${f(7 + Rr() * 11)}" ry="${f(4 + Rr() * 6)}" fill="#b0601a" opacity="${f(.55 + Rr() * .35)}"/>`; for (let i = 0; i < 14; i++){ const cx = x0 + 16 + Rr() * (w - 30), cy = y0 + 10 + Rr() * (h - 20); bb += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(1.4 + Rr() * 1.8)}" fill="none" stroke="#9a5418" stroke-width=".7" opacity=".45"/>`; } const clip = p.def('xenc', id => `<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `<g clip-path="url(#${clip})"><g ${xfrBlur(p, 3.5)}>${sp}</g>${bb}</g>`; })(),
            K.sprinkle(p, 100, 100, 130, { c: '#5a3a1a', n: 16, r: .6 }),
        ].join('');
    },

    // ポロねぎのタルト: 鉄のタルト型に、こんがりした生地のふち、卵とクリームの生地にたっぷりのポロねぎ、焼き色
    fr_tartepoireaux: p => {
        const crimp = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 6.28, rr = 84 + (i % 2 ? -2.4 : 1.4); return [100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]; });
        const R = rng('xfrtp');
        const leeks = xfrSpots('tpl', 34, 62, 13).map(([x, y, r], i) => i % 3 === 0
            ? `<g ${T(x, y, r)}><path d="M-8,1 A8,7 0 0 1 8,1 L5,1 A5,4 0 0 0 -5,1Z" fill="${p.g('#bcd480', .25, .2)}" stroke="#7a9a44" stroke-width=".7"/></g>`
            : xfrLeekRing(p, x, y, 12 + R() * 4, { c: i % 3 === 1 ? '#e2ecb8' : '#c8dc90', edge: '#7fa04a' })).join('');
        return [
            xfrTartTin(p, 94),
            `<g ${p.sh(1.2)}><path d="${smooth(crimp, true, .8)}" fill="${p.g('#dca456', .3, .3)}" stroke="#a46a24" stroke-width=".8"/></g>`,
            `<circle cx="100" cy="100" r="75" fill="#c4802e" opacity=".6"/>`,
            `<circle cx="100" cy="100" r="73" fill="${p.rg('#f4dc8a', .25, .15)}"/>`,
            `<g opacity=".95">${leeks}</g>`,
            `<g ${xfrBlur(p, 3.5)}>`, ...[[78, 70, 14, 9], [126, 76, 12, 8], [70, 122, 14, 9], [120, 130, 14, 8], [100, 100, 10, 7], [146, 104, 9, 6]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#c47a26" opacity=".6"/>`), `</g>`,
            `<path d="M48,82 Q56,56 84,44" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
            K.sprinkle(p, 100, 100, 130, { c: '#5a4030', n: 16, r: .5 }),
        ].join('');
    },

    // 野菜のクスクス: 青緑の鉢に、クスクスの山、にんじん・ズッキーニ・かぶ、ヒヨコ豆、メルゲーズ、オレンジ色のスープ
    fr_couscous: p => {
        const zuc = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="-12" y="-8" width="24" height="16" rx="5" fill="${p.g('#e4e8b0', .2, .2)}" stroke="#3a6a24" stroke-width="2.2"/></g><path d="M-6,0 L6,0" stroke="#c8d48a" stroke-width="2" stroke-linecap="round"/></g>`;
        const turnip = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="-10" y="-9" width="20" height="18" rx="5" fill="${p.g('#f2ecd8', .3, .2)}" stroke="#c8bc9a" stroke-width=".6"/></g><rect x="-10" y="-9" width="20" height="5" rx="2.5" fill="#b874a8" opacity=".8"/></g>`;
        return [
            K.bowl(p, { glaze: '#2f7a8a', inside: '#f3ead2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#e2b04a" stroke-width="1.6" opacity=".8"/>`,
            `<g ${p.sh(.8)}><circle cx="100" cy="100" r="74" fill="${p.rg('#ecc874', .2, .2)}"/></g>`,
            xfrGrains(p, 100, 100, 144, { cols: ['#f2d68e', '#e4c070', '#f8e6b0'], n: 190, rx: 1.4, ry: 1.1, seed: 1 }),
            K.pool(p, 112, 110, 70, '#d9762a', { op: .7, seed: 2 }),
            `<g ${p.sh(.7)}>`,
            ...[[70, 70, 60], [128, 64, -20], [146, 122, 40], [64, 128, 100]].map(([x, y, r]) => xfrCarrotStick(p, x, y, 32, 12, r)),
            zuc(100, 68, 20), zuc(140, 92, -50), zuc(84, 140, 10), turnip(56, 98, 15), turnip(120, 148, -20),
            `</g>`,
            ...xfrSpots('ccp', 14, 60, 12).map(([x, y]) => xfrChickpea(p, x, y, 9)),
            xfrSausage(p, 98, 96, 74, 11, -24, { c: '#9a3a22', bend: 5, grill: 4 }),
            xfrSausage(p, 106, 114, 70, 11, -20, { c: '#a3402a', bend: 4, grill: 4 }),
            xfrHerbs(p, 100, 100, 120, { n: 20 }),
        ].join('');
    },
    // セロリアックのレムラード: 白い鉢（青い線）に、細い千切りのセロリアックをマスタード入りマヨネーズであえた山、パセリ
    fr_celeri: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf9f3', lip: .9 }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3c6a9a" stroke-width="1.6" opacity=".8"/>`,
        `<g ${p.sh(1.2)}><path d="${smooth(ring(66, 14, .12, rng('xfrcel')).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#dccb98', .2, .25)}"/></g>`,
        K.shreds(p, 100, 100, 172, { c: '#d6c48e', n: 56, w: 2.8, len: .17, seed: 1, curve: .7 }),
        K.shreds(p, 98, 98, 160, { c: '#f2e8c8', n: 60, w: 2.6, len: .17, seed: 2, curve: .7 }),
        K.shreds(p, 96, 96, 120, { c: '#fcf8ea', n: 34, w: 2.4, len: .2, seed: 3, curve: .7 }),
        K.glaze(p, 98, 98, 96, '#fbf6e2', { seed: 1, op: .4 }),
        xfrGrains(p, 100, 100, 100, { cols: ['#b08632'], n: 16, rx: 1, ry: .8, seed: 3 }),
        xfrHerbs(p, 98, 96, 86, { n: 24 }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 12, r: .5 }),
    ].join(''),

    // きゅうりのクリームサラダ: 青磁の小鉢に、薄い輪切りのきゅうり、白いクリームのドレッシング、ディル、シブレット
    fr_concombre: p => [
        K.kobachi(p, { glaze: '#8fb8a6', inside: '#eef3ea' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="72" fill="${p.rg('#f6f2e2', .2, .14)}"/></g>`,
        ...xfrSpots('conc', 24, 58, 17).map(([x, y, r]) => K.cucumberSlice(p, x, y, 22, r, { oval: 1.05 })),
        K.glaze(p, 96, 96, 110, '#fbf8ec', { seed: 1, op: .4 }),
        ...[[84, 86, 0], [120, 110, 0], [96, 128, 0]].map(([x, y], i) => K.glaze(p, x, y, 26, '#ffffff', { seed: i + 3, op: .55 })),
        xfrDill(p, 92, 92, 30, -30), xfrDill(p, 118, 120, 26, 40), xfrDill(p, 132, 84, 22, -70),
        xfrChives(p, 100, 100, 110, { n: 16 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
    ].join(''),

    // レンズ豆のサラダ: 茶の鉢に、ピュイの緑レンズ豆、角切りにんじん、エシャロット、ラルドン、ゆで卵、パセリ
    fr_saladelentilles: p => [
        K.bowl(p, { glaze: '#8a6a44', inside: '#ece2cc' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="72" fill="${p.rg('#4e5038', .15, .3)}"/></g>`,
        xfrGrains(p, 100, 100, 142, { cols: ['#4c5038', '#5c5a42', '#3e4232', '#6a6448'], n: 165, rx: 2.8, ry: 2.1, hi: .2, seed: 1 }),
        `<g ${p.sh(.5)}>`, ...xfrSpots('lenc', 14, 60, 13).map(([x, y, r]) => xfrDice(p, x, y, 8, r, '#ec7b2d')), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[60, 76, 20], [134, 64, -30], [146, 120, 60], [80, 140, 10], [116, 150, -50]].map(([x, y, r]) => xfrLardon(p, x, y, 12, r, { c: '#b04e32' })), `</g>`,
        xfrGrains(p, 100, 100, 120, { cols: ['#d9b0c8', '#c890b0'], n: 24, rx: 1.8, ry: 1.2, seed: 4 }),
        K.eggHalf(p, 78, 116, 28, -40), K.eggHalf(p, 126, 82, 26, 50), K.eggHalf(p, 120, 132, 24, 110),
        xfrHerbs(p, 100, 100, 120, { n: 26 }),
        xfrShine(100, 100, 72, .25),
    ].join(''),

    // ビーツのサラダ: 白い鉢に、深い赤紫の角切りビーツ、ヴィネグレット、エシャロットの輪、シブレット
    fr_betteraves: p => [
        K.bowl(p, { glaze: '#f4f1ea', inside: '#fbf9f4', lip: .88 }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#8e1f3c" stroke-width="1.2" opacity=".6"/>`,
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#7a1430', .2, .3)}"/></g>`,
        `<g ${p.sh(.5)}>`, ...xfrSpots('bet', 34, 60, 13).map(([x, y, r], i) => xfrDice(p, x, y, 16, r, i % 3 ? '#9a2244' : '#b02c52')), `</g>`,
        ...[[80, 84, 20], [124, 112, -30], [96, 130, 60], [130, 74, 0]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="8" ry="6" fill="none" stroke="#f0d0e0" stroke-width="1.6" opacity=".9"/><ellipse rx="5" ry="3.6" fill="none" stroke="#e6b8cc" stroke-width="1" opacity=".8"/></g>`),
        K.glaze(p, 98, 96, 100, '#e86a90', { seed: 1, op: .18 }),
        xfrChives(p, 100, 100, 110, { n: 22 }),
        K.sprinkle(p, 100, 100, 110, { c: '#fff4f0', n: 14, r: .9 }),
    ].join(''),

    // サラダ・ピエモンテーズ: 緑の鉢に、マヨネーズであえた角切りじゃがいも、ゆで卵、ハム、トマト、コルニション、パセリ
    fr_piemontaise: p => {
        const gher = (x, y) => `<g ${p.sh(.4)}><circle cx="${x}" cy="${y}" r="5" fill="#4a6a24"/></g><circle cx="${x}" cy="${y}" r="3.8" fill="#a8b860"/><circle cx="${x}" cy="${y}" r="1.6" fill="#c8d488"/>`;
        return [
            K.bowl(p, { glaze: '#5a8a4a', inside: '#f3eee2' }),
            `<g ${p.sh(.8)}><circle cx="100" cy="100" r="72" fill="${p.rg('#f4e2aa', .2, .2)}"/></g>`,
            `<g ${p.sh(.5)}>`,
            ...xfrSpots('piem', 30, 60, 15).map(([x, y, r], i) => i % 6 === 1 ? xfrDice(p, x, y, 12, r, '#f0a0a2') : i % 6 === 4 ? xfrDice(p, x, y, 11, r, '#e2402c') : xfrDice(p, x, y, 16, r, i % 2 ? '#f4dc96' : '#f0d488')),
            `</g>`,
            ...[[78, 86, 20], [126, 70, -30], [120, 130, 50], [62, 124, 0]].map(([x, y, r]) => K.eggHalf(p, x, y, 20, r)),
            gher(100, 104), gher(144, 104), gher(86, 60), gher(96, 146), gher(56, 96),
            K.glaze(p, 98, 96, 120, '#fffbe8', { seed: 1, op: .35 }),
            xfrHerbs(p, 100, 100, 120, { n: 30 }),
        ].join('');
    },

    // ウフ・ミモザ: 白い皿にレタスを敷き、黄身のマヨネーズを絞ったゆで卵6切れ、ほぐした黄身、シブレット、パプリカ
    fr_oeufsmimosa: p => {
        const egg = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(.9)}><ellipse rx="22" ry="15" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".7"/></g>
            <g ${p.sh(.5)}><path d="${smooth(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, rr = i % 2 ? 9 : 11; return [Math.cos(a) * rr * 1.25, Math.sin(a) * rr * .95]; }), true, .8)}" fill="${p.rg('#f6c63a', .3, .15)}" stroke="#d9a01a" stroke-width=".6"/></g>
            <path d="M-8,0 Q0,-6 8,0 Q0,4 -4,0" stroke="#e8a81a" stroke-width="1" fill="none" opacity=".8"/>
            <ellipse cx="-14" cy="-7" rx="4" ry="1.8" fill="#fff" opacity=".8"/></g>`;
        return [
            K.plate(p, { rim: '#c9a24a' }),
            xfrLettuce(p, 100, 100, 130, 10, { seed: 1, c: '#9fd060', sy: .9 }),
            xfrLettuce(p, 76, 120, 70, -40, { seed: 2, c: '#7fbf4a' }), xfrLettuce(p, 128, 78, 70, 30, { seed: 3, c: '#b6dc6c' }),
            ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.28 + .3; return egg(100 + Math.cos(a) * 46, 100 + Math.sin(a) * 42, a * 57.3 + 90); }),
            egg(100, 100, 20),
            xfrGrains(p, 100, 100, 130, { cols: ['#f8d040', '#f2bc2a'], n: 40, rx: 1.3, ry: 1.1, seed: 2 }),
            xfrChives(p, 100, 100, 130, { n: 20 }),
            K.sprinkle(p, 100, 100, 120, { c: '#c8401a', n: 18, r: .7 }),
        ].join('');
    },

    // ポロねぎのヴィネグレット: 長皿に、縦半分に切ってゆでたポロねぎ、マスタードのヴィネグレット、刻んだゆで卵、パセリ
    fr_poireauxvin: p => {
        const gid = p.def('xlkg', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f4e4"/><stop offset=".5" stop-color="#e6edc4"/><stop offset=".78" stop-color="#b0cc78"/><stop offset="1" stop-color="#6f9a40"/></linearGradient>`);
        const leek = (y, L, r, dx) => `<g ${T(100 + dx, y, r)}><g ${p.sh(1)}><rect x="${-L / 2}" y="-11" width="${L}" height="22" rx="10" fill="url(#${gid})" stroke="#9ab070" stroke-width=".7"/></g>
            <path d="M${-L / 2 + 6},-4 Q0,-6 ${L / 2 - 4},-5 M${-L / 2 + 6},2 Q0,0 ${L / 2 - 4},1 M${-L / 2 + 8},7 Q0,5 ${L / 2 - 6},6" stroke="#c8d8a0" stroke-width="1" fill="none" opacity=".9"/>
            <path d="M${-L / 2 + 6},-7 L${L / 2 - 20},-8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".75"/></g>`;
        return [
            K.longPlate(p, { w: 188, h: 140, base: '#f7f3ea', rim: '#c8b48a' }),
            K.pool(p, 100, 102, 150, '#e0c25a', { op: .6, seed: 1, sy: .62 }),
            leek(62, 150, -3, 0), leek(84, 146, -2, 4), leek(106, 152, -3, -2), leek(128, 146, -2, 3), leek(148, 140, -3, 0),
            xfrGrains(p, 104, 100, 120, { cols: ['#d8a020', '#c08a18'], n: 30, rx: 1.1, ry: .9, seed: 2, sy: .7 }),
            ...[[84, 92], [112, 112], [70, 128], [134, 84]].map(([x, y], i) => K.glaze(p, x, y, 26, '#f2d060', { seed: i + 3, op: .45 })),
            xfrGrains(p, 100, 100, 70, { cols: ['#fbf6e6', '#f6d040'], n: 46, rx: 2, ry: 1.6, seed: 5, sy: .8 }),
            xfrHerbs(p, 100, 100, 100, { n: 22 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 12, r: .55 }),
        ].join('');
    },

    // グラタン・ドフィノワ: 青灰の楕円焼き皿に、薄切りじゃがいもを重ねてクリームで焼いた表面（うろこ状の縁がこんがり）
    fr_dauphinois: p => {
        const d = 'M24,100 C24,58 60,38 100,38 C140,38 176,58 176,100 C176,142 140,162 100,162 C60,162 24,142 24,100Z';
        const clip = p.def('xdauc', id => `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
        let rows = '';
        for (let j = 0; j < 9; j++){
            const y = 44 + j * 14, off = (j % 2) * 9;
            let dd = `M${10 - off},${y}`;
            for (let x = 10 - off; x < 190; x += 18) dd += ` A9,9 0 0 1 ${x + 18},${y}`;
            rows += `<path d="${dd}" stroke="#a8601a" stroke-width="3" fill="none" opacity=".55" transform="translate(.6 1.6)"/><path d="${dd}" stroke="#f8e2a0" stroke-width="2.2" fill="none" opacity=".9"/><path d="${dd}" stroke="#c87a24" stroke-width="1" fill="none" opacity=".7" transform="translate(0 -1.4)"/>`;
        }
        const R = rng('xfrdau');
        let sp = '';
        for (let i = 0; i < 10; i++) sp += `<ellipse cx="${f(36 + R() * 128)}" cy="${f(46 + R() * 108)}" rx="${f(8 + R() * 12)}" ry="${f(5 + R() * 7)}" fill="#a8581a" opacity="${f(.4 + R() * .35)}"/>`;
        return [
            xfrOvalBaker(p, { c: '#5d7a94', inside: '#f3ead6', rx: 90, ry: 76 }),
            `<g ${p.sh(1)}><path d="${d}" fill="${p.g('#efcf80', .25, .25)}"/></g>`,
            `<g clip-path="url(#${clip})">${rows}<g ${xfrBlur(p, 4)}>${sp}</g><path d="${d}" fill="none" stroke="#9a4e12" stroke-width="7" opacity=".45"/></g>`,
            K.sprinkle(p, 100, 100, 120, { c: '#5a3010', n: 16, r: .55 }),
            `<path d="M44,82 Q52,58 80,46" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        ].join('');
    },

    // カリフラワーのグラタン: 白い角皿に、ベシャメルをかけた小房のカリフラワー、エメンタールの焼き色、パセリ
    fr_choufleurgratin: p => {
        const R = rng('xfrcfg');
        const floret = (x, y, s) => { let b = ''; for (let i = 0; i < 8; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .3; b += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(s * (.19 + R() * .06))}" fill="${p.rg('#f4e6c2', .35, .28, .34, .32)}" stroke="#bfa070" stroke-width=".7"/>`; } return `<g ${p.sh(1.1)}>${b}</g><ellipse cx="${f(x - s * .1)}" cy="${f(y - s * .12)}" rx="${f(s * .26)}" ry="${f(s * .16)}" fill="#c27424" opacity=".45" ${xfrBlur(p, 2)}/>`; };
        const d = 'M30,22 H170 Q178,22 178,30 V170 Q178,178 170,178 H30 Q22,178 22,170 V30 Q22,22 30,22Z';
        const clip = p.def('xcfc', id => `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
        let sp = '';
        for (let i = 0; i < 14; i++) sp += `<ellipse cx="${f(30 + R() * 140)}" cy="${f(30 + R() * 140)}" rx="${f(7 + R() * 10)}" ry="${f(5 + R() * 6)}" fill="#b0601a" opacity="${f(.4 + R() * .35)}"/>`;
        return [
            xfrRectDish(p, { w: 178, h: 178, base: '#fbfaf6', rim: '#2c4c7c' }),
            `<path d="${d}" fill="${p.rg('#ecd496', .2, .25)}"/>`,
            ...Array.from({ length: 16 }, (_, i) => [44 + (i % 4) * 37 + (Math.floor(i / 4) % 2) * 6 + (R() - .5) * 6, 44 + Math.floor(i / 4) * 37 + (R() - .5) * 6]).map(([x, y]) => floret(x, y, 40)),
            `<g clip-path="url(#${clip})"><g ${xfrBlur(p, 3.5)}>${sp}</g></g>`,
            K.shreds(p, 100, 100, 130, { c: '#f8e090', n: 20, w: 1.6, len: .2, seed: 3, curve: .5 }),
            xfrHerbs(p, 100, 100, 130, { n: 18 }),
            K.sprinkle(p, 100, 100, 130, { c: '#5a3a1a', n: 14, r: .55 }),
        ].join('');
    },

    // ティアン: テラコッタの丸い焼き皿に、ズッキーニ・なす・トマトの輪切りをうず巻きに立てて並べて焼き、タイム、オリーブオイル
    fr_tian: p => {
        const kinds = [['#3f7a26', '#dfe6a6'], ['#d8321e', '#ee5a40'], ['#4a2456', '#e6d4a8']];
        let out = '';
        const rings = [[64, 24], [46, 17], [28, 10], [11, 4]];
        let n = 0;
        for (const [rr, cnt] of rings){
            for (let i = 0; i < cnt; i++){
                const a = i / cnt * 6.28, x = 100 + Math.cos(a) * rr, y = 100 + Math.sin(a) * rr, [sk, fl] = kinds[n++ % 3];
                const deg = a * 57.3 + 90;
                out += `<g ${T(x, y, deg)}><ellipse rx="12" ry="9" fill="${sk}" stroke="${dk(sk, .3)}" stroke-width=".5"/><ellipse cx="0" cy="1.4" rx="10.4" ry="7.2" fill="${fl}"/>${n % 3 === 2 ? '<ellipse cx="0" cy="1.4" rx="4" ry="2.6" fill="#f6c46a" opacity=".8"/>' : ''}</g>`;
            }
        }
        const R = rng('xfrtian');
        let sp = '';
        for (let i = 0; i < 10; i++) sp += `<ellipse cx="${f(30 + R() * 140)}" cy="${f(30 + R() * 140)}" rx="${f(6 + R() * 8)}" ry="${f(4 + R() * 5)}" fill="#6a2a0a" opacity="${f(.25 + R() * .25)}"/>`;
        return [
            K.bowl(p, { glaze: '#b8582e', inside: '#d89a62', lip: .9 }),
            `<circle cx="100" cy="100" r="78" fill="${p.rg('#a8401e', .15, .3)}"/>`,
            `<g ${p.sh(.7)}>${out}</g>`,
            `<g ${xfrBlur(p, 3)}>${sp}</g>`,
            K.glaze(p, 96, 96, 120, '#f2d460', { seed: 1, op: .15 }),
            xfrThyme(p, 84, 92, 30, -30), xfrThyme(p, 122, 116, 26, 40),
            K.sprinkle(p, 100, 100, 140, { c: '#5a6a2a', n: 30, r: .7 }),
            xfrShine(100, 100, 78, .3),
        ].join('');
    },

    // ポム・サルラデーズ: 銅のフライパンに、鴨の脂でこんがり焼いたじゃがいもの輪切り、セップ、にんにく、たっぷりのパセリ
    fr_sarladaises: p => [
        xfrSkillet(p, { R: 82, body: '#b8683a', handle: '#a8883e', inner: '#c4bfb4', rim: '#e2a070' }),
        `<circle cx="100" cy="100" r="72" fill="${p.rg('#d8a040', .2, .3)}"/>`,
        `<g ${p.sh(.7)}>`, ...xfrSpots('sarl', 27, 60, 15.5).map(([x, y, r], i) => xfrPotSlice(p, x, y, 28 - (i % 3) * 2, r, { c: i % 2 ? '#eebe58' : '#f2cc6c', edge: '#a8601a', seed: i })), `</g>`,
        `<g ${xfrBlur(p, 2)}>`, ...[[70, 80], [120, 70], [136, 120], [80, 130], [104, 102], [54, 110]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="#9a4a10" opacity=".45"/>`), `</g>`,
        `<g ${p.sh(.6)}>`, ...[[60, 64, 20], [140, 96, -40], [96, 144, 70], [118, 52, 110]].map(([x, y, r]) => xfrMush(p, x, y, 22, r, { c: '#b8946a' })), `</g>`,
        xfrGrains(p, 100, 100, 120, { cols: ['#fbf4e0', '#f2e2b8'], n: 30, rx: 1.6, ry: 1.2, seed: 2 }),
        xfrHerbs(p, 100, 100, 130, { n: 40 }),
    ].join(''),

    // ズッキーニのにんにく炒め: 白い皿に、こんがり焼いた半月切りのズッキーニ、にんにくの薄切り、タイム
    fr_courgettes: p => {
        const half = (x, y, s, r, i) => `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0Z" fill="#3a6e22" stroke="#24481a" stroke-width=".6"/></g>
            <path d="M${f(-s / 2 + 2)},0 A${f(s / 2 - 2)},${f(s / 2 - 2)} 0 0 1 ${f(s / 2 - 2)},0Z" fill="${p.g(i % 2 ? '#e4dc96' : '#dcd88a', .3, .2)}"/>
            <ellipse cx="${f(s * .04)}" cy="${f(-s * .16)}" rx="${f(s * .22)}" ry="${f(s * .1)}" fill="#c08a2a" opacity="${i % 3 ? .55 : .3}"/>
            <path d="M${f(-s * .24)},${f(-s * .06)} A${f(s * .24)},${f(s * .24)} 0 0 1 ${f(s * .24)},${f(-s * .06)}" stroke="#f4f2c8" stroke-width=".9" fill="none" opacity=".7"/></g>`;
        return [
            K.plate(p, { rim: '#5a8a4a' }),
            ...xfrSpots('courg', 37, 62, 14.5).map(([x, y, r], i) => half(x, y, 28, r, i)),
            ...[[80, 90, 20], [118, 106, -40], [96, 126, 60], [130, 76, 10], [66, 120, 80]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4.4" ry="3" fill="#f8eed8" stroke="#d8c49a" stroke-width=".5"/><ellipse rx="2" ry="1.2" fill="#e8d4a8"/></g>`),
            K.glaze(p, 100, 100, 110, '#f2d460', { seed: 1, op: .15 }),
            xfrThyme(p, 92, 98, 28, -30), xfrLeaf(p, 128, 120, 18, 40, { c: '#3f9a33', w: .6 }),
            xfrHerbs(p, 100, 100, 110, { n: 14 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
        ].join('');
    },

    // ほうれん草のクリーム煮: 白い小鉢に、刻んだほうれん草をクレームフレッシュで煮た深緑、クリームの筋、ナツメグ
    fr_epinards: p => {
        const R = rng('xfrepi');
        let bl = '';
        for (let i = 0; i < 28; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 60; bl += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 360)} d="${smooth(ring(8 + R() * 7, 7, .5, R, 1.3, .8))}" fill="${['#2a5418', '#3c6e26', '#4f8430', '#2f5e1e'][i % 4]}"/>`; }
        let fl = '';
        for (let i = 0; i < 40; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; fl += `M${f(x)},${f(y)}q${f((R() - .5) * 8)},${f((R() - .5) * 6)} ${f((R() - .5) * 10)},${f((R() - .5) * 8)}`; }
        return [
            K.kobachi(p, { glaze: '#f2eee4', inside: '#faf8f2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#5a7a3a" stroke-width="1.4" opacity=".7"/>`,
            `<g ${p.sh(1)}><path d="${smooth(ring(73, 16, .06, R).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#3a6822', .2, .3)}"/></g>`,
            `<g ${p.rough(4, .1)}>${bl}</g>`,
            `<path d="${fl}" stroke="#7aa648" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
            `<path d="${fl}" stroke="#1e3e12" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5" transform="translate(1.6 1.6)"/>`,
            ...[[84, 86, 0], [120, 112, 2], [80, 126, 1], [130, 76, 3]].map(([x, y, st]) => xfrSwirl(p, x, y, 13, { turns: .55, w: 3.4, c: '#f2eed6', op: .75, start: st })),
            K.glaze(p, 96, 94, 110, '#a8c870', { seed: 1, op: .12 }),
            K.sprinkle(p, 100, 100, 110, { c: '#8a5a2a', n: 16, r: .6 }),
            xfrShine(100, 100, 74, .4),
        ].join('');
    },

    // プチポワ・ア・ラ・フランセーズ: 白い鉢に、グリーンピース、細切りのレタス、小玉ねぎ、にんじん、ラルドン、バター
    fr_petitspois: p => [
        K.bowl(p, { glaze: '#e8e2d4', inside: '#f8f5ee' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3c6a9a" stroke-width="1.4" opacity=".7"/>`,
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="73" fill="${p.rg('#8ab84a', .2, .3)}"/></g>`,
        `<g ${p.sh(.4)}>`, ...xfrSpots('pois', 120, 68, 9.2).map(([x, y], i) => xfrPea(p, x, y, 10, { c: i % 3 ? '#6fae3a' : '#7cba44' })), `</g>`,
        `<g ${p.sh(.4)}>`, ...[[70, 70, 30], [130, 84, -40], [96, 130, 10], [140, 128, 70], [60, 116, -20]].map(([x, y, r]) => xfrBean(p, x, y, 30, r, { c: '#b6dc7a', w: 7 })), `</g>`,
        ...[[86, 92], [122, 66], [116, 116], [70, 136], [146, 104]].map(([x, y]) => xfrPearl(p, x, y, 14, { c: '#f4eedc' })),
        `<g ${p.sh(.5)}>`, ...[[104, 76], [62, 96], [132, 146], [98, 150]].map(([x, y]) => K.carrotRound(p, x, y, 11, {})), ...[[84, 116, 20], [140, 70, -30], [110, 98, 60]].map(([x, y, r]) => xfrLardon(p, x, y, 11, r)), `</g>`,
        K.glaze(p, 96, 94, 100, '#f8e48a', { seed: 1, op: .2 }),
        K.sprinkle(p, 100, 100, 120, { c: '#ffffff', n: 22, r: .9 }),
    ].join(''),

    // にんじんのヴィシー風: テラコッタの小鉢に、バターと砂糖でつやよく煮た薄い輪切りのにんじん、パセリ
    fr_vichy: p => [
        K.kobachi(p, { glaze: '#b8582e', inside: '#f3e6d4' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="72" fill="${p.rg('#e2762a', .2, .3)}"/></g>`,
        `<g ${p.sh(.5)}>`, ...xfrSpots('vichy', 40, 62, 13.5).map(([x, y], i) => K.carrotRound(p, x, y, 21 - (i % 3), { c: i % 2 ? '#f08030' : '#e8742a' })), `</g>`,
        ...xfrSpots('vichyh', 16, 60, 18).map(([x, y]) => `<path d="M${f(x - 5)},${f(y - 3)} Q${f(x - 1)},${f(y - 6)} ${f(x + 3)},${f(y - 5)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/>`),
        K.glaze(p, 96, 94, 110, '#f8b04a', { seed: 1, op: .22 }),
        xfrHerbs(p, 100, 100, 110, { n: 30 }),
        xfrShine(100, 100, 72, .35),
    ].join(''),

    // フラジョレ豆の煮込み: 茶の鉢に、淡い緑のフラジョレ豆、焼き汁、エシャロット、タイム、パセリ
    fr_flageolets: p => [
        K.bowl(p, { glaze: '#6e4b33', inside: '#efe5d3' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="73" fill="${p.rg('#8a6a34', .2, .3)}"/></g>`,
        `<g ${p.sh(.4)}>`, ...xfrSpots('flag', 84, 66, 10.2).map(([x, y, r], i) => xfrKidney(p, x, y, 14.5, r, { c: i % 3 ? '#c2d08e' : '#b0c47c', simple: true })), `</g>`,
        ...[[80, 86, 30], [124, 110, -20], [100, 134, 60]].map(([x, y, s], i) => K.glaze(p, x, y, s, '#9a7a3a', { seed: i + 2, op: .35 })),
        xfrGrains(p, 100, 100, 110, { cols: ['#e8c8d8', '#d8a8c0'], n: 18, rx: 1.8, ry: 1.2, seed: 3 }),
        xfrThyme(p, 120, 84, 30, -30),
        xfrHerbs(p, 100, 100, 120, { n: 26 }),
        xfrShine(100, 100, 73, .3),
    ].join(''),

    // マッシュルームのア・ラ・グレック: 白い小鉢に、丸ごとの小さなマッシュルーム、トマトと白ワインのオレンジ色の煮汁、コリアンダーシード、ローリエ、レモン
    fr_champignonsgrecque: p => [
        K.kobachi(p, { glaze: '#3c6a9a', inside: '#f6f3ec' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="73" fill="${p.rg('#c8682a', .2, .3)}"/></g>`,
        ...xfrSpots('grec', 22, 58, 22).map(([x, y, r], i) => i % 4 === 3 ? `<g ${p.sh(.6)}>${xfrMush(p, x, y, 24, r, { c: '#ead8b8', cooked: false })}</g>` : xfrMushCap(p, x, y, 24 - (i % 3) * 2, { c: i % 2 ? '#e2c8a0' : '#d8b890' })),
        K.glaze(p, 100, 100, 110, '#e07a3a', { seed: 1, op: .25 }),
        xfrGrains(p, 100, 100, 120, { cols: ['#c8a46a', '#b08a52'], n: 22, rx: 1.6, ry: 1.5, seed: 2, hi: .5 }),
        xfrLeaf(p, 126, 74, 30, -30, { c: '#5f7a3a', w: .38 }),
        K.lemon(p, 70, 138, 26, 30),
        xfrHerbs(p, 100, 100, 110, { n: 16 }),
        xfrShine(100, 100, 73, .35),
    ].join(''),

    // 紫キャベツのりんご煮: 白い鉢に、つやよく煮た紫キャベツの細切り、りんごのくし切り
    fr_chourouge: p => {
        const apple = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M-11,3 A11,9 0 0 1 11,3 Q0,6 -11,3Z" fill="${p.g('#f2dca8', .3, .2)}" stroke="#a8603a" stroke-width="1.6"/></g><path d="M-6,0 Q0,-4 6,0" stroke="#e6c88a" stroke-width="1" fill="none"/></g>`;
        return [
            K.bowl(p, { glaze: '#f2eee4', inside: '#faf8f2' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#7a2452" stroke-width="1.4" opacity=".7"/>`,
            `<g ${p.sh(.8)}><circle cx="100" cy="100" r="73" fill="${p.rg('#5a1a40', .2, .3)}"/></g>`,
            K.shreds(p, 100, 100, 170, { c: '#7a2452', n: 64, w: 3, len: .12, seed: 1, curve: .8 }),
            K.shreds(p, 100, 100, 166, { c: '#a8407a', n: 44, w: 2.6, len: .12, seed: 2, curve: .8 }),
            K.shreds(p, 100, 100, 150, { c: '#c86a9a', n: 22, w: 2, len: .13, seed: 3, curve: .8 }),
            apple(84, 84, 20), apple(124, 104, -30), apple(96, 130, 70), apple(136, 70, 120),
            K.glaze(p, 98, 96, 120, '#d04a8a', { seed: 1, op: .15 }),
            xfrShine(100, 100, 73, .4),
        ].join('');
    },

    // 自家製フライドポテト: 白い皿に、こんがり揚げた太めのフライドポテトの山、塩
    fr_frites: p => {
        const R = rng('xfrfri');
        const fr = Array.from({ length: 58 }, (_, i) => { const a = R() * 6.28, d = Math.sqrt(R()) * 60; return [100 + Math.cos(a) * d, 100 + Math.sin(a) * d * .9, R() * 180, 34 + R() * 16, i]; }).sort((u, v) => u[1] - v[1]);
        return [
            K.plate(p, { rim: '#c84a3a' }),
            `<g ${p.sh(1)}>`, ...fr.map(([x, y, r, L, i]) => xfrFry(p, x, y, L, r, { w: 7.5, c: ['#f0c25a', '#eab24a', '#f4cc6a'][i % 3] })), `</g>`,
            K.sprinkle(p, 100, 100, 120, { c: '#ffffff', n: 30, r: .8 }),
        ].join('');
    },

    // 米のピラフ: 灰青の鉢に、バターでつやの出たぱらぱらのご飯、玉ねぎ、ローリエ、パセリ
    fr_rizpilaf: p => [
        K.bowl(p, { glaze: '#7a8a9a', inside: '#f3eee2' }),
        `<g ${p.sh(1)}><path d="${smooth(ring(70, 14, .08, rng('xfrpil')).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#cfae6a', .25, .25)}"/></g>`,
        xfrGrains(p, 100, 100, 144, { cols: ['#fff8e6', '#f6e6c0', '#eed69e'], n: 250, rx: 3.6, ry: 1.6, rot: true, seed: 1, hi: .25 }),
        xfrGrains(p, 100, 100, 110, { cols: ['#f2dca0'], n: 14, rx: 2.4, ry: 1.6, seed: 2 }),
        xfrLeaf(p, 124, 84, 32, -30, { c: '#6a7a3a', w: .38 }),
        xfrHerbs(p, 100, 100, 110, { n: 20 }),
        K.glaze(p, 96, 94, 100, '#fff2c0', { seed: 1, op: .2 }),
    ].join(''),

    // オニオングラタンスープ: 耳つきの茶色いスープボウルに、焼き色のついたチーズがパンの上で溶けてふちまで広がり、すき間に飴色の玉ねぎとスープ
    fr_oignon: p => {
        const R = rng('xfroig');
        const top = smooth(ring(64, 18, .14, R).map(([a, b]) => [a + 100, b + 100]));
        return [
            xfrCrock(p, { c: '#6e3a1e', inside: '#d8bc90' }),
            K.liquid(p, { R: 70, c: '#7a4018', op: 1, shine: false }),
            ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.28 + .2; return xfrOnionStrip(p, 100 + Math.cos(a) * 64, 100 + Math.sin(a) * 64, 16, a * 57.3 + 90, { c: '#c8823a', op: .9 }); }),
            `<g ${p.sh(.8)}><path d="M42,70 Q30,74 28,84 Q32,92 40,88Z M160,128 Q172,132 172,142 Q164,148 158,140Z M120,40 Q124,28 134,30 Q138,38 130,42Z" fill="${p.g('#e6a848', .3, .3)}"/></g>`,
            xfrGratin(p, top, [36, 36, 128, 128], { c: '#f0c050', brown: '#9a4a12', seed: 1, n: 14, bubbles: 16, op: .85 }),
            `<path d="${top}" fill="none" stroke="#8a4410" stroke-width="2.6" opacity=".55"/>`,
            `<path d="M58,88 Q66,64 92,56" stroke="#fff6d0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
            K.sprinkle(p, 100, 100, 110, { c: '#3a1a08', n: 14, r: .6 }),
        ].join('');
    },

    // スープ・オ・ピストゥ: 青い線のスープ皿に、野菜のスープ（ズッキーニ・じゃがいも・トマト・いんげん・白いんげん・マカロニ）、真ん中に緑のピストゥ、パルメザン、バジル
    fr_pistou: p => {
        const items = xfrSpots('pist', 34, 54, 11.5).map(([x, y, r], i) => {
            const t = i % 6;
            return t === 0 ? xfrDice(p, x, y, 11, r, '#d8e0a0', { skin: '#3a7026' })
                : t === 1 ? xfrDice(p, x, y, 11, r, '#f0dca0')
                : t === 2 ? xfrKidney(p, x, y, 12, r, { c: '#f1e6cc', hl: false })
                : t === 3 ? K.macaroni(p, x, y, 11, r)
                : t === 4 ? xfrBean(p, x, y, 16, r, { w: 4.4 })
                : xfrDice(p, x, y, 9, r, '#e2402c');
        }).join('');
        return [
            xfrSoupPlate(p, { band: '#2c5a8a', well: .78 }),
            K.liquid(p, { R: 72, c: '#cfa858', op: 1, shine: false }),
            `<circle cx="100" cy="100" r="70" fill="#e2c27a" opacity=".35"/>`,
            `<g ${p.sh(.5)}>${items}</g>`,
            `<circle cx="100" cy="100" r="72" fill="#d8b468" opacity=".18"/>`,
            `<g ${p.sh(.8)}><path d="${smooth(ring(15, 10, .35, rng('xfrpst')).map(([a, b]) => [a + 102, b + 98]))}" fill="${p.rg('#4a7e26', .25, .25)}"/></g>`,
            xfrGrains(p, 102, 98, 22, { cols: ['#2f5e18', '#f6f0d0'], n: 14, rx: 1, ry: .8, seed: 2 }),
            xfrOil(p, 100, 100, 110, { n: 12, c: '#c8b032', rmax: 2.4, op: .6 }),
            xfrShaving(p, 128, 120, 16, 20), xfrShaving(p, 76, 80, 14, -30), xfrShaving(p, 120, 74, 12, 60),
            xfrLeaf(p, 86, 118, 18, 30, { c: '#3f9a33', w: .6 }), xfrLeaf(p, 116, 100, 16, -50, { c: '#4aa83a', w: .6 }),
            xfrShine(100, 100, 72, .4),
        ].join('');
    },

    // ガルビュール: 土の鉢に、とろみのあるキャベツのスープ、白いんげん、じゃがいも、にんじん、生ハム、鴨のコンフィ、田舎パン
    fr_garbure: p => [
        K.bowl(p, { glaze: '#9a5a2a', inside: '#e8d4b4' }),
        K.liquid(p, { R: 76, c: '#b49660', op: 1, shine: false }),
        `<g ${p.sh(.6)}>`, ...xfrSpots('garbc', 8, 54, 30).map(([x, y, r], i) => K.leafPiece(p, x, y, 36, r, { c: i % 2 ? '#a8c47a' : '#c4d898', cooked: true, seed: i })), `</g>`,
        `<g ${p.sh(.5)}>`, ...xfrSpots('garbb', 18, 62, 12).map(([x, y, r]) => xfrKidney(p, x, y, 12, r, { c: '#f0e2c4', hl: false })), `</g>`,
        `<g ${p.sh(.7)}>`,
        ...[[70, 70, 10], [136, 128, -20], [62, 128, 40]].map(([x, y, r], i) => xfrSpud(p, x, y, 22, r, { c: '#ecd08a', seed: i })),
        ...[[128, 64], [90, 140], [148, 96]].map(([x, y]) => K.carrotRound(p, x, y, 15, {})),
        ...[[104, 96, 20], [80, 104, -40]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-11" y="-7" width="22" height="14" rx="3" fill="${p.g('#c8605a', .25, .25)}" stroke="#8a3a34" stroke-width=".6"/><rect x="-11" y="3" width="22" height="4" rx="2" fill="#f4e2d0"/></g>`),
        xfrBreadSlice(p, 118, 112, 30, 30, { toast: .4 }),
        `</g>`,
        `<circle cx="100" cy="100" r="74" fill="#b49660" opacity=".15"/>`,
        xfrHerbs(p, 100, 100, 120, { n: 18 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 16, r: .6 }),
        xfrShine(100, 100, 76, .35),
    ].join(''),

    // クレソンのポタージュ: 深緑の鉢に、なめらかな緑のポタージュ、クレームフレッシュのうず、クレソンの小枝
    fr_cresson: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3f7a3a" stroke-width="2" opacity=".8"/>`,
        K.liquid(p, { R: 73, c: '#5f8a2e', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#7aa23e" opacity=".4"/>`,
        xfrSwirl(p, 98, 100, 36, { turns: 1.4, w: 4.2, c: '#f8f4e8' }),
        `<g ${p.sh(.5)}>`, xfrCress(p, 126, 74, 46, -30), xfrCress(p, 70, 128, 42, 150), xfrCress(p, 138, 120, 36, 60), xfrCress(p, 66, 78, 32, -120), `</g>`,
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 12, r: .55 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // ポタージュ・クレシー: 白い鉢（オレンジの線）に、明るいオレンジのにんじんのポタージュ、クリームのしずく、セルフイユ
    fr_crecy: p => [
        K.bowl(p, { glaze: '#5d7f98', inside: '#f3eee2' }),
        K.liquid(p, { R: 73, c: '#ec8a2c', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#f6a848" opacity=".45"/>`,
        ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28, x = 100 + Math.cos(a) * 44, y = 100 + Math.sin(a) * 40; return `<g ${T(x, y, a * 57.3 + 90)}><path d="M-4,-1 Q0,-6 4,-1 Q2,4 0,6 Q-2,4 -4,-1Z" fill="#fbf4e2" stroke="#e6c8a0" stroke-width=".5"/></g>`; }),
        `<g ${p.sh(.5)}>`, K.shreds(p, 100, 100, 30, { c: '#f4a04a', n: 12, w: 1.6, len: .7, seed: 2, curve: .5 }), `</g>`,
        `<g ${p.sh(.4)}>`, xfrDill(p, 106, 94, 22, -30), xfrDill(p, 94, 104, 18, 60), `</g>`,
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 10, r: .55 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // ソープ・ド・ポワ・カセ: 茶の鉢に、とろりとした黄緑のスプリットピーのスープ、カリカリのラルドン、クルトン、黒こしょう
    fr_poiscasses: p => [
        K.bowl(p, { glaze: '#7a5a3a', inside: '#efe5d3' }),
        K.liquid(p, { R: 73, c: '#94a03e', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#aab44e" opacity=".4"/>`,
        ...[[60, 80, 30, 2], [130, 120, 34, 3], [96, 60, 24, 1]].map(([x, y, rr, st]) => xfrSwirl(p, x, y, rr, { turns: .5, w: 2.4, c: '#b4bc5a', op: .7, start: st })),
        xfrCrouton(p, 86, 92, 13, 10), xfrCrouton(p, 116, 104, 13, -20), xfrCrouton(p, 98, 122, 12, 30), xfrCrouton(p, 124, 80, 12, 50), xfrCrouton(p, 72, 116, 11, -40),
        `<g ${p.sh(.5)}>`, ...[[104, 86, 20], [80, 74, -40], [130, 136, 60], [64, 100, 10], [108, 140, -20], [140, 98, 80]].map(([x, y, r]) => xfrLardon(p, x, y, 11, r, { c: '#9a4028' })), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 24, r: .6 }),
        xfrShine(100, 100, 73, .4),
    ].join(''),

    // マッシュルームのヴルーテ: グレージュの線のスープ皿に、ベージュのなめらかなスープ、クリームのうず、ソテーしたマッシュルームの薄切り、パセリ
    fr_champignons: p => [
        xfrSoupPlate(p, { band: '#8a7a64', well: .78 }),
        K.liquid(p, { R: 72, c: '#c4ab86', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#d8c4a0" opacity=".4"/>`,
        xfrSwirl(p, 100, 100, 40, { turns: 1.4, w: 3.6, c: '#f8f2e4' }),
        `<g ${p.sh(.7)}>`, ...[[90, 90, -20], [112, 96, 30], [100, 114, 80], [80, 110, 140], [114, 78, -60], [124, 116, 10]].map(([x, y, r]) => xfrMush(p, x, y, 25, r, { c: '#c49a6a' })), `</g>`,
        xfrHerbs(p, 100, 100, 70, { n: 16 }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 10, r: .55 }),
        xfrShine(100, 100, 72, .45),
    ].join(''),

    // トマトのヴルーテ: 白い鉢（緑の線）に、赤いなめらかなトマトスープ、クリームのうず、バジル、黒こしょう
    fr_tomate: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#c8402a" stroke-width="1.8" opacity=".8"/>`,
        K.liquid(p, { R: 73, c: '#c43a24', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#d8583a" opacity=".45"/>`,
        xfrSwirl(p, 98, 100, 38, { turns: 1.5, w: 4.2, c: '#fbf6ec' }),
        `<g ${p.sh(.5)}>`, xfrLeaf(p, 118, 84, 24, -30, { c: '#3f9a33', w: .6 }), xfrLeaf(p, 128, 96, 20, 40, { c: '#4aa83a', w: .6 }), xfrLeaf(p, 112, 96, 16, 100, { c: '#3f9a33', w: .6 }), `</g>`,
        xfrOil(p, 100, 100, 100, { n: 8, c: '#d8a032', rmax: 2, op: .6 }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 14, r: .55 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // ズッキーニのヴルーテ: からし色の鉢に、淡い緑のなめらかなスープ、くずしたフレッシュチーズ、薄切りのズッキーニ、シブレット
    fr_courgette: p => [
        K.bowl(p, { glaze: '#d9a63a', inside: '#f6efe0' }),
        K.liquid(p, { R: 73, c: '#a6b85a', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#bcc874" opacity=".45"/>`,
        ...[[96, 96, 12, 1], [110, 108, 9, 2], [86, 112, 8, 3], [114, 88, 7, 4]].map(([x, y, s, sd]) => `<g ${p.sh(.5)}><path d="${smooth(ring(s, 8, .4, rng(p.id + 'ch' + sd)).map(([a, b]) => [a + x, b + y]))}" fill="${p.rg('#fbf9f0', .2, .1)}" stroke="#e2dcc8" stroke-width=".5"/></g>`),
        `<g ${p.sh(.5)}>`, ...[[134, 84], [68, 120], [126, 132]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#3f7a2a"/><circle cx="${x}" cy="${y}" r="8.6" fill="${p.rg('#e6eab0', .2, .12)}"/><circle cx="${x}" cy="${y}" r="4" fill="#cfdc94"/>`), `</g>`,
        xfrChives(p, 100, 100, 100, { n: 18 }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 12, r: .55 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // キャベツのスープ: 緑のホーロー鍋に、澄んだ金色のスープ、キャベツ、じゃがいも、にんじん、ラルドン、燻製ソーセージの輪切り
    fr_chou: p => [
        xfrCocotte(p, { c: '#4a7a52', inside: '#f1e8d8' }),
        K.liquid(p, { R: 75, c: '#d2b472', op: 1, shine: false }),
        `<g ${p.sh(.6)}>`, ...xfrSpots('chouc', 9, 56, 28).map(([x, y, r], i) => K.leafPiece(p, x, y, 34, r, { c: i % 2 ? '#bcd890' : '#d6e6aa', cooked: true, seed: i })), `</g>`,
        `<g ${p.sh(.7)}>`,
        ...[[66, 74, 20], [138, 124, -10], [92, 140, 50]].map(([x, y, r], i) => xfrSpud(p, x, y, 22, r, { c: '#efd48e', seed: i })),
        ...[[124, 70], [60, 120], [146, 96], [106, 104]].map(([x, y]) => K.carrotRound(p, x, y, 14, {})),
        ...[[96, 76, 20], [80, 104, -40], [124, 146, 60], [148, 74, 0]].map(([x, y, r]) => xfrLardon(p, x, y, 11, r)),
        xfrSausageSlice(p, 116, 92, 22, 0, { skin: '#8a4428', meat: '#d08a72' }), xfrSausageSlice(p, 72, 146, 20, 30, { skin: '#8a4428', meat: '#d08a72' }), xfrSausageSlice(p, 52, 92, 20, -20, { skin: '#8a4428', meat: '#d08a72' }),
        `</g>`,
        `<circle cx="100" cy="100" r="74" fill="#d8bc78" opacity=".18"/>`,
        xfrOil(p, 100, 100, 130, { n: 14, c: '#e8c04a', rmax: 2.4, op: .6 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 18, r: .6 }),
        xfrShine(100, 100, 75, .4),
    ].join(''),

    // 野菜のポタージュ: 茶の鉢に、ポロねぎ・にんじん・じゃがいも・かぶを裏ごしした黄土色のポタージュ、バター、セルフイユ
    fr_legumes: p => [
        K.bowl(p, { glaze: '#8a6a4a', inside: '#efe5d3' }),
        K.liquid(p, { R: 73, c: '#d49c46', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#e2b25e" opacity=".4"/>`,
        xfrSwirl(p, 100, 100, 30, { turns: 1.2, w: 3.4, c: '#f8eed6', op: .85 }),
        `<g ${p.sh(.5)}><path d="${smooth(ring(9, 9, .3, rng('xfrlgb')).map(([a, b]) => [a + 104, b + 98]))}" fill="${p.g('#f8de7a', .4, .15)}" stroke="#d8b450" stroke-width=".6"/></g>`,
        `<path d="M98,94 Q104,90 110,93" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>`,
        `<g ${p.sh(.4)}>`, xfrDill(p, 84, 112, 30, 30), xfrDill(p, 126, 84, 28, -40), xfrDill(p, 120, 118, 22, 60), `</g>`,
        ...[[68, 74], [138, 72], [60, 120], [132, 138], [96, 144], [96, 58], [146, 108]].map(([x, y], i) => `<g ${p.sh(.4)}>${xfrDice(p, x, y, 10, x, ['#ec7b2d', '#9ab86a', '#f2e6c8'][i % 3])}</g>`),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 12, r: .55 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // 赤レンズ豆のスープ: 青緑の鉢に、オレンジ色のなめらかなスープ、クリームのうず、クミン、コリアンダーの葉、レンズ豆
    fr_lentcorail: p => [
        K.bowl(p, { glaze: '#2f6a7a', inside: '#f3eee2' }),
        K.liquid(p, { R: 73, c: '#dc7232', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#e88c48" opacity=".4"/>`,
        xfrGrains(p, 100, 100, 130, { cols: ['#e88a4a', '#c8602a'], n: 50, rx: 1.8, ry: 1.4, seed: 1 }),
        `<g ${p.sh(.4)}>`, xfrSwirl(p, 100, 100, 24, { turns: 1.1, w: 4.6, c: '#fbf4e4', op: .95 }), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[124, 80, -20], [134, 96, 40], [118, 92, 110], [80, 124, 160], [72, 112, 70]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M0,0 Q-6,-3 -5,-8 Q-1,-10 2,-6 Q6,-9 8,-5 Q8,-1 4,0 Q8,3 5,7 Q1,8 0,4 Q-3,6 -6,4 Q-6,1 0,0Z" fill="${p.g('#3f8a33', .3, .2)}" stroke="#2a5e22" stroke-width=".5"/></g>`), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#8a4a12', n: 24, r: .7 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // 魚のスープとルイユ: 白いスープ皿に、さび色の魚のスープ、ルイユを塗った焼いたバゲット3枚、すりおろしたチーズ、オリーブオイル
    fr_poisson: p => {
        const toast = (x, y, r, sd) => [xfrBreadSlice(p, x, y, 42, r, { toast: .6 }),
            `<g ${T(x, y, r)}><path d="${smooth(ring(10, 9, .35, rng(p.id + 'rou' + sd), 1.3, .8))}" fill="${p.g('#e8742a', .35, .2)}" stroke="#b8501a" stroke-width=".5"/></g>`,
            K.shreds(p, x, y + 1, 18, { c: '#f8e090', n: 7, w: 1.4, len: .6, seed: sd, curve: .6 })].join('');
        return [
            xfrSoupPlate(p, { band: '#2c4c7c', well: .78 }),
            K.liquid(p, { R: 72, c: '#b8541e', op: 1 }),
            `<circle cx="96" cy="94" r="46" fill="#c8682c" opacity=".45"/>`,
            xfrOil(p, 100, 100, 120, { n: 16, c: '#e88a2a', rmax: 2.6, op: .7 }),
            toast(76, 82, -20, 1), toast(126, 92, 25, 2), toast(96, 128, 5, 3),
            K.shreds(p, 140, 128, 26, { c: '#f8e090', n: 8, w: 1.4, len: .5, seed: 6, curve: .6 }),
            K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 12, r: .55 }),
            xfrShine(100, 100, 72, .45),
        ].join('');
    },

    // 鶏のブイヨンとヴェルミセル: 白い鉢（金の線）に、澄んだ金色のブイヨン、細いヴェルミセル、ほぐした鶏肉、にんじん、ポロねぎ、浮いた脂、パセリ
    fr_vermicelle: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#c9a24a" stroke-width="2" opacity=".85"/>`,
        K.liquid(p, { R: 73, c: '#e2b84e', op: .95 }),
        `<g ${p.sh(.4)}>`, K.threads(p, 100, 100, 120, { c: '#f8eab6', n: 26, seed: 1, w: 1.6 }), K.threads(p, 100, 100, 110, { c: '#efd890', n: 14, seed: 2, w: 1.4 }), `</g>`,
        `<g ${p.sh(.6)}>`, ...[[80, 80, 20], [124, 116, -30], [118, 72, 60], [72, 122, 110], [100, 100, 0]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-11,-3 Q0,-6 11,-3 Q12,1 10,4 Q0,6 -10,4 Q-12,1 -11,-3Z" fill="${p.g('#f2e2c4', .3, .2)}" stroke="#cbb48a" stroke-width=".6"/><path d="M-8,0 L8,0 M-7,2.4 L6,2.4" stroke="#d8c49e" stroke-width=".6"/></g>`), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[60, 98], [138, 92], [96, 60], [104, 142], [140, 128]].map(([x, y]) => K.carrotRound(p, x, y, 12, {})), ...[[70, 70], [130, 60], [64, 140], [146, 108], [92, 126]].map(([x, y]) => xfrLeekRing(p, x, y, 12)), `</g>`,
        xfrOil(p, 100, 100, 130, { n: 18, c: '#f6c84a', rmax: 3, op: .7 }),
        xfrHerbs(p, 100, 100, 110, { n: 18 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // 栗のヴルーテ: こげ茶の鉢に、栗色のなめらかなスープ、クリームのうず、カリカリのラルドン、砕いた栗、黒こしょう
    fr_chataigne: p => [
        K.bowl(p, { glaze: '#5a3a2a', inside: '#efe5d3' }),
        K.liquid(p, { R: 73, c: '#b08a62', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#c49e76" opacity=".4"/>`,
        xfrSwirl(p, 100, 100, 34, { turns: 1.3, w: 3.8, c: '#f8f0e0' }),
        `<g ${p.sh(.6)}>`, ...[[94, 90, 28, 1], [116, 108, 24, 2], [84, 114, 22, 3]].map(([x, y, s, sd]) => `<path d="${smooth(ring(s / 2, 7, .35, rng(p.id + 'cn' + sd)).map(([a, b]) => [a + x, b + y]))}" fill="${p.g('#c8945a', .3, .3)}" stroke="#8a5a2a" stroke-width=".6"/>`), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[110, 80, 20], [128, 96, -40], [100, 104, 60], [104, 128, 0], [72, 94, -20], [80, 74, 40]].map(([x, y, r]) => xfrLardon(p, x, y, 13, r, { c: '#9a3e24' })), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .6 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),

    // カリフラワーのヴルーテ: 紺の鉢に、アイボリーのなめらかなスープ、焼いた小房のカリフラワー、すりおろしたコンテ、ナツメグ
    fr_choufleur: p => {
        const R = rng('xfrcfs');
        const floret = (x, y, s) => { let b = ''; for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .28; b += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(s * (.2 + R() * .06))}" fill="${p.rg('#f2e2bc', .35, .28, .34, .32)}" stroke="#c8a676" stroke-width=".6"/>`; } return `<g ${p.sh(.8)}>${b}</g><ellipse cx="${f(x + s * .08)}" cy="${f(y - s * .06)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="#b8742a" opacity=".45"/>`; };
        return [
            K.bowl(p, { glaze: '#33465e', inside: '#f3eee2' }),
            K.liquid(p, { R: 73, c: '#ece2c6', op: 1 }),
            `<circle cx="96" cy="94" r="46" fill="#f6efdc" opacity=".5"/>`,
            floret(90, 90, 36), floret(118, 102, 32), floret(96, 120, 30),
            K.shreds(p, 104, 104, 70, { c: '#f2d470', n: 14, w: 1.4, len: .3, seed: 2, curve: .5 }),
            xfrOil(p, 100, 100, 110, { n: 8, c: '#e8c86a', rmax: 2, op: .6 }),
            K.sprinkle(p, 100, 100, 110, { c: '#8a5a2a', n: 18, r: .6 }),
            xfrChives(p, 104, 96, 70, { n: 8 }),
            xfrShine(100, 100, 73, .45),
        ].join('');
    },

    // トゥラン（にんにくのスープ）: 耳つきの陶器の鉢に、淡い黄色のにんにくのスープ、白い卵の糸、浸した田舎パン、黒こしょう
    fr_tourin: p => [
        xfrCrock(p, { c: '#a8683a', inside: '#efe0c4' }),
        K.liquid(p, { R: 70, c: '#e0c88a', op: 1 }),
        `<circle cx="96" cy="94" r="44" fill="#ecd8a2" opacity=".45"/>`,
        `<g ${T(84, 90, -15)}><g ${p.sh(1)}><rect x="-26" y="-18" width="52" height="36" rx="8" fill="${p.g('#b8742e', .3, .3)}" stroke="#7a4a1a" stroke-width=".8"/></g><rect x="-23" y="-15" width="46" height="30" rx="6" fill="${p.rg('#e8cc96', .25, .15)}"/></g>`,
        `<g ${T(124, 118, 20)}><g ${p.sh(1)}><rect x="-22" y="-16" width="44" height="32" rx="8" fill="${p.g('#b8742e', .3, .3)}" stroke="#7a4a1a" stroke-width=".8"/></g><rect x="-19" y="-13" width="38" height="26" rx="6" fill="${p.rg('#e2c48c', .25, .15)}"/></g>`,
        `<circle cx="100" cy="100" r="68" fill="#e0c88a" opacity=".22"/>`,
        ...[[60, 120, 30, 20], [130, 70, 34, -30], [96, 140, 28, 10], [140, 100, 24, 70], [70, 64, 26, -50], [104, 104, 22, 40]].map(([x, y, L, r], i) => xfrEggWhite(p, x, y, L, r, { seed: i })),
        xfrGrains(p, 100, 100, 110, { cols: ['#f8f0dc'], n: 10, rx: 2.2, ry: 1.4, seed: 3 }),
        xfrOil(p, 100, 100, 120, { n: 10, c: '#f2cc5a', rmax: 2.4, op: .6 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 20, r: .6 }),
        xfrShine(100, 100, 70, .4),
    ].join(''),

    // アスパラガスのヴルーテ: 白いスープ皿（緑の線）に、淡いうぐいす色のなめらかなスープ、クリームのうず、緑のアスパラガスの穂先、シブレット
    fr_asperges: p => [
        xfrSoupPlate(p, { band: '#5a8a4a', well: .78 }),
        K.liquid(p, { R: 72, c: '#dcd49a', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#e8e2b0" opacity=".5"/>`,
        xfrSwirl(p, 98, 102, 30, { turns: 1.2, w: 3.4, c: '#fbf8ec' }),
        xfrAsp(p, 108, 80, 56, -30), xfrAsp(p, 112, 98, 54, -8), xfrAsp(p, 104, 114, 50, 14),
        xfrChives(p, 96, 100, 90, { n: 16 }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 10, r: .55 }),
        xfrShine(100, 100, 72, .45),
    ].join(''),

    // ブロッコリーのヴルーテ: 白いスープ皿（赤い線）に、鮮やかな緑のスープ、クリームの線、小さなブロッコリーの房、すりおろしたチーズ
    fr_brocolis: p => [
        xfrSoupPlate(p, { band: '#c84a3a', well: .78 }),
        K.liquid(p, { R: 72, c: '#5a8e30', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#72a43e" opacity=".45"/>`,
        `<path d="M54,96 Q78,84 100,98 T146,100" stroke="#f6f2e2" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".9"/>`,
        K.broccoli(p, 90, 114, 32, -10), K.broccoli(p, 118, 122, 28, 20), K.broccoli(p, 122, 82, 26, -30), K.broccoli(p, 78, 80, 24, 10),
        K.shreds(p, 100, 104, 60, { c: '#f6dc80', n: 14, w: 1.4, len: .3, seed: 2, curve: .5 }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 10, r: .55 }),
        xfrShine(100, 100, 72, .45),
    ].join(''),

    // パースニップのヴルーテ: 青い鉢に、アイボリーのなめらかなスープ、クリームの線、角切りのりんご、クルトン、ナツメグ
    fr_panais: p => [
        K.bowl(p, { glaze: '#4a6a8a', inside: '#f3eee2' }),
        K.liquid(p, { R: 73, c: '#e2d0a2', op: 1 }),
        `<circle cx="96" cy="94" r="46" fill="#efe2bc" opacity=".5"/>`,
        ...[[0, 0], [1, 2.1], [2, 4.2]].map(([i, st]) => xfrSwirl(p, 100, 100, 40 - i * 8, { turns: .45, w: 2.6, c: '#fcf8ee', op: .9, start: st })),
        `<g ${p.sh(.5)}>`, ...[[94, 90], [114, 102], [86, 112], [104, 120], [118, 82], [128, 116]].map(([x, y], i) => xfrDice(p, x, y, 13, i * 25, '#f6ecc4', { skin: i % 2 ? '#c8302a' : '#8ab83a' })), `</g>`,
        xfrCrouton(p, 72, 84, 14, 10), xfrCrouton(p, 138, 128, 14, -20), xfrCrouton(p, 136, 74, 13, 40), xfrCrouton(p, 76, 128, 13, 25),
        K.sprinkle(p, 100, 100, 110, { c: '#8a5a2a', n: 16, r: .6 }),
        xfrShine(100, 100, 73, .45),
    ].join(''),
};

// タグの間の改行と字下げを詰めて、SVG を軽くする（絵は変わらない）
export default Object.fromEntries(Object.entries(XFR).map(([id, fn]) => [id, p => fn(p).replace(/>\s+</g, '><')]));
