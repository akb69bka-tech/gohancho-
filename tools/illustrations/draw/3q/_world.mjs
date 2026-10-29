// 外国のおかず（主菜・副菜・汁物）を斜め上35度で描くための部品（オーナーの決定 3番。基準書 docs/illustration_3q.md「8. 外国のおかず」）
// _ で始まるので build.mjs は読まない。国ごとの盛りつけファイル（3q/world_<国>.mjs）から import する。
// 決まり: 器はその国の食べ方に合うもの（基準書の「器の決まり」と「主食の器」）。青・藍は使わない（縁は錆・こげ茶・柿・若草・灰・金・朱）。
// 光は左上、影は右下、黒は使わない（いちばん暗い色は焦げ茶 SHADE）。材料は packs/<国>.js の ings と seas にあるものだけ。
import * as Q from '../kit3q.mjs';
import * as K from '../kit.mjs';
export { Q, K };
export const { f, T, rng, smooth, ring, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth, RIM } = Q;

// =========================================================
// 置き場所
// =========================================================
// 半径 R の円の中に、間を minD あけて n 個散らす（面の座標 u, v と向き rot）
export function spots(seed, n, R, minD, { ry = R, cu = 0, cv = 0 } = {}){
    const r = rng('wsp' + seed), out = [];
    let d = minD, tries = 0;
    while (out.length < n && tries < 9000){
        tries++;
        const a = r() * 6.283, rr = Math.sqrt(r()), u = cu + Math.cos(a) * rr * R, v = cv + Math.sin(a) * rr * ry;
        if (out.every(([pu, pv]) => Math.hypot(pu - u, pv - v) >= d)) out.push([u, v, r() * 360]);
        if (tries % 500 === 0) d *= .9;
    }
    return out;
}
// 山の高さ（中心が高い）
export const hill = (u, v, R, H, k = .8) => H * Math.max(0, 1 - (u * u + v * v) / R / R) ** k;
// 山の上に散らす: [[y, () => svg]]。draw(x, y, rot, i)
export const onHill = (o, seed, n, R, minD, H, draw, { lift = 0, k = .8, ry = R, cu = 0, cv = 0 } = {}) =>
    spots(seed, n, R, minD, { ry, cu, cv }).map(([u, v, r], i) => { const [x, y] = at(o, u, v, hill(u - cu, v - cv, R, H, k) + lift); return [y, () => draw(x, y, r, i)]; });

// =========================================================
// 器（青は使わない）
// =========================================================
export const EDGE = { grey: '#b4a896', gold: '#c49a42', red: '#b8402c', rust: RIM.sabi, green: RIM.wakakusa, koge: RIM.koge };
// 洋の白い平皿（アメリカ・ヨーロッパの家庭の dinner plate）。縁に淡い灰の線
export const dinnerPlate = (p, o = {}) => Q.plate(p, { line: 'none', edge: EDGE.grey, ...o });
// 洋のボウル（シリアル・チリ・シチュー用の厚手の陶器）。外の釉 outer、見込み inner、口の線 edge
export function bowl(p, { outer = '#e8dcc6', inner = '#f6f0e4', edge = null, cy = 78, rx = 92, h = 54, fx = 40, ...o } = {}){
    const v = Q.vessel(p, { cy, rx, h, fx, ft: 6, t: 4.4, outer, lip: lt(outer, .25), inner, line: 'none', belly: .56, gloss: .45, ...o });
    return { ...v, s: v.s + (edge ? `<path d="${Q.eD(100, cy, rx - 1.6, (rx - 1.6) * SY)}" fill="none" stroke="${edge}" stroke-width="1.3"/>` : '') };
}
// 副菜の小さな鉢（洋のサイドボウル・ラムカン、韓国のパンチャン皿）: 浅めの小鉢の形を使い、山高に盛る
export const sideBowl = (p, { outer = '#f1ece1', inner = '#faf7f0', edge = EDGE.grey, ...o } = {}) => Q.asabachi(p, { outer, inner, lip: lt(outer, .3), edge, ...o });
// 洋の深皿（具だくさんのスープ・煮込み）とスープカップ（なめらかなスープ）
export const soupPlate = (p, o = {}) => Q.fukazara(p, { line: EDGE.gold, ...o });
export const soupCup = (p, o = {}) => Q.soupCup(p, { line: EDGE.gold, ...o });
// 木のサラダボウル（アメリカのサラダ）
export const woodBowl = (p, o = {}) => bowl(p, { outer: '#a8703a', inner: '#c8925a', h: 38, cy: 90, fx: 50, gloss: .3, ...o });
// 鋳鉄のスキレット（ファヒータ・コーンブレッド）: 焦げ茶の鉄（黒にしない）、右に柄
export const skillet = (p, o = {}) => Q.pan(p, { rx: 82, cy: 102, h: 14, outer: '#5a4a40', lip: '#6a5a50', inner: '#4e4038', handles: 'long', handleLen: 18, handleRise: 10, rim: '#7a6a5e', ...o });
// 角のグラタン皿・耐熱皿（エンチラーダ・ベイクドビーンズ・コーンブレッド）: 面で w × d、深さ h。中身は inside で切る
export function casserole(p, { cx = 100, cy = 96, w = 176, d = 124, r = 14, h = 20, base = '#e9dccb', inner = '#f6efe2', lip = null } = {}){
    const sy = SYF, rect = (ww, dd, rr) => `<rect x="${f(-ww / 2)}" y="${f(-dd / 2)}" width="${f(ww)}" height="${f(dd)}" rx="${f(rr)}"/>`;
    const tr = y => `transform="translate(${cx} ${f(y)}) scale(1 ${sy})"`;
    lip = lip || lt(base, .25);
    const iw = w - 14, id = d - 14, ir = r - 5;
    const innerD = `M${f(cx - iw / 2 + ir)},${f(cy - id / 2 * sy)} H${f(cx + iw / 2 - ir)} A${f(ir)},${f(ir * sy)} 0 0 1 ${f(cx + iw / 2)},${f(cy - (id / 2 - ir) * sy)} V${f(cy + (id / 2 - ir) * sy)} A${f(ir)},${f(ir * sy)} 0 0 1 ${f(cx + iw / 2 - ir)},${f(cy + id / 2 * sy)} H${f(cx - iw / 2 + ir)} A${f(ir)},${f(ir * sy)} 0 0 1 ${f(cx - iw / 2)},${f(cy + (id / 2 - ir) * sy)} V${f(cy - (id / 2 - ir) * sy)} A${f(ir)},${f(ir * sy)} 0 0 1 ${f(cx - iw / 2 + ir)},${f(cy - id / 2 * sy)}Z`;
    let s = Q.ground(p, cx, cy + h + d * sy * .3, w * .46, { sy: .6, k: sy });
    // 側面（手前の厚み）: 下の板を重ねる
    for (let i = 6; i >= 1; i--) s += `<g ${tr(cy + h * i / 6)} fill="${mix(dk(base, .32), dk(base, .08), 1 - i / 6)}">${rect(w, d, r)}</g>`;
    s += `<g ${tr(cy)} fill="${Q.lg(p, [[0, lt(lip, .3)], [1, dk(lip, .08)]], 0, 0, 1, 1)}" stroke="${dk(base, .3)}" stroke-width=".8" vector-effect="non-scaling-stroke">${rect(w, d, r)}</g>`;
    s += `<path d="${innerD}" fill="${Q.lg(p, [[0, dk(inner, .25)], [.5, dk(inner, .06)], [1, lt(inner, .1)]], 0, 0, .3, 1)}"/>`;
    return { s, cx, cy, sy, inside: Q.clip(p, innerD), o: { cx, cy: cy + 4, sy }, iw, id };
}
// 籐・木のかご皿などに敷く紙（フライドチキン・フライドオクラ）: 平皿の上に置く、ふちの波打つ紙
export function paperLiner(o, rx, seed, c = '#f6efd8'){
    const R = rng('pl' + seed), pts = [];
    for (let i = 0; i < 24; i++){ const a = i / 24 * 6.283, r = rx * (1 + (i % 2 ? .06 : -.02) + (R() - .5) * .04); pts.push([o.cx + Math.cos(a) * r, o.cy + Math.sin(a) * r * (o.sy ?? SY)]); }
    return `<path d="${smooth(pts, true, .5)}" fill="${c}" stroke="${dk(c, .18)}" stroke-width=".7"/>`;
}
// 韓国: 白い磁器のパンチャン皿（浅め）と、汁の器（白い磁器の鉢）・トゥッペギ（石鍋）・真鍮の器（ユギ）
export const banchan = (p, o = {}) => sideBowl(p, { outer: '#f2efe8', inner: '#fbf9f4', edge: '#a8a096', ...o });
export const krSoupBowl = (p, o = {}) => Q.vessel(p, { cy: 76, rx: 90, h: 60, fx: 38, ft: 6, t: 3.6, outer: '#f2efe8', lip: '#fbf9f4', inner: '#f4f1ea', line: 'none', gloss: .6, belly: .62, ...o });
export const yugi = (p, o = {}) => Q.vessel(p, { cy: 78, rx: 90, h: 56, fx: 40, ft: 6, t: 3, outer: '#c4963e', lip: '#dcb460', inner: '#d6ac58', line: 'none', gloss: .7, belly: .6, ...o });
export const ttukbaegi = (p, o = {}) => Q.donabe(p, { stone: true, ...o });
// 韓国の白い平皿（主菜を盛る）・楕円皿
export const krPlate = (p, o = {}) => Q.plate(p, { line: 'none', edge: '#a8a096', ...o });

// =========================================================
// 汁と煮込み（江口の描き方: 汁は口より下の面、照り、奥は淡く手前は濃く）
// =========================================================
// 面に映る光
export const glint = (p, S, op = .55) => `<g ${S.inside}><ellipse cx="${f(S.cx - S.rx * .4)}" cy="${f(S.cy - S.ry * .62)}" rx="${f(S.rx * .28)}" ry="4.5" fill="#fff" opacity="${op}" transform="rotate(-8 ${f(S.cx - S.rx * .4)} ${f(S.cy - S.ry * .62)})" ${Q.blur(p, 2.2)}/></g>`;
// 油の粒（バター・ごま油・ラー油）
export function oilDots(p, S, n, seed, c = '#f0c040', R0 = .8){
    const R = rng(p.id + 'od' + seed), sy = S.o.sy ?? SY;
    return `<g ${S.inside}>${Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * S.rx * R0, x = S.cx + Math.cos(a) * d, y = S.cy + Math.sin(a) * d * sy, r = 1 + R() * 2.2; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * sy)}" fill="${c}" opacity=".55" stroke="${lt(c, .5)}" stroke-width=".4"/>`; }).join('')}</g>`;
}
// 汁: V は器、c は汁の色。items(place, S) は [[y, () => svg]] を返す。flecks は面に散らす細かい色（ハーブ・こしょう・唐辛子）
export function soup(p, V, { drop = 9, c, glow = .3, rimShade = .3, items = () => [], oil = 0, oilC = '#f0c040', gl = .5, flecks = null, cream = null, steamOp = 0, after = '' }){
    const S = Q.surface(p, V, { drop, c, glow, rimShade });
    const place = (u, v, z = 0) => at(S.o, u, v, z);
    const it = items(place, S);
    let fl = '';
    if (flecks){ const [col, n, sz = 1.2] = flecks, R = rng(p.id + 'fl'); for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * S.rx * .85, [x, y] = place(Math.cos(a) * d, Math.sin(a) * d); fl += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(sz * (.6 + R() * .8))}" ry="${f(sz * .55)}" fill="${Array.isArray(col) ? col[i % col.length] : col}" opacity=".9"/>`; } }
    return V.s + S.s + (cream ? Q.swirl(S.cx + 6, S.cy + 2, S.rx * .42, { c: cream, w: 2.6 }) : '') + (oil ? oilDots(p, S, oil, 1, oilC) : '') + glint(p, S, gl) +
        `<g ${V.sy ? V.above : V.inside}>${byDepth(it)}<g ${S.inside}>${fl}</g>${after}</g>` + Q.depthVeil(p, V, V.cy - V.iry, V.cy + V.iry) + V.shine(.5) + (steamOp ? Q.steam(100, 2, steamOp) : '');
}
// 煮込み・山盛り（器の口より上に具を盛る）: 下に汁・ソースの面、items(pl, S) の pl は山の上の点
export function heap(p, V, { c = '#b98a4a', drop = 12, glow = .3, H = 24, R = 72, items, after = '', base = null, srx = null }){
    const S = Q.surface(p, V, { drop, c, glow, rx: srx });
    const pl = (u, v, z = 0) => at(S.o, u, v, hill(u, v, R, H) + z);
    const b = base ? mound(p, S.cx, S.cy + 2, R * .95, H * .8, base, 'hp' + p.id, S.o.sy ?? SY) : '';
    return V.s + S.s + `<g ${V.above}>${b}${byDepth(items(pl, S))}${after}</g>` + Q.depthVeil(p, V, V.cy - V.iry - H, V.cy + V.iry) + V.shine(.45);
}
// 盛りの土台（具の下に見える山。中身の色 c）
export function mound(p, cx, cy, rx, H, c, seed, sy = SY){
    const ry = rx * sy, h = H * CZ;
    return Q.cast(p, cx, cy + ry * .4, rx, ry * .6, .3) + `<path d="M${f(cx - rx)},${f(cy)} Q${f(cx - rx * .6)},${f(cy - h * 1.25)} ${f(cx)},${f(cy - h * 1.05)} Q${f(cx + rx * .6)},${f(cy - h * 1.25)} ${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z" fill="${Q.rg(p, [[0, lt(c, .2)], [.6, c], [1, dk(c, .3)]], .38, .3, .8)}"/>`;
}
// 小鉢に山高に盛る（和え物・サラダ・ナムル）: V は小鉢、R・H は山の大きさ。items(o, R, H) は [[y, fn]]
export function inBowl(p, V, { R = 70, H = 30, base, items, after = '' }){
    const o = { cx: V.cx, cy: V.cy + 4 };
    return V.s + `<g ${V.above}>${base ? mound(p, o.cx, o.cy + 2, R, H, base, 'ib' + p.id) : ''}${byDepth(items(o, R, H))}${after}</g>` + Q.depthVeil(p, V, V.cy - V.iry - H, V.cy + V.iry) + V.shine(.5);
}
// 平皿: D は皿、items は [[y, fn]]
export const onPlate = (D, items, after = '') => D.s + byDepth(items) + after;

