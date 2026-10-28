// 料理イラスト「斜め上35度」の部品集（基準書: docs/illustration_3q.md）
// 盛りつけファイル（draw/3q/<名前>.mjs）は dishes/*.mjs と同じ形: export default { id: p => svg本文 }。p は kit.mjs の Pic。
// 視点: 水平から約35度。水平な円は縦 SY 倍の楕円、高さ z は画面で CZ 倍だけ上へ。光は左上、影は右下へ（焦げ茶。黒は使わない）。
// 器: 楕円の口・口の厚み・側面・高台・接地の影・内壁（左の内壁が陰、右に光）。汁の面は口より下（江口の描き方）。
// 具: 角切り・豆・葉は花森の描き方（地面の形を立ち上げる角柱、光と影の球、面につぶした波の葉）。
import * as K from './kit.mjs';
export { Pic } from './kit.mjs';
export const { lt, dk, mix, rng, smooth, ring, f, T } = K;
export const SY = .56, CZ = .82;
export const INDIGO = '#2c4c7c', SHADE = '#3a2212';
export const FRAME = { cx: 100, w: 184 };   // 器の幅は 200 の約92%

// ---------- 塗り・効果（同じ内容は defs を使い回す） ----------
const stops = s => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
export const lg = (p, s, x1 = 0, y1 = 0, x2 = 1, y2 = 0) => `url(#${p.def('lg' + JSON.stringify([s, x1, y1, x2, y2]), id => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`)})`;
export const rg = (p, s, cx = .38, cy = .32, r = .75) => `url(#${p.def('rg' + JSON.stringify([s, cx, cy, r]), id => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`)})`;
export const blur = (p, sd) => `filter="url(#${p.def('bl' + sd, id => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`)})"`;
export const clip = (p, d) => `clip-path="url(#${p.def('cp' + d, id => `<clipPath id="${id}"><path d="${d}"/></clipPath>`)})"`;
// 左上から明るい塗り（具の上の面）
export const lit = (p, c, l = .3, d = .22) => lg(p, [[0, lt(c, l)], [.55, c], [1, dk(c, d)]], 0, 0, 1, 1);
// ふくらみのある塗り（左上に光、縁に陰）
export const dome = (p, c, l = .34, d = .3) => rg(p, [[0, lt(c, l)], [.55, c], [1, dk(c, d)]], .36, .3, .78);

// ---------- 形 ----------
export const eD = (cx, cy, rx, ry) => `M${f(cx - rx)},${f(cy)}A${f(rx)},${f(ry)} 0 1 0 ${f(cx + rx)},${f(cy)}A${f(rx)},${f(ry)} 0 1 0 ${f(cx - rx)},${f(cy)}Z`;
// 面の座標 (u, v, 高さ z) → 画面。o は面の中心 { cx, cy }
export const at = (o, u, v, z = 0) => [o.cx + u, o.cy + v * SY - z * CZ];
// 不定形（平面に置いた形を縦につぶす）。sharp で角ばった多角形
export function blob(x, y, rx, ry, seed, { n = 9, jit = .25, rot = 0, sharp = false, sy = 1 } = {}){
    const R = rng('blob' + seed), a0 = rot * Math.PI / 180;
    const pts = Array.from({ length: n }, (_, i) => { const t = i / n * 6.283, r = 1 - jit / 2 + R() * jit, px = Math.cos(t) * rx * r, py = Math.sin(t) * ry * r; return [x + px * Math.cos(a0) - py * Math.sin(a0), y + (px * Math.sin(a0) + py * Math.cos(a0)) * sy]; });
    return sharp ? 'M' + pts.map(q => q.map(f).join(',')).join('L') + 'Z' : smooth(pts, true, .9);
}
// 手前から奥へ並べ替えて描く: items = [[y, () => svg], ...]
export const byDepth = items => items.sort((a, b) => a[0] - b[0]).map(i => i[1]()).join('');

