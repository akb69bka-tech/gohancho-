// World edition: France (fr) — everyday French home cooking
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// ---------- このファイル専用の部品（wf〜） ----------
const wfBlur = (p, s = 2) => `filter="url(#${p.def('wfbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const wfShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// 円の中に重なりにくく位置を散らす
function wfSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wfspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

// 小さな粒をまとめて（色ごとに1本のpath）: レンズ豆・クスクス・刻みパセリなど
function wfGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, rx = 2, ry = 1.4, seed = 1, sy = 1, hi = 0, jitter = .3 } = {}){
    const R = rng(p.id + 'wfg' + seed + x + y);
    const ds = cols.map(() => ''); let hs = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const ax = rx * (1 - jitter / 2 + R() * jitter), ay = ry * (1 - jitter / 2 + R() * jitter);
        ds[Math.floor(R() * cols.length)] += `M${f(gx - ax)},${f(gy)}a${f(ax)},${f(ay)} 0 1 0 ${f(ax * 2)},0a${f(ax)},${f(ay)} 0 1 0 ${f(-ax * 2)},0Z`;
        if (hi && R() < hi) hs += `M${f(gx - ax * .5)},${f(gy - ay * .35)}l${f(ax * .6)},${f(-ay * .2)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".35"/>`).join('') + (hs ? `<path d="${hs}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".75"/>` : '');
}

// さいの目（上面と側面）
function wfDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .3, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .24)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * (skin ? .38 : .2))} L${f(-h + s * .6)},${f(-h + s * (skin ? .38 : .2))}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}

// 葉（ミント・バジル・タイム）
function wfLeaf(p, x, y, L, r = 0, { c = '#3f8a33', w = .42 } = {}){
    const h = L * w / 2;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .1)},${f(-h * 1.6)} ${L / 2},0 Q${f(-L * .1)},${f(h * 1.6)} ${-L / 2},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <path d="M${f(-L * .44)},0 L${f(L * .4)},0" stroke="${lt(c, .45)}" stroke-width=".7"/>${[-.2, .05, .25].map(t => `<path d="M${f(L * t)},0 l${f(L * .1)},${f(-h * .6)} M${f(L * t)},0 l${f(L * .1)},${f(h * .6)}" stroke="${lt(c, .35)}" stroke-width=".5" opacity=".8"/>`).join('')}</g>`;
}

// 薄切り玉ねぎ（煮て透き通った弧）
function wfOnionStrip(p, x, y, s, r = 0, { c = '#f3d9a0' } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity=".8" stroke="${dk(c, .2)}" stroke-width=".6" stroke-linejoin="round"/></g>`;
}

// クリームのうず（スープの上の生クリーム・クレームフレッシュ）
function wfSwirl(p, x, y, R, { turns = 1.6, c = '#fffaf0', w = 4, op = .9, start = 0 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = start + t * turns * 6.28, rr = R * (.12 + t * .88); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .4)}" transform="translate(.6 .9)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}

// クルトン
function wfCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f(-s / 2 + s * .18)}" y="${f(-s / 2 + s * .18)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}

// 刻みハーブ（パセリ・シブレット）
function wfHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'] } = {}){
    const R = rng(p.id + 'wfh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R(); ds[i % cols.length] += `M${f(cx - rr)},${f(cy)}l${f(rr)},${f(-rr * .8)}l${f(rr)},${f(rr * .8)}l${f(-rr * .6)},${f(rr)}Z`; }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// シブレット（小口切りの細ねぎ: 小さな緑の輪）
function wfChives(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'wfc' + seed + x);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; const seg = `M${f(cx - 1.6)},${f(cy)}a1.6,1.4 0 1 0 3.2,0a1.6,1.4 0 1 0 -3.2,0Z`; if (R() < .6) d1 += seg; else d2 += seg; }
    return `<path d="${d1}" fill="none" stroke="#4f9a34" stroke-width="1.1"/><path d="${d2}" fill="none" stroke="#7ab850" stroke-width="1.1"/>`;
}

