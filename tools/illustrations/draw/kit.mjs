/*
 * ごはん帖の料理イラストの部品（SVG）
 *
 * 決まりごと
 *   - 画面は 200×200。器の中心は (100,100)。真上から見た盛りつけ
 *   - 光は左上から。具は「明るい面（左上）→ 地の色 → 暗い面（右下）」のグラデーションと、白い照り、器に落ちる影で立体にする
 *   - 輪郭は黒や茶の一律の線ではなく、その具の色を少し暗くした細い線（ポップだが図鑑のように形は正確に）
 *   - 部品は (x, y) を中心、s をおおよその大きさ（直径 px）、r を回転角で描く
 */

// ---------- 色 ----------
const hex = c => { c = c.replace('#', ''); if (c.length === 3) c = [...c].map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); };
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const lt = (c, t) => mix(c, '#ffffff', t);
export const dk = (c, t) => mix(c, '#2a1406', t);   // 暗くするときは黒でなく焦げ茶に寄せる（食べ物が濁らない）

// ---------- 乱数（料理ごとに毎回同じ絵になる） ----------
export function rng(seed){
    let h = 2166136261;
    for (const ch of String(seed)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = n => Math.round(n * 100) / 100;

// 点の列を、角の丸いなめらかな閉じた形にする（Catmull-Rom → ベジェ）
export function smooth(pts, closed = true, k = 1){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k];
        d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
// 中心のまわりに、半径を少しずつ揺らした点を並べる（自然な不定形）
export function ring(R, n, jitter, rand, sx = 1, sy = 1, start = 0){
    return Array.from({ length: n }, (_, i) => { const a = start + i / n * Math.PI * 2, rr = R * (1 - jitter / 2 + rand() * jitter); return [Math.cos(a) * rr * sx, Math.sin(a) * rr * sy]; });
}
const T = (x, y, r = 0, k = 1) => `transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${k !== 1 ? ` scale(${f(k)})` : ''}"`;

// ---------- 1枚の絵 ----------
export class Pic {
    constructor(id){ this.id = id; this.n = 0; this.defs = new Map(); this.rand = rng(id); }
    uid(){ return `${this.id}-${++this.n}`; }
    def(key, make){ if (!this.defs.has(key)){ const id = this.uid(); this.defs.set(key, { id, body: make(id) }); } return this.defs.get(key).id; }
    // 左上が明るく右下が暗い塗り
    g(c, l = .3, d = .25){
        const id = this.def(`g${c}${l}${d}`, id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lt(c, l)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, d)}"/></linearGradient>`);
        return `url(#${id})`;
    }
    // 中心が明るく縁が暗い塗り（汁・ソースの表面、器の内側）
    rg(c, l = .18, d = .3, cx = .4, cy = .38){
        const id = this.def(`r${c}${l}${d}${cx}${cy}`, id => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".75"><stop offset="0" stop-color="${lt(c, l)}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, d)}"/></radialGradient>`);
        return `url(#${id})`;
    }
    // 器に落ちる影
    sh(k = 1){
        const id = this.def(`sh${k}`, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="${1.4 * k}" dy="${2 * k}" stdDeviation="${1.3 * k}" flood-color="#2b1607" flood-opacity=".36"/></filter>`);
        return `filter="url(#${id})"`;
    }
    // 揚げ衣・パン粉のざらざら（ノイズで凹凸の陰影をつける）
    crumb(scale = .55){
        const id = this.def(`cr${scale}`, id => `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="${scale}" numOctaves="2" seed="7" result="n"/><feDiffuseLighting in="n" surfaceScale="2.2" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting><feComposite in="l" in2="SourceAlpha" operator="in" result="m"/><feBlend in="m" in2="SourceGraphic" mode="soft-light" result="b"/><feComposite in="b" in2="SourceAlpha" operator="in"/></filter>`);
        return `filter="url(#${id})"`;
    }
    // 輪郭をでこぼこにする（唐揚げ・ひき肉など）
    rough(k = 3, freq = .09){
        const id = this.def(`ro${k}${freq}`, id => `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${k}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
        return `filter="url(#${id})"`;
    }
    svg(body){
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400"><defs>${[...this.defs.values()].map(d => d.body).join('')}</defs>${body}</svg>\n`;
    }
}

// =========================================================
// 器
// =========================================================
const INDIGO = '#2c4c7c';
// 白い丸皿（縁に藍の線）
export function plate(p, { R = 94, well = .74, rim = INDIGO, base = '#fbfaf6' } = {}){
    const w = R * well;
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 4}" fill="none" stroke="${rim}" stroke-width="2.2" opacity=".9"/>
        <circle cx="100" cy="100" r="${w + 2}" fill="none" stroke="${dk(base, .08)}" stroke-width="3" opacity=".5"/>
        <circle cx="100" cy="100" r="${w}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 長皿（焼き魚・とんかつ）
export function longPlate(p, { w = 184, h = 120, base = '#f4f1ea', rim = '#c9c2b4' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${p.rg(base, .2, .12, .35, .3)}"/></g>
        <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="15" fill="none" stroke="${rim}" stroke-width="1.6" opacity=".8"/>
        <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="11" fill="${p.rg(base, .06, .08, .6, .6)}"/>
        <path d="M${x + 14},${y + 30} Q${x + 14},${y + 12} ${x + 34},${y + 12}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 深めの鉢（煮物）。glaze は外側の釉薬の色
export function bowl(p, { R = 92, glaze = '#6e4b33', inside = '#efe5d3', lip = .87 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(glaze, .25, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(glaze, .35)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${r}" fill="${p.rg(inside, .12, .32, .64, .66)}"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// どんぶり（白地に藍の模様）
export function donburi(p, { R = 94 } = {}){
    const dots = Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return `<circle cx="${f(100 + Math.cos(a) * (R - 6))}" cy="${f(100 + Math.sin(a) * (R - 6))}" r="2.1" fill="${INDIGO}"/>`; }).join('');
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="${INDIGO}" stroke-width="2"/>
        ${dots}
        <circle cx="100" cy="100" r="${R - 11}" fill="none" stroke="${INDIGO}" stroke-width="1.4"/>
        <circle cx="100" cy="100" r="${R - 13}" fill="${p.rg('#f7f4ec', .1, .26, .62, .64)}"/>`;
}
// 小鉢（青磁）
export function kobachi(p, { R = 92, glaze = '#9fbfae', inside = '#eef2ea' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(glaze, .25, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .84}" fill="${p.rg(inside, .1, .22, .62, .64)}"/>
        <circle cx="100" cy="100" r="${R * .84}" fill="none" stroke="${dk(glaze, .2)}" stroke-width="1.2" opacity=".6"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 汁椀（外は朱、内は黒の漆）
export function wan(p, { R = 92, outer = '#9a2c1e', inner = '#2a1512' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(outer, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .9}" fill="${p.rg(inner, .12, .2, .65, .66)}"/>
        <path d="M${100 - R * .76},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .3},${100 - R * .8}" stroke="#ffd9c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 茶碗
export function chawan(p, { R = 92 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 4}" fill="none" stroke="${INDIGO}" stroke-width="3"/>
        <circle cx="100" cy="100" r="${R - 9}" fill="none" stroke="${INDIGO}" stroke-width="1"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg('#f6f3ec', .1, .2, .62, .64)}"/>`;
}
// 楕円のグラタン皿・カレー皿
export function ovalDish(p, { rx = 94, ry = 74, base = '#fbfaf6', rim = INDIGO, deep = false } = {}){
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .14, .38, .32)}"/></g>
        ${rim ? `<ellipse cx="100" cy="100" rx="${rx - 4}" ry="${ry - 4}" fill="none" stroke="${rim}" stroke-width="2"/>` : ''}
        <ellipse cx="100" cy="100" rx="${rx * (deep ? .86 : .8)}" ry="${ry * (deep ? .84 : .78)}" fill="${p.rg(base, .06, deep ? .2 : .08, .6, .62)}"/>`;
}
// 鉄板・石鍋（黒）
export function stonePot(p, { R = 92 } = {}){
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#3b3533', .18, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .86}" fill="${p.rg('#26201e', .1, .2, .62, .64)}"/>`;
}
// 小さな角皿（香の物）
export function squareDish(p, { s = 150, base = '#f2efe6', rim = INDIGO } = {}){
    const x = 100 - s / 2;
    return `<g ${p.sh(1.4)}><rect x="${x}" y="${x}" width="${s}" height="${s}" rx="16" fill="${p.rg(base, .2, .12, .35, .3)}"/></g>
        <rect x="${x + 5}" y="${x + 5}" width="${s - 10}" height="${s - 10}" rx="12" fill="none" stroke="${rim}" stroke-width="1.6" opacity=".8"/>`;
}

// =========================================================
// 汁・ソース・ご飯（面）
// =========================================================
// 器の中の汁・煮汁の面。tone は色、R は半径。clip せず円で描く
export function liquid(p, { R = 64, c = '#b9813f', op = .95, cx = 100, cy = 100, shine = true } = {}){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, .22, .25, .45, .42)}" opacity="${op}"/>
        ${shine ? `<path d="M${cx - R * .62},${cy - R * .3} A${R * .72},${R * .72} 0 0 1 ${cx - R * .15},${cy - R * .66}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>` : ''}`;
}
// 皿の上のソースだまり（不定形）
export function pool(p, x, y, s, c, { op = .95, seed = 1, sy = .8 } = {}){
    const R = rng(p.id + 'pool' + seed);
    return `<path ${T(x, y)} d="${smooth(ring(s / 2, 9, .28, R, 1, sy))}" fill="${p.rg(c, .2, .22)}" opacity="${op}"/>
        <path ${T(x, y)} d="M${f(-s * .28)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .27)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// あん（透明でつやのあるとろみ）
export function glaze(p, x, y, s, c = '#d69a4a', { seed = 1, op = .55 } = {}){
    const R = rng(p.id + 'glz' + seed);
    return `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .3, R))}" fill="${c}" opacity="${op}"/>
        <path ${T(x, y)} d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .15)},${f(-s * .32)} ${f(s * .1)},${f(-s * .33)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// ご飯の山（白い面に、光る米粒を並べる）
export function rice(p, x, y, s, { sy = 1, tint = '#f7f4ea', grains = 1 } = {}){
    const R = rng(p.id + 'rice' + x + y);
    const shape = smooth(ring(s / 2, 12, .1, R, 1, sy));
    let g = '';
    const n = Math.round(s * s / 40 * grains);
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .9, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const light = (gx + gy) < 0;
        g += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="2.6" ry="1.35" transform="rotate(${f(R() * 180)} ${f(gx)} ${f(gy)})" fill="${light ? '#ffffff' : '#e7e1d1'}" stroke="${light ? '#e9e3d4' : '#d5cdb9'}" stroke-width=".5"/>`;
    }
    return `<g ${T(x, y)}><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(tint, .3, .16, .38, .34)}"/></g>${g}</g>`;
}

// =========================================================
// 肉・魚・卵・豆腐
// =========================================================
// 薄切りの豚肉（焼いた・炒めた・煮た）。s は長さ。片側の縁に脂身、表面に焼き目と照り
export function porkSlice(p, x, y, s, r = 0, { c = '#b5733c', fat = '#efd9a8', seed = 1, char = true, gloss = .55, bend = null } = {}){
    const R = rng(p.id + 'pork' + seed + x + y);
    const k = s / 40;
    const bd = bend === null ? (R() - .5) * .03 : bend;
    // 上の縁（脂身側）と下の縁を波打たせ、1枚全体をゆるく反らせる
    const top = Array.from({ length: 8 }, (_, i) => { const xx = -20 + i * 40 / 7; return [xx, -7.5 + Math.sin(i * 1.7 + R() * 2) * 2.4 + (R() - .5) * 1.6 + bd * xx * xx]; });
    const bot = Array.from({ length: 8 }, (_, i) => { const xx = 20 - i * 40 / 7; return [xx, 7.5 + Math.sin(i * 1.4 + R() * 2) * 2.6 + (R() - .5) * 1.8 + bd * xx * xx]; });
    const body = smooth([...top, ...bot], true, .9);
    const fatLine = smooth(top.map(([a, b]) => [a, b + 1.6]), false);
    let marks = '';
    if (char) for (let i = 0; i < 6; i++){ const mx = -15 + R() * 30, my = -3 + R() * 9; marks += `<ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(2.5 + R() * 4)}" ry="${f(1.4 + R() * 2)}" fill="${dk(c, .5)}" opacity="${f(.18 + R() * .25)}"/>`; }
    return `<g ${T(x, y, r, k)}><path d="${body}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="${fatLine}" stroke="${fat}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".92"/>
        <path d="${fatLine}" stroke="${dk(fat, .25)}" stroke-width=".5" fill="none" transform="translate(0 1.9)" opacity=".5"/>
        ${marks}
        <path d="M-15,1 Q-8,-1 -1,1.5 T14,1 M-12,5 Q-4,3.6 4,5.4" stroke="${dk(c, .35)}" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".45"/>
        <path d="M-14,-2 Q-4,-5 9,-3" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${gloss}"/>
        <path d="M2,4 Q8,2.5 13,3.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity="${f(gloss * .6)}"/></g>`;
}
// 薄切りの牛肉（煮た・炒めた。濃い茶でひだが多い）
export function beefSlice(p, x, y, s, r = 0, { c = '#7b4a2c', seed = 1 } = {}){
    const R = rng(p.id + 'beef' + seed + x + y);
    const k = s / 22;
    return `<g ${T(x, y, r, k)}><path d="${smooth(ring(10, 13, .35, R, 1.15, .7))}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="M-8,-1 Q-3,-4 1,-1 T9,-1 M-6,3.5 Q-1,1.5 3,4 T9,3" stroke="${dk(c, .4)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-6,-4.5 Q0,-6.4 5,-4.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 鶏肉のひと口大（煮た・照り焼き）
export function chickenPiece(p, x, y, s, r = 0, { c = '#c98d4c', skin = '#a8652b', seed = 1, glazeIt = false } = {}){
    const R = rng(p.id + 'chk' + seed + x + y);
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="${smooth(ring(9.5, 8, .25, R, 1.15, .9))}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .3)}" stroke-width=".7"/>
        <path d="${smooth(ring(6.2, 7, .3, R, 1.1, .7).map(([a, b]) => [a + 1.6, b + 1.4]))}" fill="${skin}" opacity=".55"/>
        <path d="M-6,-3.5 Q-2,-6 3,-5" stroke="#fff" stroke-width="${glazeIt ? 2.2 : 1.4}" fill="none" stroke-linecap="round" opacity="${glazeIt ? .8 : .5}"/></g>`;
}
// 唐揚げ（こぶの多い衣。こぶの頭は明るく、谷は濃い狐色）
export function karaage(p, x, y, s, r = 0, { c = '#cf8a34', seed = 1 } = {}){
    const R = rng(p.id + 'kara' + seed + x + y);
    const k = s / 20;
    let lumps = '';
    const n = 7;
    for (let i = 0; i < n; i++){
        const a = i / n * 6.28 + R() * .5, d = i === 0 ? 0 : 4 + R() * 2.2, rr = 3.4 + R() * 1.8;
        const lx = Math.cos(a) * d, ly = Math.sin(a) * d * .9;
        lumps += `<path ${T(lx, ly)} d="${smooth(ring(rr, 7, .35, R))}" fill="${p.g(lt(c, .08), .42, .3)}"/>`;
    }
    let crev = '';
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = 2 + R() * 4; crev += `<path d="M${f(Math.cos(a) * d)},${f(Math.sin(a) * d)} q${f((R() - .5) * 5)},${f((R() - .5) * 5)} ${f((R() - .5) * 6)},${f((R() - .5) * 6)}" stroke="${dk(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/>`; }
    let specks = '';
    for (let i = 0; i < 10; i++) specks += `<circle cx="${f((R() - .5) * 15)}" cy="${f((R() - .5) * 13)}" r="${f(.4 + R() * .6)}" fill="${lt(c, .55)}" opacity=".9"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.rough(1.8, .22)}><path d="${smooth(ring(9.6, 12, .28, R, 1.12, .94))}" fill="${p.g(dk(c, .12), .2, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/>${lumps}</g>
        ${crev}${specks}
        <path d="M-6.5,-4 Q-3,-7 1.5,-6.4" stroke="#fff3d8" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="3.5" cy="-3" r=".9" fill="#fff" opacity=".8"/></g>`;
}
// パン粉の揚げ物（とんかつ）を切ったもの: 幅 w、高さ h の1切れ
export function cutletSlice(p, x, y, w, h, r = 0, { c = '#d79a45', meat = '#f1e2cf' } = {}){
    return `<g ${T(x, y, r)}><g ${p.crumb(.75)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(w * .22)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        <rect x="${-w / 2 + 2.2}" y="${-h / 2 + 3}" width="${f(w * .22)}" height="${h - 6}" rx="1.5" fill="${meat}"/>
        <rect x="${-w / 2 + 2.2}" y="${-h / 2 + 3}" width="${f(w * .22)}" height="${h - 6}" rx="1.5" fill="none" stroke="${dk(meat, .2)}" stroke-width=".5"/>
        <path d="M${-w / 2 + w * .5},${-h / 2 + 4} L${-w / 2 + w * .5},${h / 2 - 4}" stroke="#fff3d6" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></g>`;
}
// 鶏ももの照り焼き（1枚肉を切ったもの・照りと焼き目）
export function teriyakiSlab(p, x, y, w, h, r = 0, { c = '#9c5a24', seed = 1 } = {}){
    const R = rng(p.id + 'teri' + seed);
    const pts = [[-w / 2, -h / 2 + 2], [w / 2, -h / 2], [w / 2 + 1, h / 2 - 1], [-w / 2 - 1, h / 2]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .28, .35)}" stroke="${dk(c, .4)}" stroke-width=".8"/>
        <path d="M${-w / 2 + 3},${-h / 4} Q0,${-h / 2 + 1} ${w / 2 - 3},${-h / 3}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${-w / 3},${h / 5} L${-w / 6},${h / 3} M${w / 8},${h / 6} L${w / 4},${h / 3}" stroke="${dk(c, .5)}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
}
// 鮭の切り身（白い脂の線）
export function salmon(p, x, y, s, r = 0, { c = '#f08d5c', cooked = true } = {}){
    const k = s / 40;
    const base = cooked ? '#ee9562' : c;
    return `<g ${T(x, y, r, k)}><path d="M-19,-8 C-12,-15 6,-15 16,-9 C21,-5 21,5 15,10 C5,15 -12,14 -19,7 C-22,3 -22,-4 -19,-8Z" fill="${p.g(base, .25, .3)}" stroke="${dk(base, .3)}" stroke-width=".9"/>
        <path d="M15,-9 C20,-5 20,5 15,10 C18,4 18,-4 15,-9Z" fill="#8f8f8f" opacity=".7"/>
        <path d="M-14,-9 Q-6,-2 -12,8 M-6,-12 Q2,-2 -4,11 M3,-12 Q10,-1 5,12 M10,-10 Q15,0 11,11" stroke="#fbe2cf" stroke-width="1.4" fill="none" opacity=".9"/>
        ${cooked ? '<path d="M-12,-6 Q-2,-10 8,-7" stroke="#c4612e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>' : ''}
        <path d="M-15,-6 Q-6,-11 4,-10" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 青魚の切り身（さば・ぶり）。skin を上に、焼き目つき
export function fishFillet(p, x, y, w, h, r = 0, { skin = '#5d6f80', flesh = '#d9b48c', stripes = true, char = .4, glazeC = null } = {}){
    const R = rng(p.id + 'fil' + x + y);
    let st = '';
    if (stripes) for (let i = 0; i < 6; i++){ const sx = -w / 2 + 6 + i * (w - 12) / 5; st += `<path d="M${f(sx)},${f(-h / 2 + 3)} Q${f(sx + 4)},${f(-h / 6)} ${f(sx - 1)},${f(h / 8)}" stroke="#2c3542" stroke-width="1.4" fill="none" opacity=".7"/>`; }
    let ch = '';
    for (let i = 0; i < 5; i++) ch += `<ellipse cx="${f(-w / 2 + 6 + R() * (w - 12))}" cy="${f(-h / 2 + 4 + R() * (h - 8))}" rx="${f(2 + R() * 3)}" ry="${f(1.2 + R() * 1.6)}" fill="#3b2412" opacity="${char * (.4 + R() * .5)}"/>`;
    return `<g ${T(x, y, r)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .32)}" fill="${p.g(flesh, .2, .3)}" stroke="${dk(flesh, .35)}" stroke-width=".8"/>
        <rect x="${-w / 2 + 1}" y="${-h / 2 + 1}" width="${w - 2}" height="${f(h * .62)}" rx="${f(h * .3)}" fill="${p.g(skin, .35, .25)}"/>
        ${st}${ch}
        ${glazeC ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .32)}" fill="${glazeC}" opacity=".5"/>` : ''}
        <path d="M${-w / 2 + 6},${-h / 2 + 4} Q0,${-h / 2 + 1} ${w / 2 - 8},${-h / 2 + 4}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 一尾の焼き魚（さんま・あじなど）。長さ L