// =========================================================
// 具（汎用）
// =========================================================
// 真上の絵の部品（kit.mjs）を面に寝かせる: 縦に sq 倍につぶし、thick で厚み（江口の slice3q と同じ考え方）
export const flat = (p, x, y, inner, { sq = .62, th = 1.6, tc = '#5a3418' } = {}) => `<g ${Q.thick(p, th, tc, .7)}><g transform="translate(${f(x)} ${f(y)}) scale(1 ${sq})">${inner}</g></g>`;
// 角切り（じゃがいも・トマト・ハム・肉・にんじん）: ゆがんだ四角の角柱
export function dice(p, x, y, s, c, seed, { h = s * .6, rot = null, top = null, line = .45, liq = null, sink = 0 } = {}){
    const R = rng(p.id + 'dc' + seed), pts = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]].map(([u, v]) => [(u + (R() - .5) * .18) * s, (v + (R() - .5) * .18) * s]);
    return Q.prism(p, x, y, pts, h, c, { rot: rot ?? R() * 90, top: top || Q.lit(p, c, .3, .12), line, sink, liquid: liq });
}
// 輪切り（にんじん・ズッキーニ・ソーセージ・きゅうり）: 薄い円柱。top で上の面の絵を差しかえる
export const coin = (p, x, y, r, c, { h = 2.4, top = null, liq = null, sy = SY, rim = null } = {}) => Q.cyl(p, x, y, r, h, c, liq, { top, sy, rimC: rim });
// 丸い具（肉団子・じゃがいも・ダンプリング）
export const ball = (p, x, y, s, c, seed, o = {}) => Q.lump(p, x, y, s / 2, s * .42, c, p.id + 'bl' + seed, { n: 8, jit: .18, ...o });
// クリームの山（マッシュポテト・ポテトサラダ・グリッツ・ワカモレ）: なめらかな丸い山にうねり
export function cream(p, cx, cy, rx, H, c, seed, { ridges = 4, sy = SY, shade = .22 } = {}){
    const R = rng(p.id + 'cr' + seed), ry = rx * sy, h = H * CZ, pts = [];
    for (let i = 0; i <= 24; i++){ const t = i / 24, a = Math.PI * (1 + t), k = Math.sin(t * Math.PI); pts.push([cx + Math.cos(a) * rx * (1 + (R() - .5) * .06), cy + Math.sin(a) * ry * .35 - h * Math.pow(k, .7) * (1 + (R() - .5) * .12)]); }
    const d = `M${f(cx - rx)},${f(cy)} ${pts.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z`;
    let rd = '';
    for (let i = 0; i < ridges; i++){ const yy = cy - h * (.25 + i * .16), ww = rx * (.75 - i * .14), sk = (R() - .5) * 10; rd += `<path d="M${f(cx - ww + sk)},${f(yy + 2)} Q${f(cx + sk)},${f(yy - 5)} ${f(cx + ww * .8 + sk)},${f(yy + 1)}" stroke="${dk(c, .14)}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${f(cx - ww + sk)},${f(yy + .6)} Q${f(cx + sk)},${f(yy - 6.4)} ${f(cx + ww * .8 + sk)},${f(yy - .4)}" stroke="${lt(c, .5)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>`; }
    return Q.cast(p, cx + 2, cy + ry * .3, rx * 1.02, ry * .55, .3) + `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .4)], [.55, c], [1, dk(c, shade)]], .36, .28, .8)}" stroke="${dk(c, .25)}" stroke-width=".6"/>` + rd +
        `<path d="M${f(cx - rx * .62)},${f(cy - h * .5)} Q${f(cx - rx * .45)},${f(cy - h * .95)} ${f(cx - rx * .05)},${f(cy - h * 1.02)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 小さなクリームの山（サワークリーム・マヨネーズ・ホイップ）
export const dollop = (p, x, y, s, c = '#fbf8f0') => {
    const d = `M${f(x - s / 2)},${f(y)} Q${f(x - s * .45)},${f(y - s * .5)} ${f(x - s * .05)},${f(y - s * .62)} Q${f(x + s * .1)},${f(y - s * .78)} ${f(x + s * .12)},${f(y - s * .55)} Q${f(x + s * .48)},${f(y - s * .42)} ${f(x + s / 2)},${f(y)} A${f(s / 2)},${f(s * .22)} 0 0 1 ${f(x - s / 2)},${f(y)}Z`;
    return Q.cast(p, x, y + 1.4, s * .5, s * .16, .3) + `<path d="${d}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, c], [1, dk(c, .15)]], .35, .3, .8)}" stroke="${dk(c, .22)}" stroke-width=".6"/><path d="M${f(x - s * .3)},${f(y - s * .2)} Q${f(x - s * .2)},${f(y - s * .45)} ${f(x)},${f(y - s * .5)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>`;
};
// バターのかたまり（溶けかけ）
export const butterPat = (p, x, y, s) => `<path d="${Q.blob(x + 1, y + 1.5, s * .7, s * .7 * SY, 'bt' + x, { n: 9, jit: .3 })}" fill="#f8dc70" opacity=".55"/>` + Q.prism(p, x, y, Q.square(s), s * .32, '#f6dc7a', { rot: 20, top: Q.lg(p, [[0, '#fff6c8'], [1, '#f2d060']], 0, 0, 1, 1), line: .4 });
// 細切りチーズ（チェダー・モントレージャック）
export function cheese(p, x, y, rx, n, seed, { c = '#f2a83a', ry = rx * SY, w = 1.6, L = 7 } = {}){
    const R = rng(p.id + 'ch' + seed); let o = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), xx = x + Math.cos(a) * d * rx, yy = y + Math.sin(a) * d * ry, l = L * (.6 + R() * .6), r = R() * 180, b = (R() - .5) * 4; o += `<g ${T(xx, yy, r)}><path d="M${f(-l / 2)},0 Q0,${f(b)} ${f(l / 2)},0" stroke="${dk(c, .3)}" stroke-width="${f(w + .9)}" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${f(-l / 2)},0 Q0,${f(b)} ${f(l / 2)},0" stroke="${R() < .4 ? lt(c, .3) : c}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`; }
    return o;
}
// 細かい粒（パセリ・こしょう・パプリカ・ごま・ねぎ）
export function flecks(p, x, y, rx, n, seed, cols, { ry = rx * SY, s = 1.2, shape = 'dot' } = {}){
    const R = rng(p.id + 'fk' + seed), cs = Array.isArray(cols) ? cols : [cols]; let o = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), xx = x + Math.cos(a) * d * rx, yy = y + Math.sin(a) * d * ry, c = cs[i % cs.length];
        o += shape === 'seed' ? `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(s * 1.1)}" ry="${f(s * .55)}" transform="rotate(${f(R() * 180)} ${f(xx)} ${f(yy)})" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".3"/>` : `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(s * (.6 + R() * .7))}" ry="${f(s * .5)}" fill="${c}"/>`; }
    return o;
}
// たれ・ソースを細くかける（ランチ・マヨ・ケチャップ）
export const drizzle = (pts, c, w = 2.2) => `<path d="${smooth(pts, false)}" stroke="${dk(c, .25)}" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".5" transform="translate(.6 1)"/><path d="${smooth(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${smooth(pts, false)}" stroke="#fff" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" opacity=".55" transform="translate(-.4 -.5)"/>`;
// ソースだまり（平皿）
export const pool = (p, cx, cy, rx, c, seed, sy = SYF) => Q.tarePool(p, cx, cy, rx, c, p.id + seed, { sy });
// 照り
export const shine = Q.shine;