// ディル（細い羽のような葉）
function wfDill(p, x, y, L, r = 0){
    let d = `M${-L / 2},0 Q0,${f(-L * .06)} ${L / 2},0`;
    for (let i = 0; i < 7; i++){ const t = -L / 2 + (i + .7) * L / 8; d += `M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(-L * .16)} M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(L * .14)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#3f7f2a" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
}

// いんげん（細長く、両端がすぼまる）
function wfBean(p, x, y, L, r = 0, { c = '#4f9a34', w = 4.4 } = {}){
    const h = w / 2;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .4)},${-h} ${f(-L * .3)},${-h} L${f(L * .34)},${-h} Q${f(L * .46)},${-h} ${L / 2},${f(-h * .3)} Q${f(L * .44)},${h} ${f(L * .32)},${h} L${f(-L * .3)},${h} Q${f(-L * .42)},${h} ${-L / 2},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/>
        <path d="M${f(-L * .28)},${f(-h * .4)} L${f(L * .28)},${f(-h * .4)}" stroke="${lt(c, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}

// トマトの輪切り
function wfTomSlice(p, x, y, s, r = 0){
    const k = s / 40;
    const ch = [0, 1, 2, 3].map(i => { const a = i * 90 + 45; return `<g transform="rotate(${a})"><path d="M5,-5 Q14,-9 14,0 Q14,9 5,5 Q7,0 5,-5Z" fill="#f79a6a" opacity=".9"/><circle cx="10" cy="-2.4" r="1.2" fill="#f6dc8a"/><circle cx="11" cy="2.2" r="1.2" fill="#f6dc8a"/></g>`; }).join('');
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><circle r="20" fill="${p.rg('#d8322a', .25, .2)}" stroke="#9e1d16" stroke-width=".7"/></g>
        <circle r="17.6" fill="${p.rg('#ee5640', .2, .15)}"/>${ch}<circle r="4.6" fill="#f6a890"/>
        <path d="M-13,-8 Q-6,-15 3,-15" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// レタスの葉（ふちの波打つ葉）
function wfLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468', sy = .72 } = {}){
    const R = rng(p.id + 'wfl' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .1); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s / 2 * sy]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="${lt(c, .6)}" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(i % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(i % 2 ? s * .24 : -s * .24)}" stroke="${lt(c, .5)}" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}

// 骨付き鶏ももの皮目（こんがり焼いて煮込んだ）
function wfThigh(p, x, y, s, r = 0, { c = '#d48c3c', seed = 1, sauce = null } = {}){
    const R = rng(p.id + 'wft' + seed + x);
    const pts = ring(1, 12, .16, R, s / 2, s * .36).map(([a, b]) => [a + (a > 0 ? 0 : a * .08), b * (a > s * .2 ? .82 : 1)]);
    let spots = '';
    for (let i = 0; i < 5; i++) spots += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .4)}" rx="${f(s * (.06 + R() * .08))}" ry="${f(s * (.04 + R() * .05))}" fill="${dk(c, .5)}" opacity="${f(.22 + R() * .2)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.g(c, .4, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .7 - s * .05, b * .6 - s * .06]))}" fill="${lt(c, .25)}" opacity=".45"/>
        <g ${wfBlur(p, 1.4)}>${spots}</g>
        <path d="M${f(s * .32)},${f(-s * .1)} Q${f(s * .52)},${f(-s * .04)} ${f(s * .56)},${f(s * .04)}" stroke="#efe3c8" stroke-width="${f(s * .1)}" stroke-linecap="round" fill="none"/>
        ${sauce ? `<path d="${smooth(pts.map(([a, b]) => [a * .9 + 2, b * .5 + s * .14]))}" fill="${sauce}" opacity=".55"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .08)},${f(-s * .3)} ${f(s * .18)},${f(-s * .24)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-s * .1)},${f(-s * .02)} Q${f(s * .02)},${f(-s * .08)} ${f(s * .12)},${f(-s * .05)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}

// ソーセージ（1本・ゆるく曲がる）
function wfSausage(p, x, y, L, W, r = 0, { c = '#b8664a', bend = 6 } = {}){
    const h = W / 2, b = bend;
    const d = `M${f(-L / 2 + h)},${f(-h)} Q0,${f(-h - b * 2)} ${f(L / 2 - h)},${f(-h)} A${h},${h} 0 0 1 ${f(L / 2 - h)},${f(h)} Q0,${f(h - b * 2)} ${f(-L / 2 + h)},${f(h)} A${h},${h} 0 0 1 ${f(-L / 2 + h)},${f(-h)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${d}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M${f(-L * .36)},${f(-h * .45)} Q0,${f(-h * .45 - b * 2)} ${f(L * .3)},${f(-h * .45)}" stroke="#fff" stroke-width="${f(W * .14)}" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M${f(-L * .3)},${f(h * .4)} Q0,${f(h * .4 - b * 2)} ${f(L * .34)},${f(h * .4)}" stroke="${dk(c, .3)}" stroke-width="${f(W * .12)}" fill="none" stroke-linecap="round" opacity=".35"/>
        <path d="M${f(-L / 2 + 2)},0 l-3,-1.5 M${f(L / 2 - 2)},0 l3,1.5" stroke="${dk(c, .4)}" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
// ソーセージの厚い輪切り（断面のピンクと脂の粒）
function wfSausageSlice(p, x, y, s, r = 0, { skin = '#a2553a', meat = '#e39a8a' } = {}){
    const R = rng(p.id + 'wfss' + x + y);
    let fat = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = R() * s * .3; fat += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.6 + R() * .7)}" fill="#f8e6dc"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g(skin, .2, .25)}" stroke="${dk(skin, .3)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.8)}" ry="${f(s * .46 - 1.8)}" fill="${p.rg(meat, .15, .15)}"/>${fat}
        <path d="M${f(-s * .28)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// 骨付きロース（ポークチョップ）: 上の辺に沿って骨、下の丸い縁に脂、こんがり焼いた赤身
function wfChop(p, x, y, s, r = 0, { c = '#c07a36', seed = 1 } = {}){
    const R = rng(p.id + 'wfch' + seed);
    const k = s / 70;
    const body = `M-32,-18 L30,-20 Q36,-19 36,-12 C37,4 28,20 8,24 C-10,27 -28,20 -33,6 Q-35,-10 -32,-18Z`;
    let spots = '';
    for (let i = 0; i < 8; i++) spots += `<ellipse cx="${f(-22 + R() * 46)}" cy="${f(-10 + R() * 24)}" rx="${f(3 + R() * 5)}" ry="${f(2 + R() * 3)}" fill="${dk(c, .55)}" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}><path d="${body}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <path d="M35,-8 C35,6 27,19 8,23 C-10,26 -27,19 -32,6" stroke="#f0d49a" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M35,-8 C35,6 27,19 8,23 C-10,26 -27,19 -32,6" stroke="#b98a44" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6" transform="translate(-1 -2.4)"/>
        <g ${wfBlur(p, 1.4)}>${spots}</g>
        <path d="M-31,-17.5 L31,-19.5 Q40,-20 41,-15 Q41,-10 35,-12 L-30,-11 Q-34,-14 -31,-17.5Z" fill="${p.g('#efe2c6', .25, .25)}" stroke="#b39a74" stroke-width=".7"/>
        <path d="M-26,-16 L30,-17.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
        <path d="M-20,-4 Q-2,-11 16,-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// パプリカの細切り（幅のある帯）