export function wholeFish(p, x, y, L, r = 0, { skin = '#6f7f8f', belly = '#e4ddd0', char = .5 } = {}){
    const h = L * .16, R = rng(p.id + 'wf' + x);
    let ch = '';
    for (let i = 0; i < 7; i++) ch += `<ellipse cx="${f(-L * .35 + R() * L * .7)}" cy="${f(-h * .3 + R() * h * .5)}" rx="${f(2 + R() * 4)}" ry="${f(1 + R() * 1.8)}" fill="#3b2412" opacity="${f(char * (.35 + R() * .5))}"/>`;
    return `<g ${T(x, y, r)}>
        <path d="M${-L / 2},0 C${-L * .38},${-h} ${L * .25},${-h * 1.05} ${L * .38},${-h * .2} L${L / 2},${-h * .9} L${L / 2 - 3},0 L${L / 2},${h * .9} L${L * .38},${h * .2} C${L * .25},${h * 1.05} ${-L * .38},${h} ${-L / 2},0Z" fill="${p.g(belly, .2, .25)}" stroke="${dk(skin, .3)}" stroke-width=".9"/>
        <path d="M${-L / 2 + 2},-1 C${-L * .36},${-h} ${L * .25},${-h * 1.02} ${L * .37},${-h * .25} C${L * .2},${-h * .1} ${-L * .3},${-h * .05} ${-L / 2 + 2},-1Z" fill="${p.g(skin, .35, .3)}"/>
        <circle cx="${-L * .4}" cy="${-h * .18}" r="${f(h * .2)}" fill="#f4efe2" stroke="#3a3a3a" stroke-width=".8"/><circle cx="${-L * .4}" cy="${-h * .18}" r="${f(h * .09)}" fill="#222"/>
        <path d="M${-L * .3},${-h * .7} Q${-L * .28},0 ${-L * .3},${h * .7}" stroke="${dk(skin, .3)}" stroke-width="1" fill="none" opacity=".7"/>
        ${ch}
        <path d="M${-L * .25},${-h * .62} Q0,${-h * .92} ${L * .25},${-h * .55}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// えび（むき身、丸まった形）
export function shrimp(p, x, y, s, r = 0, { c = '#ef7a52' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-8,4 C-10,-4 -4,-10 3,-9 C9,-8 11,-2 9,3 C7,7 2,7 1,3 C0,-1 -3,0 -3,4 C-3,7 -6,8 -8,4Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/>
        <path d="M-5,-5 Q-3,-2 -6,0 M-1,-8 Q0,-4 -3,-2 M4,-8 Q4,-4 1,-2 M8,-4 Q6,-1 3,0" stroke="#fde1d3" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-8,4 L-11,7 L-7,8Z" fill="${dk(c, .1)}"/></g>`;
}
// あさり（殻つき）
export function clam(p, x, y, s, r = 0, { open = true } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-10,3 C-10,-6 -4,-10 0,-10 C4,-10 10,-6 10,3 C6,6 -6,6 -10,3Z" fill="${p.g('#b9a690', .3, .3)}" stroke="#6b5a48" stroke-width=".8"/>
        <path d="M-7,2 C-6,-5 -2,-8 0,-9 M-2,3 C-2,-4 0,-8 0,-9 M3,3 C3,-4 1,-7 0,-9 M7,2 C6,-4 2,-8 0,-9" stroke="#7d6a55" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-9,-1 Q-4,-3 0,-1 Q5,1 9,-2" stroke="#5a4636" stroke-width="2" fill="none" opacity=".35"/>
        ${open ? '<ellipse cx="0" cy="3.5" rx="6.5" ry="2.8" fill="#e9c08f" stroke="#b9875a" stroke-width=".6"/>' : ''}</g>`;
}
// 豆腐（さいの目、または大きめ）。w×h、soft で絹ごし
export function tofu(p, x, y, w, h = w, r = 0, { c = '#f7f2e4', tint = null } = {}){
    const base = tint || c;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .14)}" fill="${p.g(base, .35, .2)}" stroke="${dk(base, .18)}" stroke-width=".6"/></g>
        <path d="M${-w / 2 + 2},${-h / 2 + 2.5} L${w / 2 - 3},${-h / 2 + 2.5}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
}
// 厚揚げ（狐色の皮と白い断面）
export function atsuage(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .16)}" fill="${p.g('#c98b3a', .3, .3)}" stroke="#8a5622" stroke-width=".7"/></g>
        <path d="M${-s / 2 + 2},${s / 2 - 2} L${-s / 2 + 2},${-s / 6} Q${-s / 2 + 2},${-s / 2 + 2} ${-s / 6},${-s / 2 + 2} L${s / 2 - 2},${-s / 2 + 2} L${s / 2 - 2},${s / 2 - 2}Z" fill="${p.g('#f3ead6', .2, .15)}"/></g>`;
}
// 目玉焼き
export function friedEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'egg' + x);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.8)}><path d="${smooth(ring(19, 11, .18, R))}" fill="${p.rg('#ffffff', .1, .1)}" stroke="#e2dccd" stroke-width=".8"/></g>
        <path d="${smooth(ring(19, 11, .18, rng(p.id + 'egg' + x)))}" fill="none" stroke="#d9a25a" stroke-width="2" opacity=".35"/>
        <circle cx="2" cy="1" r="8.5" fill="${p.rg('#f8a51c', .3, .15, .35, .32)}" stroke="#d98a12" stroke-width=".8"/>
        <ellipse cx="-.5" cy="-2" rx="3" ry="1.8" fill="#fff" opacity=".75"/></g>`;
}
// ゆで卵の半分
export function eggHalf(p, x, y, s, r = 0, { yolk = '#f7b52d', stain = null } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.6)}><ellipse cx="0" cy="0" rx="10" ry="8" fill="${stain ? p.g(stain, .2, .25) : p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g>
        <circle cx=".5" cy=".5" r="4.6" fill="${p.rg(yolk, .25, .15)}"/><ellipse cx="-4.5" cy="-3.5" rx="2.5" ry="1.2" fill="#fff" opacity=".7"/></g>`;
}
// ふんわり炒り卵・半熟卵のかたまり
export function scrambled(p, x, y, s, { c = '#f8d354', seed = 1, n = 5 } = {}){
    const R = rng(p.id + 'scr' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = R() * s * .28, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = s * (.18 + R() * .14);
        out += `<path ${T(cx, cy)} d="${smooth(ring(rr, 8, .45, R))}" fill="${p.g(c, .35, .18)}" stroke="${dk(c, .18)}" stroke-width=".5"/>`;
    }
    return `<g ${p.sh(.6)}>${out}</g>`;
}
// うずらの卵
export function quailEgg(p, x, y, s, r = 0, { c = '#f4ead6' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .4)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .2)}" stroke-width=".5"/></g><ellipse cx="${f(-s * .15)}" cy="${f(-s * .14)}" rx="${f(s * .14)}" ry="${f(s * .07)}" fill="#fff" opacity=".8"/></g>`;
}
// ひき肉（そぼろ・麻婆の肉）: 小さな粒をばらまく
export function mince(p, x, y, s, { c = '#8a5a34', n = 30, seed = 1 } = {}){
    const R = rng(p.id + 'min' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1.3 + R() * 1.3, 5, .5, R))}" fill="${R() < .5 ? c : dk(c, .2)}"/>`; }
    return out;
}
// ハンバーグ（楕円のパティ）
export function patty(p, x, y, w, h, r = 0, { c = '#6b3b1f' } = {}){
    const R = rng(p.id + 'pat' + x);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.4, .12)}><ellipse rx="${w / 2}" ry="${h / 2}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g></g>
        <g ${p.crumb(.7)}><ellipse rx="${w / 2 - 3}" ry="${h / 2 - 3}" fill="${lt(c, .08)}" opacity=".6"/></g>
        <path d="M${-w * .32},${-h * .2} Q${-w * .1},${-h * .42} ${w * .2},${-h * .36}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 肉団子（つやのある丸）