// ---------- 影 ----------
// 接地の影（器の下）。広く薄い影＋真下の濃い芯。右下へずらす
export function ground(p, cx, cy, rx, { op = 1, sy = .8 } = {}){
    const ry = rx * SY * sy;
    return `<ellipse cx="${f(cx + 6)}" cy="${f(cy + 2)}" rx="${f(rx * 1.12)}" ry="${f(ry * 1.1)}" fill="${SHADE}" opacity="${f(.14 * op)}" ${blur(p, 4)}/>` +
        `<ellipse cx="${f(cx + 2)}" cy="${f(cy)}" rx="${f(rx * .92)}" ry="${f(ry * .75)}" fill="${SHADE}" opacity="${f(.28 * op)}" ${blur(p, 1.6)}/>`;
}
// 具が面に落とす小さな影
export const cast = (p, x, y, rx, ry, op = .3) => `<ellipse cx="${f(x + 2)}" cy="${f(y + 1.4)}" rx="${f(rx)}" ry="${f(ry)}" fill="${SHADE}" opacity="${op}" ${blur(p, 1.4)}/>`;
// 形 d の影（右下へずらしてぼかす）
export const dropOf = (p, d, dx = 1.8, dy = 2.4, op = .32, sd = 1.4) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="${SHADE}" opacity="${op}" ${blur(p, sd)}/>`;

// =========================================================
// 器
// =========================================================
// 口の上面の藍: 'white' = 白い器（口の内側に藍の線 2.2）／ 'thin' = 漆・鋼・土鍋（細い藍の線 1.2）／ 'none' = 線なし（肉じゃがの鉢など今の絵が線なしのもの）
function rimLine(cx, cy, rx, line){
    if (line === 'none') return '';
    const w = line === 'thin' ? 1.2 : 2.2, inset = line === 'thin' ? 1.4 : 2.2;
    return `<path d="${eD(cx, cy, rx - inset, (rx - inset) * SY)}" fill="none" stroke="${INDIGO}" stroke-width="${w}"/>`;
}
// 鉢・椀・茶碗・どんぶり・小鉢の共通形
// cx, cy: 口の楕円の中心 / rx: 口の半径 / h: 口から胴の底まで / fx: 高台の半径 / ft: 高台の高さ / t: 口の厚み
// outer: 外の色 / lip: 口の上面の色 / inner: 内側の色 / line: 藍（上） / bands: 胴の藍の帯 [[口からの深さ, 太さ]] / dots: 口のまわりの藍の点（どんぶり）
export function vessel(p, { cx = 100, cy = 82, rx = 92, h = 50, fx = 40, ft = 6, t = 3.4, outer, lip = null, inner, line = 'none', bands = [], dots = false, belly = .62, gloss = .38 }){
    const ry = rx * SY, bx = fx + 14, by = cy + h, bry = bx * SY;
    const body = `M${f(cx - rx)},${f(cy)} C${f(cx - rx)},${f(cy + h * belly)} ${f(cx - bx - 10)},${f(by)} ${f(cx - bx * .6)},${f(by + bry * .8)} Q${f(cx)},${f(by + bry * 1.12)} ${f(cx + bx * .6)},${f(by + bry * .8)} C${f(cx + bx + 10)},${f(by)} ${f(cx + rx)},${f(cy + h * belly)} ${f(cx + rx)},${f(cy)}Z`;
    const fTop = by + bry * 1.12 - (fx - 2) * SY;   // 高台の底が胴の底より ft だけ下に出る
    const foot = ft ? `M${f(cx - fx)},${f(fTop)} L${f(cx - fx + 2)},${f(fTop + ft)} A${f(fx - 2)},${f((fx - 2) * SY)} 0 0 0 ${f(cx + fx - 2)},${f(fTop + ft)} L${f(cx + fx)},${f(fTop)}Z` : '';
    const irx = rx - t, iry = irx * SY, mouth = eD(cx, cy + .6, irx, iry);
    lip = lip || lt(outer, .18);
    let s = ground(p, cx, (ft ? fTop + ft + (fx - 2) * SY * .6 : by + bry), (ft ? fx : bx) + 12);
    if (ft) s += `<path d="${foot}" fill="${lg(p, [[0, lt(outer, .1)], [.6, dk(outer, .15)], [1, dk(outer, .4)]])}" stroke="${dk(outer, .45)}" stroke-width=".6"/>`;
    s += `<path d="${body}" fill="${lg(p, [[0, lt(outer, .32)], [.28, lt(outer, .08)], [.7, outer], [1, dk(outer, .4)]])}" stroke="${dk(outer, .45)}" stroke-width=".7"/>` +
        `<path d="${body}" fill="${lg(p, [[0, SHADE, 0], [.7, SHADE, 0], [1, SHADE, .22]], 0, 0, 0, 1)}"/>`;
    for (const [dy, w] of bands) s += `<g ${clip(p, body)}><path d="M${f(cx - rx - 4)},${f(cy + dy)} A${f(rx + 4)},${f((rx + 4) * SY)} 0 0 0 ${f(cx + rx + 4)},${f(cy + dy)}" stroke="${INDIGO}" stroke-width="${w}" fill="none"/></g>`;
    s += `<path d="M${f(cx - rx + 8)},${f(cy + 10)} Q${f(cx - rx + 12)},${f(cy + h * .6)} ${f(cx - bx * .7)},${f(by + bry * .3)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="${gloss}"/>`;
    s += `<path d="${eD(cx, cy, rx, ry)}" fill="${lg(p, [[0, lt(lip, .25)], [.6, lip], [1, dk(lip, .15)]])}" stroke="${dk(outer, .4)}" stroke-width=".7"/>`;
    s += `<path d="${mouth}" fill="${lg(p, [[0, dk(inner, .3)], [.45, dk(inner, .08)], [1, lt(inner, .12)]])}"/>`;
    // 左上の口が内壁に落とす影
    s += `<g ${clip(p, mouth)}><path d="${eD(cx - 6, cy - 3, irx + 2, iry + 2)}" fill="none" stroke="${SHADE}" stroke-width="9" opacity=".16" ${blur(p, 2.5)}/></g>`;
    s += rimLine(cx, cy, rx, line);
    if (dots) for (let i = 0; i < 30; i++){ const a = i / 30 * 6.283; if (Math.sin(a) < -.98) continue; s += `<circle cx="${f(cx + Math.cos(a) * (rx - 5.2))}" cy="${f(cy + Math.sin(a) * (rx - 5.2) * SY)}" r="1.5" fill="${INDIGO}"/>`; }
    // 手前の口より上だけを見せる形（盛り上がった中身が手前の口に隠れる）
    const aboveD = `M${f(cx - irx)},${f(cy + .6)} A${f(irx)},${f(iry)} 0 0 0 ${f(cx + irx)},${f(cy + .6)} L200,${f(cy + .6)} L200,0 L0,0 L0,${f(cy + .6)}Z`;
    return { s, cx, cy, rx, ry, irx, iry, mouth, inside: clip(p, mouth), above: clip(p, aboveD),
        shine: (op = .6) => `<path d="M${f(cx - rx * .92)},${f(cy - ry * .38)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx * .35)},${f(cy - ry * .93)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>` };
}
// --- 鉢・椀の決まった形（大きさと位置は基準書の表どおり。変えるときは o で上書き） ---
export const hachi = (p, o = {}) => vessel(p, { cy: 76, rx: 92, h: 58, fx: 42, ft: 6, t: 6, outer: '#6e4b33', lip: '#8a6448', inner: '#efe5d3', line: 'white', ...o });          // 深めの鉢（煮物。口に藍の線 2.2: 採用の肉じゃがにそろえる）
export const wan = (p, o = {}) => vessel(p, { cy: 72, rx: 90, h: 64, fx: 36, ft: 8, t: 3, outer: '#9a2c1e', lip: '#b23a28', inner: '#4a2018', line: 'thin', gloss: .32, ...o });   // 汁椀（朱の漆。内側は焦げ茶の漆）
export const chawan = (p, o = {}) => vessel(p, { cy: 96, rx: 86, h: 52, fx: 30, ft: 7, outer: '#f4f0e6', lip: '#fbf9f3', inner: '#ece6d8', line: 'white', bands: [[12, 2.6], [18, 1]], gloss: .6, ...o });   // 茶碗
export const donburi = (p, o = {}) => vessel(p, { cy: 80, rx: 92, h: 62, fx: 38, ft: 7, outer: '#f6f3ec', lip: '#fbfaf6', inner: '#f2eee4', line: 'white', dots: true, bands: [[30, 1.4]], gloss: .6, ...o });   // どんぶり
export const kobachi = (p, o = {}) => vessel(p, { cy: 84, rx: 92, h: 44, fx: 54, ft: 5, outer: '#9fbfae', lip: '#b7d0c2', inner: '#eef2ea', line: 'none', belly: .5, ...o });   // 小鉢（青磁。今の絵も線なし）
export const shiroBowl = (p, o = {}) => vessel(p, { cy: 76, rx: 92, h: 58, fx: 42, ft: 6, outer: '#f4f0e6', lip: '#fbf9f3', inner: '#f2eee4', line: 'white', gloss: .6, ...o });   // 白い鉢（洋のスープなど）