function wfPepStrip(p, x, y, L, r = 0, { c = '#d8301e', w = 6 } = {}){
    return `<g ${T(x, y, r)}><path d="M${-L / 2},${-w / 2} Q0,${-w / 2 - 3} ${L / 2},${-w / 2} Q${L / 2 + 1.5},0 ${L / 2},${w / 2} Q0,${w / 2 - 2} ${-L / 2},${w / 2} Q${-L / 2 - 1.5},0 ${-L / 2},${-w / 2}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-L * .36)},${f(-w * .2)} Q0,${f(-w * .5 - 2)} ${f(L * .34)},${f(-w * .2)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// マッシュルームの薄切り（かさ＋軸の断面）
function wfMush(p, x, y, s, r = 0, { c = '#d9c3a0', cooked = true } = {}){
    const col = cooked ? mix(c, '#a87a4a', .3) : c;
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-10,-8 0,-9 Q10,-8 10,0 Q6,1 3,1 L3,8 Q0,9.4 -3,8 L-3,1 Q-6,1 -10,0Z" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .35)}" stroke-width=".6"/>
        <path d="M-8,-1 Q-7,-6 0,-7 Q7,-6 8,-1" stroke="${lt(col, .35)}" stroke-width="1" fill="none"/></g>`;
}

// 型のふちが波形の白いキッシュ皿
function wfFlutedDish(p, R = 94){
    const pts = Array.from({ length: 72 }, (_, i) => { const a = i / 72 * 6.28, rr = R - (i % 2 ? 3.2 : 0); return [100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]; });
    return `<g ${p.sh(1.6)}><path d="${smooth(pts, true, .8)}" fill="${p.rg('#fbf9f3', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 9}" fill="${p.rg('#f2eee4', .08, .14, .6, .62)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}

// 長方形のグラタン皿（白い磁器）
function wfRectDish(p, { w = 184, h = 150, base = '#fbfaf6', rim = null } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${p.rg(base, .2, .14, .35, .3)}"/></g>
        ${rim ? `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="17" fill="none" stroke="${rim}" stroke-width="1.6"/>` : ''}
        <rect x="${x + 11}" y="${y + 11}" width="${w - 22}" height="${h - 22}" rx="12" fill="${p.rg(dk(base, .04), .05, .22, .6, .6)}"/>
        <path d="M${x + 14},${y + 34} Q${x + 14},${y + 13} ${x + 36},${y + 13}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}

// 木のまな板（パンを置く）
function wfBoard(p, { w = 182, h = 136, c = '#c99a64' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2, R = rng(p.id + 'board');
    let grain = '';
    for (let i = 0; i < 9; i++){ const yy = y + 10 + i * (h - 20) / 8 + (R() - .5) * 4; grain += `<path d="M${x + 8},${f(yy)} Q${f(x + w * .3)},${f(yy + (R() - .5) * 6)} ${f(x + w * .55)},${f(yy + (R() - .5) * 3)} T${x + w - 8},${f(yy + (R() - .5) * 4)}" stroke="${dk(c, .18)}" stroke-width="${f(.6 + R() * .7)}" fill="none" opacity=".45"/>`; }
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${p.g(c, .25, .2)}" stroke="${dk(c, .3)}" stroke-width="1"/></g>${grain}
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="12" fill="none" stroke="${lt(c, .35)}" stroke-width="1.4" opacity=".7"/>`;
}

// バゲット（クープの割れ目つき）
function wfBaguette(p, x, y, L, W, r = 0){
    const c = '#d48c38';
    const body = `M${-L / 2},0 C${-L / 2},${f(-W * .5)} ${f(-L * .42)},${-W / 2} ${f(-L * .3)},${-W / 2} L${f(L * .3)},${-W / 2} C${f(L * .42)},${-W / 2} ${L / 2},${f(-W * .5)} ${L / 2},0 C${L / 2},${f(W * .5)} ${f(L * .42)},${W / 2} ${f(L * .3)},${W / 2} L${f(-L * .3)},${W / 2} C${f(-L * .42)},${W / 2} ${-L / 2},${f(W * .5)} ${-L / 2},0Z`;
    let cuts = '';
    const n = 6;
    for (let i = 0; i < n; i++){
        const cx = -L * .36 + i * L * .72 / (n - 1);
        cuts += `<g transform="translate(${f(cx)} 0) rotate(-16)"><path d="M${f(-L * .1)},0 Q0,${f(-W * .3)} ${f(L * .1)},0 Q0,${f(W * .22)} ${f(-L * .1)},0Z" fill="${p.g('#eab868', .35, .15)}"/><path d="M${f(-L * .1)},0 Q0,${f(W * .22)} ${f(L * .1)},0" stroke="#9a5a1a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/><path d="M${f(-L * .07)},${f(-W * .06)} Q0,${f(-W * .2)} ${f(L * .06)},${f(-W * .08)}" stroke="#fbe2a8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><path d="${body}" fill="${p.g(c, .3, .35)}" stroke="#94561c" stroke-width=".9"/></g>
        <path d="M${f(-L * .44)},${f(W * .3)} L${f(L * .44)},${f(W * .3)}" stroke="#a0581a" stroke-width="${f(W * .2)}" stroke-linecap="round" opacity=".35"/>
        ${cuts}
        <path d="M${f(-L * .4)},${f(-W * .3)} L${f(L * .38)},${f(-W * .3)}" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" opacity=".55"/>
        ${K.sprinkle(p, 0, 0, W * .9, { c: '#fbf3e2', n: 12, r: .6 })}</g>`;
}
// バゲットの輪切り（皮とクラム）
function wfBreadSlice(p, x, y, s, r = 0){
    const R = rng(p.id + 'wfbs' + x + y);
    let holes = '';
    for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = R() * s * .3; holes += `<ellipse cx="${f(Math.cos(a) * d * 1.3)}" cy="${f(Math.sin(a) * d * .8)}" rx="${f(1 + R() * 1.8)}" ry="${f(.8 + R() * 1.2)}" fill="#dcc08a" opacity=".85"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${f(s * .62)}" ry="${f(s * .4)}" fill="${p.g('#c9822e', .25, .3)}" stroke="#94561c" stroke-width=".7"/></g>
        <ellipse rx="${f(s * .62 - 2.4)}" ry="${f(s * .4 - 2.4)}" fill="${p.rg('#f6e7c4', .25, .1)}"/>${holes}</g>`;
}

// じゃがいものピュレの表面（スプーンでならした筋）
function wfMashSwirl(p, x, y, R, { c = '#f3dc9a', seed = 1 } = {}){
    const Rn = rng(p.id + 'wfms' + seed);
    let lines = '';
    for (let i = 0; i < 6; i++){
        const rr = R * (.2 + i * .14), a0 = Rn() * 6.28, sw = 2.4 + Rn() * 1.8;
        const pts = Array.from({ length: 9 }, (_, j) => { const a = a0 + j / 8 * sw; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .92]; });
        const d = smooth(pts, false);
        lines += `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6" transform="translate(.8 1)"/><path d="${d}" stroke="${lt(c, .6)}" stroke-width="2" fill="none" stroke-linecap="round" transform="translate(-1.2 -1.4)" opacity=".95"/>`;
    }
    return `<path ${T(x, y)} d="${smooth(ring(R, 14, .12, Rn))}" fill="${p.rg(c, .35, .22, .4, .36)}" stroke="${dk(c, .2)}" stroke-width=".8"/>${lines}`;
}