export function meatball(p, x, y, s, { c = '#8c4a22', glossy = true } = {}){
    return `<g ${p.sh(.7)}><g ${p.rough(1.2, .2)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g></g>
        ${glossy ? `<ellipse cx="${f(x - s * .16)}" cy="${f(y - s * .18)}" rx="${f(s * .16)}" ry="${f(s * .09)}" fill="#fff" opacity=".7" transform="rotate(-30 ${f(x - s * .16)} ${f(y - s * .18)})"/>` : ''}`;
}
// ハム・ベーコン・ウインナー
export function ham(p, x, y, w, h, r = 0){ return `<g ${T(x, y, r)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1.2" fill="${p.g('#f1a3a6', .25, .2)}" stroke="#d27f84" stroke-width=".5"/></g>`; }
export function bacon(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1.5" fill="${p.g('#c4573f', .25, .25)}" stroke="#8c3727" stroke-width=".5"/>
        <rect x="${-w / 2 + 1}" y="${f(-h * .08)}" width="${w - 2}" height="${f(h * .22)}" rx="1" fill="#f3d9c0" opacity=".9"/></g>`;
}
export function sausage(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${f(-s * .22)}" width="${s}" height="${f(s * .44)}" rx="${f(s * .22)}" fill="${p.g('#c5653e', .3, .25)}" stroke="#8a3b20" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .1)} L${f(s * .3)},${f(-s * .1)}" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".6"/></g>`;
}
export function squidRing(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="${p.g('#f2e4d4', .2, .25)}" stroke-width="${f(s * .2)}"/><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="#c99b78" stroke-width=".6" opacity=".7"/></g>`;
}
export function octopus(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},${s / 3} Q0,${-s / 2} ${s / 2},${s / 3} Z" fill="${p.g('#c64a3f', .2, .2)}"/><path d="M${-s / 2.6},${s / 3} Q0,${-s / 5} ${s / 2.6},${s / 3} Z" fill="#f4e6dc"/>
        <circle cx="${f(-s * .18)}" cy="${f(-s * .02)}" r="${f(s * .07)}" fill="#e9c2b6"/><circle cx="${f(s * .12)}" cy="${f(-s * .08)}" r="${f(s * .06)}" fill="#e9c2b6"/></g>`;
}