// ---------- 野菜 ----------
// 葉（レタス・ほうれん草・ケール・えごまの葉）
export const leaf = Q.leaf;
// ブロッコリー（小房）: 丸い房の集まりと茎
export function broc(p, x, y, s, seed, c = '#3f8a34', { roast = 0 } = {}){
    const R = rng(p.id + 'br' + seed); let b = '';
    const k = s / 22;
    b += `<path d="M${f(x - 3 * k)},${f(y)} L${f(x - 2.4 * k)},${f(y + 8 * k)} Q${f(x)},${f(y + 9.4 * k)} ${f(x + 2.6 * k)},${f(y + 8 * k)} L${f(x + 3 * k)},${f(y)}Z" fill="${Q.lg(p, [[0, '#c4e09a'], [1, '#7aa84e']])}" stroke="#5e8a3a" stroke-width=".5"/>`;
    const bud = [];
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.283 + R(), d = i ? 6 * k : 0, bx = x + Math.cos(a) * d, by = y - 5 * k + Math.sin(a) * d * .55 - (i ? 0 : 2 * k); bud.push([by, bx, (4.4 + R() * 1.4) * k]); }
    bud.sort((a, b2) => a[0] - b2[0]);
    for (const [by, bx, r] of bud) b += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(r)}" fill="${Q.rg(p, [[0, lt(c, .3)], [.6, c], [1, dk(c, .35)]], .35, .3, .8)}" stroke="${dk(c, .35)}" stroke-width=".5"/>`;
    for (let i = 0; i < 10; i++) b += `<circle cx="${f(x + (R() - .5) * 14 * k)}" cy="${f(y - 6 * k + (R() - .5) * 8 * k)}" r="${f(.7 * k)}" fill="${roast && R() < roast ? '#6a4a1a' : lt(c, .45)}"/>`;
    if (roast) for (let i = 0; i < 4; i++) b += `<circle cx="${f(x + (R() - .3) * 12 * k)}" cy="${f(y - 4 * k + (R() - .5) * 8 * k)}" r="${f(1.6 * k)}" fill="#7a5a22" opacity=".55"/>`;
    return Q.cast(p, x, y + 7 * k, 9 * k, 3 * k, .3) + b;
}
// ミニトマト
export const tomatoBall = (p, x, y, s) => Q.cast(p, x, y + s * .4, s * .5, s * .18, .3) + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${Q.rg(p, [[0, '#ff7a5a'], [.55, '#e5352a'], [1, '#a51f17']], .35, .3, .8)}" stroke="#a51f17" stroke-width=".6"/><path d="M${f(x - 2.4)},${f(y - s / 2 + 1.2)} l2.4,1.8 l2.4,-1.8 M${f(x)},${f(y - s / 2 + 3)} l0,-2.4" stroke="#4f8a2b" stroke-width="1.4" stroke-linecap="round" fill="none"/><ellipse cx="${f(x - s * .18)}" cy="${f(y - s * .12)}" rx="${f(s * .12)}" ry="${f(s * .07)}" fill="#fff" opacity=".85"/>`;
// トマトの角切り
export const tomatoDice = (p, x, y, s, seed) => dice(p, x, y, s, '#e0412e', 't' + seed, { h: s * .5, top: Q.rg(p, [[0, '#ff8a6a'], [.5, '#e8503a'], [1, '#b82a1c']], .4, .35, .8) }) + `<ellipse cx="${f(x - s * .1)}" cy="${f(y - s * .5 * CZ - 1)}" rx="${f(s * .18)}" ry="${f(s * .1)}" fill="#f6c050" opacity=".7"/>`;
// いんげん・アスパラ・オクラのさや: 細長い棒
export function pod(p, x, y, L, rot, { c = '#4a9a2c', w = 4.6, tip = null } = {}){
    return `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.5)})"><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w / 2)}" transform="translate(1.4 2.4)" fill="${SHADE}" opacity=".25"/><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w / 2)}" fill="${Q.lg(p, [[0, lt(c, .35)], [.5, c], [1, dk(c, .3)]], 0, 0, 0, 1)}" stroke="${dk(c, .4)}" stroke-width=".5"/><path d="M${f(-L * .42)},${f(-w * .18)} L${f(L * .42)},${f(-w * .18)}" stroke="${lt(c, .5)}" stroke-width=".8" opacity=".8"/>${tip ? `<path d="M${f(L / 2 - 1)},0 l${f(w * 1.6)},${f(-w * .45)} l0,${f(w * .9)}Z" fill="${tip}" stroke="${dk(tip, .3)}" stroke-width=".4"/>` : ''}</g></g>`;
}
// アスパラ（穂先つき）
export function asparagus(p, x, y, L, rot){
    const c = '#5a9a34';
    return `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.5)})"><rect x="${f(-L / 2)}" y="-2.4" width="${f(L)}" height="4.8" rx="2.4" transform="translate(1.4 2.4)" fill="${SHADE}" opacity=".25"/><rect x="${f(-L / 2)}" y="-2.3" width="${f(L)}" height="4.6" rx="2.3" fill="${Q.lg(p, [[0, '#a8d070'], [.5, c], [1, '#3a6a20']], 0, 0, 0, 1)}" stroke="#2e5a1a" stroke-width=".5"/>${[.1, .3, .5].map(t => `<path d="M${f(-L / 2 + L * t)},-2 l3,1.6" stroke="#3a6a20" stroke-width=".7"/>`).join('')}<path d="M${f(L / 2 - 2)},-3.2 Q${f(L / 2 + 6)},0 ${f(L / 2 - 2)},3.2Z" fill="${Q.lg(p, [[0, '#9ac860'], [1, '#4a7a28']], 0, 0, 0, 1)}" stroke="#2e5a1a" stroke-width=".5"/></g></g>`;
}
// レモン（輪切り・くし切り）
export function lemon(p, x, y, s, { wedge = false, rot = 0, c = '#f6d23a' } = {}){
    if (wedge) return Q.cast(p, x, y + 3, s * .5, s * .16, .3) + `<g ${T(x, y, rot)}><path d="M${f(-s / 2)},0 Q0,${f(-s * .5)} ${f(s / 2)},0Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M${f(-s / 2 + 2)},-1 Q0,${f(-s * .38)} ${f(s / 2 - 2)},-1Z" fill="#fbeea0"/><path d="M${f(-s / 2)},0 Q0,${f(s * .2)} ${f(s / 2)},0" fill="${dk(c, .1)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>`;
    const ry = s / 2 * SY;
    return Q.cast(p, x, y + 2, s * .5, ry * .6, .3) + `<ellipse cx="${f(x)}" cy="${f(y + 1.6)}" rx="${f(s / 2)}" ry="${f(ry)}" fill="${dk(c, .2)}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(ry)}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2 - 2)}" ry="${f(ry - 1.4)}" fill="#fbeea0"/>${Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283; return `<path d="M${f(x)},${f(y)} L${f(x + Math.cos(a) * (s / 2 - 3))},${f(y + Math.sin(a) * (ry - 2))}" stroke="${c}" stroke-width=".8"/>`; }).join('')}`;
}
// 玉ねぎ（くし切り・薄切り）
export const onionStrip = (x, y, L, r, c = '#efdcae') => `<g ${T(x, y, r)}><path d="M${-L / 2},2 Q0,-4 ${L / 2},2" stroke="${dk(c, .35)}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${-L / 2},1.5 Q0,-4.4 ${L / 2},1.5" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${-L / 3},0 Q0,-3.4 ${L / 3},0" stroke="#fff" stroke-width=".7" fill="none" opacity=".7"/></g>`;
// ピーマン・パプリカの細切り
export const pepperStrip = (p, x, y, L, rot, c = '#3f8f2f') => Q.prism(p, x, y, [[-L / 2, -2], [L / 2, -2.6], [L / 2, 1.4], [-L / 2, 2]], 2.4, c, { rot, line: .45, top: Q.lg(p, [[0, lt(c, .45)], [.5, c], [1, dk(c, .2)]], 0, 0, 0, 1) });
// ねぎ（小口切り）・青ねぎ
export const negi = Q.negi;
// 長ねぎの斜め切り（韓国のデパ）
export const daepa = (p, x, y, L, rot) => Q.prism(p, x, y, [[-L / 2, -2.6], [L / 2 - 3, -2.6], [L / 2, 2.6], [-L / 2 + 3, 2.6]], 3.4, '#e8f0d4', { rot, line: .4, top: Q.lg(p, [[0, '#f8fbea'], [.5, '#d8e8b8'], [1, '#8ab860']], 0, 0, 1, 0) });
// 青唐辛子・赤唐辛子の輪切り
export const chiliRing = (x, y, s = 3.2, c = '#3f8f2f') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * .7)}" fill="#f2e6b0" stroke="${c}" stroke-width="1.3"/><circle cx="${f(x - s * .2)}" cy="${f(y)}" r=".6" fill="#e8d080"/>`;
// きのこの薄切り（マッシュルーム）
export function mushSlice(p, x, y, s, rot, { c = '#c8a478', cooked = true } = {}){
    const k = s / 20, cap = cooked ? '#a87a4a' : '#e8dcc8', fl = cooked ? c : '#f2ead8';
    return Q.cast(p, x, y + 3 * k, 9 * k, 3 * k, .3) + `<g ${T(x, y, rot, k)}><g transform="scale(1 .8)"><path d="M-10,2 Q-10,-10 0,-10 Q10,-10 10,2 L4,2 L4,9 Q0,10.5 -4,9 L-4,2Z" fill="${Q.lg(p, [[0, lt(fl, .25)], [1, dk(fl, .15)]], 0, 0, 1, 1)}" stroke="${dk(cap, .3)}" stroke-width=".8"/><path d="M-10,2 Q-10,-10 0,-10 Q10,-10 10,2" fill="none" stroke="${cap}" stroke-width="2.4"/><path d="M-6,-5 Q-3,-8 2,-8" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6"/></g></g>`;
}
// 丸ごとのマッシュルーム・ひらたけ
export const mushCap = (p, x, y, s, c = '#b88a5a') => Q.cast(p, x, y + s * .25, s * .5, s * .16, .3) + `<path d="M${f(x - s * .18)},${f(y)} L${f(x - s * .14)},${f(y + s * .3)} Q${f(x)},${f(y + s * .36)} ${f(x + s * .14)},${f(y + s * .3)} L${f(x + s * .18)},${f(y)}Z" fill="#efe4cc" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M${f(x - s / 2)},${f(y + 1)} Q${f(x - s / 2)},${f(y - s * .45)} ${f(x)},${f(y - s * .45)} Q${f(x + s / 2)},${f(y - s * .45)} ${f(x + s / 2)},${f(y + 1)} Q${f(x)},${f(y + s * .12)} ${f(x - s / 2)},${f(y + 1)}Z" fill="${Q.dome(p, c)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M${f(x - s * .3)},${f(y - s * .18)} Q${f(x - s * .18)},${f(y - s * .36)} ${f(x + s * .02)},${f(y - s * .38)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".55"/>`;
// コーン（粒）
export const kernel = (p, x, y, s = 3) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .6)}" ry="${f(s * .5)}" fill="${Q.rg(p, [[0, '#fff2a0'], [.6, '#f6c83a'], [1, '#d09a1a']], .35, .3, .8)}" stroke="#c08a18" stroke-width=".4"/>`;
// 豆（いんげん豆・黒豆・ひよこ豆・白いんげん）
export const bean = (p, x, y, s, rot, c) => Q.bean(p, x, y, s, rot, c);
export const pea = Q.pea;
// ゆでたまごの半分（黄身つき）・デビルドエッグ
export function eggHalf(p, x, y, s, rot = 0, { yolk = '#f6c22a', piped = false, paprika = false } = {}){
    const ry = s * .38;
    let o = Q.cast(p, x, y + ry * .6, s * .52, ry * .5, .32) + `<g ${T(x, y, rot)}><ellipse cx="0" cy="${f(ry * .32)}" rx="${f(s / 2)}" ry="${f(ry)}" fill="${Q.lg(p, [[0, '#fbf8f0'], [1, '#d8d0c0']], 0, 0, 0, 1)}" stroke="#c8bca8" stroke-width=".6"/><ellipse rx="${f(s / 2)}" ry="${f(ry * .9)}" fill="${Q.lg(p, [[0, '#ffffff'], [1, '#efe8da']], 0, 0, 1, 1)}" stroke="#c8bca8" stroke-width=".6"/>`;
    if (piped) o += `<path d="M${f(-s * .26)},${f(ry * .1)} Q${f(-s * .26)},${f(-ry * .9)} 0,${f(-ry * 1.1)} Q${f(s * .26)},${f(-ry * .9)} ${f(s * .26)},${f(ry * .1)} Q0,${f(ry * .4)} ${f(-s * .26)},${f(ry * .1)}Z" fill="${Q.rg(p, [[0, '#fff2a0'], [.6, '#f6d050'], [1, '#d8a020']], .35, .3, .8)}" stroke="#c89020" stroke-width=".5"/><path d="M${f(-s * .16)},${f(-ry * .2)} Q0,${f(-ry * .7)} ${f(s * .16)},${f(-ry * .2)} M${f(-s * .1)},${f(-ry * .55)} Q0,${f(-ry * .9)} ${f(s * .1)},${f(-ry * .55)}" stroke="#c89020" stroke-width=".6" fill="none" opacity=".7"/>` + (paprika ? Array.from({ length: 7 }, (_, i) => `<circle cx="${f((i % 3 - 1) * s * .08 + (i * 37 % 5 - 2) * .6)}" cy="${f(-ry * (.2 + (i % 4) * .18))}" r=".7" fill="#c8401c"/>`).join('') : '');
    else o += `<ellipse cx="${f(s * .02)}" cy="${f(-ry * .05)}" rx="${f(s * .22)}" ry="${f(ry * .5)}" fill="${Q.rg(p, [[0, lt(yolk, .35)], [.6, yolk], [1, dk(yolk, .2)]], .35, .3, .8)}"/>`;
    return o + `<path d="M${f(-s * .34)},${f(-ry * .3)} Q${f(-s * .2)},${f(-ry * .7)} ${f(s * .02)},${f(-ry * .78)}" stroke="#fff" stroke-width="1" fill="none" opacity=".8"/></g>`;
}
// 目玉焼き（斜め）
export function friedEgg(p, x, y, s, seed, { yolk = '#f6a91c', sy = SY, crisp = true } = {}){
    const d = Q.blob(x, y, s / 2, s / 2 * sy, p.id + 'fe' + seed, { n: 10, jit: .18 });
    return Q.dropOf(p, d, 1.4, 2, .26) + (crisp ? `<path d="${d}" fill="none" stroke="#d8a050" stroke-width="2.2" opacity=".6"/>` : '') + `<path d="${d}" fill="${Q.lg(p, [[0, '#ffffff'], [1, '#f0ebe0']], 0, 0, 1, 1)}" stroke="#d8ccb4" stroke-width=".6"/>` +
        `<ellipse cx="${f(x + s * .04)}" cy="${f(y - 2)}" rx="${f(s * .19)}" ry="${f(s * .17)}" fill="${Q.rg(p, [[0, lt(yolk, .4)], [.6, yolk], [1, dk(yolk, .2)]], .35, .3, .8)}" stroke="${dk(yolk, .25)}" stroke-width=".5"/><ellipse cx="${f(x - s * .03)}" cy="${f(y - 3.5)}" rx="${f(s * .06)}" ry="${f(s * .035)}" fill="#fff" opacity=".9"/>`;
}