// ---------- 料理 ----------
export default {
    // バゲット: 木のまな板に、クープの割れたバゲット1本と輪切り3枚
    fr_staple: p => [
        wfBoard(p),
        wfBaguette(p, 94, 90, 184, 34, -28),
        wfBreadSlice(p, 128, 140, 34, -10), wfBreadSlice(p, 152, 124, 32, 15), wfBreadSlice(p, 104, 150, 30, -25),
    ].join(''),

    // 鶏のバスク風煮込み: 赤いホーローの鍋に、トマトとパプリカのソース、こんがりした骨付き鶏もも、タイム
    fr_basquaise: p => {
        const R = rng('wfbasq');
        const strips = wfSpots('basq', 24, 60, 13).map(([x, y, r], i) => wfPepStrip(p, x, y, 26 + R() * 8, r, { c: ['#d8301e', '#3f8f2f', '#e8b223', '#d8301e'][i % 4] })).join('');
        return [
            K.bowl(p, { glaze: '#c9442a', inside: '#f2e7d6', lip: .86 }),
            K.liquid(p, { R: 70, c: '#c2441f', op: 1 }),
            `<circle cx="96" cy="94" r="50" fill="#d9603a" opacity=".35"/>`,
            `<g ${p.sh(.6)}>`, strips,
            ...[[72, 66, 30], [138, 140, -40], [60, 128, 70], [142, 72, 110]].map(([x, y, r]) => wfOnionStrip(p, x, y, 22, r)),
            `</g>`,
            wfThigh(p, 76, 96, 62, -20, { seed: 1 }),
            wfThigh(p, 126, 116, 62, 150, { seed: 2, c: '#cf8436' }),
            wfThigh(p, 112, 66, 52, 20, { seed: 3, c: '#d8923f' }),
            ...[[76, 96, 50], [126, 116, 50], [112, 66, 42]].map(([x, y, s], i) => `<g ${wfBlur(p, 2)}><ellipse cx="${x + 4}" cy="${y + 10}" rx="${s * .45}" ry="${s * .14}" fill="#b83a1c" opacity=".55"/></g>`),
            wfPepStrip(p, 98, 112, 28, 40, { c: '#d8301e' }), wfPepStrip(p, 90, 134, 26, -20, { c: '#3f8f2f' }), wfPepStrip(p, 142, 86, 26, 80, { c: '#e8b223' }), wfPepStrip(p, 62, 70, 24, -50, { c: '#d8301e' }),
            wfShine(100, 100, 70, .35),
            ...[[84, 80, 10], [130, 104, -30]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-9,0 L9,0" stroke="#5a6a3a" stroke-width=".8"/>${[-6, -2, 2, 6].map(t => `<ellipse cx="${t}" cy="-1.6" rx="1.6" ry=".9" fill="#5f8a3a"/><ellipse cx="${t + 1}" cy="1.6" rx="1.6" ry=".9" fill="#5f8a3a"/>`).join('')}</g>`),
            K.sprinkle(p, 100, 100, 110, { c: '#a3180c', n: 22, r: .7 }),
        ].join('');
    },

    // アッシ・パルマンティエ: 白い角形グラタン皿に、フォークの筋をつけて焼き色のついたマッシュポテト。手前の角をすくって、下のひき肉をのぞかせる
    fr_hachis: p => {
        const x0 = 22, y0 = 37, w = 156, h = 126;
        const cut = `M${x0 + w},${y0 + h - 48} L${x0 + w - 52},${y0 + h - 48} L${x0 + w - 52},${y0 + h}`;
        const top = `M${x0 + 10},${y0} L${x0 + w - 10},${y0} Q${x0 + w},${y0} ${x0 + w},${y0 + 10} L${x0 + w},${y0 + h - 48} L${x0 + w - 52},${y0 + h - 48} L${x0 + w - 52},${y0 + h} L${x0 + 10},${y0 + h} Q${x0},${y0 + h} ${x0},${y0 + h - 10} L${x0},${y0 + 10} Q${x0},${y0} ${x0 + 10},${y0}Z`;
        const clip = p.def('wfhc', id => `<clipPath id="${id}"><path d="${top}"/></clipPath>`);
        let ridges = '';
        for (let i = 0; i < 13; i++){
            const yy = y0 + 6 + i * 9.4;
            const j = i * 1.7, d = `M${x0 - 4},${yy} Q${x0 + 22},${f(yy - 4 - Math.sin(j) * 2)} ${x0 + 44},${f(yy + Math.cos(j) * 1.5)} T${x0 + 92},${f(yy + Math.sin(j + 1) * 2)} T${x0 + 140},${f(yy - Math.cos(j) * 2)} T${x0 + 188},${yy}`;
            ridges += `<path d="${d}" stroke="#a86c22" stroke-width="2.8" fill="none" opacity=".6" transform="translate(0 2.4)"/><path d="${d}" stroke="#fbe6a8" stroke-width="2.2" fill="none" opacity=".95"/>`;
        }
        return [
            wfRectDish(p, { w: 188, h: 158 }),
            `<rect x="${x0 + w - 54}" y="${y0 + h - 50}" width="56" height="52" rx="6" fill="${p.rg('#8a5530', .15, .2)}"/>`,
            K.mince(p, x0 + w - 26, y0 + h - 24, 46, { c: '#7a4626', n: 60, seed: 2 }),
            K.carrotRound(p, x0 + w - 36, y0 + h - 14, 7, {}), K.carrotRound(p, x0 + w - 14, y0 + h - 34, 6, {}),
            `<g ${p.sh(1)}><path d="${top}" fill="${p.g('#efc86a', .25, .25)}"/></g>`,
            `<g clip-path="url(#${clip})">`, ridges,
            `<g ${wfBlur(p, 4)}>`,
            ...[[50, 60, 18, 10], [96, 70, 22, 12], [142, 58, 16, 9], [64, 112, 20, 11], [108, 120, 16, 9], [140, 92, 14, 8], [44, 146, 14, 8]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#b0601a" opacity=".7"/>`),
            `</g>`,
            `</g>`,
            `<path d="${cut}" stroke="#f6e4b6" stroke-width="3.2" fill="none" stroke-linejoin="round"/>`,
            `<path d="${cut}" stroke="#c99a52" stroke-width="1" fill="none" stroke-linejoin="round" transform="translate(1.6 1.6)"/>`,
            wfHerbs(p, 84, 92, 90, { n: 22 }),
        ].join('');
    },

    // キッシュ・ロレーヌ: 白い波形のキッシュ皿、こんがりした生地のふち、焼き色のついた卵液、ところどころにベーコン。1切れ切り分けてある
    fr_quiche: p => {
        const R = rng('wfquiche');
        const crimp = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 6.28, rr = 77 + (i % 2 ? -2.4 : 1.4); return [100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]; });
        const a1 = -10 * Math.PI / 180, a2 = 34 * Math.PI / 180, Rw = 86;
        const wedge = `M100,100 L${f(100 + Math.cos(a1) * Rw)},${f(100 + Math.sin(a1) * Rw)} A${Rw},${Rw} 0 0 1 ${f(100 + Math.cos(a2) * Rw)},${f(100 + Math.sin(a2) * Rw)}Z`;
        const lard = Array.from({ length: 13 }, () => { const a = R() * 6.28, d = 10 + R() * 50; return [100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 180]; }).filter(([x, y]) => { const a = Math.atan2(y - 100, x - 100); return !(a > a1 - .12 && a < a2 + .12); });
        return [
            wfFlutedDish(p),
            `<g ${p.sh(1.2)}><path d="${smooth(crimp, true, .8)}" fill="${p.g('#d9a050', .3, .3)}" stroke="#a46a24" stroke-width=".8"/></g>`,
            `<circle cx="100" cy="100" r="68" fill="#c4802e" opacity=".6"/>`,
            `<circle cx="100" cy="100" r="66" fill="${p.rg('#f2cc62', .25, .18)}"/>`,
            `<g ${wfBlur(p, 3.5)}>`,
            ...[[78, 76, 14, 9], [120, 70, 12, 8], [72, 120, 16, 10], [114, 128, 14, 8], [96, 100, 10, 7], [134, 104, 10, 6], [62, 96, 8, 6]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#c47a26" opacity=".7"/>`),
            `</g>`,
            ...lard.map(([x, y, r]) => K.bacon(p, x, y, 11, 6, r)),
            `<circle cx="100" cy="100" r="66" fill="#f2cc62" opacity=".18"/>`,
            K.sprinkle(p, 100, 100, 120, { c: '#5a4030', n: 16, r: .5 }),
            `<path d="M52,82 Q60,58 84,48" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
            // 切り分けた1切れのあと
            `<path d="${wedge}" fill="${p.rg('#efebe0', .1, .12, .3, .5)}"/>`,
            `<path d="M100,100 L${f(100 + Math.cos(a1) * 76)},${f(100 + Math.sin(a1) * 76)} M100,100 L${f(100 + Math.cos(a2) * 76)},${f(100 + Math.sin(a2) * 76)}" stroke="#e8c160" stroke-width="3" stroke-linecap="round"/>`,
            `<path d="M100,100 L${f(100 + Math.cos(a2) * 76)},${f(100 + Math.sin(a2) * 76)}" stroke="#2b1607" stroke-width="3" opacity=".12" transform="translate(1.5 2)"/>`,
            `<path d="M${f(100 + Math.cos(a1) * 66)},${f(100 + Math.sin(a1) * 66)} L${f(100 + Math.cos(a1) * 77)},${f(100 + Math.sin(a1) * 77)} M${f(100 + Math.cos(a2) * 66)},${f(100 + Math.sin(a2) * 66)} L${f(100 + Math.cos(a2) * 77)},${f(100 + Math.sin(a2) * 77)}" stroke="#c7863a" stroke-width="3.4" stroke-linecap="round"/>`,
        ].join('');
    },

    // 鮭のポワレ: 白い皿に、焼き色のついた鮭の切り身、レモンバター、いんげん、レモン、ディル
    fr_saumon: p => [
        K.plate(p, { rim: '#9aa6ae' }),
        K.pool(p, 94, 106, 104, '#efcf74', { op: .7, seed: 1, sy: .7 }),
        `<g ${p.sh(.8)}>`,
        ...[[130, 64, -24], [138, 70, -30], [126, 72, -18], [144, 60, -36], [134, 78, -26], [120, 64, -14], [148, 76, -40], [128, 58, -22]].map(([x, y, r], i) => wfBean(p, x, y, 46 - (i % 3) * 4, r)),
        `</g>`,
        `<g ${p.sh(1.2)}>`, K.salmon(p, 86, 112, 104, -8), `</g>`,
        K.glaze(p, 86, 112, 70, '#f5d77e', { seed: 3, op: .35 }),
        wfDill(p, 82, 104, 30, -20), wfDill(p, 96, 118, 24, 30),
        K.lemon(p, 150, 120, 34, -70),
        K.sprinkle(p, 86, 112, 60, { c: '#2a2420', n: 14, r: .55 }),
    ].join(''),

    // ソーセージとレンズ豆の煮込み: 茶の土鍋に、緑のレンズ豆、にんじんの輪切り、燻製ソーセージ、パセリ
    fr_lentilles: p => [
        K.bowl(p, { glaze: '#7b4b2e', inside: '#e9dcc4' }),
        K.liquid(p, { R: 72, c: '#6a5a3a', op: 1, shine: false }),
        wfGrains(p, 100, 100, 140, { cols: ['#5e6040', '#4c4b33', '#77714a', '#6b5a3e'], n: 250, rx: 2.8, ry: 2.1, hi: .3, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...[[62, 84], [132, 62], [146, 124], [78, 140], [110, 92], [58, 116], [120, 146], [96, 58]].map(([x, y]) => K.carrotRound(p, x, y, 12, {})),
        `</g>`,
        wfSausage(p, 100, 118, 96, 25, -16, { c: '#9c5034', bend: 4 }),
        wfSausageSlice(p, 82, 76, 24, 20), wfSausageSlice(p, 110, 70, 24, -20), wfSausageSlice(p, 136, 92, 22, 40), wfSausageSlice(p, 60, 102, 20, 0),
        wfLeaf(p, 140, 132, 22, -40, { c: '#5f7a3a' }),
        wfHerbs(p, 100, 100, 110, { n: 20 }),
        wfShine(100, 100, 72, .3),
    ].join(''),

    // ハムとチーズのコキエット: 白い深皿に、小さなマカロニ、角切りハム、とろけたエメンタール、黒こしょう
    fr_coquillettes: p => {
        const R = rng('wfcoq');
        const mac = wfSpots('coq', 42, 62, 11).map(([x, y, r]) => K.macaroni(p, x, y, 13, r, { c: R() < .5 ? '#f2d688' : '#ecca72' })).join('');
        return [
            K.bowl(p, { glaze: '#f3efe6', inside: '#fbf9f3', lip: .9 }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#c94a3a" stroke-width="1.6" opacity=".8"/>`,
            `<g ${p.sh(.9)}><path d="${smooth(ring(68, 14, .08, R).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#ecd08a', .2, .2)}"/></g>`,
            mac,
            `<g ${p.sh(.5)}>`,
            ...wfSpots('coqh', 14, 56, 18).map(([x, y, r]) => K.ham(p, x, y, 11, 10, r)),
            `</g>`,
            K.glaze(p, 96, 96, 92, '#fbe7a6', { seed: 2, op: .45 }),
            `<g ${p.sh(.4)}>`, K.shreds(p, 100, 100, 70, { c: '#f8e8a8', n: 22, w: 2, len: .4, seed: 3, curve: .5 }), `</g>`,
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 34, r: .65 }),
        ].join('');
    },

    // 豚のマスタード煮: 白い皿に、焼き色のついた骨付きロース2枚、粒マスタード入りのクリームソース、マッシュルーム、いんげん
    fr_porcmoutarde: p => [
        K.plate(p),
        K.pool(p, 94, 108, 132, '#e9c96e', { op: .95, seed: 1, sy: .8 }),
        wfChop(p, 84, 80, 96, -12, { seed: 1 }),
        wfChop(p, 96, 128, 94, 6, { seed: 2, c: '#b87434' }),
        K.glaze(p, 90, 112, 60, '#f0d68a', { seed: 5, op: .55 }),
        `<g ${p.sh(.6)}>`, ...[[136, 82, 10], [148, 110, -30], [128, 106, 60], [60, 120, 160], [140, 136, 20]].map(([x, y, r]) => wfMush(p, x, y, 18, r)), `</g>`,
        wfGrains(p, 100, 110, 110, { cols: ['#b08632', '#8a6420'], n: 46, rx: 1.1, ry: .9, seed: 2, sy: .8 }),
        `<g ${p.sh(.7)}>`, ...[[150, 64, 70], [158, 72, 64], [144, 70, 76], [160, 58, 60]].map(([x, y, r]) => wfBean(p, x, y, 40, r)), `</g>`,
        wfHerbs(p, 92, 106, 70, { n: 12 }),
    ].join(''),

    // にんじんのラペ: 白い鉢に、細かくすりおろしたにんじんの山、パセリ、レモン
    fr_carottes: p => [
        K.bowl(p, { glaze: '#e8e2d4', inside: '#f8f5ee' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3c6a9a" stroke-width="1.4" opacity=".7"/>`,
        `<g ${p.sh(.8)}><path d="${smooth(ring(56, 14, .12, rng('wfcar')).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#d86a1c', .15, .3)}"/></g>`,
        K.shreds(p, 100, 100, 130, { c: '#e8761e', n: 72, w: 2.6, len: .24, seed: 1, curve: .7 }),
        K.shreds(p, 98, 98, 100, { c: '#f39236', n: 56, w: 2.4, len: .24, seed: 2, curve: .7 }),
        K.shreds(p, 94, 94, 70, { c: '#f9ad55', n: 40, w: 2.2, len: .26, seed: 3, curve: .7 }),
        K.glaze(p, 96, 96, 90, '#f6c46a', { seed: 1, op: .25 }),
        wfHerbs(p, 98, 98, 80, { n: 24 }),
        K.lemon(p, 140, 136, 30, -40),
    ].join(''),

    // トマトのサラダ: 白い皿に、輪切りのトマトを円く重ね、エシャロット、シブレット、オリーブオイル
    fr_tomates: p => [
        K.plate(p, { rim: '#3c6a9a' }),
        ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28 + .2; return wfTomSlice(p, 100 + Math.cos(a) * 46, 100 + Math.sin(a) * 46, 40, i * 40); }),
        ...Array.from({ length: 3 }, (_, i) => { const a = i / 3 * 6.28 + 1; return wfTomSlice(p, 100 + Math.cos(a) * 14, 100 + Math.sin(a) * 14, 38, i * 70); }),
        K.glaze(p, 100, 100, 120, '#c8c050', { seed: 1, op: .18 }),
        wfGrains(p, 100, 100, 110, { cols: ['#e8cde0', '#c9a0c0'], n: 40, rx: 1.6, ry: 1.2, seed: 3 }),
        wfChives(p, 100, 100, 110, { n: 30 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 26, r: .55 }),
        K.sprinkle(p, 100, 100, 100, { c: '#ffffff', n: 16, r: .8 }),
    ].join(''),

    // グリーンサラダ: 木のサラダボウルに、バタビアとサニーレタスの葉、ヴィネグレットのつや、エシャロットの輪
    fr_salade: p => {
        const R = rng('wfsal');
        const leaves = wfSpots('sal', 11, 52, 24).map(([x, y, r], i) => wfLettuce(p, x, y, 46 + R() * 14, r, { seed: i, c: ['#9fd060', '#7fbf4a', '#c4e07a', '#6aa83c'][i % 4] })).join('');
        return [
            K.bowl(p, { glaze: '#a8743e', inside: '#d8b07a', lip: .88 }),
            `<circle cx="100" cy="100" r="88" fill="none" stroke="#8a5a2c" stroke-width="1" opacity=".6"/>`,
            leaves,
            wfLettuce(p, 96, 98, 58, 30, { seed: 40, c: '#b6dc6c' }), wfLettuce(p, 112, 120, 50, -60, { seed: 41, c: '#8cc652' }),
            ...[[80, 84, 0], [124, 100, 40], [92, 132, -30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="6" transform="rotate(${r} ${x} ${y})" fill="none" stroke="#b57aa8" stroke-width="1.4" opacity=".9"/>`),
            K.glaze(p, 100, 104, 100, '#f2e2a0', { seed: 3, op: .15 }),
            K.sprinkle(p, 100, 100, 110, { c: '#fff7d0', n: 14, r: 1.1 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .5 }),
        ].join('');
    },

    // いんげんのペルシヤード: 白い楕円皿に、つやのあるいんげんの山、にんにくとパセリのみじん切り、バター
    fr_haricots: p => {
        const R = rng('wfhar');
        const beans = Array.from({ length: 90 }, (_, i) => { const x = 100 + (R() - .5) * 120, y = 100 + (R() - .5) * 80, L = 40 + R() * 14; return [x, y, L, -25 + (R() - .5) * 60]; }).filter(([x, y]) => ((x - 100) / 60) ** 2 + ((y - 100) / 40) ** 2 < 1).slice(0, 44);
        return [
            K.ovalDish(p, { rx: 94, ry: 70, rim: '#3c6a9a' }),
            `<g ${p.sh(.8)}>`, ...beans.map(([x, y, L, r], i) => wfBean(p, x, y, L, r, { c: i % 3 ? '#4a9632' : '#5fa83f', w: 6 })), `</g>`,
            K.glaze(p, 100, 100, 110, '#f6e08a', { seed: 1, op: .2 }),
            wfGrains(p, 100, 100, 100, { cols: ['#fbf6e6', '#efe2bc'], n: 40, rx: 1.6, ry: 1.2, seed: 2, sy: .7 }),
            wfHerbs(p, 100, 100, 100, { n: 24, cols: ['#2f7a22', '#4a9a32'] }),
            K.sprinkle(p, 100, 100, 100, { c: '#fff8d8', n: 18, r: 1 }),
        ].join('');
    },

    // ラタトゥイユ: テラコッタの鉢に、角切りのなす・ズッキーニ・赤パプリカをトマトで煮込み、バジル
    fr_ratatouille: p => {
        const items = wfSpots('rat', 44, 62, 12.5).map(([x, y, r], i) => {
            const t = i % 5;
            return t === 0 || t === 3 ? wfDice(p, x, y, 18, r, '#c99a5a', { skin: '#46224f' })
                : t === 1 ? wfDice(p, x, y, 17, r, '#cfd48c', { skin: '#3a7026' })
                : t === 2 ? K.pepperPiece(p, x, y, 19, r, { c: '#cc2a1a' })
                : wfOnionStrip(p, x, y, 18, r, { c: '#efc49a' });
        }).join('');
        return [
            K.bowl(p, { glaze: '#b8582e', inside: '#ead6b8' }),
            K.liquid(p, { R: 72, c: '#a8381a', op: 1 }),
            `<g ${p.sh(.6)}>`, items, `</g>`,
            ...[[80, 96], [124, 120], [112, 76], [70, 132], [140, 86]].map(([x, y], i) => K.glaze(p, x, y, 22, '#b53a1c', { seed: i + 3, op: .45 })),
            wfShine(100, 100, 72, .35),
            `<g ${p.sh(.5)}>`, wfLeaf(p, 104, 98, 26, -30, { c: '#3f9a33', w: .55 }), wfLeaf(p, 118, 108, 22, 40, { c: '#4aa83a', w: .55 }), wfLeaf(p, 96, 112, 18, 120, { c: '#3f9a33', w: .55 }), `</g>`,
            K.sprinkle(p, 100, 100, 120, { c: '#f2d460', n: 12, r: 1.2 }),
        ].join('');
    },

    // 自家製ピュレ: 白い鉢に、スプーンでならしたなめらかなじゃがいものピュレ、溶けかけのバター、ナツメグ
    fr_puree: p => [
        K.bowl(p, { glaze: '#5f7f98', inside: '#f7f3ea' }),
        `<g ${p.sh(1.2)}>`, wfMashSwirl(p, 100, 100, 64, { c: '#f2dc9e' }), `</g>`,
        `<path d="${smooth(ring(16, 9, .3, rng('wfpb')).map(([a, b]) => [a + 104, b + 96]))}" fill="#f8dc6a" opacity=".55"/>`,
        `<g ${p.sh(.6)}><rect x="94" y="86" width="20" height="17" rx="4" transform="rotate(-12 104 94)" fill="${p.g('#f9e48e', .4, .15)}" stroke="#d9b850" stroke-width=".6"/></g>`,
        `<path d="M96,90 L108,88" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`,
        K.sprinkle(p, 100, 100, 100, { c: '#8a5a2a', n: 14, r: .6 }),
        `<path d="M50,86 Q58,62 84,52" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // タブレ: 青緑の鉢に、クスクス、角切りトマトときゅうり、ミントの葉、レモン
    fr_taboule: p => [
        K.bowl(p, { glaze: '#5f9a8a', inside: '#eef2ea' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#ead08a', .2, .2)}"/></g>`,
        wfGrains(p, 100, 100, 136, { cols: ['#f2dc9a', '#e2c278', '#f8ebc0'], n: 190, rx: 1.6, ry: 1.2, seed: 1 }),
        `<g ${p.sh(.5)}>`,
        ...wfSpots('tab', 22, 58, 14).map(([x, y, r], i) => i % 2 ? wfDice(p, x, y, 9, r, '#e2402c') : wfDice(p, x, y, 9, r, '#cfe3a0', { skin: '#3f7a2a' })),
        `</g>`,
        `<g ${p.sh(.5)}>`, ...[[84, 82, -30], [120, 96, 40], [96, 124, 100], [130, 128, -60], [70, 112, 20]].map(([x, y, r]) => wfLeaf(p, x, y, 18, r, { c: '#3c9a40', w: .6 })), `</g>`,
        wfHerbs(p, 100, 100, 120, { n: 22 }),
        K.lemon(p, 140, 66, 30, 30),
    ].join(''),

    // ポロねぎとじゃがいものスープ: 白いスープ皿に、淡い緑がかったクリーム色のスープ、クレームフレッシュ、ポロねぎの輪切り、クルトン
    fr_poireaux: p => [
        K.bowl(p, { glaze: '#f3efe4', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#7a9a5a" stroke-width="1.8" opacity=".8"/>`,
        K.liquid(p, { R: 73, c: '#ddd59c', op: 1 }),
        `<circle cx="96" cy="94" r="48" fill="#ece6bc" opacity=".5"/>`,
        wfSwirl(p, 100, 100, 32, { turns: 1.3, w: 3.6 }),
        `<g ${p.sh(.5)}>`, ...[[70, 80, 15], [128, 74, 13], [136, 120, 15], [76, 128, 13], [112, 140, 12], [60, 104, 11]].map(([x, y, s]) => `<g ${T(x, y)}><ellipse rx="${s / 2}" ry="${s * .44}" fill="${p.g('#e8efc8', .2, .2)}" stroke="#9ab86a" stroke-width="1"/><ellipse rx="${s * .32}" ry="${s * .27}" fill="none" stroke="#b8cf8a" stroke-width=".9"/><ellipse rx="${s * .14}" ry="${s * .11}" fill="none" stroke="#c9da9a" stroke-width=".8"/></g>`), `</g>`,
        wfCrouton(p, 118, 98, 12, 10), wfCrouton(p, 92, 114, 11, -20), wfCrouton(p, 104, 76, 11, 30),
        wfChives(p, 100, 100, 90, { n: 16 }),
        wfShine(100, 100, 73, .45),
    ].join(''),

    // かぼちゃのポタージュ: 茶の鉢に、なめらかなオレンジのスープ、クレームフレッシュのうず、かぼちゃの種、黒こしょう
    fr_potiron: p => [
        K.bowl(p, { glaze: '#6d4a35', inside: '#f1e6d4' }),
        K.liquid(p, { R: 72, c: '#e8892a', op: 1 }),
        `<circle cx="96" cy="94" r="48" fill="#f3a548" opacity=".45"/>`,
        wfSwirl(p, 98, 100, 38, { turns: 1.5, w: 4.2 }),
        `<g ${p.sh(.4)}>`, ...[[118, 84, 30], [124, 92, -20], [112, 90, 70], [128, 80, 110], [82, 118, 40], [90, 124, -50]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4.2" ry="2.2" fill="${p.g('#6f8a3a', .3, .25)}" stroke="#4a5f22" stroke-width=".5"/></g>`), `</g>`,
        K.sprinkle(p, 100, 100, 100, { c: '#2a2420', n: 18, r: .6 }),
        wfShine(100, 100, 72, .45),
    ].join(''),
};