// =========================================================
// 野菜・きのこ・海藻
// =========================================================
// じゃがいも（ひと口大）。boiled で煮た色
export function potato(p, x, y, s, r = 0, { c = '#ecc77c', seed = 1 } = {}){
    const R = rng(p.id + 'pot' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 7, .3, R, 1.1, .95, R());
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .55)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .28)}" stroke-width=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - 1.6, b * .62 - 1.6]), true, .55)}" fill="${lt(c, .22)}" opacity=".85"/>
        <path d="M-5,-4.5 Q-2,-6.5 2,-5.5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// にんじん（乱切り）
export function carrotChunk(p, x, y, s, r = 0, { c = '#ec7b2d' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-9,5 L-3,-8 Q4,-10 9,-4 L6,7 Q-2,9 -9,5Z" fill="${p.g(c, .28, .28)}" stroke="${dk(c, .3)}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="M-3,-8 Q4,-10 9,-4 L1,0Z" fill="${lt(c, .25)}"/>
        <path d="M2.5,-6.5 Q5,-6.6 6.2,-4.3" stroke="${lt(c, .45)}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
}
// にんじん（輪切り・いちょう切り）
export function carrotRound(p, x, y, s, { c = '#ef7f30', half = false, r = 0 } = {}){
    const d = half ? `M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0 Z` : null;
    return half ? `<g ${T(x, y, r)}><path d="${d}" fill="${p.g(c, .28, .25)}" stroke="${dk(c, .28)}" stroke-width=".6"/><path d="M${f(-s * .2)},0 A${f(s * .2)},${f(s * .2)} 0 0 1 ${f(s * .2)},0" fill="${lt(c, .3)}"/></g>`
        : `<g ${T(x, y, r)}><circle r="${s / 2}" fill="${p.g(c, .28, .25)}" stroke="${dk(c, .28)}" stroke-width=".6"/><circle r="${f(s * .22)}" fill="${lt(c, .3)}"/></g>`;
}
// 細切り（千切り）の野菜を何本か: にんじん・ごぼう・ピーマンなど
export function shreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, dir = null } = {}){
    const R = rng(p.id + 'shr' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = dir === null ? R() * Math.PI : dir + (R() - .5) * .6, L = s * len * (.55 + R() * .45);
        const cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .7;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * L * curve;
        const col = R() < .4 ? dk(c, .15) : R() < .5 ? lt(c, .15) : c;
        out += `<path d="M${f(cx - dx)},${f(cy - dy)} Q${f(cx - dy * bend / L * 2)},${f(cy + dx * bend / L * 2)} ${f(cx + dx)},${f(cy + dy)}" stroke="${col}" stroke-width="${f(w * (.8 + R() * .4))}" fill="none" stroke-linecap="round"/>`;
    }
    return out;
}
// 千切りキャベツの山
export function cabbageShreds(p, x, y, s, { seed = 1, sy = .8 } = {}){
    const R = rng(p.id + 'cab' + seed);
    let out = `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .25, R, 1, sy))}" fill="${p.rg('#eef6dc', .3, .1)}"/>`;
    for (let i = 0; i < Math.round(s * 1.6); i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .46, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * Math.PI, L = 7 + R() * 10;
        const col = R() < .35 ? '#fbfdf2' : R() < .6 ? '#d4e9a8' : R() < .85 ? '#b5d67f' : '#8fbf5a';
        const x1 = cx - Math.cos(ang) * L / 2, y1 = cy - Math.sin(ang) * L / 2;
        out += `<path d="M${f(x1)},${f(y1)} q${f(Math.cos(ang + 1.3) * 2.4)},${f(Math.sin(ang + 1.3) * 2.4)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}" stroke="${dk(col, .12)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/><path d="M${f(x1)},${f(y1)} q${f(Math.cos(ang + 1.3) * 2.4)},${f(Math.sin(ang + 1.3) * 2.4)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}" stroke="${col}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    }
    return `<g ${p.sh(.6)}>${out}</g>`;
}
// キャベツのざく切り・白菜のそぎ切り（葉の一片）
export function leafPiece(p, x, y, s, r = 0, { c = '#bcd98b', vein = '#eef6dc', seed = 1, cooked = false } = {}){
    const R = rng(p.id + 'lf' + seed + x + y);
    const k = s / 20, col = cooked ? mix(c, '#c9b36a', .25) : c;
    return `<g ${T(x, y, r, k)}><path d="${smooth(ring(9.5, 9, .35, R, 1.2, .8))}" fill="${p.g(col, .25, .2)}" stroke="${dk(col, .2)}" stroke-width=".6" opacity=".97"/>
        <path d="M-9,1 Q0,-1 9,0 M-3,0 L-6,-4 M2,-.5 L0,-5 M2,0 L4,4" stroke="${vein}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// 白菜の芯の部分（白いそぎ切り）
export function napaStem(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,-3 Q0,-6 10,-3 L9,3 Q0,6 -9,3Z" fill="${p.g('#f5f2e4', .2, .2)}" stroke="#d5d0b8" stroke-width=".6"/><path d="M-8,0 L8,0" stroke="#e1dcc4" stroke-width=".8"/><path d="M5,-4 Q10,-5 11,-1 L9,3Z" fill="#b8d98a" opacity=".9"/></g>`;
}
// 玉ねぎ（くし切り・煮たり炒めたもの）: 透けた三日月を2〜3枚重ねる
export function onion(p, x, y, s, r = 0, { c = '#ead39c', layers = 2 } = {}){
    const k = s / 20;
    let out = '';
    for (let i = 0; i < layers; i++){
        const o = i * 2.2, R1 = 10 - o, R2 = 7.6 - o;
        out += `<path d="M${-R1},${2 + o * .6} A${R1},${R1 * .82} 0 0 1 ${R1},${2 + o * .6} L${R2},${2.6 + o * .6} A${R2},${R2 * .72} 0 0 0 ${-R2},${2.6 + o * .6}Z" fill="${p.g(i ? lt(c, .15) : c, .3, .2)}" stroke="${dk(c, .25)}" stroke-width=".55" opacity=".9"/>`;
    }
    return `<g ${T(x, y, r, k)}>${out}<path d="M-7.5,-.5 A8.5,7 0 0 1 -1,-5.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// トマト（くし切り）
export function tomatoWedge(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,3 A10,9 0 0 1 10,3 Q0,7 -10,3Z" fill="${p.g('#e5382a', .3, .25)}" stroke="#a8221a" stroke-width=".6"/></g>
        <path d="M-7,3 A7,5.5 0 0 1 7,3 Q0,5.6 -7,3Z" fill="#f47058"/>
        <path d="M-4,1.5 Q-2.5,-1 -1,1.5 M1,1.5 Q2.5,-1 4,1.5" stroke="#f9d36b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M-6,-3 Q0,-6 5,-4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
export function cherryTomato(p, x, y, s){
    return `<g ${p.sh(.6)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#e5352a', .3, .25, .35, .32)}" stroke="#a51f17" stroke-width=".6"/></g>
        <path d="M${x - 2.5},${y - s / 2 + 1.5} l2.5,2 l2.5,-2 M${x},${y - s / 2 + 3.5} l0,-2.5" stroke="#4f8a2b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <ellipse cx="${f(x - s * .18)}" cy="${f(y - s * .1)}" rx="${f(s * .12)}" ry="${f(s * .07)}" fill="#fff" opacity=".8"/>`;
}
// きゅうり（輪切り・斜め切り）
export function cucumberSlice(p, x, y, s, r = 0, { oval = 1.3 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2 * oval)}" ry="${s / 2}" fill="#3f7d2e"/><ellipse rx="${f(s / 2 * oval - 1.2)}" ry="${s / 2 - 1.2}" fill="${p.rg('#d6eab0', .2, .12)}"/>
        <ellipse rx="${f(s / 4 * oval)}" ry="${f(s / 4)}" fill="#bcd98d"/>
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${f(Math.cos(i * 1.57 + .7) * s / 6 * oval)}" cy="${f(Math.sin(i * 1.57 + .7) * s / 6)}" rx="1" ry=".6" fill="#f2f7e2"/>`).join('')}</g>`;
}
// たたききゅうり（不規則な割れ）
export function cucumberChunk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'cuc' + seed + x);
    const pts = ring(s / 2, 7, .5, R, 1.3, .8);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .4)}" fill="${p.g('#d6eab0', .2, .15)}" stroke="#3d7a2c" stroke-width="${f(s * .12)}" stroke-linejoin="round"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .5, b * .5]), true, .4)}" fill="#c0dc90"/></g>`;
}
// ブロッコリー（小房）
export function broccoli(p, x, y, s, r = 0, { c = '#3f8a34' } = {}){
    const k = s / 20;
    const R = rng(p.id + 'bro' + x + y);
    let b = '';
    for (let i = 0; i < 9; i++){ const a = i / 9 * 6.28, d = i === 0 ? 0 : 4.5 + R() * 1.5; b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - 1)}" r="${f(3.4 + R() * 1.2)}" fill="${R() < .5 ? c : lt(c, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; }
    let dots = '';
    for (let i = 0; i < 14; i++){ dots += `<circle cx="${f(-7 + R() * 14)}" cy="${f(-8 + R() * 13)}" r=".7" fill="${lt(c, .4)}"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-2.5,4 L-3,11 Q0,12.5 3,11 L2.5,4Z" fill="#a9cf7c" stroke="#6e9a46" stroke-width=".5"/>${b}</g>${dots}</g>`;
}
// ピーマン・パプリカ（細切り or 乱切り）
export function pepperPiece(p, x, y, s, r = 0, { c = '#3f8f2f', strip = false } = {}){
    const k = s / 20;
    return strip
        ? `<g ${T(x, y, r, k)}><path d="M-10,-1.4 Q0,-3 10,-1.4 L10,1.4 Q0,0 -10,1.4Z" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M-8,-1.3 Q0,-2.4 8,-1.3" stroke="#fff" stroke-width=".7" fill="none" opacity=".7"/></g>`
        : `<g ${T(x, y, r, k)}><path d="M-9,-5 Q0,-9 9,-5 Q10,2 6,7 Q0,4 -6,7 Q-10,2 -9,-5Z" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M-6,-4 Q0,-7 5,-4.5" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// なす（皮つきの乱切り）
export function eggplant(p, x, y, s, r = 0, { flesh = '#e7d6a6', skin = '#4d2a5c', cooked = true } = {}){
    const k = s / 20, fl = cooked ? mix(flesh, '#a8743c', .35) : flesh;
    return `<g ${T(x, y, r, k)}><path d="M-10,0 Q-8,-8 0,-8.5 Q8,-8 10,0 Q8,8 0,8.5 Q-8,8 -10,0Z" fill="${p.g(skin, .3, .2)}" stroke="#2b1433" stroke-width=".6"/>
        <path d="M-7,-1 Q-5,-6 0,-6.2 Q5,-6 7,-1 Q5,5 0,5.4 Q-5,5 -7,-1Z" fill="${p.g(fl, .25, .2)}"/>
        <path d="M-4,-4 Q0,-5.6 4,-4" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// ほうれん草・小松菜など（ざく切りの青菜）
export function greens(p, x, y, s, { c = '#3d7d2a', seed = 1, n = 9, stems = '#9cc46a', sy = .8 } = {}){
    const R = rng(p.id + 'grn' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .7 * sy, a = (R() - .5) * 50 + (R() < .5 ? 0 : 180);
        out += R() < .45
            ? `<g ${T(cx, cy, a)}><rect x="-6" y="-1.4" width="12" height="2.8" rx="1.4" fill="${stems}" stroke="${dk(stems, .25)}" stroke-width=".4"/></g>`
            : `<g ${T(cx, cy, a, s / 50)}><path d="M-10,0 Q-4,-7 4,-5 Q10,-2 10,0 Q8,4 2,5 Q-6,6 -10,0Z" fill="${p.g(R() < .5 ? c : lt(c, .1), .25, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M-9,0 Q0,-1 9,0" stroke="${lt(c, .35)}" stroke-width=".8" fill="none"/></g>`;
    }
    return `<g ${p.sh(.6)}>${out}</g>`;
}
// 長ねぎ（斜め切り）・小口ねぎ
export function negiPiece(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .3)}" fill="${p.g('#eef3df', .25, .15)}" stroke="#bccb9a" stroke-width=".6"/><ellipse rx="${f(s * .32)}" ry="${f(s * .17)}" fill="none" stroke="#d1dcb4" stroke-width=".7"/></g>`;
}
export function scallions(p, x, y, s, { n = 14, seed = 1, c = '#5fa03a' } = {}){
    const R = rng(p.id + 'scl' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="1.9" fill="none" stroke="${R() < .6 ? c : lt(c, .3)}" stroke-width="1.2"/>`; }
    return out;
}
// しいたけ（かさを上に、飾り切り）
export function shiitake(p, x, y, s, r = 0, { cross = true } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="${p.rg('#7a4b2b', .25, .3, .35, .32)}" stroke="#4a2b16" stroke-width=".6"/></g>
        ${cross ? `<path d="M${f(-s * .28)},${f(-s * .28)} L${f(s * .28)},${f(s * .28)} M${f(s * .28)},${f(-s * .28)} L${f(-s * .28)},${f(s * .28)}" stroke="#ead9bd" stroke-width="${f(s * .1)}" stroke-linecap="round"/>` : ''}
        <ellipse cx="${f(-s * .18)}" cy="${f(-s * .2)}" rx="${f(s * .14)}" ry="${f(s * .07)}" fill="#fff" opacity=".35"/></g>`;
}
// しめじ（小さなかさと軸の房）
export function shimeji(p, x, y, s, r = 0, { n = 4, cap = '#8a6a4c' } = {}){
    const R = rng(p.id + 'shm' + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = r + (i - (n - 1) / 2) * 22 + (R() - .5) * 10, L = s * (.45 + R() * .2), rad = a * Math.PI / 180;
        const ex = x + Math.cos(rad) * L, ey = y + Math.sin(rad) * L;
        out += `<path d="M${x},${y} L${f(ex)},${f(ey)}" stroke="#efe6d4" stroke-width="${f(s * .12)}" stroke-linecap="round"/><path d="M${x},${y} L${f(ex)},${f(ey)}" stroke="#d9ccb2" stroke-width=".5"/>
            <circle cx="${f(ex)}" cy="${f(ey)}" r="${f(s * .15)}" fill="${p.rg(cap, .3, .3, .35, .32)}" stroke="${dk(cap, .3)}" stroke-width=".5"/>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}
// まいたけ（ひらひらした房）
export function maitake(p, x, y, s, r = 0){
    const R = rng(p.id + 'mai' + x + y);
    let out = '';
    for (let i = 0; i < 5; i++){ const a = (i / 5 - .5) * 1.8 + r * Math.PI / 180, d = s * .25; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, a * 57.3 + 90, s / 30)} d="M-6,0 Q-6,-6 0,-7 Q6,-6 6,0 Q3,2 0,1 Q-3,2 -6,0Z" fill="${p.g(R() < .5 ? '#6e5038' : '#86654a', .3, .25)}" stroke="#3f2b1b" stroke-width=".5"/>`; }
    return `<g ${p.sh(.5)}>${out}</g>`;
}
// エリンギ（縦切り）
export function eringi(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-3,10 L-3,-3 Q-8,-5 -7,-8 Q0,-12 7,-8 Q8,-5 3,-3 L3,10 Q0,11 -3,10Z" fill="${p.g('#efe2c6', .2, .25)}" stroke="#bfa47c" stroke-width=".6"/><path d="M-6,-7 Q0,-10 6,-7" stroke="#b08a5a" stroke-width="1.5" fill="none" opacity=".7"/></g>`;
}
// なめこ（つやのある小さな茶色）
export function nameko(p, x, y, s, { n = 12 } = {}){
    const R = rng(p.id + 'nam' + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 2.4 + R() * 1.4; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${p.rg('#c06a26', .3, .3, .35, .32)}"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .28)}" fill="#fff" opacity=".7"/>`; }
    return out;
}
// れんこん（穴のある輪切り）
export function lotus(p, x, y, s, r = 0, { c = '#e2c595' } = {}){
    const holes = [0, 1, 2, 3, 4, 5, 6].map(i => i === 6 ? `<circle r="${f(s * .08)}" fill="${dk(c, .3)}"/>` : `<ellipse cx="${f(Math.cos(i * 1.047) * s * .27)}" cy="${f(Math.sin(i * 1.047) * s * .27)}" rx="${f(s * .1)}" ry="${f(s * .08)}" fill="${dk(c, .3)}"/>`).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .45)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .28)}" stroke-width=".6"/></g>${holes}</g>`;
}
// ごぼう（斜め切り・ささがき）
export function gobo(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .26)}" fill="${p.g('#b48a5a', .2, .3)}" stroke="#6e4a2a" stroke-width=".7"/><ellipse rx="${f(s * .3)}" ry="${f(s * .13)}" fill="#d9c09a"/></g>`;
}
// こんにゃく（ちぎり・三角）
export function konnyaku(p, x, y, s, r = 0){
    const R = rng(p.id + 'kon' + x + y);
    let dots = '';
    for (let i = 0; i < 6; i++) dots += `<circle cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .5)}" r=".6" fill="#3d3a38"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 6, .35, R, 1.1, .85), true, .6)}" fill="${p.g('#8c8682', .25, .25)}" stroke="#5a5450" stroke-width=".6"/>${dots}</g>`;
}
// 大根（輪切り・いちょう。煮ると飴色）
export function daikon(p, x, y, s, r = 0, { c = '#f1ead8', simmered = false, half = false } = {}){
    const col = simmered ? '#d9a65e' : c;
    return half
        ? `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${-s / 2},${s / 6} A${s / 2},${s / 2} 0 0 1 ${s / 2},${s / 6} Z" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .2)}" stroke-width=".6"/></g></g>`
        : `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.rg(col, .2, .22)}" stroke="${dk(col, .22)}" stroke-width=".7"/></g>
            <ellipse rx="${f(s * .36)}" ry="${f(s * .32)}" fill="none" stroke="${lt(col, .25)}" stroke-width="1" opacity=".8"/>
            <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .36)} ${f(s * .12)},${f(-s * .34)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 大根おろし
export function grated(p, x, y, s){
    const R = rng(p.id + 'grt' + x);
    return `<g ${p.sh(.5)}><path ${T(x, y)} d="${smooth(ring(s / 2, 9, .25, R, 1.1, .85))}" fill="${p.rg('#f6f4ee', .2, .12)}"/></g>
        ${Array.from({ length: 10 }, () => `<circle cx="${f(x + (R() - .5) * s * .7)}" cy="${f(y + (R() - .5) * s * .55)}" r=".8" fill="#e2ddcf"/>`).join('')}`;
}
// かぼちゃ（くし形・煮物）
export function kabocha(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-10,4 Q-6,-7 2,-8 Q9,-8 10,-1 L8,6 Q0,9 -10,4Z" fill="${p.g('#f0a72c', .3, .25)}" stroke="#b77314" stroke-width=".6"/></g>
        <path d="M-10,4 Q0,9 8,6 Q0,7.5 -9,2Z" fill="#2f5b2a" stroke="#1f3e1c" stroke-width=".8"/>
        <path d="M-4,-4 Q1,-6.2 6,-5" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// さつまいも（皮つきの乱切り・大学芋は照り）
export function sweetPotato(p, x, y, s, r = 0, { glazeIt = false } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-10,2 L-4,-8 Q4,-9 9,-3 L6,7 Q-2,9 -10,2Z" fill="${p.g('#f2c64c', .3, .25)}" stroke="#a87a1c" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M6,7 Q-2,9 -10,2 L-8,1 Q-1,6.5 5,5Z" fill="#8a2e4a"/>
        ${glazeIt ? '<path d="M-4,-6 Q2,-8 7,-3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>' : ''}</g>`;
}
// 里芋（つるんとした丸）
export function satoimo(p, x, y, s, r = 0, { c = '#e9dcc4' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="${p.rg(c, .25, .25, .38, .35)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <ellipse cx="${f(-s * .15)}" cy="${f(-s * .14)}" rx="${f(s * .15)}" ry="${f(s * .08)}" fill="#fff" opacity=".75"/></g>`;
}
// もやし
export function sprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'spr' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s * .8, cy = y + (R() - .5) * s * .6, a = R() * Math.PI, L = 8 + R() * 8, b = (R() - .5) * 5;
        const x1 = cx - Math.cos(a) * L / 2, y1 = cy - Math.sin(a) * L / 2, x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        out += `<path d="M${f(x1)},${f(y1)} Q${f(cx + b)},${f(cy - b)} ${f(x2)},${f(y2)}" stroke="#f7f4e6" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M${f(x1)},${f(y1)} Q${f(cx + b)},${f(cy - b)} ${f(x2)},${f(y2)}" stroke="#d8d2b8" stroke-width=".5" fill="none"/><ellipse cx="${f(x2)}" cy="${f(y2)}" rx="1.7" ry="1.2" fill="#e8d36a"/>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}
// わかめ
export function wakame(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wak' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 9, .5, R, 1.3, .7))}" fill="#2f5a2a" opacity=".88"/><path d="M${f(-s * .35)},0 Q0,${f(-s * .1)} ${f(s * .35)},0" stroke="#5c8a45" stroke-width="1" fill="none" opacity=".8"/></g>`;
}
// 白菜キムチ
export function kimchi(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'kim' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 8, .35, R, 1.25, .75))}" fill="${p.g('#d9502c', .25, .25)}" stroke="#9a2f17" stroke-width=".6"/>
        <path d="M${f(-s * .3)},${f(s * .05)} Q0,${f(-s * .12)} ${f(s * .32)},${f(s * .05)}" stroke="#f3c28a" stroke-width="${f(s * .12)}" fill="none" stroke-linecap="round" opacity=".7"/>
        ${Array.from({ length: 4 }, () => `<circle cx="${f((R() - .5) * s * .7)}" cy="${f((R() - .5) * s * .4)}" r=".7" fill="#7a1a0c"/>`).join('')}</g>`;
}
// 油揚げ（短冊）
export function aburaage(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1.4" fill="${p.g('#d9a04a', .25, .25)}" stroke="#9c6a26" stroke-width=".5"/><path d="M${-w / 2 + 1},${-h / 4} L${w / 2 - 1},${-h / 4}" stroke="#f4d69a" stroke-width=".7" opacity=".8"/></g>`;
}
// ひじき（黒い短い粒）
export function hijiki(p, x, y, s, { n = 40, seed = 1 } = {}){
    const R = rng(p.id + 'hij' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .85, ang = R() * 180; out += `<rect ${T(cx, cy, ang)} x="-2.8" y="-.9" width="5.6" height="1.8" rx=".9" fill="${R() < .5 ? '#2a2420' : '#3d342c'}"/>`; }
    return out;
}
// ごま・かつお節・のり・紅しょうが・針しょうが・大葉・三つ葉・レモン・すだち・梅干し・唐辛子
export function sesame(p, x, y, s, { n = 14, c = '#f3e7c6', seed = 1 } = {}){
    const R = rng(p.id + 'ses' + seed + x);
    return Array.from({ length: n }, () => { const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .8; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.2" ry=".7" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".25"/>`; }).join('');
}
export function bonito(p, x, y, s, { n = 10 } = {}){
    const R = rng(p.id + 'bon' + x);
    return Array.from({ length: n }, () => `<path ${T(x + (R() - .5) * s, y + (R() - .5) * s * .7, R() * 360)} d="M-3,-1.5 Q0,-3 3,-1 Q2,2 -2,1.8Z" fill="${R() < .5 ? '#e9b8a0' : '#d99c80'}" opacity=".95"/>`).join('');
}
export function noriStrips(p, x, y, s, { n = 10 } = {}){
    const R = rng(p.id + 'nor' + x);
    return Array.from({ length: n }, () => `<rect ${T(x + (R() - .5) * s, y + (R() - .5) * s * .6, R() * 180)} x="-3.5" y="-.6" width="7" height="1.2" fill="#1f2a1c"/>`).join('');
}
export function beniShoga(p, x, y, s){
    return `<g ${p.sh(.4)}>${shreds(p, x, y, s, { c: '#d9304b', n: 12, w: 1.4, len: .7, seed: 9 })}</g>`;
}
export function gingerShreds(p, x, y, s){ return shreds(p, x, y, s, { c: '#f2df9c', n: 9, w: 1.1, len: .8, seed: 4 }); }
export function shiso(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M0,-10 L3,-7 L6,-6 L7,-2 L9,1 L7,4 L5,8 L0,10 L-5,8 L-7,4 L-9,1 L-7,-2 L-6,-6 L-3,-7Z" fill="${p.g('#3f8a33', .25, .25)}" stroke="#2a5f22" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M0,-9 L0,9 M0,-3 L-5,-6 M0,-3 L5,-6 M0,2 L-6,0 M0,2 L6,0 M0,6 L-4,6 M0,6 L4,6" stroke="#7cb85c" stroke-width=".7" fill="none"/></g>`;
}
export function mitsuba(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M0,10 L0,0" stroke="#8cbf5c" stroke-width="1.4"/>${[-50, 0, 50].map(a => `<path transform="rotate(${a})" d="M0,0 Q-4,-5 0,-9 Q4,-5 0,0Z" fill="#4f9a3a" stroke="#2f6a22" stroke-width=".5"/>`).join('')}</g>`;
}
export function lemon(p, x, y, s, r = 0, { c = '#f6d44a', rind = '#e3b51f' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Z" fill="${rind}"/></g><path d="M-8.4,2 A8.4,7.4 0 0 1 8.4,2 Z" fill="${lt(c, .35)}"/>
        ${[-60, -30, 0, 30, 60].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4.6" stroke="#fff6c6" stroke-width=".9"/>`).join('')}</g>`;
}
export function sudachi(p, x, y, s){
    return `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="#4f8f2f"/></g><circle cx="${x}" cy="${y}" r="${f(s / 2 - 1.6)}" fill="#e9efb0"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${x},${y} L${f(x + Math.cos(i * 1.047) * (s / 2 - 2))},${f(y + Math.sin(i * 1.047) * (s / 2 - 2))}" stroke="#fdfde8" stroke-width=".8"/>`).join('')}`;
}
export function umeboshi(p, x, y, s){
    return `<g ${p.sh(.6)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#c42c35', .3, .3, .35, .32)}" stroke="#7e1420" stroke-width=".6"/></g>
        <path d="M${x - s * .25},${y} Q${x - s * .1},${y - s * .15} ${x},${y} T${x + s * .25},${y}" stroke="#8e1a24" stroke-width=".8" fill="none" opacity=".7"/>
        <ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .18)}" rx="${f(s * .13)}" ry="${f(s * .07)}" fill="#fff" opacity=".7"/>`;
}
export function chiliThreads(p, x, y, s){ return shreds(p, x, y, s, { c: '#d42a1c', n: 7, w: .8, len: .9, seed: 2, curve: .6 }); }
export function corn(p, x, y, s, { n = 12 } = {}){
    const R = rng(p.id + 'crn' + x);
    return Array.from({ length: n }, () => { const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7; return `<rect x="${f(cx - 1.6)}" y="${f(cy - 1.4)}" width="3.2" height="2.8" rx="1" fill="${p.g('#f6cf3a', .3, .2)}" stroke="#c99a12" stroke-width=".3"/>`; }).join('');
}
export function cheese(p, x, y, s, { seed = 1, browned = .5 } = {}){
    const R = rng(p.id + 'chs' + seed);
    let out = `<path ${T(x, y)} d="${smooth(ring(s / 2, 12, .3, R, 1, .85))}" fill="${p.rg('#f6d97c', .2, .15)}"/>`;
    for (let i = 0; i < 9; i++) out += `<path ${T(x + (R() - .5) * s * .7, y + (R() - .5) * s * .55)} d="${smooth(ring(2 + R() * 4, 6, .5, R))}" fill="${R() < .5 ? '#d48a2c' : '#b8651c'}" opacity="${f(browned * (.5 + R() * .5))}"/>`;
    return out;
}
// 麺（スパゲッティ・焼きそば・うどん・中華麺）。渦の線を重ねる
export function noodles(p, x, y, s, { c = '#f2d48a', w = 2.4, n = 26, seed = 1, sy = .9, outline = null } = {}){
    const R = rng(p.id + 'ndl' + seed);
    const ol = outline || dk(c, .25);
    let out = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.25 + R() * .72), a0 = R() * 6.28, sweep = 1.2 + R() * 2.2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const d = smooth(pts, false);
        out += `<path d="${d}" stroke="${ol}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${R() < .3 ? lt(c, .2) : c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    }
    return `<g ${p.sh(.8)}>${out}</g>`;
}
// マカロニ
export function macaroni(p, x, y, s, r = 0, { c = '#f1d58c' } = {}){
    return `<g ${T(x, y, r, s / 12)}><path d="M-5,2 A5,5 0 0 1 5,2" stroke="${dk(c, .25)}" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M-5,2 A5,5 0 0 1 5,2" stroke="${c}" stroke-width="3.4" fill="none" stroke-linecap="round"/><ellipse cx="5" cy="2" rx="1.6" ry="1.1" fill="${dk(c, .3)}"/></g>`;
}
// たけのこ（薄切り）
export function bamboo(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-9,4 Q-8,-6 0,-9 Q8,-6 9,4 Z" fill="${p.g('#f0dfa6', .25, .25)}" stroke="#bea568" stroke-width=".6"/><path d="M-6,3 L-3,-4 M-1,3 L0,-6 M4,3 L3,-4" stroke="#d9c584" stroke-width=".8"/></g>`;
}
// ゴーヤ（半月切り）
export function goya(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,2 A10,9 0 0 1 10,2 L6.5,2 A6.5,5.5 0 0 0 -6.5,2Z" fill="${p.g('#5aa13c', .25, .25)}" stroke="#2f6a22" stroke-width=".6"/>${[-7, -4, 0, 4, 7].map(a => `<circle cx="${a}" cy="${f(-Math.sqrt(Math.max(0, 81 - a * a)) * .82 + 2.6)}" r="1" fill="#7cc35a"/>`).join('')}</g>`;
}
// 春雨・しらたき（細い透明の麺）
export function threads(p, x, y, s, { c = '#e8e6df', n = 16, seed = 1, w = 1.2 } = {}){
    const R = rng(p.id + 'thr' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const pts = Array.from({ length: 5 }, () => [x + (R() - .5) * s, y + (R() - .5) * s * .7]);
        out += `<path d="${smooth(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".85"/>`;
    }
    return out;
}
// 天かす・パン粉の散らし
export function crumbs(p, x, y, s, { n = 18, c = '#e7b45a' } = {}){
    const R = rng(p.id + 'crm' + x);
    return Array.from({ length: n }, () => `<circle cx="${f(x + (R() - .5) * s)}" cy="${f(y + (R() - .5) * s * .8)}" r="${f(.8 + R() * 1.2)}" fill="${R() < .5 ? c : lt(c, .3)}"/>`).join('');
}
// ソースやマヨの線（ジグザグ）
export function drizzle(p, x, y, w, h, { c = '#fffbe8', width = 1.8, n = 5, r = 0 } = {}){
    let d = `M${-w / 2},${-h / 2}`;
    for (let i = 1; i <= n; i++) d += ` L${f(-w / 2 + i * w / n)},${i % 2 ? h / 2 : -h / 2}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .15)}" stroke-width="${width + .8}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
// 青のり・粉チーズ・黒こしょう
export function sprinkle(p, x, y, s, { c = '#3f7d2a', n = 20, r = .7 } = {}){
    const R = rng(p.id + 'spk' + x + y + c);
    return Array.from({ length: n }, () => { const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; return `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(r * (.6 + R() * .7))}" fill="${c}"/>`; }).join('');
}
// パセリ
export function parsley(p, x, y, s){
    return `<g ${p.sh(.4)}>${Array.from({ length: 6 }, (_, i) => `<circle cx="${f(x + Math.cos(i) * s * .22)}" cy="${f(y + Math.sin(i * 1.7) * s * .2)}" r="${f(s * .2)}" fill="${i % 2 ? '#3d8a2c' : '#4fa03a'}"/>`).join('')}</g>`;
}
// オクラ（輪切りの星形）
export function okra(p, x, y, s){
    const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28 - 1.57, rr = i % 2 ? s * .36 : s / 2; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y)}><path d="${smooth(pts, true, .3)}" fill="#4e9a34" stroke="#2f6a22" stroke-width=".5"/><path d="${smooth(pts.map(([a, b]) => [a * .62, b * .62]), true, .3)}" fill="#d8edb0"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${f(Math.cos(i * 1.257 - 1.57) * s * .17)}" cy="${f(Math.sin(i * 1.257 - 1.57) * s * .17)}" r="${f(s * .06)}" fill="#f6f8e6"/>`).join('')}</g>`;
}
// 長いも（角切り）
export function yamCube(p, x, y, s, r = 0){ return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s * .8}" rx="2" fill="${p.g('#f6f1e2', .2, .18)}" stroke="#d6cdb5" stroke-width=".5"/></g></g>`; }
// さやいんげん・絹さや
export function greenBean(p, x, y, s, r = 0, { c = '#4f9a34' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-s / 2}" y="-1.8" width="${s}" height="3.6" rx="1.8" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>`;
}
export function snowPea(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q0,-6 10,0 Q0,5 -10,0Z" fill="${p.g('#69b043', .3, .25)}" stroke="#3a7524" stroke-width=".6"/>${[-5, 0, 5].map(a => `<ellipse cx="${a}" cy="0" rx="1.8" ry="1.2" fill="#8bc960" opacity=".8"/>`).join('')}</g>`;
}
// 香味の黄色い粒（コーン・溶き卵の帯など）
export function eggRibbons(p, x, y, s, { n = 9, seed = 1 } = {}){
    const R = rng(p.id + 'erb' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const pts = Array.from({ length: 4 }, () => [x + (R() - .5) * s, y + (R() - .5) * s * .8]); out += `<path d="${smooth(pts, false)}" stroke="#f6d35a" stroke-width="${f(2 + R() * 2.4)}" fill="none" stroke-linecap="round" opacity=".95"/>`; }
    return out;
}

export { T, f };