// ---------- 肉・魚 ----------
// 平たい肉・切り身（ステーキ・鶏むね・ポークチョップ・魚）: Q.slab に焼き目と照り
export function cutSlab(p, x, y, rx, ry, depth, c, seed, { rot = 0, n = 12, jit = .16, sear = null, grill = 0, glaze = null, edgeC = null, sharp = false } = {}){
    const sl = Q.slab(p, x, y, rx, ry, depth, c, p.id + 'cs' + seed, { n, jit, rot, edgeC, sharp });
    let o = sl.s;
    const cp = Q.clip(p, sl.d);
    if (sear) o += `<g ${cp}><path d="${sl.d}" fill="none" stroke="${sear}" stroke-width="6" opacity=".55" ${Q.blur(p, 2)}/></g>`;
    if (grill) o += `<g ${cp}>${Array.from({ length: grill }, (_, i) => { const u = (i - (grill - 1) / 2) * rx * .42; return `<path d="M${f(x + u - 10)},${f(y - ry)} L${f(x + u + 10)},${f(y + ry)}" stroke="#5a2c10" stroke-width="2.6" opacity=".55"/>`; }).join('')}</g>`;
    if (glaze) o += `<path d="${sl.d}" fill="${glaze}" opacity=".35"/>`;
    o += Q.shine(x - rx * .25, y - ry * .35, rx * .6, -8, .7);
    return o;
}
// 揚げ物の衣（フライドチキン・フライドオクラ）: でこぼこの輪郭と衣の粒
export function crusty(p, x, y, rx, ry, seed, { c = '#c8822e', n = 30, rot = 0, h = 6 } = {}){
    const R = rng(p.id + 'cy' + seed), d = Q.blob(x, y, rx, ry, p.id + 'cyb' + seed, { n: 14, jit: .22, rot });
    let o = Q.dropOf(p, d, 2, 3 + h * .3, .34, 1.6) + `<path d="${d}" transform="translate(0 ${f(h * .5)})" fill="${dk(c, .3)}"/>` + `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .35)], [.55, c], [1, dk(c, .3)]], .35, .3, .8)}" stroke="${dk(c, .4)}" stroke-width=".7"/>`;
    for (let i = 0; i < n; i++){ const a = R() * 6.283, dd = Math.sqrt(R()) * .85, xx = x + Math.cos(a) * dd * rx, yy = y + Math.sin(a) * dd * ry, r = .8 + R() * 1.5, lite = (Math.cos(a) * dd < 0 && Math.sin(a) * dd < 0); o += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r)}" ry="${f(r * .7)}" fill="${lite ? lt(c, .4) : dk(c, .18)}" opacity=".85"/>`; }
    return o + `<path d="M${f(x - rx * .55)},${f(y - ry * .1)} Q${f(x - rx * .4)},${f(y - ry * .6)} ${f(x)},${f(y - ry * .7)}" stroke="#fff6dc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// ひき肉のそぼろ（タコス・チリ・スロッピージョー）
export function crumble(p, cx, cy, rx, ry, n, seed, { c = '#8a4a24', sauce = null } = {}){
    const R = rng(p.id + 'cb' + seed), it = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry, r = 1.8 + R() * 2.2, cc = R() < .5 ? c : (R() < .5 ? lt(c, .15) : dk(c, .18)); it.push([y, `<path d="${smooth(ring(r, 6, .5, R))}" transform="translate(${f(x)} ${f(y)})" fill="${cc}" stroke="${dk(c, .4)}" stroke-width=".4"/>`]); }
    it.sort((a, b) => a[0] - b[0]);
    return (sauce ? `<ellipse cx="${f(cx)}" cy="${f(cy + 1)}" rx="${f(rx * 1.02)}" ry="${f(ry * 1.02)}" fill="${sauce}" opacity=".85"/>` : '') + it.map(q => q[1]).join('');
}
// ベーコン（焼いた、波打つ短冊）
export function bacon(p, x, y, L, rot, { w = 7, seed = 1 } = {}){
    const R = rng(p.id + 'bc' + seed), pts = [], pts2 = [];
    for (let i = 0; i <= 8; i++){ const u = -L / 2 + i * L / 8, wv = Math.sin(i * 1.4 + R()) * 2.2; pts.push([u, -w / 2 + wv]); pts2.push([u, w / 2 + wv]); }
    const d = `M${pts.map(q => q.map(f).join(',')).join('L')}L${pts2.reverse().map(q => q.map(f).join(',')).join('L')}Z`;
    return `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.25)})"><path d="${d}" transform="translate(1.4 3)" fill="${SHADE}" opacity=".3"/><path d="${d}" transform="translate(0 1.6)" fill="#6a2a12"/><path d="${d}" fill="${Q.lg(p, [[0, '#c8644a'], [.5, '#a8442a'], [1, '#7a2c18']], 0, 0, 0, 1)}" stroke="#6a2412" stroke-width=".6"/><path d="M${pts.slice(0, 9).map(([u, v]) => `${f(u)},${f(v + w * .45)}`).join('L')}" stroke="#f2d4b0" stroke-width="${f(w * .22)}" fill="none" opacity=".9"/><path d="M${pts.slice(0, 9).map(([u, v]) => `${f(u)},${f(v + w * .15)}`).join('L')}" stroke="#e8b890" stroke-width="1" fill="none" opacity=".6"/></g></g>`;
}
// ベーコン・ハムの角切り
export const baconBit = (p, x, y, s, seed) => dice(p, x, y, s, '#b8503a', 'bb' + seed, { h: s * .4, top: Q.lg(p, [[0, '#e8907a'], [.5, '#c4583e'], [1, '#f0d4b8']], 0, 0, 1, 1) });
export const hamDice = (p, x, y, s, seed) => dice(p, x, y, s, '#ec9a94', 'hd' + seed, { h: s * .55, top: Q.lit(p, '#f4b0a8', .3, .1) });
// ソーセージの輪切り（スモークソーセージ・アンドゥイユ・フランクフルト）
export const sausageCoin = (p, x, y, r, { c = '#9a4a28', inner = '#d8907a', liq = null } = {}) => coin(p, x, y, r, c, { h: 3.2, liq, top: Q.rg(p, [[0, lt(inner, .25)], [.6, inner], [1, dk(inner, .15)]], .4, .35, .8), rim: dk(c, .2) }) + `<ellipse cx="${f(x - r * .25)}" cy="${f(y - 3.2 * CZ - r * SY * .2)}" rx="${f(r * .2)}" ry="${f(r * .1)}" fill="#f8e0d0" opacity=".7"/>`;
// えび（むき身。C の字に丸まった桃色）
export function shrimp(p, x, y, s, rot = 0, { c = '#f6a080', flip = 1 } = {}){
    const d = `M${f(-s * .5)},${f(s * .05)} C${f(-s * .5)},${f(-s * .45)} ${f(s * .25)},${f(-s * .55)} ${f(s * .45)},${f(-s * .1)} C${f(s * .55)},${f(s * .15)} ${f(s * .35)},${f(s * .35)} ${f(s * .15)},${f(s * .25)} C${f(s * .25)},${f(s * .05)} ${f(s * .15)},${f(-s * .2)} ${f(-s * .05)},${f(-s * .2)} C${f(-s * .25)},${f(-s * .2)} ${f(-s * .25)},${f(s * .05)} ${f(-s * .2)},${f(s * .12)}Z`;
    let seg = ''; for (let i = 1; i < 5; i++){ const a = Math.PI * (1.05 - i * .2), r1 = s * .2, r2 = s * .48; seg += `<path d="M${f(Math.cos(a) * r1)},${f(Math.sin(a) * -r1 * .9)} L${f(Math.cos(a) * r2)},${f(Math.sin(a) * -r2 * .9)}" stroke="${dk(c, .2)}" stroke-width=".8" opacity=".7"/>`; }
    return Q.cast(p, x, y + s * .2, s * .5, s * .16, .3) + `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${flip} ${f(SY * 1.4)})"><path d="${d}" fill="${Q.lg(p, [[0, '#fde0d0'], [.4, c], [1, '#e2603a']], 0, 0, 1, 1)}" stroke="#c8502e" stroke-width=".7"/>${seg}<path d="M${f(s * .45)},${f(-s * .1)} l${f(s * .16)},${f(-s * .1)} l${f(-s * .02)},${f(s * .2)}Z" fill="#e8582e" stroke="#b84020" stroke-width=".5"/></g>`;
}
// 魚の切り身（皮目を上・身を上）
export function fishPiece(p, x, y, w, d, rot, seed, { flesh = '#f2e4d0', skin = null, sear = '#c8823a', h = 7 } = {}){
    return cutSlab(p, x, y, w / 2, d / 2 * SYF, h, skin || flesh, seed, { rot, n: 12, jit: .1, sear, edgeC: dk(flesh, .12) });
}
// 骨つきの丸ごとの魚（焼き魚）: 銀の灰に焼き色（青は使わない）
export function wholeFish(p, x, y, L, rot, seed, { skin = '#a09a8a', belly = '#ece4d4', char = .5, H = 22 } = {}){
    const R = rng(p.id + 'wf' + seed), h = H * SYF * 1.3;
    const body = `M${f(-L / 2)},0 C${f(-L * .3)},${f(-h)} ${f(L * .2)},${f(-h * 1.05)} ${f(L * .38)},${f(-h * .2)} L${f(L / 2)},${f(-h * .7)} L${f(L / 2 - 2)},${f(h * .6)} L${f(L * .38)},${f(h * .1)} C${f(L * .2)},${f(h * .9)} ${f(-L * .3)},${f(h * .8)} ${f(-L / 2)},0Z`;
    let o = `<g ${T(x, y, rot)}><path d="${body}" transform="translate(2 ${f(h * .5)})" fill="${SHADE}" opacity=".3" ${Q.blur(p, 1.6)}/><path d="${body}" transform="translate(0 2)" fill="${dk(skin, .3)}"/><path d="${body}" fill="${Q.lg(p, [[0, lt(skin, .2)], [.45, skin], [.7, belly], [1, dk(belly, .1)]], 0, 0, 0, 1)}" stroke="${dk(skin, .4)}" stroke-width=".7"/>`;
    for (let i = 0; i < 7; i++) o += `<ellipse cx="${f(-L * .3 + i * L * .1 + (R() - .5) * 4)}" cy="${f(-h * .3 + (R() - .5) * h * .5)}" rx="${f(3 + R() * 4)}" ry="${f(1.6 + R() * 1.6)}" fill="#6a3a14" opacity="${f(char * (.3 + R() * .4))}"/>`;
    o += `<circle cx="${f(-L * .38)}" cy="${f(-h * .18)}" r="${f(h * .16)}" fill="#f4ecd8" stroke="#6a5a48" stroke-width=".6"/><circle cx="${f(-L * .38)}" cy="${f(-h * .18)}" r="${f(h * .07)}" fill="#4a3020"/><path d="M${f(-L * .3)},${f(-h * .5)} Q${f(-L * .26)},${f(0)} ${f(-L * .3)},${f(h * .45)}" stroke="${dk(skin, .3)}" stroke-width="1" fill="none"/><path d="M${f(-L * .22)},${f(-h * .62)} Q${f(0)},${f(-h * .85)} ${f(L * .2)},${f(-h * .6)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
    return o;
}
// 骨つきの肉（スペアリブ・カルビ）: 肉の塊から骨の端がのぞく
export function rib(p, x, y, s, rot, seed, { c = '#8a4a24', glaze = '#a85a24' } = {}){
    const o = Q.lump(p, x, y, s / 2, s * .34, c, p.id + 'rb' + seed, { n: 9, jit: .2, hi: .55 });
    const a = rot * Math.PI / 180, bx = x + Math.cos(a) * s * .5, by = y + Math.sin(a) * s * .5 * SY;
    return `<path d="M${f(x + Math.cos(a) * s * .3)},${f(y + Math.sin(a) * s * .3 * SY)} L${f(bx)},${f(by)}" stroke="#e8dcc0" stroke-width="${f(s * .16)}" stroke-linecap="round"/><path d="M${f(x + Math.cos(a) * s * .3)},${f(y + Math.sin(a) * s * .3 * SY)} L${f(bx)},${f(by)}" stroke="#fff8e8" stroke-width="${f(s * .06)}" stroke-linecap="round" opacity=".7"/>` + o + `<path d="${Q.blob(x, y - 1, s * .42, s * .26, p.id + 'rbg' + seed)}" fill="${glaze}" opacity=".35"/>`;
}
// 鶏の骨つきもも（ドラムスティック）・フライドチキン
export function drumstick(p, x, y, s, rot, seed, { c = '#c8822e', fried = true } = {}){
    const a = rot * Math.PI / 180, ex = x + Math.cos(a) * s * .78, ey = y + Math.sin(a) * s * .78 * SY;
    const bone = `<path d="M${f(x)},${f(y)} L${f(ex)},${f(ey)}" stroke="#d8c8a8" stroke-width="${f(s * .17)}" stroke-linecap="round"/><path d="M${f(x)},${f(y)} L${f(ex)},${f(ey)}" stroke="#f4ecd8" stroke-width="${f(s * .1)}" stroke-linecap="round"/><circle cx="${f(ex)}" cy="${f(ey)}" r="${f(s * .12)}" fill="#f8f2e2" stroke="#c8b898" stroke-width=".6"/>`;
    return bone + (fried ? crusty(p, x - Math.cos(a) * s * .05, y, s * .42, s * .3, seed, { c, rot }) : Q.lump(p, x, y, s * .42, s * .3, c, p.id + 'ds' + seed, { hi: .6 }));
}

// ---------- パン・粉もの ----------
// 丸いパン（バンズ）の上半分: 斜めから見たドーム
export function bunTop(p, x, y, rx, H, { c = '#d08a3a', sesame = true, seed = 1 } = {}){
    const ry = rx * SY * .7, R = rng(p.id + 'bn' + seed);
    const d = `M${f(x - rx)},${f(y)} C${f(x - rx)},${f(y - H * 1.2)} ${f(x + rx)},${f(y - H * 1.2)} ${f(x + rx)},${f(y)} A${f(rx)},${f(ry)} 0 0 1 ${f(x - rx)},${f(y)}Z`;
    let o = `<path d="${d}" fill="${Q.rg(p, [[0, '#f6c878'], [.5, c], [1, dk(c, .35)]], .35, .25, .85)}" stroke="${dk(c, .45)}" stroke-width=".7"/>`;
    if (sesame) for (let i = 0; i < 14; i++){ const u = (R() - .5) * 1.6, v = R(), xx = x + u * rx * .7, yy = y - H * (.4 + v * .5) * (1 - Math.abs(u) * .4); o += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="1.4" ry=".75" transform="rotate(${f(R() * 180)} ${f(xx)} ${f(yy)})" fill="#fbf2d8" stroke="#d8c090" stroke-width=".3"/>`; }
    return o + `<path d="M${f(x - rx * .6)},${f(y - H * .45)} Q${f(x - rx * .4)},${f(y - H * .85)} ${f(x)},${f(y - H * .9)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// パンの下半分（切り口が上）
export const bunBottom = (p, x, y, rx, h, c = '#d08a3a') => { const ry = rx * SY * .7; return Q.cast(p, x + 3, y + h + 2, rx * 1.05, ry * .7, .35) + `<path d="M${f(x - rx)},${f(y)} L${f(x - rx + 2)},${f(y + h)} A${f(rx - 2)},${f(ry)} 0 0 0 ${f(x + rx - 2)},${f(y + h)} L${f(x + rx)},${f(y)}Z" fill="${Q.lg(p, [[0, lt(c, .2)], [.6, c], [1, dk(c, .35)]])}" stroke="${dk(c, .45)}" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="#f2dcae" stroke="${dk(c, .3)}" stroke-width=".6"/>`; };
// 肉のパティ（側面が見える円盤）
export const pattyDisc = (p, x, y, rx, h, c = '#6e3a1e') => { const ry = rx * SY * .7; return `<path d="M${f(x - rx)},${f(y)} L${f(x - rx)},${f(y + h)} A${f(rx)},${f(ry)} 0 0 0 ${f(x + rx)},${f(y + h)} L${f(x + rx)},${f(y)}Z" fill="${Q.lg(p, [[0, lt(c, .15)], [.6, c], [1, dk(c, .35)]])}" stroke="${dk(c, .4)}" stroke-width=".6"/><g ${p.rough(1.4, .2)}><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${Q.rg(p, [[0, lt(c, .25)], [.6, c], [1, dk(c, .2)]], .38, .3, .8)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>`; };
// とろけたチーズの1枚（パティにかかる）
export const cheeseSlice = (x, y, rx, h, c = '#f4b03a') => { const ry = rx * SY * .7; return `<path d="M${f(x - rx - 2)},${f(y)} L${f(x - rx + 4)},${f(y + h + 4)} L${f(x - rx * .4)},${f(y + h * .6)} L${f(x)},${f(y + ry + h + 3)} L${f(x + rx * .4)},${f(y + h * .8)} L${f(x + rx - 4)},${f(y + h + 5)} L${f(x + rx + 2)},${f(y)}Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx + 2)}" ry="${f(ry + 1)}" fill="${lt(c, .15)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; };
// 葉のふち（レタスがはみ出す）
export const lettuceRuffle = (p, x, y, rx, seed) => { const R = rng(p.id + 'lr' + seed), pts = []; for (let i = 0; i <= 20; i++){ const t = i / 20, a = Math.PI * t; pts.push([x - Math.cos(a) * (rx + 4 + R() * 3), y + Math.sin(a) * (rx * SY * .7 + 3 + R() * 3)]); } return `<path d="${smooth(pts, false)} L${f(x + rx)},${f(y - 2)} L${f(x - rx)},${f(y - 2)}Z" fill="${Q.lg(p, [[0, '#a8d468'], [1, '#5a9a30']], 0, 0, 0, 1)}" stroke="#4a8a2a" stroke-width=".6"/>`; };
// 食パン（斜めに寝かせた1枚）。toast で焼き色、cut で三角
export function bread(p, x, y, w, rot, { c = '#f2dcae', crust = '#c88a3a', toast = .4, tri = false, th = 5 } = {}){
    const h = w * .9, pts = tri ? [[-w / 2, h / 2], [w / 2, h / 2], [-w / 2, -h / 2]] : [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h * .25], [w * .3, -h / 2], [-w * .3, -h / 2], [-w / 2, -h * .25]];
    const fill = mix(c, '#d89a4a', toast);
    return Q.prism(p, x, y, pts, th, crust, { rot, top: Q.lg(p, [[0, lt(fill, .3)], [.6, fill], [1, dk(fill, .12)]], 0, 0, 1, 1), line: .6 });
}

