// 江口 ひなた: 主食の絵（STAPLE_CHOICES の img と、各国の xx_staple）を斜め上35度に描き直したもの（基準書 docs/illustration_3q.md「7. 主食の器」）
// ご飯は茶碗に riceDome（オーナー採用の「ご飯=江口」の描き方）。ほかの国のご飯はその国の飯碗・皿に同じ山を盛る。
// パンは平皿・パンかご（布を敷く）・木の板。新しく藍・青は使わない（縁の線は朱・金・錆・緑・灰）。
// どの国の献立に並んでも浮かないよう、器は家庭でふつうに使うものにし、飾りは材料にあるものだけ。
import * as Q from '../kit3q.mjs';
const { f, T, rng, smooth, ring, lt, dk, mix, SY, SYF, CZ, SHADE, at, byDepth, eD } = Q;

// =========================================================
// 器
// =========================================================
// vessel と同じ胴の形（帯を描くときの切り抜き用）
function bodyD({ cx = 100, cy, rx, h, fx, belly = .62 }){
    const bx = fx + 14, by = cy + h, bry = bx * SY;
    return `M${f(cx - rx)},${f(cy)} C${f(cx - rx)},${f(cy + h * belly)} ${f(cx - bx - 10)},${f(by)} ${f(cx - bx * .6)},${f(by + bry * .8)} Q${f(cx)},${f(by + bry * 1.12)} ${f(cx + bx * .6)},${f(by + bry * .8)} C${f(cx + bx + 10)},${f(by)} ${f(cx + rx)},${f(cy + h * belly)} ${f(cx + rx)},${f(cy)}Z`;
}
// 外の四角から楕円を抜いた形で切る（口の上面より外だけを見せる）
const outside = (p, d) => `clip-path="url(#${p.def('eo' + d, id => `<clipPath id="${id}"><path clip-rule="evenodd" d="M-10,-10 H210 V210 H-10Z ${d}"/></clipPath>`)})"`;
const ringLine = (cx, cy, rx, c, w = 1.4, sy = SY) => `<path d="${eD(cx, cy, rx, rx * sy)}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
// 飯碗（藍なし）: 茶碗と同じ大きさ。edge は口の細い線、bands は胴の帯 [[口からの深さ, 太さ]]（色は edge）
function meshiwan(p, { outer = '#f4f0e6', lip = '#fbf9f3', inner = '#ece6d8', edge = null, bands = [], ...o } = {}){
    const g = { cx: 100, cy: 96, rx: 86, h: 52, fx: 30, ft: 7, belly: .62, ...o };
    const V = Q.vessel(p, { ...g, t: 3.4, outer, lip, inner, line: 'none', gloss: .6 });
    const body = bodyD(g);
    let add = edge ? ringLine(g.cx, g.cy, g.rx - 2.2, edge, 1.6) : '';
    const lipD = eD(g.cx, g.cy, g.rx, g.rx * SY);
    for (const [dy, w] of bands) add += `<g ${Q.clip(p, body)}><g ${outside(p, lipD)}><path d="M${f(g.cx - g.rx - 4)},${f(g.cy + dy)} A${f(g.rx + 4)},${f((g.rx + 4) * SY)} 0 0 0 ${f(g.cx + g.rx + 4)},${f(g.cy + dy)}" stroke="${edge}" stroke-width="${w}" fill="none"/></g></g>`;
    return { ...V, s: V.s + add };
}
// 鋼の器（韓国のご飯の器・ステンレス）: 灰の金属。口に細い灰の線
function steelBowl(p, o = {}){
    const V = Q.vessel(p, { cx: 100, cy: 92, rx: 84, h: 50, fx: 34, ft: 4, t: 2.4, outer: '#b7bcc2', lip: '#e2e5e8', inner: '#cfd3d8', line: 'none', belly: .7, gloss: .85, ...o });
    return { ...V, s: V.s + ringLine(100, o.cy ?? 92, (o.rx ?? 84) - 1.2, '#8c9298', 1) };
}
// 平皿（藍なし）。edge で縁の細い線（朱・金・緑・錆）
const dish = (p, edge = '#c8a050', o = {}) => Q.plate(p, { line: 'none', edge, ...o });
// 籐のパンかご: 低い胴に編み目。cloth で布を敷き（手前の口に布の端を垂らす）、check で格子の布
function basket(p, { c = '#b98a4e', cloth = '#f3ecdc', check = null, stripe = null, flap = true, cy = 98, rx = 86, h = 28, fx = 58 } = {}){
    const cx = 100, g = { cx, cy, rx, h, fx, belly: .4 };
    const V = Q.vessel(p, { ...g, ft: 0, t: 5, outer: c, lip: lt(c, .12), inner: dk(c, .2), line: 'none', gloss: .25 });
    const body = bodyD(g);
    // 編み目: 横の段（交互にずらした破線）と縦の芯
    let weave = '';
    for (let i = 0; i < 9; i++){ const dy = 4 + i * 4.2; weave += `<path d="M${f(cx - rx - 6)},${f(cy + dy)} A${f(rx + 6)},${f((rx + 6) * SY)} 0 0 0 ${f(cx + rx + 6)},${f(cy + dy)}" stroke="${dk(c, .35)}" stroke-width="1" fill="none" stroke-dasharray="5 3" stroke-dashoffset="${i % 2 ? 4 : 0}" opacity=".7"/>`; }
    for (let i = -12; i <= 12; i++){ const x = cx + i * 8; weave += `<path d="M${f(x)},${f(cy)} L${f(cx + (x - cx) * .8)},${f(cy + h + 30)}" stroke="${lt(c, .2)}" stroke-width=".8" opacity=".35"/>`; }
    const rim = `<path d="${eD(cx, cy, rx - 2, (rx - 2) * SY)}" fill="none" stroke="${dk(c, .3)}" stroke-width="4.6" stroke-dasharray="3.4 2.2" opacity=".55"/>`;
    let s = V.s + `<g ${Q.clip(p, body)}><g ${outside(p, eD(cx, cy, rx, rx * SY))}>${weave}</g></g>` + rim;
    // 布（口の中を覆い、奥の端は立ち上がり、手前の端は口から垂れる）
    let back = '', front = '';
    if (cloth){
        const fill = Q.lg(p, [[0, lt(cloth, .25)], [.6, cloth], [1, dk(cloth, .12)]], 0, 0, 1, 1);
        const pat = check ? `url(#${p.def('gh' + check, id => `<pattern id="${id}" width="12" height="7" patternUnits="userSpaceOnUse"><rect width="12" height="7" fill="${cloth}"/><rect width="6" height="7" fill="${check}" opacity=".55"/><rect width="12" height="3.5" fill="${check}" opacity=".55"/></pattern>`)})` : null;
        const lp = Array.from({ length: 48 }, (_, i) => { const t = i / 48 * 6.283, sn = Math.sin(t), k = sn < 0 ? -sn : 0; return [cx + Math.cos(t) * (rx - 7), cy - 1 + sn * (rx - 7) * SY - k * 18 - k * Math.sin(t * 5) * 4]; });
        const liner = smooth(lp, true, .9);
        back = `<path d="${liner}" fill="${pat || fill}" stroke="${dk(cloth, .25)}" stroke-width=".7"/>` + (pat ? `<path d="${liner}" fill="${Q.lg(p, [[0, '#fff', .25], [.5, '#fff', 0], [1, SHADE, .18]], 0, 0, 1, 1)}"/>` : '') +
            `<path d="${liner}" fill="${Q.lg(p, [[0, SHADE, .3], [.45, SHADE, .08], [1, '#fff', .15]], 0, 0, .3, 1)}"/>` +
            (stripe ? `<path d="M${f(cx - rx + 16)},${f(cy - 16)} Q${f(cx)},${f(cy - 64)} ${f(cx + rx - 16)},${f(cy - 18)}" stroke="${stripe}" stroke-width="2.2" fill="none" opacity=".75"/>` : '');
        if (flap){
            const a1 = 2.0, a2 = 2.75, P = a => [cx + Math.cos(a) * (rx + 1), cy + Math.sin(a) * (rx + 1) * SY];
            const [x1, y1] = P(a1), [x2, y2] = P(a2);
            const d = `M${f(x1)},${f(y1)} Q${f(x1 - 4)},${f(y1 + 18)} ${f(x1 - 10)},${f(y1 + 30)} L${f(x2 + 4)},${f(y2 + 26)} Q${f(x2 - 2)},${f(y2 + 12)} ${f(x2)},${f(y2)} A${f(rx + 1)},${f((rx + 1) * SY)} 0 0 0 ${f(x1)},${f(y1)}Z`;
            front = Q.dropOf(p, d, 1.6, 2.4, .25) + `<path d="${d}" fill="${pat || fill}" stroke="${dk(cloth, .25)}" stroke-width=".7"/>` + (pat ? `<path d="${d}" fill="${SHADE}" opacity=".08"/>` : '') +
                (stripe ? `<path d="M${f(x1 - 8)},${f(y1 + 22)} L${f(x2 + 3)},${f(y2 + 19)}" stroke="${stripe}" stroke-width="2.2" opacity=".75"/>` : '') +
                `<path d="M${f(x1 - 10)},${f(y1 + 30)} L${f(x2 + 4)},${f(y2 + 26)}" stroke="${dk(cloth, .3)}" stroke-width="1" stroke-dasharray="1.6 1.6" opacity=".6"/>`;
        }
    }
    return { ...V, s: s + back, front, cx, cy };
}
// 木の板（パン・ポレンタ）: 角丸の板（slabPlate を木の色に）。木目は板の面に
function board(p, { c = '#c89458', w = 184, d = 128, r = 16, h = 10 } = {}){
    const D = Q.slabPlate(p, { w, d, r, h, base: c, line: 'none' }), R = rng(p.id + 'bd');
    let grain = '';
    for (let i = 1; i < 8; i++){ const v = -d / 2 + i * d / 8, k = (R() - .5) * 6; grain += `<path d="M${f(-w / 2 + 10)},${f(v)} Q${f(-20)},${f(v + k)} ${f(10)},${f(v - k * .5)} T${f(w / 2 - 10)},${f(v + k * .3)}" stroke="${dk(c, .22)}" stroke-width="1.2" fill="none" vector-effect="non-scaling-stroke" opacity=".35"/>`; }
    return { ...D, s: D.s + `<g transform="translate(100 ${f(D.cy)}) scale(1 ${SYF})">${grain}</g>` };
}
// せいろ（竹の蒸し器）: まっすぐな円筒の胴に竹の帯、口の中に簀（す）
function seiro(p, { cx = 100, cy = 96, rx = 88, h = 34 } = {}){
    const ry = rx * SY, c = '#d4b070', irx = rx - 6, iry = irx * SY, mouth = eD(cx, cy + 1, irx, iry);
    const side = `M${f(cx - rx)},${f(cy)} L${f(cx - rx)},${f(cy + h)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(cy + h)} L${f(cx + rx)},${f(cy)}Z`;
    let s = Q.ground(p, cx, cy + h + ry * .55, rx * .95);
    s += `<path d="${side}" fill="${Q.lg(p, [[0, lt(c, .3)], [.3, lt(c, .08)], [.75, c], [1, dk(c, .38)]])}" stroke="${dk(c, .45)}" stroke-width=".7"/>`;
    // 竹の帯（上下）と、縦の継ぎ目
    for (const dy of [5, h - 5]) s += `<g ${Q.clip(p, side)}><path d="M${f(cx - rx - 2)},${f(cy + dy)} A${f(rx + 2)},${f((rx + 2) * SY)} 0 0 0 ${f(cx + rx + 2)},${f(cy + dy)}" stroke="${dk(c, .3)}" stroke-width="5" fill="none" opacity=".55"/><path d="M${f(cx - rx - 2)},${f(cy + dy - 1.6)} A${f(rx + 2)},${f((rx + 2) * SY)} 0 0 0 ${f(cx + rx + 2)},${f(cy + dy - 1.6)}" stroke="${lt(c, .35)}" stroke-width="1" fill="none" opacity=".7"/></g>`;
    for (const a of [2.3, 1.15]) { const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; s += `<path d="M${f(x)},${f(y + 8)} L${f(x)},${f(y + h - 8)}" stroke="${dk(c, .35)}" stroke-width="1.4"/><circle cx="${f(x - 3)}" cy="${f(y + h / 2)}" r="1.2" fill="${dk(c, .5)}"/><circle cx="${f(x + 3)}" cy="${f(y + h / 2)}" r="1.2" fill="${dk(c, .5)}"/>`; }
    s += `<path d="M${f(cx - rx + 8)},${f(cy + 8)} L${f(cx - rx + 9)},${f(cy + h - 6)}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
    s += `<path d="${eD(cx, cy, rx, ry)}" fill="${Q.lg(p, [[0, lt(c, .3)], [1, dk(c, .1)]])}" stroke="${dk(c, .45)}" stroke-width=".7"/>`;
    // 口の中: 簀（す）の板
    let slats = '';
    for (let i = -8; i <= 8; i++){ const y = cy + 4 + i * 4.4; slats += `<path d="M${f(cx - irx)},${f(y)} L${f(cx + irx)},${f(y)}" stroke="${dk(c, .3)}" stroke-width="1" opacity=".55"/>`; }
    s += `<path d="${mouth}" fill="${Q.lg(p, [[0, dk('#e6cf98', .3)], [.5, '#e6cf98'], [1, lt('#e6cf98', .15)]], 0, 0, 0, 1)}"/><g ${Q.clip(p, mouth)}>${slats}<path d="${eD(cx - 6, cy - 2, irx + 2, iry + 2)}" fill="none" stroke="${SHADE}" stroke-width="10" opacity=".2" ${Q.blur(p, 2.5)}/></g>`;
    const aboveD = `M${f(cx - irx)},${f(cy + 1)} A${f(irx)},${f(iry)} 0 0 0 ${f(cx + irx)},${f(cy + 1)} L200,${f(cy + 1)} L200,0 L0,0 L0,${f(cy + 1)}Z`;
    return { s, cx, cy, rx, ry, irx, iry, inside: Q.clip(p, mouth), above: Q.clip(p, aboveD) };
}

// =========================================================
// ご飯・粒の山
// =========================================================
// riceDome（kit3q）と同じ形で、粒の色を変えられるもの（玄米・雑穀・赤米・ブルグル・そばの実）。
// pal = [明るい, ふつう, 陰, いちばん陰], line = 粒の縁、mixes = [[色, 割合, 大きさ]] は混ぜる粒（黒米・きび・豆など）
const prof = q => Math.pow(Math.max(0, 1 - q), .62);
function grainDome(p, cx, cy, rx, ry, H, { pal = ['#ffffff', '#faf7ef', '#f0ebdd', '#e4dcc8'], line = '#e4ddca', base = null, mixes = [], n = 560, seed = 1, size = 1, rim = '#bfb397' } = {}){
    const R = rng(p.id + 'gd' + seed);
    const top = []; for (let i = 0; i <= 40; i++){ const u = -1 + 2 * i / 40; top.push([cx + u * rx, cy - H * prof(u * u) - Math.sqrt(Math.max(0, 1 - u * u)) * ry * .25]); }
    const outline = `M${f(cx - rx)},${f(cy)} ${top.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z`;
    const gs = [];
    for (let i = 0; i < n; i++){
        const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d, v = Math.sin(a) * d, z = H * prof(d * d), gu = u * 1.6, gv = v * 1.2 - .7;
        const l = -(gu * .7 + gv * .7) / Math.hypot(gu, gv, 1) + .2, m = R();
        let mixC = null, ms = 1; for (let k = 0, acc = 0; k < mixes.length; k++){ acc += mixes[k][1]; if (m < acc){ mixC = mixes[k][0]; ms = mixes[k][2] || 1; break; } }
        gs.push({ x: cx + u * rx * .98, y: cy + v * ry - z, v, l, sc: (.82 + .25 * (v + 1) / 2) * size * ms, r: R() * 180, mixC });
    }
    gs.sort((a, b) => a.v - b.v);
    const g = gs.map(({ x, y, l, sc, r, mixC }) => {
        const c = mixC ? (l > .3 ? lt(mixC, .25) : l > -.3 ? mixC : dk(mixC, .2)) : (l > .45 ? pal[0] : l > .05 ? pal[1] : l > -.3 ? pal[2] : pal[3]);
        return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2.5 * sc)}" ry="${f(1.35 * sc)}" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${c}" stroke="${mixC ? dk(mixC, .3) : l > .05 ? line : dk(line, .1)}" stroke-width=".4"/>`;
    }).join('');
    const b = base || [pal[0], pal[1], dk(pal[3], .06)];
    return `<path d="${outline}" fill="${Q.rg(p, [[0, b[0]], [.55, b[1]], [1, b[2]]], .38, .3, .75)}"/>${g}
        <path d="${outline}" fill="${Q.lg(p, [[0, SHADE, 0], [.5, SHADE, 0], [1, SHADE, .2]], 0, 0, 1, 1)}"/>
        <path d="M${f(cx - rx)},${f(cy)} ${top.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)}" fill="none" stroke="${rim}" stroke-width="1.2" opacity=".75"/>`;
}
// 山の表面の点（u, v は -1〜1）
const onDome = (cx, cy, rx, ry, H, u, v, lift = 0) => [cx + u * rx * .98, cy + v * ry - H * prof(u * u + v * v) - lift];
// 山の上に散らす（重ならないように）。draw(x, y, i, r)
function sprinkle(seed, n, minD, cx, cy, rx, ry, H, draw, { k = .82, lift = 1 } = {}){
    const R = rng('spk' + seed), pts = [];
    let d = minD, tries = 0;
    while (pts.length < n && tries < 6000){ tries++; const a = R() * 6.283, rr = Math.sqrt(R()) * k, u = Math.cos(a) * rr, v = Math.sin(a) * rr; if (pts.every(q => Math.hypot((q[0] - u) * rx, (q[1] - v) * rx) >= d)) pts.push([u, v, R()]); if (tries % 500 === 0) d *= .9; }
    return pts.sort((a, b) => a[1] - b[1]).map(([u, v, r], i) => { const [x, y] = onDome(cx, cy, rx, ry, H, u, v, lift); return draw(x, y, i, r); }).join('');
}
// 白いご飯（kit3q の riceDome そのもの）
const rice = (p, cx, cy, rx, ry, H, o = {}) => Q.riceDome(p, cx, cy, rx, ry, H, o);
// 照り（ご飯の左上の白い弧）
const riceShine = (cx, cy, rx, H, op = .55) => `<path d="M${f(cx - rx * .62)},${f(cy - H * .55)} Q${f(cx - rx * .5)},${f(cy - H * .95)} ${f(cx - rx * .12)},${f(cy - H * 1.02)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 茶碗に盛ったご飯（基準: 口の中心＋2、高さ 44〜46）
function inChawan(p, V, H, dome){ return V.s + `<g ${V.above}>${dome(100, V.cy + 2, V.irx - 1, V.iry, H)}</g>`; }

// =========================================================
// パン
// =========================================================
// 面の座標の多角形を高さ h で立ち上げる（prism の縦の比を変えられるもの。皿・板の上は SYF）
function block(p, x, y, pts, h, c, { rot = 0, top = null, side = null, line = .6, sy = SYF, stroke = null } = {}){
    const a = rot * Math.PI / 180, P2 = pts.map(([u, v]) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]);
    const pr = ([u, v], z) => [x + u, y + v * sy - z * CZ];
    const n = P2.length; let area = 0; for (let i = 0; i < n; i++){ const [u1, v1] = P2[i], [u2, v2] = P2[(i + 1) % n]; area += u1 * v2 - u2 * v1; }
    const sg = area > 0 ? 1 : -1, sc = side || c, ln = stroke || dk(sc, .45);
    const out = [Q.dropOf(p, 'M' + P2.map(q => pr(q, 0).map(f).join(',')).join('L') + 'Z', 2, 2.4, .32, 1.6)];
    for (let i = 0; i < n; i++){
        const A = P2[i], B = P2[(i + 1) % n], du = B[0] - A[0], dv = B[1] - A[1], nu = dv * sg, nv = -du * sg, L = Math.hypot(nu, nv);
        if (nv / L <= .02) continue;
        const col = mix(lt(sc, .04), dk(sc, .36), (.5 + .5 * nu / L) * .9);
        const q = [pr(A, h), pr(B, h), pr(B, 0), pr(A, 0)];
        out.push(`<path d="M${q.map(([u, v]) => `${f(u)},${f(v)}`).join('L')}Z" fill="${col}" stroke="${col}" stroke-width=".5" stroke-linejoin="round"/>`);
    }
    const tp = P2.map(q => pr(q, h)), td = `M${tp.map(([u, v]) => `${f(u)},${f(v)}`).join('L')}Z`;
    out.push(`<path d="${td}" fill="${top || Q.lit(p, c)}" stroke="${ln}" stroke-width="${line}" stroke-linejoin="round"/>`);
    return { s: out.join(''), top: td, tp };
}
// なめらかな多角形（パンの形）を点に
const loafPts = (w, d, k = .62) => {   // 食パンの形（上が丸い山）
    const pts = [];
    for (let i = 0; i <= 10; i++){ const t = Math.PI + i / 10 * Math.PI; pts.push([Math.cos(t) * w / 2, -d * .18 + Math.sin(t) * d * .32 * (1 + (k - .62))]); }
    pts.push([w / 2, d * .14], [w * .48, d / 2], [-w * .48, d / 2], [-w / 2, d * .14]);
    return pts;
};
const ovalPts = (w, d, n = 18, seed = 0, jit = 0) => { const R = rng('ov' + seed); return Array.from({ length: n }, (_, i) => { const t = i / n * 6.283, k = 1 - jit / 2 + R() * jit; return [Math.cos(t) * w / 2 * k, Math.sin(t) * d / 2 * k]; }); };
// 切ったパン（寝かせた1枚）: 中身の面と、耳（縁の濃い帯）。toast で焼き色
function breadSlice(p, x, y, pts, rot, { crumb = '#f3e2bc', crust = '#b8732e', th = 4, toast = 0, sy = SYF, holes = 8, seed = 1 } = {}){
    const c = toast ? mix(crumb, '#d99a48', toast) : crumb;
    const b = block(p, x, y, pts, th, c, { rot, sy, side: crust, top: Q.rg(p, [[0, lt(c, .2)], [.7, c], [1, dk(c, toast ? .2 : .08)]], .4, .35, .75), stroke: dk(crust, .2), line: .8 });
    const R = rng(p.id + 'bh' + seed);
    // 耳: 上の面の縁を crust で太くなぞる（内側だけ見えるよう切り抜く）
    let s = b.s + `<g ${Q.clip(p, b.top)}><path d="${b.top}" fill="none" stroke="${crust}" stroke-width="5.2" stroke-linejoin="round"/><path d="${b.top}" fill="none" stroke="${lt(crust, .25)}" stroke-width="1.2" stroke-linejoin="round" opacity=".5" transform="translate(-.6 -.6)"/>`;
    // 気泡
    const cx = b.tp.reduce((a, q) => a + q[0], 0) / b.tp.length, cy = b.tp.reduce((a, q) => a + q[1], 0) / b.tp.length;
    const ext = Math.max(...b.tp.map(q => Math.abs(q[0] - cx)));
    for (let i = 0; i < holes; i++){ const u = (R() - .5) * ext * 1.2, v = (R() - .5) * ext * .7 * sy; s += `<ellipse cx="${f(cx + u)}" cy="${f(cy + v)}" rx="${f(1 + R() * 1.2)}" ry="${f(.6 + R() * .5)}" fill="${dk(c, .18)}" opacity=".55"/>`; }
    return s + `</g>`;
}
// まるいパン（ロールパン・パンデサル・ボリーリョ・バゲット・マントウ）: 面の楕円（w × d、rot 度）を、高さ h のふくらみで立ち上げる。
// 輪郭は「底の楕円」と「持ち上げた楕円」の外形。上の面は左上が明るい。slit: 切れ目の数（縦の切れ目 / 斜めのクープ）
function bun(p, x, y, w, d, h, rot, { c = '#d99a4e', top = null, sy = SYF, slit = 0, coupe = 0, crumbs = 0, flour = 0, seed = 1, line = null, gloss = .5 } = {}){
    const a = rot * Math.PI / 180, N = 36, R = rng(p.id + 'bun' + seed);
    const P = (t, z) => { const u = Math.cos(t) * w / 2, v = Math.sin(t) * d / 2; return [x + u * Math.cos(a) - v * Math.sin(a), y + (u * Math.sin(a) + v * Math.cos(a)) * sy - z * CZ]; };
    // 外形: 各 t で底と持ち上げた点のうち上の方 → 上半分は持ち上げた楕円、下半分は底の楕円
    const outline = [];
    for (let i = 0; i < N; i++){ const t = i / N * 6.283, b = P(t, 0), l = P(t, h * .92); const back = l[1] < b[1] - h * CZ * .5; outline.push(b[1] - y > 0 ? (back ? l : b) : l); }
    const d0 = smooth(outline, true, .9);
    const topC = top || lt(c, .2), line2 = line || dk(c, .4);
    const body = `<path d="${d0}" fill="${Q.rg(p, [[0, lt(topC, .32)], [.45, c], [.85, dk(c, .22)], [1, dk(c, .4)]], .36, .26, .78)}" stroke="${line2}" stroke-width=".8"/>`;
    // 底のくびれ（下の縁を暗く）
    const lower = `<path d="${d0}" fill="${Q.lg(p, [[0, SHADE, 0], [.62, SHADE, 0], [1, SHADE, .22]], 0, 0, 0, 1)}"/>`;
    let s = Q.dropOf(p, smooth(Array.from({ length: N }, (_, i) => P(i / N * 6.283, 0)), true, .9), 2.4, 2.6, .34, 2) + body + lower;
    const cxy = [x, y - h * CZ];
    const along = (k, z = 1) => { const u = k * w / 2 * .78, v = 0; return [x + u * Math.cos(a) - v * Math.sin(a), y + (u * Math.sin(a)) * sy - h * CZ * z * Math.sqrt(Math.max(0, 1 - k * k * .7))]; };
    if (slit){   // 縦に1本（ボリーリョ・バインミー）
        const q = Array.from({ length: 9 }, (_, i) => along(-.8 + i * .2, .98));
        s += `<path d="M${q.map(pt => pt.map(f).join(',')).join('L')}" stroke="${lt(c, .5)}" stroke-width="${slit}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${q.map(pt => [pt[0] + .8, pt[1] + 1.4].map(f).join(',')).join('L')}" stroke="${dk(c, .35)}" stroke-width=".9" fill="none" opacity=".6"/>`;
    }
    if (coupe){  // 斜めのクープ（バゲット）
        for (let i = 0; i < coupe; i++){ const k = -.7 + i * 1.4 / Math.max(1, coupe - 1); const [px, py] = along(k, .96); const g = `<g ${T(px, py, rot + 28)}><path d="M-${f(w / coupe * .36)},0 Q0,-2 ${f(w / coupe * .36)},0" stroke="${lt(c, .55)}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-${f(w / coupe * .34)},1.2 Q0,-.6 ${f(w / coupe * .34)},1.2" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".7"/></g>`; s += g; }
    }
    if (crumbs){ let g = ''; for (let i = 0; i < crumbs; i++){ const t = R() * 6.283, r = Math.sqrt(R()) * .85, u = Math.cos(t) * r * w / 2, v = Math.sin(t) * r * d / 2, z = h * Math.sqrt(Math.max(0, 1 - r * r)); const px = x + u * Math.cos(a) - v * Math.sin(a), py = y + (u * Math.sin(a) + v * Math.cos(a)) * sy - z * CZ; g += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(.5 + R() * .6)}" fill="${R() < .5 ? '#f3dcae' : dk(c, .3)}" opacity=".9"/>`; } s += `<g ${Q.clip(p, d0)}>${g}</g>`; }
    if (flour){ s += `<ellipse cx="${f(cxy[0] - w * .08)}" cy="${f(cxy[1] + 2)}" rx="${f(w * .22)}" ry="${f(d * .14)}" fill="#fff" opacity="${flour}" ${Q.blur(p, 1.6)}/>`; }
    // 照り
    s += `<path d="M${f(cxy[0] - w * .32)},${f(cxy[1] + d * sy * .12)} Q${f(cxy[0] - w * .22)},${f(cxy[1] - d * sy * .1)} ${f(cxy[0] + w * .02)},${f(cxy[1] - d * sy * .14)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${gloss}" transform="rotate(${f(rot * .6)} ${f(cxy[0])} ${f(cxy[1])})"/>`;
    return s;
}
// 平たいパンの重なり（ロティ・トルティーヤ・アエーシ）: n 枚を少しずつずらして重ね、いちばん上に焼き目
function flatStack(p, x, y, r, n, { c = '#e7c88f', edge = null, spot = '#a8692c', spots = 14, th = 2.2, sy = SY, seed = 1, dx = 1.2, puff = 0 } = {}){
    const R = rng(p.id + 'fs' + seed);
    let s = Q.cast(p, x + 2, y + 3, r * 1.04, r * sy * .9, .3);
    for (let i = 0; i < n; i++){
        const ox = x + (i - n + 1) * dx * (R() < .5 ? 1 : -1) * .6, oy = y - i * th * CZ, d = smooth(ring(r, 18, .035, rng(p.id + 'fl' + seed + i), 1, sy));
        s += `<path d="${d}" transform="translate(${f(ox)} ${f(oy + th * CZ)})" fill="${dk(edge || c, .3)}"/>`;
        s += `<path d="${d}" transform="translate(${f(ox)} ${f(oy)})" fill="${i === n - 1 ? Q.rg(p, [[0, lt(c, .22)], [.65, c], [1, dk(c, .14)]], .4, .35, .75) : mix(c, dk(edge || c, .2), .4)}" stroke="${dk(edge || c, .35)}" stroke-width=".7"/>`;
        if (i === n - 1){
            let g = '';
            for (let k = 0; k < spots; k++){ const t = R() * 6.283, dd = Math.sqrt(R()) * r * .82, sr = 1.4 + R() * 3; g += `<ellipse cx="${f(ox + Math.cos(t) * dd)}" cy="${f(oy + Math.sin(t) * dd * sy)}" rx="${f(sr)}" ry="${f(sr * sy * .9)}" fill="${spot}" opacity="${f(.3 + R() * .4)}"/>`; }
            if (puff) g += `<ellipse cx="${f(ox - r * .2)}" cy="${f(oy - r * sy * .15)}" rx="${f(r * .45)}" ry="${f(r * sy * .32)}" fill="#fff" opacity="${puff}" ${Q.blur(p, 3)}/>`;
            s += g + `<path d="M${f(ox - r * .7)},${f(oy - r * sy * .2)} Q${f(ox - r * .4)},${f(oy - r * sy * .7)} ${f(ox + r * .05)},${f(oy - r * sy * .8)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
        }
    }
    return s;
}
// 半分に折った平たいパン（立てかけたもの）: 面の上で、折り目を奥にした半円
function foldedFlat(p, x, y, r, rot, { c = '#e7c88f', spot = '#a8692c', sy = SY, seed = 1, lift = 14 } = {}){
    const R = rng(p.id + 'ff' + seed), a = rot * Math.PI / 180;
    const pts = []; for (let i = 0; i <= 16; i++){ const t = Math.PI + i / 16 * Math.PI, u = Math.cos(t) * r, v = Math.sin(t) * r; pts.push([u, v]); }
    // 折り目（直線）は面に、弧は持ち上がる
    const scr = ([u, v], z) => [x + u * Math.cos(a) - v * Math.sin(a) * .2, y + (u * Math.sin(a)) * sy - z];
    const P = pts.map(([u, v], i) => scr([u, 0], -v / r * lift + 0 * i));
    const d = `M${P.map(q => q.map(f).join(',')).join('L')}Z`;
    let g = ''; for (let k = 0; k < 7; k++){ const t = Math.PI + R() * Math.PI, dd = R() * .8; const [px, py] = scr([Math.cos(t) * r * dd, 0], -Math.sin(t) * lift * dd); g += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(1.5 + R() * 2.2)}" ry="${f(1.2 + R())}" fill="${spot}" opacity="${f(.3 + R() * .35)}"/>`; }
    return Q.dropOf(p, d, 2, 3, .3, 1.6) + `<path d="${d}" fill="${Q.lg(p, [[0, lt(c, .2)], [1, dk(c, .12)]], 0, 0, 0, 1)}" stroke="${dk(c, .35)}" stroke-width=".7"/>${g}`;
}
// バター（角）
const butter = (p, x, y, s, rot = 15, sy = SYF) => block(p, x, y, Q.square(s), s * .45, '#f6dc7a', { rot, sy, top: Q.lit(p, '#fbe99c', .3, .08), side: '#e8c25a' }).s;
// パセリ・ディルなど（細かい緑）
function herbs(p, seed, n, cx, cy, rx, ry, { c = '#3f8a2c', r = 1.2 } = {}){
    const R = rng(p.id + 'hb' + seed);
    let s = '';
    for (let i = 0; i < n; i++){ const t = R() * 6.283, d = Math.sqrt(R()); s += `<circle cx="${f(cx + Math.cos(t) * d * rx)}" cy="${f(cy + Math.sin(t) * d * ry)}" r="${f(r * (.7 + R() * .6))}" fill="${R() < .5 ? c : lt(c, .25)}"/>`; }
    return s;
}

// =========================================================
// 絵
// =========================================================
const W = ['#ffffff', '#faf7ef', '#f0ebdd', '#e4dcc8'];   // 白米
export default {
    // ---------------- 日本の主食 ----------------
    // 白ご飯: 茶碗（白・藍の線と帯）に riceDome。オーナー採用の「ご飯=江口」の試作そのまま（口の中心＋2、高さ 46）
    rice: p => {
        const V = Q.chawan(p);
        return V.s + `<g ${V.above}>${Q.riceDome(p, 100, V.cy + 2, V.irx - 1, V.iry, 46)}</g>`;
    },
    // 玄米ご飯: 茶碗に、薄茶の粒の玄米（ところどころ濃い粒）
    st_genmai: p => {
        const V = Q.chawan(p);
        return inChawan(p, V, 44, (cx, cy, rx, ry, H) => grainDome(p, cx, cy, rx, ry, H, { pal: ['#f3e2bc', '#e6cc96', '#d6b67c', '#c49e64'], line: '#c8a870', rim: '#a8844c', mixes: [['#b98848', .12], ['#d8b072', .2]] }));
    },
    // 雑穀ご飯: 茶碗に、黒米で薄紫に色づいたご飯と、紫の黒米・黄色のもちきび・赤茶の小豆
    st_zakkoku: p => {
        const V = Q.chawan(p);
        return inChawan(p, V, 44, (cx, cy, rx, ry, H) => grainDome(p, cx, cy, rx, ry, H, { pal: ['#f8eef0', '#ecdce0', '#dcc6cc', '#c8acb4'], line: '#c8a8b2', rim: '#a88894', mixes: [['#7a3a5c', .1], ['#f0c840', .07, .6], ['#e8d8a8', .06, .7], ['#8a3a34', .025, 1.5]] }));
    },
    // パン（トースト）: 白い平皿（藍なし・錆の細い線）に、こんがり焼いた食パン2枚。片方にバター
    st_toast: p => {
        const D = dish(p, '#b07a44'), o = D.o;
        const [x1, y1] = at(o, -14, -10), [x2, y2] = at(o, 14, 12);
        return D.s + breadSlice(p, x1, y1, loafPts(80, 76), -14, { crumb: '#f2dcaa', crust: '#a8602a', toast: .62, th: 6, seed: 1, holes: 6 }) +
            breadSlice(p, x2, y2, loafPts(80, 76), 10, { crumb: '#f2dcaa', crust: '#a8602a', toast: .55, th: 6, seed: 2, holes: 6 }) +
            butter(p, x2 + 4, y2 - 2 - 6 * CZ, 16, 18) + `<path d="${Q.blob(x2 + 4, y2 + 2 - 6 * CZ, 14, 7, 'bm', { jit: .3 })}" fill="#f8e6a0" opacity=".55"/>`;
    },
    // ---------------- ほかの国のご飯（その国の飯碗・皿） ----------------
    // 白ご飯（ブラジルのふだんの主食。アメリカ・イギリス・フランス・スペイン・エジプト・インドの「白ご飯」もこの絵）: どこの食卓でも浮かない、線のない白い小鉢
    br_staple: p => {
        const V = meshiwan(p, { outer: '#f6f3ec', lip: '#fcfbf7', inner: '#efebe1', edge: '#c8b48a' });
        return V.s + `<g ${V.above}>${rice(p, 100, V.cy + 2, V.irx - 1, V.iry, 40)}</g>`;
    },
    // 米饭（中国）: 白い飯碗に朱の線と帯
    cn_staple: p => {
        const V = meshiwan(p, { edge: '#c0392b', bands: [[13, 2.2], [19, .9]] });
        return V.s + `<g ${V.above}>${rice(p, 100, V.cy + 2, V.irx - 1, V.iry, 44)}</g>`;
    },
    // 白飯（台湾）: 白い飯碗に錆の線（中国の絵と見分けられるよう帯は1本）
    tw_staple: p => {
        const V = meshiwan(p, { outer: '#f5f1e8', edge: '#9a6a3a', bands: [[16, 1.6]] });
        return V.s + `<g ${V.above}>${rice(p, 100, V.cy + 2, V.irx - 1, V.iry, 44)}</g>`;
    },
    // Cơm trắng（ベトナム）: 小ぶりの白い飯碗に緑の帯
    vn_staple: p => {
        const V = meshiwan(p, { outer: '#f4f2ea', edge: '#3f7a4a', bands: [[14, 2]], rx: 82 });
        return V.s + `<g ${V.above}>${rice(p, 100, V.cy + 2, V.irx - 1, V.iry, 44)}</g>`;
    },
    // 밥（韓国）: ステンレスの器に、口から少し盛り上がるご飯
    kr_staple: p => {
        const V = steelBowl(p);
        return V.s + `<g ${V.above}>${rice(p, 100, V.cy + 2, V.irx - 1, V.iry, 32)}</g>`;
    },
    // 雑穀ご飯（チャプコッパプ）: ステンレスの器に、紫がかったご飯と黒豆・小豆
    st_japgok: p => {
        const V = steelBowl(p), cx = 100, cy = V.cy + 2, rx = V.irx - 1, ry = V.iry, H = 32;
        return V.s + `<g ${V.above}>${grainDome(p, cx, cy, rx, ry, H, { pal: ['#e8ccd6', '#d4aebe', '#bf94a6', '#a87a8e'], line: '#a8788c', rim: '#8a5a70', mixes: [['#6a2a4a', .16], ['#f2e4e8', .12]] })}` +
            sprinkle('jg', 14, 13, cx, cy, rx, ry, H, (x, y, i, r) => Q.bean(p, x, y, i % 2 ? 7 : 8.4, r * 180, i % 2 ? '#8a3a34' : '#4a3438')) + '</g>';
    },
    // Nasi putih（インドネシア）: 白い平皿（朱の縁）に、型で丸く抜いたご飯
    id_staple: p => {
        const D = dish(p, '#c8504a'), o = D.o;
        return D.s + rice(p, o.cx, o.cy + 6, 50, 50 * SYF, 40);
    },
    // Kanin（フィリピン）: 白い平皿（金の縁）にバナナの葉を敷き、丸く盛ったご飯
    ph_staple: p => {
        const D = dish(p, '#d0a040'), o = D.o;
        const leaf = `<g transform="translate(${o.cx} ${f(o.cy + 4)}) scale(1 ${SYF}) rotate(-20)"><path d="M-74,0 C-60,-34 50,-40 76,-4 C54,32 -52,36 -74,0Z" fill="${Q.lg(p, [[0, '#6fae4a'], [.6, '#3f8a34'], [1, '#2f6a2a']], 0, 0, 1, 1)}" stroke="#2a5a24" stroke-width="1"/>` +
            `<path d="M-72,0 L74,-3" stroke="#a8d08a" stroke-width="2"/>${Array.from({ length: 9 }, (_, i) => { const u = -56 + i * 14; return `<path d="M${u},-1 L${u + 12},-28 M${u},0 L${u + 12},27" stroke="#5a9a44" stroke-width="1" opacity=".7"/>`; }).join('')}</g>`;
        return D.s + leaf + rice(p, o.cx + 2, o.cy + 6, 48, 48 * SYF, 40);
    },
    // ข้าวสวย（タイ）: 白い平皿（緑の縁）に、ジャスミンライス（少し長い粒）
    th_staple: p => {
        const D = dish(p, '#3f7a4a'), o = D.o;
        return D.s + grainDome(p, o.cx, o.cy + 6, 52, 52 * SYF, 36, { pal: W, n: 600, size: 1.05, mixes: [['#fbf8f0', .2, 1.15]] });
    },
    // Arroz blanco（ペルー）: 白い平皿（朱の縁）に、器で型抜きした丸いご飯
    pe_staple: p => {
        const D = dish(p, '#c0392b'), o = D.o;
        return D.s + rice(p, o.cx, o.cy + 6, 50, 50 * SYF, 42);
    },
    // もち米（カオニャオ）: 竹で編んだかご（低い籠）に、つやのあるもち米のかたまり
    st_sticky: p => {
        const V = basket(p, { c: '#cfae6a', cloth: null, cy: 96, h: 32, rx: 84, fx: 52 });
        const cx = 100, cy = V.cy + 2;
        return V.s + `<g ${V.above}>${grainDome(p, cx, cy, V.irx - 2, V.iry, 40, { pal: ['#ffffff', '#f8f4e8', '#ece4cc', '#dcd0b0'], line: '#d8ccac', size: 1.08, n: 520 })}${riceShine(cx, cy, V.irx, 40, .7)}</g>`;
    },
    // ガーリックライス（シナンガグ）: 白い平皿（緑の縁）に、にんにくの油で炒めたご飯と、きつね色のにんにく
    st_garlicrice: p => {
        const D = dish(p, '#3f7a4a'), o = D.o, cx = o.cx, cy = o.cy + 6, rx = 54, ry = rx * SYF, H = 30;
        return D.s + grainDome(p, cx, cy, rx, ry, H, { pal: ['#fdf6e0', '#f4e8c4', '#e8d6a6', '#d6c08a'], line: '#d8c08a', rim: '#b89a5a', mixes: [['#e8c46a', .08]] }) +
            sprinkle('gr', 22, 9, cx, cy, rx, ry, H, (x, y, i, r) => `<path d="${Q.blob(x, y, 2.6 + r, 1.8, 'gc' + i, { jit: .4 })}" fill="${Q.dome(p, i % 3 ? '#d8963a' : '#c47c2a')}" stroke="#9a5a1e" stroke-width=".4"/>`, { lift: .5 });
    },
    // ご飯と豆の煮もの（アホース・イ・フェイジャン）: 白い平皿（緑の縁）の左にご飯、右に黒っぽい豆の煮もの
    st_ricebeans: p => {
        const D = dish(p, '#3f7a4a'), o = D.o;
        const [bx, by] = at(o, 30, 6);
        const pool = Q.tarePool(p, bx, by, 40, '#5a3020', 'fj', { sy: SYF });
        const R = rng('fjb');
        const beans = []; for (let i = 0; i < 26; i++){ const t = R() * 6.283, d = Math.sqrt(R()) * 32; const x = bx + Math.cos(t) * d, y = by + Math.sin(t) * d * SYF * .9; beans.push([y, () => Q.bean(p, x, y - 1, 8.4, R() * 180, R() < .5 ? '#5a3424' : '#6e4230')]); }
        const [rx0, ry0] = at(o, -30, -2);
        return D.s + byDepth([[ry0 - 10, () => rice(p, rx0, ry0, 38, 38 * SYF, 34)]]) + pool + byDepth(beans) + Q.shine(bx - 10, by - 6, 16, -6, .6);
    },
    // ピラウ（ピラフ）: 白い平皿（金の縁）に、器で型どりしたご飯と、炒めた細いパスタ（シェリエ）
    st_pilav: p => {
        const D = dish(p, '#c8a050'), o = D.o, cx = o.cx, cy = o.cy + 6, rx = 54, ry = rx * SYF, H = 38;
        return D.s + grainDome(p, cx, cy, rx, ry, H, { pal: ['#fffcf2', '#f8f2e2', '#ece2c8', '#dccfae'], line: '#d8ccac', mixes: [['#f4ecd4', .1]] }) +
            sprinkle('sh', 26, 8, cx, cy, rx, ry, H, (x, y, i, r) => `<rect x="${f(x - 4)}" y="${f(y - 1.1)}" width="8" height="2.2" rx="1.1" fill="${i % 2 ? '#c98a42' : '#b8762e'}" stroke="#8a5420" stroke-width=".3" transform="rotate(${f(r * 180)} ${f(x)} ${f(y)})"/>`);
    },
    // ブルグルのピラフ: 素焼きの色の浅い鉢に、トマトで色づいたブルグル（ひき割り小麦）とパセリ
    st_bulgur: p => {
        const V = Q.asabachi(p, { outer: '#c98a5a', inner: '#f0e2cc', edge: '#8a4a2a' }), cx = 100, cy = V.cy + 4, rx = V.irx - 6, ry = rx * SY, H = 40;
        return V.s + `<g ${V.above}>${grainDome(p, cx, cy, rx, ry, H, { pal: ['#f0c27a', '#dfa45a', '#c88a44', '#b06e30'], line: '#a8682a', rim: '#8a5020', size: .82, n: 700, mixes: [['#c0602a', .12]] })}` +
            sprinkle('bp', 16, 10, cx, cy, rx, ry, H, (x, y, i, r) => `<path d="${Q.blob(x, y, 2.4, 1.6, 'bp' + i, { jit: .5 })}" fill="${i % 2 ? '#3f8a2c' : '#5aa83a'}"/>`) + '</g>' + V.shine(.5);
    },
    // そばの実のカーシャ: 白い浅い鉢に、茶色いそばの実と溶かしバター、ディル
    st_kasza: p => {
        const V = Q.asabachi(p, { outer: '#efe9dc', inner: '#f8f4ec', edge: '#b89a6a' }), cx = 100, cy = V.cy + 4, rx = V.irx - 6, ry = rx * SY, H = 38;
        return V.s + `<g ${V.above}>${grainDome(p, cx, cy, rx, ry, H, { pal: ['#c08a5a', '#a06a3e', '#84542e', '#6a4022'], line: '#5a3a1e', rim: '#5a3a1e', size: 1.05, mixes: [['#b8824e', .15]] })}` +
            `<path d="${Q.blob(cx - 6, cy - H + 4, 18, 7, 'kb', { jit: .3 })}" fill="#f2d060" opacity=".5"/>` + `<ellipse cx="${f(cx - 10)}" cy="${f(cy - H + 2)}" rx="5" ry="2" fill="#fff4b0" opacity=".7"/>` +
            sprinkle('kd', 18, 8, cx, cy, rx, ry, H, (x, y, i, r) => `<path d="M${f(x - 2.4)},${f(y)} l4.8,${f((r - .5) * 2)}" stroke="${i % 2 ? '#4f8f2f' : '#6aa83a'}" stroke-width="1.3" stroke-linecap="round"/>`) + '</g>' + V.shine(.5);
    },
    // ゆでじゃがいも: 白い平皿（緑の縁）に、皮をむいたゆでじゃがいもとバター、パセリ
    st_potatoes: p => {
        const D = dish(p, '#3f7a4a'), o = D.o;
        const it = [[-34, -18, 26, 20], [10, -24, 28, 21], [40, 2, 24, 19], [-24, 14, 27, 21], [14, 18, 28, 22]].map(([u, v, rx, ry], i) => { const [x, y] = at(o, u, v, 8); return [y, () => Q.lump(p, x, y, rx * .9, ry * .82, i % 2 ? '#f0d48c' : '#f2d896', 'po' + i, { n: 9, jit: .18, hi: .6, edge: '#c9a654' })]; });
        const [bx, by] = at(o, -4, -4, 22);
        it.push([by + 30, () => butter(p, bx, by, 15, 20) + herbs(p, 'pp', 34, o.cx, o.cy - 8, 50, 26, { c: '#3f8a2c', r: 1.1 })]);
        return D.s + byDepth(it);
    },
    // ポレンタ: 木の板に、黄色く丸く広げたやわらかいポレンタとバター
    st_polenta: p => {
        const D = board(p, { c: '#c08a52' }), o = D.o;
        const d = smooth(ring(62, 16, .07, rng('pol'), 1, SYF * .95)), cx = o.cx, cy = o.cy + 2;
        const side = `<path d="${d}" transform="translate(${cx} ${f(cy + 5)})" fill="#c8961e"/>`;
        return D.s + `<g transform="translate(${cx} ${cy})">${Q.dropOf(p, d, 2, 7, .3, 2)}</g>` + side +
            `<path d="${d}" transform="translate(${cx} ${cy})" fill="${Q.rg(p, [[0, '#fbe08a'], [.6, '#f2c440'], [1, '#d8a42a']], .4, .35, .7)}" stroke="#c08a1e" stroke-width=".7"/>` +
            `<path d="M${cx - 34},${cy - 4} q16,-10 34,-4 M${cx - 10},${cy + 16} q18,-8 34,-2" stroke="#fdeba0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>` +
            butter(p, cx + 4, cy - 2, 18, -12) + `<path d="${Q.blob(cx + 6, cy + 2, 16, 7, 'pb', { jit: .3 })}" fill="#f8e490" opacity=".6"/>`;
    },
    // ---------------- パン ----------------
    // パンとバター（イギリス。アメリカの「食パン」もこの絵）: 白い平皿（金の縁）に、薄切りの食パン3枚を少しずつずらし、バター
    gb_staple: p => {
        const D = dish(p, '#c8a050'), o = D.o;
        const sl = [[-26, -16, -10], [-2, -2, -6], [22, 12, -2]].map(([u, v, r], i) => { const [x, y] = at(o, u, v); return breadSlice(p, x, y, loafPts(66, 64), r, { crumb: '#f6ead0', crust: '#b8783a', th: 3.4, seed: i, holes: 7 }); }).join('');
        const [bx, by] = at(o, -46, 26);
        return D.s + sl + butter(p, bx, by, 18, 10);
    },
    // ディナーロール（アメリカ。ドイツのブレートヒェン・ブラジルのパンもこの絵）: 布を敷いたパンかごに、つやのある丸いロールパン
    st_rolls: p => {
        const V = basket(p, { cloth: '#f4ecda' }), o = { cx: 100, cy: V.cy + 2 };
        const it = [[-42, -36, '#d39448'], [2, -46, '#d99c50'], [44, -30, '#cf8e42'], [-52, 8, '#dba058'], [-10, 2, '#d39448'], [32, 10, '#d99c50'], [-28, 44, '#cf8e42'], [16, 50, '#dba058']].map(([u, v, c], i) => { const [x, y] = at(o, u, v, 8 + (v < 30 ? 6 : 0)); return [y, () => bun(p, x, y, 50, 44, 30, i * 23, { c, sy: SY, seed: i, gloss: .65 })]; });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>` + V.front;
    },
    // パンデサル（フィリピン）: 茶色い紙を敷いたかごに、パン粉をまぶした小さな丸パン
    st_pandesal: p => {
        const V = basket(p, { c: '#c9a46a', cloth: '#d8b98a' }), o = { cx: 100, cy: V.cy + 2 };
        const it = [[-40, -40], [0, -48], [40, -36], [-54, 0], [-16, -4], [22, -2], [56, 6], [-34, 38], [4, 44], [42, 42]].map(([u, v], i) => { const [x, y] = at(o, u, v, 8); return [y, () => bun(p, x, y, 42, 38, 24, i * 30, { c: '#d18c44', sy: SY, seed: i, crumbs: 40, gloss: .3 })]; });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>` + V.front;
    },
    // ボリーリョ（メキシコ）: 木の板に、縦の切れ目のある細長い小型パン3つ
    st_bolillo: p => {
        const D = board(p), o = D.o;
        const it = [[-30, -30, '#d9934a'], [6, -2, '#cf8a40'], [38, 26, '#dc9a52']].map(([u, v, c], i) => { const [x, y] = at(o, u, v); return [y, () => bun(p, x, y, 100, 44, 30, -22, { c, seed: i, slit: 3.4, gloss: .55 })]; });
        return D.s + byDepth(it);
    },
    // バインミー（ベトナム）: 木の板に、皮の軽いベトナムのバゲット2本（縦の切れ目）
    st_banhmi: p => {
        const D = board(p), o = D.o;
        const it = [[-6, -22, '#e0a252'], [6, 20, '#d8984a']].map(([u, v, c], i) => { const [x, y] = at(o, u, v); return [y, () => bun(p, x, y, 160, 42, 26, -8, { c, seed: i, slit: 3.6, gloss: .6 })]; });
        return D.s + byDepth(it);
    },
    // バゲット（フランス）: 木の板に、斜めのクープのバゲット1本と、切った3切れ
    fr_staple: p => {
        const D = board(p), o = D.o;
        const [bx, by] = at(o, -8, -16);
        const sl = [[-30, 30, -10], [4, 34, 15], [38, 28, -25]].map(([u, v, r], i) => { const [x, y] = at(o, u, v); return [y, () => breadSlice(p, x, y, ovalPts(30, 24, 16), r, { crumb: '#f4e4bc', crust: '#c07a30', th: 5, seed: i, holes: 6 })]; });
        return D.s + byDepth([[by, () => bun(p, bx, by, 172, 30, 18, -10, { c: '#d58c3a', coupe: 5, seed: 1, gloss: .5 })], ...sl]);
    },
    // Brot（ドイツ）: 木の板に、丸い田舎パン（粉をふった焼き色）と、切った3枚
    de_staple: p => {
        const D = board(p, { c: '#c09060' }), o = D.o;
        const [lx, ly] = at(o, -24, -8);
        const sl = [[22, 10, -20], [38, 22, -10], [54, 34, 0]].map(([u, v, r], i) => { const [x, y] = at(o, u, v); return [y, () => breadSlice(p, x, y, ovalPts(46, 34, 18, i, .06), r, { crumb: '#d8b888', crust: '#6e3a1a', th: 5, seed: i, holes: 10 })]; });
        return D.s + byDepth([[ly, () => bun(p, lx, ly, 96, 80, 40, 0, { c: '#9a5a2a', top: '#b8783a', seed: 1, flour: .45, gloss: .3 }) + `<path d="M${f(lx - 26)},${f(ly - 30)} Q${f(lx)},${f(ly - 38)} ${f(lx + 24)},${f(ly - 30)} M${f(lx - 22)},${f(ly - 20)} Q${f(lx)},${f(ly - 27)} ${f(lx + 22)},${f(ly - 20)}" stroke="#e8c898" stroke-width="2" fill="none" opacity=".6"/>`], ...sl]);
    },
    // Pan（スペイン）: 布を敷いたパンかごに、バーラ（細長いパン）を切ったものと切り口
    es_staple: p => {
        const V = basket(p, { cloth: '#fbf6ea', stripe: '#c8392e' }), o = { cx: 100, cy: V.cy + 2 };
        const it = [[-8, -36, 0], [12, -2, 1]].map(([u, v, i]) => { const [x, y] = at(o, u, v, 10); return [y, () => bun(p, x, y, 140, 40, 26, -14, { c: '#d6923e', coupe: 3, seed: i, gloss: .5 })]; });
        [[-34, 40, 20], [8, 48, -10], [44, 36, 10]].forEach(([u, v, r], i) => { const [sx, sy0] = at(o, u, v, 8); it.push([sy0, () => breadSlice(p, sx, sy0, ovalPts(40, 32, 16), r, { crumb: '#f4e4bc', crust: '#c8822e', th: 6, sy: SY, seed: 3 + i })]); });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>` + V.front;
    },
    // Pane（イタリア）: 赤い格子の布を敷いたパンかごに、切った田舎パンと小さな丸パン
    it_staple: p => {
        const V = basket(p, { cloth: '#fbf6ee', check: '#c8392e' }), o = { cx: 100, cy: V.cy + 2 };
        const it = [[-30, -30, -14], [-4, 2, -6], [20, 36, 2]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 8 + i * 3); return [y, () => breadSlice(p, x, y, ovalPts(72, 52, 18, i, .05), r, { crumb: '#f0dcb0', crust: '#b8742e', th: 7, sy: SY, seed: i, holes: 12 })]; });
        const [rx1, ry1] = at(o, 46, -36, 8), [rx2, ry2] = at(o, -50, 30, 8);
        it.push([ry1, () => bun(p, rx1, ry1, 40, 36, 24, 0, { c: '#d18c40', sy: SY, seed: 5, slit: 2.4 })], [ry2 + 40, () => bun(p, rx2, ry2, 38, 34, 22, 30, { c: '#d6924a', sy: SY, seed: 6 })]);
        return V.s + `<g ${V.above}>${byDepth(it)}</g>` + V.front;
    },
    // Chleb（ポーランド）: 布を敷いたパンかごに、ライ麦パンの切ったもの（濃い茶）と、小麦のパン
    pl_staple: p => {
        const V = basket(p, { cloth: '#f6f0e2', stripe: '#b8302a' }), o = { cx: 100, cy: V.cy + 2 };
        const it = [[42, -36, 18, '#f0dcb0', '#b8742e'], [-34, -26, -14, '#d4b888', '#7a4220'], [-10, 6, -6, '#c9a878', '#6a3a1a'], [16, 38, 2, '#b89468', '#5e3418']].map(([u, v, r, cr, cu], i) => { const [x, y] = at(o, u, v, 8 + i * 3); return [i, () => breadSlice(p, x, y, loafPts(64, 70), r, { crumb: cr, crust: cu, th: 7, sy: SY, seed: i, holes: 12 })]; });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>` + V.front;
    },
    // Ekmek（トルコ）: パンかごに、白いパン（ソムン）1本と切った厚切り
    tr_staple: p => {
        const V = basket(p, { cloth: null }), o = { cx: 100, cy: V.cy + 2 };
        const [lx, ly] = at(o, 6, -34, 8);
        const it = [[ly, () => bun(p, lx, ly, 130, 56, 34, -6, { c: '#d68a3a', seed: 1, sy: SY, slit: 3.4, gloss: .5 })]];
        [[-40, 24, -20], [-4, 36, -10], [34, 34, 0]].forEach(([u, v, r], i) => { const [x, y] = at(o, u, v, 8 + i * 2); it.push([y + i, () => breadSlice(p, x, y, ovalPts(56, 42, 18, i), r, { crumb: '#f6ead0', crust: '#c47a32', th: 8, sy: SY, seed: i, holes: 9 })]); });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>`;
    },
    // ふだんの平たいパン（エジプト）: パンかごに、ふくらんだ茶色のアエーシ・バラディを重ね、1枚を立てかける
    eg_staple: p => {
        const V = basket(p, { cloth: null, c: '#b88a4e' }), o = { cx: 100, cy: V.cy + 2 };
        const it = [[-24, -28, 1, '#c99258'], [26, -20, 2, '#cf9a5e'], [-2, 22, 3, '#c48c52']].map(([u, v, i, c]) => { const [x, y] = at(o, u, v, 12); return [y, () => flatStack(p, x, y, 46, 2, { c, edge: '#a8723a', spot: '#7a4a22', spots: 18, th: 5, puff: .35, sy: SY, seed: i })]; });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>`;
    },
    // Tortillas de maíz（メキシコ）: 布をかけたかごに、とうもろこしのトルティーヤを重ね、1枚を半分に折る
    mx_staple: p => {
        const V = basket(p, { cloth: '#fbf8f0', stripe: '#2f7a4a' }), o = { cx: 100, cy: V.cy + 2 };
        const [x, y] = at(o, -4, 6, 8);
        return V.s + flatStack(p, x, y, 60, 6, { c: '#e6c472', edge: '#b48a3c', spot: '#9a6a24', spots: 16, th: 2.2, sy: SY }) + foldedFlat(p, x + 30, y + 10, 26, 0, { c: '#ecd08a', spot: '#9a6a24', lift: 16 }) + V.front;
    },
    // 小麦粉のトルティーヤ（メキシコ）: 布をかけたかごに、白っぽい薄焼きを重ねる
    st_flourtort: p => {
        const V = basket(p, { cloth: '#fbf8f0', stripe: '#c8392e' }), o = { cx: 100, cy: V.cy + 2 };
        const [x, y] = at(o, -2, 6, 8);
        return V.s + flatStack(p, x, y, 62, 6, { c: '#f4e6c6', edge: '#c8a878', spot: '#b88040', spots: 20, th: 2, sy: SY }) + V.front;
    },
    // ロティ（チャパティ）（インド）: 布を敷いたかごに、焼き目のある丸い薄焼きパンを重ねる
    st_roti: p => {
        const V = basket(p, { c: '#a87a44', cloth: '#f3e9d2', stripe: '#d8782a' }), o = { cx: 100, cy: V.cy + 2 };
        const [x, y] = at(o, -2, 6, 8);
        return V.s + flatStack(p, x, y, 60, 5, { c: '#e8c88e', edge: '#c09a5a', spot: '#9a5a22', spots: 22, th: 2, sy: SY, puff: .2 }) + V.front;
    },
    // ロティとご飯（インドのふだんの主食）: ステンレスのターリー（縁の立った丸い盆）に、重ねたロティと、バスマティライス
    in_staple: p => {
        const D = Q.plate(p, { base: '#cdd1d6', line: 'none', edge: '#9aa0a6', well: .84 }), o = D.o;
        const [rx0, ry0] = at(o, 30, 10), [fx, fy] = at(o, -24, -6);
        return D.s + flatStack(p, fx, fy, 40, 3, { c: '#e8c88e', edge: '#c09a5a', spot: '#9a5a22', spots: 14, th: 2, sy: SYF }) +
            grainDome(p, rx0, ry0, 34, 34 * SYF, 26, { pal: W, n: 300, size: 1.05, mixes: [['#fbf8f0', .25, 1.2]] }) + foldedFlat(p, fx - 4, fy + 22, 24, 0, { c: '#e2bc7e', spot: '#9a5a22', lift: 12, sy: SYF });
    },
    // マントウ（中国・台湾）: せいろに、白くふっくらした蒸しパン4つと湯気
    st_mantou: p => {
        const V = seiro(p), o = { cx: 100, cy: V.cy + 2 };
        const it = [[-32, -22], [30, -24], [-28, 22], [32, 20]].map(([u, v], i) => { const [x, y] = at(o, u, v); return [y, () => bun(p, x, y, 64, 56, 24, i * 20, { c: '#f3ecdc', top: '#ffffff', sy: SY, seed: i, gloss: .8, line: '#c8bea4' })]; });
        return V.s + `<g ${V.above}>${byDepth(it)}</g>` + Q.steam(100, 18, .5);
    },
};