// 平皿（白・藍の線）。中身は見込み（well）の上に置く。返り値の o は面の中心
export function plate(p, { cx = 100, cy = 106, rx = 92, h = 12, well = .7, base = '#fbfaf6', line = 'white' } = {}){
    const ry = rx * SY, fx = rx * .62, fy = fx * SY, by = cy + h, w = rx * well;
    const side = `M${f(cx - rx)},${f(cy)} C${f(cx - rx)},${f(cy + h)} ${f(cx - fx - 12)},${f(by + fy * .5)} ${f(cx - fx)},${f(by + fy * .55)} L${f(cx + fx)},${f(by + fy * .55)} C${f(cx + fx + 12)},${f(by + fy * .5)} ${f(cx + rx)},${f(cy + h)} ${f(cx + rx)},${f(cy)}Z`;
    const s = ground(p, cx, by + fy * .45, rx * .78) +
        `<path d="${side}" fill="${lg(p, [[0, lt(base, .1)], [.6, dk(base, .08)], [1, dk(base, .22)]])}" stroke="${dk(base, .28)}" stroke-width=".6"/>` +
        `<path d="${eD(cx, cy, rx, ry)}" fill="${lg(p, [[0, lt(base, .4)], [1, dk(base, .05)]])}" stroke="${dk(base, .2)}" stroke-width=".6"/>` +
        rimLine(cx, cy, rx - 2.2, line) +
        `<path d="${eD(cx, cy + 2, w, w * SY)}" fill="${lg(p, [[0, dk(base, .08)], [.35, base], [1, lt(base, .3)]], 0, 0, 0, 1)}"/>` +
        `<path d="M${f(cx - w)},${f(cy + 2)} A${f(w)},${f(w * SY)} 0 0 1 ${f(cx + w)},${f(cy + 2)}" stroke="${dk(base, .15)}" stroke-width="1.6" fill="none" opacity=".8"/>` +
        `<path d="M${f(cx - rx * .9)},${f(cy - ry * .4)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx * .35)},${f(cy - ry * .93)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>`;
    return { s, cx, cy: cy + 2, rx: w, ry: w * SY, o: { cx, cy: cy + 2 } };
}
// 楕円の皿（カレー・グラタン）: 面で rx × rz の楕円
export function ovalPlate(p, { cx = 100, cy = 104, rx = 92, rz = 70, h = 10, well = .78, base = '#fbfaf6', line = 'white' } = {}){
    const ry = rz * SY, wx = rx * well, wy = ry * well;
    const s = ground(p, cx, cy + h + ry * .5, rx * .8) +
        `<path d="M${f(cx - rx)},${f(cy)} L${f(cx - rx + 6)},${f(cy + h)} A${f(rx - 6)},${f(ry - 3)} 0 0 0 ${f(cx + rx - 6)},${f(cy + h)} L${f(cx + rx)},${f(cy)}Z" fill="${lg(p, [[0, lt(base, .1)], [.6, dk(base, .08)], [1, dk(base, .22)]])}"/>` +
        `<path d="${eD(cx, cy, rx, ry)}" fill="${lg(p, [[0, lt(base, .4)], [1, dk(base, .05)]])}" stroke="${dk(base, .2)}" stroke-width=".6"/>` +
        (line === 'none' ? '' : `<path d="${eD(cx, cy, rx - 4, ry - 2.4)}" fill="none" stroke="${INDIGO}" stroke-width="2"/>`) +
        `<path d="${eD(cx, cy + 2, wx, wy)}" fill="${lg(p, [[0, dk(base, .1)], [.35, base], [1, lt(base, .3)]], 0, 0, 0, 1)}"/>`;
    return { s, cx, cy: cy + 2, rx: wx, ry: wy, o: { cx, cy: cy + 2 } };
}
// 長皿・角皿（焼き魚・香の物）: 面で w × d の角丸の板。面の座標で描いて縦につぶす
export function slabPlate(p, { cx = 100, cy = 104, w = 184, d = 120, r = 18, h = 8, base = '#f4f1ea', line = 'white' } = {}){
    const rect = (ww, dd, rr) => `<rect x="${f(-ww / 2)}" y="${f(-dd / 2)}" width="${f(ww)}" height="${f(dd)}" rx="${f(rr)}"/>`;
    const tr = (y) => `transform="translate(${cx} ${f(y)}) scale(1 ${SY})"`;
    const s = ground(p, cx, cy + h + d * SY * .32, w * .46, { sy: .6 }) +
        `<g ${tr(cy + h)} fill="${dk(base, .22)}">${rect(w - 4, d - 4, r)}</g>` +
        `<g ${tr(cy + h * .5)} fill="${dk(base, .1)}">${rect(w - 2, d - 2, r)}</g>` +
        `<g ${tr(cy)} fill="${lg(p, [[0, lt(base, .4)], [1, dk(base, .06)]], 0, 0, 1, 1)}" stroke="${dk(base, .2)}" stroke-width=".8" vector-effect="non-scaling-stroke">${rect(w, d, r)}</g>` +
        (line === 'none' ? '' : `<g ${tr(cy)} fill="none" stroke="${INDIGO}" stroke-width="2" vector-effect="non-scaling-stroke">${rect(w - 9, d - 9, r - 4)}</g>`) +
        `<g ${tr(cy + 1.5)} fill="${lg(p, [[0, dk(base, .08)], [.3, base], [1, lt(base, .2)]], 0, 0, 0, 1)}">${rect(w - 22, d - 22, r - 8)}</g>`;
    return { s, cx, cy: cy + 1.5, o: { cx, cy: cy + 1.5 } };
}
// 浅い鍋（パエリア鍋・フライパン）: 鋼の色。取っ手 2つ（handles: 'loop' = 両側の輪／'long' = 右に長い柄）
export function pan(p, { cx = 100, cy = 100, rx = 84, h = 13, outer = '#9ea3aa', lip = '#b4b9bf', inner = '#8a9097', handles = 'loop', handleC = '#d2402c' } = {}){
    const ry = rx * SY, irx = rx - 3.5, iry = irx * SY, mouth = eD(cx, cy + .5, irx, iry);
    let s = ground(p, cx, cy + h + ry * .6, rx * .9);
    const loop = side => { const x = cx + side * (rx - 1); return `<path d="M${f(x)},${f(cy - 4)} q${side * 17},-2 ${side * 17},9 q0,10 ${-side * 17},8" stroke="${dk(handleC, .4)}" stroke-width="5.6" fill="none" stroke-linecap="round"/><path d="M${f(x)},${f(cy - 4)} q${side * 17},-2 ${side * 17},9 q0,10 ${-side * 17},8" stroke="${side < 0 ? handleC : dk(handleC, .15)}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; };
    if (handles === 'loop') s += loop(-1) + loop(1);
    if (handles === 'long') s += `<path d="M${f(cx + rx - 4)},${f(cy + 2)} L${f(cx + rx + 30)},${f(cy - 10)}" stroke="#5a4636" stroke-width="7" stroke-linecap="round"/><path d="M${f(cx + rx - 4)},${f(cy + 1)} L${f(cx + rx + 30)},${f(cy - 11)}" stroke="#8a6a50" stroke-width="3.6" stroke-linecap="round"/>`;
    s += `<path d="M${f(cx - rx)},${f(cy)} L${f(cx - rx + 4)},${f(cy + h)} A${f(rx - 4)},${f((rx - 4) * SY)} 0 0 0 ${f(cx + rx - 4)},${f(cy + h)} L${f(cx + rx)},${f(cy)}Z" fill="${lg(p, [[0, lt(outer, .3)], [.35, outer], [1, dk(outer, .4)]])}" stroke="${dk(outer, .45)}" stroke-width=".7"/>`;
    s += `<path d="${eD(cx, cy, rx, ry)}" fill="${lip}" stroke="${dk(outer, .4)}" stroke-width=".7"/>` + `<path d="${mouth}" fill="${lg(p, [[0, dk(inner, .25)], [1, lt(inner, .15)]])}"/>` + rimLine(cx, cy, rx, 'thin');
    return { s, cx, cy, rx, ry, irx, iry, mouth, inside: clip(p, mouth),
        shine: (op = .65) => `<path d="M${f(cx - rx * .92)},${f(cy - ry * .38)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx * .35)},${f(cy - ry * .93)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>` };
}
// 土鍋（ふたなし。土色の外・飴釉の口・小さな耳）。石鍋は stone: true（焦げ茶の石。黒は使わない）
export function donabe(p, { cx = 100, cy = 80, rx = 92, h = 54, stone = false, ...o } = {}){
    const outer = stone ? '#5a4a42' : '#7a5236', lip = stone ? '#6e5e56' : '#5e3a22', inner = stone ? '#4a3c36' : '#e9dcc4';
    const v = vessel(p, { cx, cy, rx, h, fx: 52, ft: 0, t: 5, outer, lip, inner, line: 'thin', belly: .7, gloss: .3, ...o });
    const ear = side => `<path d="M${f(cx + side * (rx - 2))},${f(cy + 4)} q${side * 12},0 ${side * 12},7 q0,6 ${-side * 12},6Z" fill="${lg(p, [[0, lt(outer, .2)], [1, dk(outer, .3)]])}" stroke="${dk(outer, .45)}" stroke-width=".6"/>`;
    return { ...v, s: ear(-1) + ear(1) + v.s };
}

// 汁・煮汁の面（江口の描き方）: 口より drop 下の楕円。中心が明るく縁が濃い面、縁の陰、左上の照り。
// 返り値 s は器の口で切ってある。具を汁に沈めるときは inside（面の形の clip）を使う
export function surface(p, V, { drop = 10, rx = null, c, glow = .25, rimShade = .26 }){
    rx = rx ?? V.irx - drop * .45;
    const cy = V.cy + drop, ry = rx * SY, sd = eD(V.cx, cy, rx, ry);
    const s = `<g ${V.inside}><path d="${sd}" fill="${rg(p, [[0, lt(c, glow)], [.6, c], [1, dk(c, .22)]], .42, .36, .62)}"/>
        <g ${clip(p, sd)}><path fill-rule="evenodd" d="M0,0 H200 V200 H0Z ${eD(V.cx + 7, cy + 4, rx * .98, ry * .96)}" fill="${SHADE}" opacity="${rimShade}" ${blur(p, 3)}/>
        <path d="M${f(V.cx - rx * .9)},${f(cy - ry * .2)} A${f(rx * .95)},${f(ry * .9)} 0 0 1 ${f(V.cx + rx * .5)},${f(cy - ry * .84)}" stroke="${lt(c, .55)}" stroke-width="1.6" fill="none" opacity=".65"/></g></g>`;
    return { s, cx: V.cx, cy, rx, ry, o: { cx: V.cx, cy }, inside: clip(p, sd) };
}
// 奥を淡く・手前を濃く（空気の層）: 中身を描いたあとに重ねる
export const depthVeil = (p, V, top, bottom) => `<rect x="0" y="${f(top)}" width="200" height="${f(bottom - top)}" fill="${lg(p, [[0, '#fff8ec', .2], [.45, '#fff8ec', 0], [.75, SHADE, 0], [1, SHADE, .1]], 0, 0, 0, 1)}" ${V.inside}/>`;

// =========================================================
// 具
// =========================================================
// 角柱（花森の描き方）: 面の多角形 pts を高さ hgt で立ち上げ、手前を向いた側面だけ描く。角切り・豆腐・にんじん・こんにゃく
export function prism(p, x, y, pts, hgt, c, { rot = 0, top = null, line = .5, sink = 0, liquid = null } = {}){
    const a = rot * Math.PI / 180, P2 = pts.map(([u, v]) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]);
    const pr = ([u, v], z) => [x + u, y + v * SY - z * CZ];
    const n = P2.length; let area = 0; for (let i = 0; i < n; i++){ const [u1, v1] = P2[i], [u2, v2] = P2[(i + 1) % n]; area += u1 * v2 - u2 * v1; }
    const sg = area > 0 ? 1 : -1, out = [sink ? '' : cast(p, x, y + 1, Math.max(...P2.map(q => Math.abs(q[0]))) * 1.05, Math.max(...P2.map(q => Math.abs(q[0]))) * SY * .6, .28)];
    for (let i = 0; i < n; i++){
        const A = P2[i], B = P2[(i + 1) % n], du = B[0] - A[0], dv = B[1] - A[1], nu = dv * sg, nv = -du * sg, L = Math.hypot(nu, nv);
        if (nv / L <= .02) continue;
        const col = mix(lt(c, .02), dk(c, .34), (.5 + .5 * nu / L) * .9);   // 右を向いた面ほど暗い
        const q = [pr(A, hgt), pr(B, hgt), pr(B, sink), pr(A, sink)];
        out.push(`<path d="M${q.map(([u, v]) => `${f(u)},${f(v)}`).join('L')}Z" fill="${col}" stroke="${dk(c, .45)}" stroke-width="${line}" stroke-linejoin="round"/>`);
        if (sink && liquid) out.push(`<path d="M${f(pr(A, sink)[0])},${f(pr(A, sink)[1])} L${f(pr(B, sink)[0])},${f(pr(B, sink)[1])}" stroke="${lt(liquid, .4)}" stroke-width="1" opacity=".8"/>`);
    }
    const tp = P2.map(q => pr(q, hgt));
    out.push(`<path d="M${tp.map(([u, v]) => `${f(u)},${f(v)}`).join('L')}Z" fill="${top || lit(p, c)}" stroke="${dk(c, .45)}" stroke-width="${line}" stroke-linejoin="round"/>`);
    return out.join('');
}
export const square = s => [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
// さいの目（豆腐など）。汁に浮かせるときは sink（沈む高さ）と liquid（汁の色）
export const cube = (p, x, y, s, rot, c = '#f6f1e2', o = {}) => prism(p, x, y, square(s), s * .62, c, { rot, top: lg(p, [[0, '#fffefa'], [1, lt(c, .02)]], 0, 0, 1, 1), line: .55, ...o });
// 乱切り（にんじん・大根）: 角ばった塊
export const rangiri = (p, x, y, s, rot, c = '#e97a2a', seed = 1) => { const R = rng('rg' + seed); return prism(p, x, y, Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.283, r = s / 2 * (.75 + R() * .4); return [Math.cos(a) * r, Math.sin(a) * r * .8]; }), s * .45, c, { rot }); };
// 丸い具（じゃがいも・里芋・鶏肉・肉団子）: 左上に光、右下に陰
export function lump(p, x, y, rx, ry, c, seed, { n = 8, jit = .26, hi = .5, edge = null } = {}){
    const d = blob(x, y, rx, ry, seed, { n, jit });
    return dropOf(p, d, 2, 2.8, .34, 1.6) +
        `<path d="${d}" fill="${rg(p, [[0, lt(c, .34)], [.55, c], [1, edge || dk(c, .3)]], .34, .3, .78)}" stroke="${dk(c, .42)}" stroke-width=".65"/>` +
        `<path d="M${f(x - rx * .55)},${f(y - ry * .05)} Q${f(x - rx * .45)},${f(y - ry * .62)} ${f(x + rx * .05)},${f(y - ry * .7)}" stroke="#fff" stroke-width="${f(Math.max(1, rx * .1))}" fill="none" stroke-linecap="round" opacity="${hi}"/>`;
}
// 平たい具（薄切り肉・魚の切り身・卵焼きの面）: 側面の厚みを重ねて上の面を明るく
export function slab(p, x, y, rx, ry, depth, c, seed, { n = 12, jit = .28, rot = 0, sharp = false, edgeC = null } = {}){
    const top = blob(x, y, rx, ry, seed, { n, jit, rot, sharp }), steps = Math.max(2, Math.round(depth / 1.2));
    let side = '';
    for (let i = steps; i >= 1; i--) side += `<path d="${top}" transform="translate(0 ${f(depth * i / steps)})" fill="${edgeC || dk(c, .18 + .22 * i / steps)}"/>`;
    return { d: top, s: dropOf(p, top, 1.8, depth + 1.8, .3) + side + `<path d="${top}" fill="${lit(p, c)}" stroke="${dk(c, .45)}" stroke-width=".6"/>` };
}
// 豆（花森の描き方）: 光と影の球。グリーンピース・枝豆・大豆（c を変える）
export const pea = (p, x, y, r = 2.8, c = '#76b83a') => cast(p, x, y + r * .6, r * .9, r * .4, .3) + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${rg(p, [[0, lt(c, .45)], [.5, c], [1, dk(c, .45)]], .35, .3, .75)}" stroke="${dk(c, .55)}" stroke-width=".5"/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .38)}" r="${f(r * .28)}" fill="#fff" opacity=".8"/>`;
// 細長い豆（いんげん豆・小豆・黒豆は焦げ茶で）
export const bean = (p, x, y, s, rot, c = '#c46a4a') => `<g ${T(x, y, rot)}>${cast(p, 0, s * .2, s * .5, s * .2, .3)}<ellipse rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${rg(p, [[0, lt(c, .4)], [.55, c], [1, dk(c, .4)]], .35, .3, .75)}" stroke="${dk(c, .5)}" stroke-width=".5"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .1)}" rx="${f(s * .12)}" ry="${f(s * .05)}" fill="#fff" opacity=".7"/></g>`;
// 葉（花森の描き方）: 面に置いた波打つ葉を縦につぶす。わかめ・ほうれん草・小松菜・青じそ
export function leaf(p, x, y, w, rot, c, seed, { wave = 3, vein = true, op = 1 } = {}){
    const R = rng('lf' + seed), pts = [];
    for (let i = 0; i <= 8; i++){ const u = -w / 2 + i * w / 8, k = Math.sin(i / 8 * Math.PI); pts.push([u, -w * .3 * k - Math.sin(i * 1.7) * wave * k - R() * 2]); }
    for (let i = 8; i >= 0; i--){ const u = -w / 2 + i * w / 8, k = Math.sin(i / 8 * Math.PI); pts.push([u, w * .3 * k + Math.sin(i * 1.4) * wave * k + R() * 2]); }
    const d = smooth(pts);
    return `<g transform="translate(${f(x)} ${f(y)}) scale(1 ${SY}) rotate(${f(rot)})" opacity="${op}"><path d="${d}" transform="translate(1.5 3)" fill="${SHADE}" opacity=".25"/><path d="${d}" transform="translate(0 1.6)" fill="${dk(c, .35)}"/><path d="${d}" fill="${lg(p, [[0, lt(c, .2)], [.5, c], [1, dk(c, .2)]], 0, 0, 1, 1)}" stroke="${dk(c, .4)}" stroke-width=".8"/>${vein ? `<path d="M${f(-w * .4)},0 Q0,-2 ${f(w * .4)},1" stroke="${lt(c, .35)}" stroke-width="1.4" fill="none" opacity=".7"/>` : ''}</g>`;
}
// 葉物のこんもりした山（おひたし・和え物）: 奥から手前へ葉を重ね、中心を高く
export function greensMound(p, cx, cy, rx, H, c = '#3d7d2a', seed = 1, { n = 16, stem = '#9cc46a' } = {}){
    const R = rng('gm' + seed), it = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d * rx, v = Math.sin(a) * d * rx, z = H * (1 - d * d); const [x, y] = at({ cx, cy }, u, v, z); it.push([y, () => leaf(p, x, y, 28 + R() * 12, R() * 180, R() < .3 ? lt(c, .12) : c, seed * 100 + i, { wave: 2 }) + (R() < .4 ? `<path d="M${f(x - 6)},${f(y + 1)} l12,-2" stroke="${stem}" stroke-width="2.2" stroke-linecap="round"/>` : '')]); }
    return cast(p, cx, cy + 2, rx * 1.05, rx * SY * .7, .3) + byDepth(it);
}
// 千切りの山（キャベツ・大根・ごぼう）: 江口の描き方を一般化。colors = [明るい, ふつう, 暗い]
export function shredMound(p, cx, cy, rx, H, colors = ['#f4f8e4', '#cfe3a2', '#a9c87a'], seed = 1, { n = 150, w = 1.5 } = {}){
    const R = rng('sm' + seed), ry = rx * SY, pts = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d, v = Math.sin(a) * d; pts.push([cx + u * rx, cy + v * ry - H * Math.pow(1 - d * d, .7), v, u]); }
    pts.sort((a, b) => a[2] - b[2]);
    let o = '';
    for (const [x, y, v, u] of pts){ const L = 7 + R() * 7, bend = (R() - .5) * 5, c = (-u - v) > .2 ? colors[0] : (R() < .6 ? colors[1] : colors[2]); o += `<g ${T(x, y, R() * 180)}><path d="M${f(-L / 2)},0 Q0,${f(bend)} ${f(L / 2)},0" stroke="${dk(c, .25)}" stroke-width="${w + .9}" fill="none" stroke-linecap="round" opacity=".5"/><path d="M${f(-L / 2)},0 Q0,${f(bend)} ${f(L / 2)},0" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`; }
    const base = `<path d="M${f(cx - rx)},${f(cy)} Q${f(cx - rx * .5)},${f(cy - H * 1.3)} ${f(cx)},${f(cy - H * 1.05)} Q${f(cx + rx * .5)},${f(cy - H * 1.3)} ${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z" fill="${rg(p, [[0, colors[0]], [1, colors[2]]], .36, .3, .8)}"/>`;
    return cast(p, cx, cy + ry * .5, rx * 1.02, ry * .6, .3) + base + o;
}
// ご飯の山（江口の描き方）: 斜めから見たドームに粒を並べ、左上を向いた粒ほど明るく。輪郭は淡い影で締める
export function riceDome(p, cx, cy, rx, ry, H, { n = 560, seed = 1, tint = '#f7f4ea', grain = '#e4ddca' } = {}){
    const R = rng(p.id + 'rd' + seed), prof = q => Math.pow(Math.max(0, 1 - q), .62);
    const top = []; for (let i = 0; i <= 40; i++){ const u = -1 + 2 * i / 40; top.push([cx + u * rx, cy - H * prof(u * u) - Math.sqrt(Math.max(0, 1 - u * u)) * ry * .25]); }
    const outline = `M${f(cx - rx)},${f(cy)} ${top.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z`;
    const gs = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d, v = Math.sin(a) * d, z = H * prof(d * d); const gu = u * 1.6, gv = v * 1.2 - .7; gs.push({ x: cx + u * rx * .98, y: cy + v * ry - z, v, l: -(gu * .7 + gv * .7) / Math.hypot(gu, gv, 1) + .2, sc: .82 + .25 * (v + 1) / 2, r: R() * 180 }); }
    gs.sort((a, b) => a.v - b.v);
    const g = gs.map(({ x, y, l, sc, r }) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2.5 * sc)}" ry="${f(1.35 * sc)}" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${l > .45 ? '#ffffff' : l > .05 ? '#faf7ef' : l > -.3 ? '#f0ebdd' : '#e4dcc8'}" stroke="${l > .05 ? grain : dk(grain, .1)}" stroke-width=".4"/>`).join('');
    return `<path d="${outline}" fill="${rg(p, [[0, '#ffffff'], [.55, tint], [1, '#d6ccb4']], .38, .3, .75)}"/>${g}
        <path d="${outline}" fill="${lg(p, [[0, SHADE, 0], [.5, SHADE, 0], [1, SHADE, .2]], 0, 0, 1, 1)}"/>
        <path d="M${f(cx - rx)},${f(cy)} ${top.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)}" fill="none" stroke="#bfb397" stroke-width="1.2" opacity=".75"/>`;
}
// 平らに広がった粒（チャーハン・パエリア・炊き込みご飯の面）: color(d, x) で色を返す。d は中心からの距離 0〜1
export function grainsPlane(p, cx, cy, rx, { n = 400, seed = 1, color = () => '#f6c860', edge = '#b06a20', size = 2.4 } = {}){
    const R = rng(p.id + 'gp' + seed), gs = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()); gs.push([cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * rx * SY, R() * 180, d]); }
    return gs.sort((a, b) => a[1] - b[1]).map(([x, y, r, d]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${size}" ry="${f(size * .5)}" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${color(d, x)}" stroke="${edge}" stroke-width=".35"/>`).join('');
}
// 小口切り（ねぎ）: 横長の輪
export const negi = (p, x, y, s = 5.4, c = '#5fa03a') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s / 2 * SY * 1.1)}" fill="${lt(c, .55)}" stroke="${c}" stroke-width="1.2"/>`;
// 湯気（器の上）
export const steam = (cx, top, op = .5) => `<path d="M${cx - 16},${top + 20} c-5,-7 5,-12 0,-19 M${cx + 2},${top + 16} c-5,-7 5,-12 0,-19 M${cx + 20},${top + 20} c-5,-7 5,-12 0,-19" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 照り（たれ・煮汁）の細い白い弧と、右端の白い点（江口の描き方）
export const shine = (x, y, w, r = 0, op = .85) => `<g ${T(x, y, r)}><path d="M${f(-w / 2)},0 Q0,${f(-w * .18)} ${f(w / 2)},0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/><circle cx="${f(w / 2 + 2.4)}" cy="-.4" r=".9" fill="#fff" opacity="${op}"/></g>`;

// =========================================================
// 江口の描き方（オーナー採用: 肉じゃが・生姜焼き・ご飯）
// =========================================================
// 煮物の具（じゃがいも・里芋・大根の面取りなど）: 放射状の塗り、縁は煮汁の飴色、左上に白い照りの弧と鏡の白い点
export function glossLump(p, x, y, s, seed, { c = '#ecc77c' } = {}){
    const R = rng(p.id + 'po' + seed);
    const d = smooth(ring(s / 2, 7, .28, R, 1.08, .82, R()), true, .6);
    return `${cast(p, x, y + s * .3, s * .5, s * .16, .35)}<g ${T(x, y)}>
        <path d="${d}" fill="${rg(p, [[0, lt(c, .4)], [.55, c], [.85, mix(c, '#b9853f', .45)], [1, dk(c, .35)]], .36, .3, .72)}" stroke="${dk(c, .32)}" stroke-width=".8"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .18)},${f(-s * .34)} ${f(s * .08)},${f(-s * .34)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .2)}" rx="${f(s * .06)}" ry="${f(s * .035)}" fill="#fff" opacity=".85"/></g>`;
}
// 平たい具の厚み: 真下にずらした濃い縁（dy）＋ 右下にぼかした影。filter として使う: `<g ${thick(p)}>…</g>`
export function thick(p, dy = 2, c = '#6a3a18', k = .7){
    const id = p.def('th' + dy + c + k, id => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="160%"><feOffset in="SourceAlpha" dy="${dy}" result="o"/><feFlood flood-color="${c}"/><feComposite in2="o" operator="in" result="t"/><feOffset in="SourceAlpha" dx="${1.6 * k}" dy="${dy + 1.8 * k}" result="o2"/><feGaussianBlur in="o2" stdDeviation="${1.2 * k}" result="b"/><feFlood flood-color="${SHADE}" flood-opacity=".32"/><feComposite in2="b" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="t"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// 平皿の肉（基準）: kit.mjs の porkSlice を縦に sq 倍につぶし、thick で厚み。opt は porkSlice の設定（c・fat・seed・gloss・bend・char）
export const slice3q = (p, x, y, s, r, opt, { th = 2, tc = '#6a3a18', sq = .6 } = {}) => `<g ${thick(p, th, tc, .8)}><g transform="translate(${f(x)} ${f(y)}) scale(1 ${sq})">${K.porkSlice(p, 0, 0, s, r, opt)}</g></g>`;
// たれだまり（平皿）: 中心が明るく縁が濃い面、左上に照り
export function tarePool(p, cx, cy, rx, c = '#94521c', seed = 'tare'){
    return `<path d="${smooth(ring(rx, 10, .2, rng(seed), 1, SY * 1.05))}" transform="translate(${f(cx)} ${f(cy)})" fill="${rg(p, [[0, lt(c, .3)], [.6, c], [1, dk(c, .35)]], .4, .36, .6)}" opacity=".92"/>
        <path d="M${f(cx - rx * .78)},${f(cy - 2)} Q${f(cx - rx * .48)},${f(cy - rx * SY * .5)} ${f(cx - rx * .09)},${f(cy - rx * SY * .55)}" stroke="#ffd9a0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
}

// 海老（花森の描き方。オーナーの指摘で「耳に見えない」形に直したもの）: 丸まった胴を横から見せ、頭・殻の節・尾・脚・ひげで一目で海老と分かる。
// 海老を使う料理（えびフライ・天丼・エビチリ・パエリアなど）は全員これを使う。s は胴の長さの目安、flip = -1 で左右反転
export function prawn3q(p, x, y, s, rot = 0, flip = 1, { c = '#f2743e', line = '#a83a20' } = {}){
    const L = s * 1.25, P0 = [-L / 2, 2], P1 = [-L * .05, -L * .36], P2 = [L / 2, L * .02];
    const B = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
    const N = t => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]), l = Math.hypot(dx, dy); return [dy / l, -dx / l]; };
    const W = t => t < .3 ? s * (.15 + .03 * Math.sin(t / .3 * Math.PI)) : s * (.17 - (t - .3) / .62 * .1);
    const off = (t, k) => { const [bx, by] = B(t), [nx, ny] = N(t), w = W(t) * k; return [bx + nx * w, by + ny * w]; };
    const ts = Array.from({ length: 25 }, (_, i) => .02 + i / 24 * .9);
    const body = 'M' + ts.map(t => off(t, 1).map(f).join(',')).join('L') + 'L' + ts.slice().reverse().map(t => off(t, -1).map(f).join(',')).join('L') + 'Z';
    const red = dk(c, .1), deep = dk(c, .25);
    let legs = '';
    for (let i = 0; i < 7; i++){ const t = .12 + i * .1, [lx, ly] = off(t, -.9), [nx, ny] = N(t); legs += `<path d="M${f(lx)},${f(ly)} l${f(-nx * 5 - 1.5)},${f(-ny * 5)}" stroke="${deep}" stroke-width="1" stroke-linecap="round"/>`; }
    const [ex, ey] = B(.92), base = Math.atan2(N(.92)[1], N(.92)[0]) - Math.PI / 2;
    const tail = [-.5, 0, .5].map(a => { const ang = base + a * .9, tl = s * .26; return `<path d="M${f(ex)},${f(ey)} L${f(ex + Math.cos(ang - .22) * tl)},${f(ey + Math.sin(ang - .22) * tl)} Q${f(ex + Math.cos(ang) * tl * 1.12)},${f(ey + Math.sin(ang) * tl * 1.12)} ${f(ex + Math.cos(ang + .22) * tl)},${f(ey + Math.sin(ang + .22) * tl)}Z" fill="${red}" stroke="${line}" stroke-width=".6" stroke-linejoin="round"/>`; }).join('');
    let seg = '';
    for (let i = 0; i < 6; i++){ const t = .32 + i * .1, a = off(t, 1.05), b = off(t, -1.05); seg += `<path d="M${f(a[0])},${f(a[1])} Q${f((a[0] + b[0]) / 2 + 2)},${f((a[1] + b[1]) / 2)} ${f(b[0])},${f(b[1])}" stroke="${dk(c, .2)}" stroke-width="1.1" fill="none"/>`; }
    const back = 'M' + Array.from({ length: 14 }, (_, i) => off(.05 + i / 13 * .82, .55).map(f).join(',')).join('L');
    const [hx, hy] = B(.04), [n0x, n0y] = N(.04), [cx2, cy2] = B(.18);
    const head = `<path d="M${f(hx + n0x * s * .1)},${f(hy + n0y * s * .1)} L${f(hx - s * .22)},${f(hy - s * .16)} L${f(hx - s * .02)},${f(hy - n0y * s * .02)}Z" fill="${red}" stroke="${line}" stroke-width=".6" stroke-linejoin="round"/>` +
        `<circle cx="${f(hx + s * .05)}" cy="${f(hy - s * .02)}" r="${f(s * .04)}" fill="#4a1e12"/>` +
        `<path d="M${f(hx)},${f(hy + s * .04)} C${f(hx - s * .3)},${f(hy + s * .1)} ${f(hx - s * .2)},${f(hy - s * .5)} ${f(hx + s * .25)},${f(hy - s * .62)}" stroke="${deep}" stroke-width=".9" fill="none"/>` +
        `<path d="M${f(hx)},${f(hy + s * .06)} C${f(hx - s * .36)},${f(hy + s * .2)} ${f(hx - s * .44)},${f(hy - s * .3)} ${f(hx - s * .3)},${f(hy - s * .52)}" stroke="${deep}" stroke-width=".8" fill="none"/>`;
    const carapace = `<path d="M${f(off(.02, 1)[0])},${f(off(.02, 1)[1])} Q${f(cx2)},${f(cy2 + s * .02)} ${f(off(.3, -1)[0])},${f(off(.3, -1)[1])}" stroke="${dk(c, .2)}" stroke-width="1" fill="none" opacity=".8"/>`;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${flip} 1)"><path d="${body}" fill="${SHADE}" opacity=".3" transform="translate(2 4)" ${blur(p, 1.4)}/>${legs}${tail}<path d="${body}" fill="${lg(p, [[0, lt(c, .45)], [.45, c], [1, dk(c, .2)]], 0, 0, 0, 1)}" stroke="${line}" stroke-width=".8" stroke-linejoin="round"/>${seg}${carapace}<path d="${back}" stroke="${lt(c, .62)}" stroke-width="${f(s * .05)}" fill="none" stroke-linecap="round" opacity=".85"/>${head}</g>`;
}