// ---------- 韓国の具 ----------
// キムチ（白菜の葉に唐辛子の赤）
export function kimchi(p, x, y, s, rot, seed, { c = '#d8452a', stem = '#f2d4b0' } = {}){
    const R = rng(p.id + 'km' + seed), d = Q.blob(x, y, s / 2, s * .3, p.id + 'kmb' + seed, { n: 9, jit: .35, rot });
    return Q.dropOf(p, d, 1.2, 2, .3) + `<path d="${d}" fill="${Q.lg(p, [[0, lt(c, .25)], [.6, c], [1, dk(c, .25)]], 0, 0, 1, 1)}" stroke="${dk(c, .35)}" stroke-width=".6"/>` +
        `<path d="M${f(x - s * .3)},${f(y + s * .05)} Q${f(x)},${f(y - s * .12 + (R() - .5) * 3)} ${f(x + s * .32)},${f(y - s * .02)}" stroke="${stem}" stroke-width="${f(s * .12)}" fill="none" stroke-linecap="round" opacity=".75"/>` +
        flecks(p, x, y, s * .35, 5, 'kf' + seed, ['#a82a14', '#f08a50'], { s: .8 });
}
// 豆腐（大きめの角。煮汁に沈める・焼き目）
export const tofuBlock = (p, x, y, s, rot, { c = '#f6f1e2', liq = null, sink = 0, sear = null, depth = .5 } = {}) => Q.prism(p, x, y, [[-s / 2, -s * .4], [s / 2, -s * .4], [s / 2, s * .4], [-s / 2, s * .4]], s * depth, sear || c, { rot, sink, liquid: liq, top: sear ? Q.rg(p, [[0, lt(sear, .3)], [.6, sear], [1, dk(sear, .2)]], .4, .35, .8) : Q.lg(p, [[0, '#fffefa'], [1, lt(c, .02)]], 0, 0, 1, 1), line: .55 });
// トック（円柱の餅・斜め切りの餅）
export const tteokStick = (p, x, y, L, rot, { c = '#f4eee0', coat = null } = {}) => Q.prism(p, x, y, [[-L / 2, -3.4], [L / 2, -3.4], [L / 2, 3.4], [-L / 2, 3.4]], 6, coat || c, { rot, line: .5, top: Q.lg(p, [[0, lt(coat || c, .4)], [.5, coat || c], [1, dk(coat || c, .2)]], 0, 0, 0, 1) });
export const tteokOval = (p, x, y, s, rot) => Q.prism(p, x, y, Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.283; return [Math.cos(a) * s / 2, Math.sin(a) * s * .3]; }), 2.2, '#f2ece0', { rot, line: .5, top: Q.lg(p, [[0, '#ffffff'], [1, '#ece4d4']], 0, 0, 1, 1) });
// おでん（オムク）: 平たい練り物を折りたたんだ形
export function eomuk(p, x, y, w, rot, seed, { c = '#d8a060', liq = null } = {}){
    const R = rng(p.id + 'eo' + seed), pts = [[-w / 2, -w * .22], [-w * .1, -w * .3 + R() * 3], [w / 2, -w * .2], [w * .45, w * .22], [0, w * .28], [-w * .48, w * .2]];
    return Q.prism(p, x, y, pts, 3, c, { rot, sink: liq ? 1 : 0, liquid: liq, top: Q.rg(p, [[0, lt(c, .35)], [.6, c], [1, dk(c, .15)]], .4, .35, .8) }) + `<path d="M${f(x - w * .3)},${f(y - 3)} Q${f(x)},${f(y - 6)} ${f(x + w * .3)},${f(y - 3)}" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" opacity=".6"/>`;
}
// もやし・豆もやし（白い茎と黄色い頭）
export function sprout(p, x, y, L, rot, { head = true, c = '#f6f2e2' } = {}){
    return `<g ${T(x, y, rot)}><path d="M${f(-L / 2)},0 Q0,${f(-2)} ${f(L / 2)},1" stroke="#c8bc98" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".6"/><path d="M${f(-L / 2)},0 Q0,${f(-2)} ${f(L / 2)},1" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>${head ? `<ellipse cx="${f(-L / 2 - 1.4)}" cy="0" rx="2.6" ry="1.9" fill="${Q.rg(p, [[0, '#fff2a0'], [1, '#e2c040']], .35, .3, .8)}" stroke="#c8a030" stroke-width=".4"/>` : ''}</g>`;
}
// 山盛りの細いもの（もやし・ナムル・大根のなます・ほうれん草）: 中心が高い山に短い線を重ねる
export const strands = (p, cx, cy, rx, H, cols, seed, o = {}) => Q.strandMound(p, cx, cy, rx, H, cols, seed, o);
// 卵焼きの輪切り（ケランマリ）: 層の渦巻き
export function eggRoll(p, x, y, w, rot, { c = '#f6d050', fleck = ['#e8742a', '#4a9a2c'] } = {}){
    const h = w * .7, pts = [[-w / 2, -h * .45], [w / 2, -h * .45], [w / 2, h * .45], [-w / 2, h * .45]];
    let o = Q.prism(p, x, y, [[-w * .18, -h / 2], [w * .18, -h / 2], [w * .18, h / 2], [-w * .18, h / 2]], h * .9, c, { rot, line: .5 });
    return o + `<g ${T(x, y - h * .45 * CZ, rot)}><ellipse rx="${f(w * .19)}" ry="${f(h * .36)}" fill="${lt(c, .15)}" opacity=".0"/></g>` + flecks(p, x, y - h * .5, w * .12, 3, 'er' + x, fleck, { s: .8 });
}
// 薄い揚げ焼き（チヂミ・ジョン）: 平たい円盤
export function jeon(p, x, y, r, seed, { c = '#e8b84a', sy = SYF, h = 3.2, rot = 0 } = {}){
    const d = Q.blob(x, y, r, r * sy, p.id + 'jn' + seed, { n: 12, jit: .12, rot });
    let side = ''; for (let i = 3; i >= 1; i--) side += `<path d="${d}" transform="translate(0 ${f(h * i / 3)})" fill="${dk(c, .15 + .1 * i)}"/>`;
    return Q.dropOf(p, d, 2, h + 2, .3) + side + `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .3)], [.5, c], [.85, '#d8902a'], [1, '#b8701e']], .4, .35, .75)}" stroke="${dk(c, .4)}" stroke-width=".6"/>`;
}
// ごま（白）
export const sesame = (p, x, y, rx, n, seed, c = '#f4e8c8') => flecks(p, x, y, rx, n, 'ss' + seed, c, { s: 1.1, shape: 'seed' });
// 唐辛子の粉（コチュカル）
export const gochugaru = (p, x, y, rx, n, seed) => flecks(p, x, y, rx, n, 'gc' + seed, ['#b8281a', '#d8402a', '#8a1e10'], { s: .7 });

// ---------- 2回目に足した部品（麺・ご飯もの、見直し） ----------
// 麺の山（スパゲッティ・フェットチーネ・そうめん・中華麺）: 山の上に曲がった麺を奥から手前へ重ねる。w は麺の太さ
export function noodleMound(p, cx, cy, rx, H, c, seed, { w = 2.4, n = 90, len = 30, curl = 1, sy = SY, edge = null, flat = false } = {}){
    const R = rng(p.id + 'nm' + seed), ry = rx * sy, it = [], e = edge || dk(c, .3);
    for (let i = 0; i < n; i++){
        const a = R() * 6.283, d = Math.sqrt(R()) * .95, u = Math.cos(a) * d, v = Math.sin(a) * d, z = flat ? 0 : H * Math.pow(Math.max(0, 1 - d * d), .7);
        const x = cx + u * rx, y = cy + v * ry - z * CZ, ang = R() * 6.283, L = len * (.6 + R() * .6), k = curl * (R() - .5) * L * .6;
        const x1 = x - Math.cos(ang) * L / 2, y1 = y - Math.sin(ang) * L / 2 * sy, x2 = x + Math.cos(ang) * L / 2, y2 = y + Math.sin(ang) * L / 2 * sy;
        const mx = x - Math.sin(ang) * k, my = y + Math.cos(ang) * k * sy, lite = (-u - v) > .2;
        it.push([v, `<path d="M${f(x1)},${f(y1)} Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}" stroke="${e}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round" opacity=".6"/><path d="M${f(x1)},${f(y1)} Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}" stroke="${lite ? lt(c, .25) : R() < .5 ? c : dk(c, .08)}" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/>`]);
    }
    it.sort((a, b) => a[0] - b[0]);
    const base = flat ? '' : mound(p, cx, cy, rx * .92, H * .85, dk(c, .1), 'nmb' + seed, sy);
    return base + it.map(q => q[1]).join('');
}
// 立ち上がった葉（サラダの葉を横から見た形）: 下が濃く、上の縁が明るい弧。山に混ぜて高さを出す
export function standLeaf(p, x, y, w, h, rot, c, seed){
    const R = rng(p.id + 'sl' + seed), pts = [];
    for (let i = 0; i <= 10; i++){ const t = i / 10, u = -w / 2 + t * w; pts.push([u, -h * Math.sin(t * Math.PI) * (.8 + R() * .3) - (i % 2 ? 2 : 0)]); }
    const top = pts.map(([u, v]) => `${f(u)},${f(v)}`).join(' L');
    const d = `M${top} Q${f(w * .3)},${f(h * .25)} 0,${f(h * .2)} Q${f(-w * .3)},${f(h * .25)} ${f(-w / 2)},0Z`;
    return `<g ${T(x, y, rot)}><path d="${d}" transform="translate(1.6 2.6)" fill="${SHADE}" opacity=".25"/><path d="${d}" fill="${Q.lg(p, [[0, lt(c, .35)], [.5, c], [1, dk(c, .3)]], 0, 0, 0, 1)}" stroke="${dk(c, .4)}" stroke-width=".7"/><path d="M${top}" fill="none" stroke="${lt(c, .5)}" stroke-width="1.2" opacity=".8"/><path d="M0,${f(h * .15)} Q${f(w * .05)},${f(-h * .4)} ${f(-w * .05)},${f(-h * .85)}" stroke="${lt(c, .55)}" stroke-width="1.6" fill="none" opacity=".75"/></g>`;
}
// おかゆの面（米粒が見える白い面）: S は surface の返り値
export function porridge(p, S, seed, { c = '#f4ecd8', n = 140 } = {}){
    const R = rng(p.id + 'pg' + seed), sy = S.o.sy ?? SY; let s = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * .92, x = S.cx + Math.cos(a) * d * S.rx, y = S.cy + Math.sin(a) * d * S.rx * sy; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.2" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="${R() < .5 ? lt(c, .5) : c}" stroke="${dk(c, .12)}" stroke-width=".35" opacity=".9"/>`; }
    return `<g ${S.inside}>${s}</g>`;
}
// ご飯の山（型抜き・盛り）
export const riceMound = (p, cx, cy, rx, H, o = {}) => Q.riceDome(p, cx, cy, rx, rx * (o.sy ?? SY) * .9, H, { n: Math.round(rx * 9), ...o });
// 炒めたご飯（チャーハン・ジャンバラヤ・キムチポックンパ）: 色つきの粒の山
export function friedRice(p, cx, cy, rx, H, seed, { cols = ['#f2d6a0', '#e8c488', '#f8e6c0'], edge = '#b8823a', n = 520, sy = SY } = {}){
    const R = rng(p.id + 'fr' + seed), ry = rx * sy, gs = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d, v = Math.sin(a) * d, z = H * Math.pow(Math.max(0, 1 - d * d), .7); gs.push([v, cx + u * rx, cy + v * ry - z * CZ, R() * 180, (-u - v) > .3]); }
    gs.sort((a, b) => a[0] - b[0]);
    return mound(p, cx, cy, rx, H, cols[1], 'frb' + seed, sy) + gs.map(([, x, y, r, lite], i) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.5" ry="1.35" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${lite ? lt(cols[i % cols.length], .3) : cols[i % cols.length]}" stroke="${edge}" stroke-width=".35"/>`).join('');
}

// ---------- 3回目に足した部品（統括の見直し: 炒め物の具を大きく多く、煮込みの具の形と照り） ----------
// 具を (x, y) を中心に k 倍する
export const grow = (x, y, k, svg) => k === 1 ? svg : `<g transform="translate(${f(x)} ${f(y)}) scale(${k}) translate(${f(-x)} ${f(-y)})">${svg}</g>`;
// 平皿に山盛り（炒め物）: 具を big 倍に大きく、dens 倍に多く。皿の白が目立たないように山を広げる
export function plateHeap(p, D, seed, n, R, minD, H, draw, { sauce = null, sauceR = 34, big = 1.3, dens = 1.55 } = {}){
    R *= .96; H += 8;
    const it = spots(seed, Math.round(n * dens), R, minD * .9).map(([u, v, r], i) => { const [x, y] = at(D.o, u, v, 4 + hill(u, v, R, H)); return [y, () => grow(x, y, big, draw(x, y, r, i))]; });
    return D.s + (sauce ? pool(p, D.o.cx + 4, D.o.cy + 8, sauceR, sauce, seed) : '') + byDepth(it);
}
// 煮込み（滷・kho・紅焼など）: 具ひとつずつに細い焦げ茶の縁と照りの弧をつけ、茶色の塊に見えないようにする
export const piece = (p, x, y, svg, { s = 10, edge = true } = {}) => (edge ? `<g ${p.edge('#2a1206', .7, .55)}>${svg}</g>` : svg) + Q.shine(x - s * .3, y - s * .9, s * .7, -10, .85);
export function braise(p, V, c, seed, n, minD, H, draw, { srx = 50, R = 50, s = 12 } = {}){
    return heap(p, V, { c, drop: 4, H, R, srx, glow: .5, items: (pl) => [...spots(seed, n, R - 4, minD), ...spots(seed + '2', Math.round(n / 3), R * .5, minD).map(([u, v, r]) => [u, v, r, H * .35])].map(([u, v, r, z = 0], i) => { const [x, y] = pl(u, v, z); return [y, () => piece(p, x, y, draw(x, y, r, i), { s })]; }) });
}
// ムール貝（ひらいた殻の中に橙の身。殻は焦げ茶のオリーブ色で、縁に真珠色の内側。青にしない）
export function musselOpen(p, x, y, s, rot = 0){
    const valve = side => `<path d="M0,0 C${f(side * s * .3)},${f(-s * .16)} ${f(side * s * .5)},${f(-s * .6)} ${f(side * s * .2)},${f(-s * .84)} C${f(side * s * .02)},${f(-s * .96)} ${f(-side * s * .1)},${f(-s * .5)} 0,0Z" transform="rotate(${side * 28})"/>`;
    const shell = side => `<g fill="${Q.lg(p, [[0, '#6a5a40'], [.5, '#3e3226'], [1, '#2a2018']], 0, 0, 1, 1)}" stroke="#1e1610" stroke-width=".6">${valve(side)}</g>`;
    const inner = side => `<g transform="rotate(${side * 28}) translate(${f(side * s * .04)} ${f(-s * .1)}) scale(1.25 .74)"><path d="M0,${f(-s * .06)} C${f(side * s * .14)},${f(-s * .24)} ${f(side * s * .26)},${f(-s * .58)} ${f(side * s * .1)},${f(-s * .74)} C${f(side * s * .02)},${f(-s * .8)} ${f(-side * s * .02)},${f(-s * .48)} 0,${f(-s * .06)}Z" fill="#e8e0d0"/><path d="M0,${f(-s * .14)} C${f(side * s * .1)},${f(-s * .28)} ${f(side * s * .2)},${f(-s * .52)} ${f(side * s * .08)},${f(-s * .64)} C${f(side * s * .02)},${f(-s * .68)} ${f(-side * s * .01)},${f(-s * .46)} 0,${f(-s * .14)}Z" fill="${Q.rg(p, [[0, '#ffc890'], [.6, '#f09a50'], [1, '#c8682a']], .4, .35, .8)}"/></g>`;
    return Q.cast(p, x, y + 2, s * .5, s * .16, .32) + `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(1 .8)">${shell(-1)}${shell(1)}${inner(-1)}${inner(1)}<path d="M${f(-s * .22)},${f(-s * .5)} q${f(-s * .05)},${f(-s * .14)} ${f(-s * .02)},${f(-s * .26)}" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// 輪切りのゴーヤの肉詰め: でこぼこの緑の皮・淡い緑の身の輪・中の豚ひき肉
export function stuffedMelon(p, x, y, r, { h = 8, liq = null } = {}){
    const R = rng(p.id + 'sm' + x), bumps = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.283, k = 1 + (i % 2 ? .08 : -.04) + (R() - .5) * .05; return [Math.cos(a) * r * k, Math.sin(a) * r * k * SY]; });
    const top = smooth(bumps.map(([u, v]) => [x + u, y - h * CZ + v]), true, .6), side = smooth(bumps.map(([u, v]) => [x + u, y + v]), true, .6);
    return (liq ? '' : Q.cast(p, x, y + r * SY * .5, r * 1.05, r * SY * .7, .3)) + `<path d="${side}" fill="#3f6a24"/>` + `<path d="M${f(x - r)},${f(y - h * CZ)} L${f(x - r)},${f(y)} A${f(r)},${f(r * SY)} 0 0 0 ${f(x + r)},${f(y)} L${f(x + r)},${f(y - h * CZ)}Z" fill="${Q.lg(p, [[0, '#8ab858'], [.5, '#5a8a34'], [1, '#2e5a1e']])}"/>` + (liq ? `<path d="M${f(x - r)},${f(y - h * CZ * .4)} A${f(r)},${f(r * SY)} 0 0 0 ${f(x + r)},${f(y - h * CZ * .4)} L${f(x + r)},${f(y + .5)} A${f(r)},${f(r * SY)} 0 0 1 ${f(x - r)},${f(y + .5)}Z" fill="${liq}" opacity=".55"/>` : '') +
        `<path d="${top}" fill="#6a9a3a" stroke="#2e5a1e" stroke-width=".7"/><ellipse cx="${f(x)}" cy="${f(y - h * CZ)}" rx="${f(r * .8)}" ry="${f(r * .8 * SY)}" fill="${Q.rg(p, [[0, '#f2f6d8'], [1, '#c8dca0']], .4, .35, .8)}"/><ellipse cx="${f(x)}" cy="${f(y - h * CZ)}" rx="${f(r * .56)}" ry="${f(r * .56 * SY)}" fill="${Q.rg(p, [[0, '#d8a888'], [.6, '#b87a5a'], [1, '#8a5a3a']], .4, .35, .8)}"/>` + flecks(p, x, y - h * CZ, r * .45, 8, 'smf' + x, ['#7a4a2a', '#e8c8a8'], { ry: r * .45 * SY, s: 1 }) + `<ellipse cx="${f(x - r * .2)}" cy="${f(y - h * CZ - r * .22 * SY)}" rx="${f(r * .18)}" ry="${f(r * .07)}" fill="#fff" opacity=".7"/>`;
}

// =========================================================
// 4回目（インドから先の国）: 材料の種類から具を描く辞書と、盛りつけの組み立て W.make
// =========================================================
const leafy = (p, x, y, s, r, i, c) => Q.leaf(p, x, y, s, r, c, 'lf' + p.id + i, { wave: 2.6 });
const strip = (p, x, y, L, r, c, w = 2.6) => Q.prism(p, x, y, [[-L / 2, -w / 2], [L / 2, -w / 2], [L / 2, w / 2], [-L / 2, w / 2]], w * .8, c, { rot: r, line: .35, top: Q.lg(p, [[0, lt(c, .35)], [1, dk(c, .1)]], 0, 0, 0, 1) });
const sliceMeat = (p, x, y, s, r, i, c, fat) => Q.slice3q(p, x, y, s, r, { c, fat, seed: i, gloss: .7, char: false }, { sq: .5 });
const cubeOf = (p, x, y, s, i, c, top, liq) => dice(p, x, y, s, c, p.id + 'cu' + i, { h: s * .55, sink: liq ? 2 : 0, liq, top: Q.rg(p, top, .4, .35, .8) });
// 具の辞書: ING[kind](p, x, y, s, r, i, liq) → svg。s は大きさの目安
export const ING = {
    chicken: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#e8c08a', soak: '#b8783a', k: .4, sy: .72 }),
    chickenCurry: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#d8904a', soak: '#a84a1e', k: .5, sy: .72 }),
    chickenRoast: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#c8803a', soak: '#7a3414', k: .5, sy: .72 }),
    drumstick: (p, x, y, s, r, i) => drumstick(p, x, y, s * 1.6, r, i, { c: '#b8682a', fried: false }),
    friedChicken: (p, x, y, s, r, i) => crusty(p, x, y, s * .5, s * .36, i, { c: '#c8822e', n: 14, h: 5, rot: r }),
    beef: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#6a3418', [[0, '#a86a42'], [.6, '#7a4224'], [1, '#5a2c14']], liq),
    beefSlice: (p, x, y, s, r, i) => sliceMeat(p, x, y, s * 1.4, r, i, '#7a4022', '#a8704a'),
    pork: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#c8946a', [[0, '#f0d0b0'], [.6, '#d8a880'], [1, '#a8784a']], liq),
    porkSlice: (p, x, y, s, r, i) => sliceMeat(p, x, y, s * 1.4, r, i, '#c87a4a', '#f2c8a0'),
    lamb: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#7a3a24', [[0, '#b8785a'], [.6, '#8a4a30'], [1, '#5a2a18']], liq),
    mince: (p, x, y, s, r, i) => crumble(p, x, y, s * .6, s * .3, 10, p.id + 'mc' + i, { c: '#8a4a24' }),
    meatball: (p, x, y, s, r, i) => ball(p, x, y - s * .2, s, '#9a5228', p.id + 'mb' + i, { hi: .6 }),
    sausage: (p, x, y, s, r, i) => cutSlab(p, x, y, s * 1.1, s * .3, s * .3, '#a8502a', p.id + 'sg' + i, { rot: r, sear: '#5a2410', jit: .04 }),
    sausageCoin: (p, x, y, s, r, i, liq) => sausageCoin(p, x, y, s * .45, { liq }),
    bacon: (p, x, y, s, r, i) => baconBit(p, x, y, s * .6, i),
    ham: (p, x, y, s, r, i) => hamDice(p, x, y, s * .6, i),
    fish: (p, x, y, s, r, i, liq) => liq ? Q.prism(p, x, y, [[-s * .6, -s * .4], [s * .6, -s * .35], [s * .55, s * .4], [-s * .55, s * .38]], s * .45, '#f2ece0', { rot: r, sink: 2, liquid: liq, top: Q.lit(p, '#fbf8f0', .2, .08), line: .5 }) : cutSlab(p, x, y, s * .8, s * .45, 6, '#f6f0e4', p.id + 'fs' + i, { rot: r, sear: '#c8903a', edgeC: '#e0d8c8' }),
    fishFried: (p, x, y, s, r, i) => crusty(p, x, y, s * .7, s * .4, i, { c: '#d8a048', n: 16, h: 5, rot: r }),
    salmon: (p, x, y, s, r, i) => cutSlab(p, x, y, s * .8, s * .45, 8, '#f08a5a', p.id + 'sa' + i, { rot: r, sear: '#c8602a', edgeC: '#f8b890' }),
    shrimp: (p, x, y, s, r, i) => shrimp(p, x, y, s, r),
    prawn: (p, x, y, s, r, i) => Q.prawn3q(p, x, y, s * 1.3, r, i % 2 ? 1 : -1),
    clam: (p, x, y, s, r) => Q.clam(p, x, y, s, r),
    mussel: (p, x, y, s, r) => musselOpen(p, x, y, s * 1.2, r),
    squid: (p, x, y, s, r) => `<g ${T(x, y, r)}><ellipse rx="${f(s * .5)}" ry="${f(s * .36)}" fill="none" stroke="${Q.lg(p, [[0, '#fbece0'], [1, '#e0b8a0']])}" stroke-width="${f(s * .18)}"/></g>`,
    egg: (p, x, y, s, r, i) => eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    eggRibbon: (p, x, y, s, r, i) => Q.eggRibbon(p, x, y, s * 1.6, i),
    friedEgg: (p, x, y, s, r, i) => friedEgg(p, x, y, s * 2.4, i),
    scramble: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .45, s * .3, i % 2 ? '#f8d050' : '#f6e080', p.id + 'sc' + i, { n: 8, jit: .38, hi: .5, edge: '#d8a830' }),
    tofu: (p, x, y, s, r, i, liq) => tofuBlock(p, x, y, s, r, { liq, sink: liq ? s * .25 : 0 }),
    paneer: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#f2e8d0', [[0, '#fffbf0'], [.7, '#f6eedc'], [1, '#e0cca8']], liq),
    cheese: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#f2d890', [[0, '#fff2c0'], [1, '#e8c870']]),
    feta: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#f6f2e6', [[0, '#ffffff'], [1, '#ece4d0']]),
    potato: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#f2e2b0', [[0, '#fff6d8'], [.6, '#f6e4b0'], [1, '#d8c080']], liq),
    potatoRoast: (p, x, y, s, r, i) => cubeOf(p, x, y, s, i, '#c8862e', [[0, '#fbe0a0'], [.6, '#e8b058'], [.9, '#c8802a'], [1, '#9a5a1a']]),
    potatoBoiled: (p, x, y, s, r, i) => Q.glossLump(p, x, y, s, i, { c: '#f0d690' }),
    sweetPotato: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#9a3e24', [[0, '#ffc070'], [.6, '#f0903a'], [1, '#c8661e']], liq),
    pumpkin: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#3f6a2a', [[0, '#fbc860'], [.6, '#f0a030'], [1, '#c8781a']], liq),
    cassava: (p, x, y, s, r, i) => cubeOf(p, x, y, s * 1.2, i, '#e8dcc0', [[0, '#fffbf0'], [1, '#e8dcb8']]),
    plantain: (p, x, y, s, r, i) => coin(p, x, y, s * .45, '#c8822e', { h: 3, top: Q.rg(p, [[0, '#ffd890'], [.6, '#f0a840'], [1, '#c8742a']], .4, .35, .8) }),
    carrot: (p, x, y, s, r, i, liq) => coin(p, x, y, s * .38, '#e8742a', { h: 2, liq, top: Q.rg(p, [[0, '#ffb070'], [.6, '#f08a3a'], [1, '#d8641e']], .4, .35, .8) }),
    carrotStick: (p, x, y, s, r) => strip(p, x, y, s * 1.2, r, '#e8742a', 2.4),
    onion: (p, x, y, s, r) => onionStrip(x, y, s, r),
    redOnion: (p, x, y, s, r) => onionStrip(x, y, s, r, '#c87aa8'),
    tomato: (p, x, y, s, r, i) => tomatoDice(p, x, y, s * .8, i),
    cherryTomato: (p, x, y, s) => tomatoBall(p, x, y - s * .3, s * .8),
    pepperR: (p, x, y, s, r) => pepperStrip(p, x, y, s * 1.2, r, '#d8302a'),
    pepperG: (p, x, y, s, r) => pepperStrip(p, x, y, s * 1.2, r, '#3f8a2a'),
    pepperY: (p, x, y, s, r) => pepperStrip(p, x, y, s * 1.2, r, '#f2b82a'),
    chiliR: (p, x, y, s, r) => chiliRing(x, y, s * .25, '#d8281a'),
    chiliG: (p, x, y, s, r) => chiliRing(x, y, s * .25, '#3f8f2f'),
    garlic: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .35, s * .26, '#f4e8cc', p.id + 'ga' + i, { n: 8, jit: .14, hi: .6, edge: '#c8a870' }),
    pea: (p, x, y, s) => Q.pea(p, x, y, s * .3),
    chickpea: (p, x, y, s) => Q.pea(p, x, y, s * .36, '#e8c890'),
    kidney: (p, x, y, s, r) => Q.bean(p, x, y, s * .8, r, '#8a2a24'),
    blackBean: (p, x, y, s, r) => Q.bean(p, x, y, s * .7, r, '#4a3028'),
    whiteBean: (p, x, y, s, r) => Q.bean(p, x, y, s * .8, r, '#efe6d0'),
    favaBean: (p, x, y, s, r) => Q.bean(p, x, y, s * .8, r, '#a8b870'),
    brownBean: (p, x, y, s, r) => Q.bean(p, x, y, s * .8, r, '#9a6a3a'),
    lentil: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .28)}" ry="${f(s * .17)}" fill="${Q.rg(p, [[0, '#c8945a'], [1, '#7a4a22']], .35, .3, .8)}" stroke="#5a3418" stroke-width=".3"/>`,
    redLentil: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .28)}" ry="${f(s * .17)}" fill="${Q.rg(p, [[0, '#f8b070'], [1, '#d8742a']], .35, .3, .8)}" stroke="#a8541e" stroke-width=".3"/>`,
    greenBean: (p, x, y, s, r) => pod(p, x, y, s * 2, r),
    okra: (p, x, y, s) => coin(p, x, y, s * .38, '#4a8a2a', { h: 2.4, top: Q.rg(p, [[0, '#e8f0c8'], [.5, '#a8c870'], [1, '#4a8a2a']], .4, .35, .8) }),
    zucchini: (p, x, y, s, r, i, liq) => coin(p, x, y, s * .45, '#3f7a2a', { h: 2.2, liq, top: Q.rg(p, [[0, '#f8f6d8'], [.75, '#e4ecb8'], [.9, '#a8c870'], [1, '#3f7a2a']], .4, .35, .8) }),
    eggplant: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#5a2a4a', [[0, '#e8c890'], [.6, '#c8945a'], [1, '#8a5a2a']], liq),
    cauliflower: (p, x, y, s, r, i) => broc(p, x, y, s * 1.6, i, '#f2e8c8'),
    broccoli: (p, x, y, s, r, i) => broc(p, x, y, s * 1.6, i),
    cabbage: (p, x, y, s, r, i) => leafy(p, x, y, s * 1.6, r, i, i % 2 ? '#d8e8a8' : '#b8d488'),
    redCabbage: (p, x, y, s, r) => strip(p, x, y, s * 1.2, r, '#7a2a5a', 2.4),
    lettuce: (p, x, y, s, r, i) => leafy(p, x, y, s * 1.8, r, i, i % 2 ? '#7ab848' : '#5a9a34'),
    spinach: (p, x, y, s, r, i) => leafy(p, x, y, s * 1.5, r, i, i % 2 ? '#2f6a22' : '#3f7a2a'),
    kale: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.5, r, '#2e4a22', 'kl' + p.id + i, { wave: 4 }),
    herb: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .8, r, '#3f8a2a', 'hb' + p.id + i, { wave: .6 }),
    mint: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .8, r, '#4a9a3a', 'mt' + p.id + i, { wave: .8 }),
    mushroom: (p, x, y, s, r) => mushSlice(p, x, y, s * 1.2, r % 60 - 30),
    mushCap: (p, x, y, s) => mushCap(p, x, y, s, '#a87a4a'),
    corn: (p, x, y, s) => kernel(p, x, y, s * .4),
    olive: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .4)}" ry="${f(s * .3)}" fill="${Q.rg(p, [[0, '#7a5a50'], [.6, '#4a3028'], [1, '#2e1e18']], .35, .3, .8)}" stroke="#2a1a14" stroke-width=".5"/><ellipse cx="${f(x - s * .12)}" cy="${f(y - s * .1)}" rx="${f(s * .1)}" ry="${f(s * .05)}" fill="#fff" opacity=".7"/>`,
    greenOlive: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .4)}" ry="${f(s * .3)}" fill="${Q.rg(p, [[0, '#c8c870'], [.6, '#8a9a3a'], [1, '#5a6a22']], .35, .3, .8)}" stroke="#4a5a1a" stroke-width=".5"/>`,
    lemon: (p, x, y, s, r) => lemon(p, x, y, s * 1.4, { wedge: true, rot: r % 40 - 20 }),
    lime: (p, x, y, s, r) => lemon(p, x, y, s * 1.4, { wedge: true, rot: r % 40 - 20, c: '#8ab83a' }),
    avocado: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#7aa83a', [[0, '#f0f4b0'], [.7, '#c8dc78'], [1, '#7aa83a']]),
    cucumber: (p, x, y, s) => coin(p, x, y, s * .4, '#3f7a2a', { h: 1.6, top: Q.rg(p, [[0, '#f8faea'], [.6, '#e8f0d0'], [.85, '#c8dca0'], [1, '#3f7a2a']], .4, .35, .8) }),
    radish: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#f2ecd8', [[0, '#ffffff'], [1, '#ece4cc']], liq),
    beet: (p, x, y, s, r, i, liq) => cubeOf(p, x, y, s, i, '#7a1a34', [[0, '#d8506a'], [.6, '#a82a48'], [1, '#6a1428']], liq),
    celery: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .4, -s * .16], [s * .4, -s * .16], [s * .32, s * .2], [-s * .32, s * .2]], 2.2, '#9ac860', { rot: r, line: .45 }),
    leek: (p, x, y, s) => coin(p, x, y, s * .4, '#9ac860', { h: 1.6, top: Q.rg(p, [[0, '#f6f8e0'], [.6, '#dce8b0'], [1, '#8ab858']], .4, .35, .8) }),
    apple: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#c8281e', [[0, '#fffbe8'], [.7, '#f6eccc'], [1, '#e8d8a8']]),
    pineapple: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#e8b830', [[0, '#fff2a0'], [1, '#f0c040']]),
    mango: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#e8a020', [[0, '#ffd870'], [1, '#f0a830']]),
    peanut: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .26, s * .18, '#d8a868', p.id + 'pn' + i, { n: 8, jit: .12, hi: .55 }),
    nut: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .3, s * .22, '#a8763a', p.id + 'nt' + i, { n: 8, jit: .4, hi: .3 }),
    raisin: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .2)}" ry="${f(s * .14)}" fill="#5a2a2a"/>`,
    noodleBit: (p, x, y, s, r) => `<g ${T(x, y, r)}><path d="M${f(-s * .6)},0 Q0,${f(-s * .25)} ${f(s * .6)},0" stroke="#d8b050" stroke-width="${f(s * .32)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .6)},0 Q0,${f(-s * .25)} ${f(s * .6)},0" stroke="#f6dc88" stroke-width="${f(s * .2)}" fill="none" stroke-linecap="round"/></g>`,
    dumpling: (p, x, y, s, r, i) => ball(p, x, y - s * .2, s, '#f6eedc', p.id + 'dp' + i, { hi: .55, edge: '#d8c8a0' }),
    bread: (p, x, y, s, r, i) => cubeOf(p, x, y, s * .8, i, '#d89a48', [[0, '#f8d898'], [.6, '#e0a858'], [1, '#b8742a']]),
    rice: (p, x, y, s, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.2" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="#fbf6ea" stroke="#d8ccb4" stroke-width=".3"/>`,
    tempeh: (p, x, y, s, r, i, liq) => dice(p, x, y, s, '#a8702e', p.id + 'tp' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#f0d8a0'], [.6, '#d8b070'], [1, '#a8783a']], .4, .35, .8) }) + flecks(p, x, y - s * .3, s * .3, 5, 'tpf' + i, ['#f6ecd0', '#8a5a2a'], { ry: s * .15, s: .9 }),
    tempehSweet: (p, x, y, s, r) => strip(p, x, y, s * 1.3, r, '#7a3a14', 3),
    beanSprout: (p, x, y, s, r) => sprout(p, x, y, s * 1.2, r),
    longBean: (p, x, y, s, r) => pod(p, x, y, s * 2.2, r, { w: 3.4 }),
    chayote: (p, x, y, s, r, i, liq) => strip(p, x, y, s * 1.1, r, i % 2 ? '#c8dc98' : '#b8d488', 3.4),
    krupuk: (p, x, y, s, r, i) => `<path d="${Q.blob(x, y, s * .8, s * .55, p.id + 'kr' + i, { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, '#fff8e8'], [1, '#f2dcb0']], .4, .35, .8)}" stroke="#d8b878" stroke-width=".6"/>` + flecks(p, x, y, s * .5, 6, 'krf' + i, ['#e8a080'], { ry: s * .3, s: .8 }),
    greensLong: (p, x, y, s, r, i) => `<g ${T(x, y, r)}><path d="M${f(-s)},0 Q0,-3 ${f(s)},1" stroke="#4a7a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${f(-s)},0 Q0,-3 ${f(s)},1" stroke="#8ab858" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>` + Q.leaf(p, x + s * .6, y - 2, s * .9, r + 20, i % 2 ? '#2f6a22' : '#3f7a2a', 'gl' + p.id + i, { wave: 1.2 }),
    sambalDab: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .45, s * .3, '#c8281a', p.id + 'sd' + i, { n: 10, jit: .3, hi: .7, edge: '#8a1a10' }) + flecks(p, x, y - s * .1, s * .3, 5, 'sdf' + i, ['#f2c8a0', '#e8501e'], { ry: s * .15, s: .8 }),
    chiliLarge: (p, x, y, s, r) => pod(p, x, y, s * 1.8, r, { c: '#d8281a', w: 5 }),
    greenChiliLarge: (p, x, y, s, r) => pod(p, x, y, s * 1.8, r, { c: '#4a8a2a', w: 5 }),
    mushOyster: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, '#c8b49a', 'mo' + p.id + i, { wave: 2.4 }),
    sausageLink: (p, x, y, s, r, i) => cutSlab(p, x, y, s * .9, s * .3, s * .3, '#a8502a', p.id + 'sl' + i, { rot: r, sear: '#6a2a10', jit: .03 }),
    omelette: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .6, -s * .3], [s * .6, -s * .3], [s * .6, s * .3], [-s * .6, s * .3]], 3, '#f2c040', { rot: r, line: .4, top: Q.rg(p, [[0, '#fff0a0'], [.6, '#f6d050'], [1, '#e0a830']], .4, .35, .8) }),
    pumpkinSeed: (p, x, y, s, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .26)}" ry="${f(s * .13)}" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${Q.lg(p, [[0, '#a8c060'], [1, '#4a6a22']], 0, 0, 0, 1)}" stroke="#3a4a14" stroke-width=".4"/>`,
    crouton: (p, x, y, s, r, i) => dice(p, x, y, s * .6, '#c8862e', p.id + 'cr' + i, { h: s * .45, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }),
    basil: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .9, r, '#3f8a2a', 'bs' + p.id + i, { wave: .4 }),
    tomatoChunk: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, s * .2], [0, -s * .35], [s / 2, s * .2], [0, s * .32]], s * .4, '#c8301e', { rot: r, top: Q.rg(p, [[0, '#ff8a6a'], [.6, '#e0402a'], [1, '#a82a1a']], .4, .35, .8), line: .5 }),
    pepperRoast: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -s * .2], [s * .7, -s * .24], [s * .7, s * .2], [-s * .7, s * .22]], 2, '#b8301e', { rot: r, line: .4, top: Q.lg(p, [[0, '#e8603a'], [1, '#a8281a']], 0, 0, 0, 1) }),
    grain: (p, x, y, s, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.5" fill="#e8d098" stroke="#b89858" stroke-width=".3"/>`,
};
// 盛りつけの組み立て: spec = { v: 器の関数(p) => V, mode: 'plate' | 'soup' | 'braise' | 'bowl'（小鉢・鉢に山高）, c: ソース・汁の色,
//   items: [[kind, 数, 大きさ]], R, H, base, flecks: [[色, 数, 大きさ]], sauce, oil: [数, 色], cream, after(o, S) }
const SMALL_TOP = new Set(['lentil', 'redLentil', 'moong', 'pea', 'corn', 'grain', 'kidney', 'blackBean', 'whiteBean', 'brownBean', 'chickpea', 'fava', 'favaSprout', 'canary', 'urad', 'pumpkinSeed', 'peanut']);
export function make(p, spec){
    const { v, mode = 'plate', c = '#c88a4a', items = [], R = 50, H = 16, base = null, flecks: fl = [], sauce = null, sauceR = 32, oil = null, cream = null, after = () => '', minD = 10, big = 1, steam = 0, rice = null, noodle = null, porr = null, top = null, topR = 30 } = spec;
    const dens = spec.dens ?? (mode === 'plate' ? 1.5 : mode === 'bowl' ? 1.7 : 1), list = []; items.forEach(([k, n, s = 12]) => { for (let j = 0; j < Math.round(n * (n > 3 ? dens : 1)); j++) list.push([k, s]); });
    const R0 = rng(p.id + 'mk'); for (let i = list.length - 1; i > 0; i--){ const j = Math.floor(R0() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    const draw = (k, s, x, y, r, i, liq) => { const fn = (spec.ing && spec.ing[k]) || ING[k]; if (!fn) throw new Error('ING ' + k); return grow(x, y, big, fn(p, x, y, s, r, i, liq)); };
    const flk = (cx, cy, rx, ry) => fl.map(([col, n, sz = 1.4], j) => flecks(p, cx, cy, rx, n, 'mkf' + j, col, { ry, s: sz })).join('');
    if (mode === 'plate'){
        const D = v(p), sp = spots(p.id + 'pl', list.length, R, minD), z0 = rice || noodle ? 6 : 4;
        const it = sp.map(([u, v2, r], i) => { const [x, y] = at(D.o, u, v2, z0 + hill(u, v2, R + 4, H)); return [y, () => draw(list[i][0], list[i][1], x, y, r, i)]; });
        const bed = rice ? friedRice(p, D.o.cx, D.o.cy + 4, R + 6, H, p.id + 'rc', { cols: rice.cols, edge: rice.edge, sy: D.o.sy, n: rice.n ?? 520 })
            : noodle ? noodleMound(p, D.o.cx, D.o.cy + 4, R + 6, H, noodle.c, p.id + 'nd', { w: noodle.w ?? 2.4, n: noodle.n ?? 140, len: 32, sy: D.o.sy, edge: noodle.edge }) : '';
        return D.s + (sauce ? pool(p, D.o.cx + 4, D.o.cy + 8, sauceR, sauce, 'mks') : '') + (base ? mound(p, D.o.cx, D.o.cy + 2, R * .92, H * .7, base, 'mkb', D.o.sy) : '') + bed + byDepth(it) + flk(D.o.cx, D.o.cy - H * CZ * .5, R * .8, R * .4) + after(D.o, D, p);
    }
    if (mode === 'bowl'){
        const V = v(p), bg = spec.bowlBig ?? 1.3; return inBowl(p, V, { R: R + 14, H: H + 18, base, items: (o, RR, HH) => [...onHill(o, p.id + 'bw', list.length, RR * .97, minD * .9, HH, (x, y, r, i) => grow(x, y, bg, draw(list[i][0], list[i][1], x, y, r, i))), [999, () => flk(o.cx, o.cy - HH * CZ * .6, RR * .7, RR * .25) + after(o, V, p)]] });
    }
    if (mode === 'braise'){
        const V = v(p); return braise(p, V, c, p.id + 'br', list.length, minD, H + 14, (x, y, r, i) => draw(list[i % list.length][0], list[i % list.length][1], x, y, r, i), { srx: 50, R: 50 }) + flk(100, V.cy - 4, 40, 14) + after({ cx: 100, cy: V.cy }, V, p);
    }
    // soup
    const V = v(p);
    return soup(p, V, { c, drop: V.sy ? 4 : 9, glow: .35, oil: oil ? oil[0] : 0, oilC: oil ? oil[1] : '#f0c040', cream, steamOp: steam, items: (pl, S) => [...(porr ? [[-999, () => porridge(p, S, p.id + 'po', porr)]] : []), ...spots(p.id + 'sp', list.length, S.rx * .8, minD * .9).map(([u, v2, r], i) => { const [x, y] = pl(u, v2, 1); return [y, () => draw(list[i][0], list[i][1], x, y, r, i, c)]; }), [998, () => top ? topCluster(S, pl) : ''], [999, () => flk(S.cx, S.cy, S.rx * .8, S.rx * (S.o.sy ?? SY) * .7) + after(S, V, p)]] });
    // 汁物の真ん中に、何のスープか分かる具を小さな山に（ポタージュ・豆のスープ。2026-10-29 統括の見直し 4回目）
    function topCluster(S, pl){
        const tl = []; top.forEach(([k, n, s = 14]) => { for (let j = 0; j < n; j++) tl.push([k, s]); });
        const H = Math.min(14, 4 + tl.length * .5);
        return `<path d="${Q.blob(S.cx, S.cy, topR * 1.05, topR * (S.o.sy ?? SY) * .9, p.id + 'tpb', { n: 12, jit: .12 })}" fill="${SHADE}" opacity=".12"/>` + byDepth(spots(p.id + 'tp', tl.length, topR, Math.max(6, tl[0][1] * .55)).map(([u, v2, r], i) => { const [x, y] = pl(u, v2, 2 + hill(u, v2, topR + 2, H)); const g = grow(x, y, 1.25, draw(tl[i][0], tl[i][1], x, y, r, 500 + i)); return [y, () => SMALL_TOP.has(tl[i][0]) ? `<g ${p.edge('#2a1206', .5, .45)}>${g}</g>` : piece(p, x, y, g, { s: tl[i][1] * .8 })]; }));
    }
}

// 串焼き（サテ・ケバブ・アンティクーチョ・シュハスコ）: 平行な串に具を通す。piece(x, y, i) で具をひとつ描く
export function skewers(p, o, n, piece, { L = 120, k = 4, rot = -10, gap = 16, stick = '#d8b878' } = {}){
    return byDepth(Array.from({ length: n }, (_, j) => { const [x, y] = at(o, -4, (j - (n - 1) / 2) * gap); return [y, () => `<g ${T(x, y, rot)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="${dk(stick, .2)}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(-L / 2)},-.4 L${f(L / 2)},-.4" stroke="${stick}" stroke-width="1.6" stroke-linecap="round"/>${Array.from({ length: k }, (_, i) => piece(-L * .32 + i * (L * .64 / Math.max(1, k - 1)), 0, j * k + i)).join('')}</g>`]; }));
}
// 丸ごとの魚を皿に（焼き魚・揚げ魚）: 上にソースや薬味を on(x, y) で
export const fishOn = (p, D, { L = 150, rot = -8, skin = '#a8763a', belly = '#e8c890', char = .6, on = () => '' } = {}) => D.s + wholeFish(p, D.o.cx, D.o.cy, L, rot, 1, { skin, belly, char }) + on(D.o.cx, D.o.cy);
// オーブン焼き（グラタン・パルミジャーナ・エスコンジジーニョ・ムサカ）: 角の耐熱皿に焼き色の面、top(o) で上の具
export function bake(p, { base = '#e9dccb', inner = '#f6efe2', c = '#f2c860', fl = ['#d8902a', '#c8782a', '#f8e0a0', '#a8601e'], n = 80, top = () => '', blister = 0, scoop = null, dome = null, ...o } = {}){
    const V = casserole(p, { base, inner, ...o }), O = V.o;
    // 焼き色のふくれ（グラタン）: 濃い焼き色の斑と、ふちの明るい輪
    const bl = blister ? spots(p.id + 'bl', blister, 66, 14, { ry: 36 }).map(([u, v], k) => { const [x, y] = at(O, u, v * .62); const r = 6 + (k % 3) * 2.4; return `<path d="${Q.blob(x, y, r, r * .6, p.id + 'blb' + k, { n: 9, jit: .3 })}" fill="${Q.rg(p, [[0, '#7a3a10'], [.55, '#a8601e'], [1, '#e0a040']], .45, .4, .8)}" opacity=".85"/>`; }).join('') : '';
    // パイ: 生地が山にふくらみ、縁に指で押した波、まん中に空気穴、照り
    const dm = dome ? `<ellipse cx="${O.cx}" cy="${f(O.cy - 6)}" rx="70" ry="34" fill="${Q.rg(p, [[0, '#fbe0a0'], [.55, c], [1, dk(c, .25)]], .42, .32, .85)}"/>` + Array.from({ length: 30 }, (_, k) => { const a = k / 30 * 6.283, x = O.cx + Math.cos(a) * 74, y = O.cy - 4 + Math.sin(a) * 40; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="5.6" ry="4" fill="${Q.rg(p, [[0, '#f6d890'], [1, dk(c, .3)]], .4, .35, .8)}" stroke="${dk(c, .4)}" stroke-width=".4"/>`; }).join('') + [-10, 0, 10].map(d => `<path d="M${f(O.cx + d - 3)},${f(O.cy - 18 + Math.abs(d) * .2)} l6,-3" stroke="${dk(c, .5)}" stroke-width="1.8" stroke-linecap="round"/>`).join('') + (dome.leaves ? [[-30, -10, -30], [26, -14, 20]].map(([u, v, r], k) => Q.leaf(p, O.cx + u, O.cy + v, 22, r, c, 'pl' + k, { wave: .8 })).join('') : '') + Q.shine(O.cx - 34, O.cy - 26, 34, -8, .7) : '';
    // ひとすくい取った跡（手前右）: 中の層が切り口に見える
    let sc = '';
    if (scoop){
        const { u0 = 22, u1 = 90, v0 = 4, v1 = 70, hf = 30, layers = [[c, 1]], dots = [], bottom = null } = scoop;
        const P3 = (u, v, z) => at(O, u, v, z), pt = a => a.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
        const B = [P3(u0, v0, -hf), P3(u1, v0, -hf), P3(u1, v1, -hf), P3(u0, v1, -hf)];
        const back = [P3(u0, v0, 0), P3(u1, v0, 0), P3(u1, v0, -hf), P3(u0, v0, -hf)], left = [P3(u0, v0, 0), P3(u0, v1, 0), P3(u0, v1, -hf), P3(u0, v0, -hf)];
        let acc = 0; const stops = []; layers.forEach(([col, fr]) => { stops.push([acc, col]); acc += fr; stops.push([Math.min(1, acc - .001), col]); });
        const face = Q.lg(p, stops, 0, 0, 0, 1);
        sc = `<polygon points="${pt(B)}" fill="${bottom || dk(inner, .12)}"/>` + `<polygon points="${pt(left)}" fill="${face}"/><polygon points="${pt(left)}" fill="${SHADE}" opacity=".25"/>` + `<polygon points="${pt(back)}" fill="${face}"/>` +
            dots.map(([col, k, r = 2.4], j) => Array.from({ length: k }, (_, m) => { const R = rng(p.id + 'sd' + j + m)(), R2 = rng(p.id + 'se' + j + m)(); const [x, y] = P3(u0 + 4 + R * (u1 - u0 - 8), v0, -hf * (.15 + R2 * .75)); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .8)}" fill="${col}" stroke="${dk(col, .3)}" stroke-width=".4"/>`; }).join('')).join('') +
            `<polyline points="${pt([P3(u0, v1, 0), P3(u0, v0, 0), P3(u1, v0, 0)])}" fill="none" stroke="${lt(layers[0][0], .3)}" stroke-width="1.2"/>`;
    }
    return V.s + `<g ${V.inside}><rect width="200" height="200" fill="${c}"/>${flecks(p, 100, 96, 80, n, 'bk' + p.id, fl, { ry: 46, s: 2.4 })}${bl}${top(V.o, V, p)}${dm}${sc}</g>` + Q.shine(60, V.cy - 30, 30, -6, .5);
}
// カツ（シュニッツェル・ミラネサ・パネ・スハボヴィ）: ぎざぎざのころもに細かいパン粉の粒、切り分けた切れ目に白い中身が見える（2026-10-29 見直し 4回目）
export function cutlet(p, x, y, rx, ry, rot = -8, { inner = '#f6eadc', c = ['#f6d080', '#e0a848', '#a8702a'], cuts = 3, seed = 'ct', lemonAt = null } = {}){
    const sd = p.id + seed, body = Q.blob(0, 0, rx, ry, sd, { n: 18, jit: .1 });
    let s = `<g ${T(x, y, rot)}><path d="${body}" transform="translate(1.5 3)" fill="${SHADE}" opacity=".25"/><path d="${body}" transform="translate(0 2.4)" fill="${dk(c[2], .15)}"/><path d="${body}" fill="${Q.rg(p, [[0, c[0]], [.6, c[1]], [1, c[2]]], .4, .35, .85)}" stroke="${dk(c[2], .3)}" stroke-width=".8"/>`;
    const R = rng(sd + 'cr');
    for (let k = 0; k < Math.round(rx * ry / 9); k++){ const a = R() * 6.283, d = Math.sqrt(R()) * .9; const px = Math.cos(a) * rx * d, py = Math.sin(a) * ry * d; s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(.6 + R() * .9)}" fill="${R() < .5 ? lt(c[0], .3) : dk(c[1], .25)}" opacity=".85"/>`; }
    for (let k = 1; k <= cuts; k++){ const u = rx * (-.1 + k * .28); const h = ry * Math.sqrt(Math.max(0, 1 - (u / rx) ** 2)) * .95; s += `<path d="M${f(u + 1.6)},${f(-h)} L${f(u + .6)},${f(h)}" stroke="${SHADE}" stroke-width="1.6" opacity=".45"/><path d="M${f(u)},${f(-h)} L${f(u - 1)},${f(h)}" stroke="${inner}" stroke-width="2.6"/>`; }
    s += `<path d="M${f(-rx * .7)},${f(-ry * .5)} Q${f(-rx * .2)},${f(-ry * .95)} ${f(rx * .3)},${f(-ry * .7)}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".5"/></g>`;
    return s;
}
// ピーマンの肉詰め: 縦の筋のあるピーマン、切った口から中の詰めもの、へたのふた
export function bellPepper(p, x, y, s, c, seed, { fill = '#8a4a24', grain = '#f2e4c0', cap = true } = {}){
    const w = s * .5, h = s * .62, top = y - h;
    const lob = `M${f(x - w)},${f(top + 2)} C${f(x - w * 1.08)},${f(y - h * .3)} ${f(x - w * .9)},${f(y + 2)} ${f(x - w * .45)},${f(y + 3)} Q${f(x - w * .2)},${f(y - 1)} ${f(x)},${f(y + 3.6)} Q${f(x + w * .2)},${f(y - 1)} ${f(x + w * .45)},${f(y + 3)} C${f(x + w * .9)},${f(y + 2)} ${f(x + w * 1.08)},${f(y - h * .3)} ${f(x + w)},${f(top + 2)}Z`;
    return Q.cast(p, x, y + 3, w * 1.1, w * .3, .3) + `<path d="${lob}" fill="${Q.lg(p, [[0, lt(c, .35)], [.45, c], [1, dk(c, .35)]], 0, 0, 1, 0)}" stroke="${dk(c, .45)}" stroke-width=".7"/>` +
        [-.45, 0, .45].map(k => `<path d="M${f(x + w * k)},${f(top + 4)} Q${f(x + w * k * 1.1)},${f(y - h * .4)} ${f(x + w * k * .9)},${f(y + 1)}" stroke="${dk(c, .3)}" stroke-width="1" fill="none" opacity=".6"/>`).join('') +
        `<ellipse cx="${f(x)}" cy="${f(top + 2)}" rx="${f(w)}" ry="${f(w * .42)}" fill="${dk(c, .2)}"/><ellipse cx="${f(x)}" cy="${f(top + 1.4)}" rx="${f(w * .86)}" ry="${f(w * .34)}" fill="${Q.rg(p, [[0, lt(fill, .3)], [1, fill]], .4, .35, .8)}"/>` + flecks(p, x, top, w * .7, 8, 'bp' + seed, [grain, dk(fill, .2)], { ry: w * .25, s: 1.4 }) +
        `<path d="M${f(x - w * .6)},${f(y - h * .35)} q${f(w * .2)},${f(-h * .3)} ${f(w * .1)},${f(-h * .5)}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".5"/>` +
        (cap ? `<g transform="translate(${f(x + w * .9)} ${f(top - 2)}) rotate(24)"><ellipse rx="${f(w * .6)}" ry="${f(w * .26)}" fill="${dk(c, .1)}" stroke="${dk(c, .45)}" stroke-width=".6"/><path d="M0,${f(-w * .1)} l1,${f(-w * .5)}" stroke="#4a6a22" stroke-width="2.6" stroke-linecap="round"/></g>` : '');
}
