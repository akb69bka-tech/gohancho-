// World edition: Turkey (tr)
import * as K from '../kit.mjs';
const { T, f, smooth, ring, rng, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// ---------- この国のファイル専用の部品（tr〜） ----------
const trBlur = (p, s = 2) => `filter="url(#${p.def('trbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const TURQ = '#1f8a8f', COBALT = '#23468c', TRED = '#c0362c';

// 白い皿（トルコ石色の縁）
function trPlate(p, { rim = TURQ } = {}){
    return K.plate(p, { rim }) + `<circle cx="100" cy="100" r="87" fill="none" stroke="${COBALT}" stroke-width=".8" opacity=".7"/>`;
}
// イズニック風の白い鉢: コバルトとトルコ石の帯、赤い点の小花
function trIznikBowl(p, { R = 92, lip = .84, inside = '#fbf8f1', n = 12 } = {}){
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
// 銅のサハン（両手の小鍋。外は銅、内はすず引き）
function trSahan(p, { R = 80, inner = '#cfcac0' } = {}){
    const handle = x => `<g ${p.sh(1)}><path d="M${x - 9},88 Q${x},84 ${x + 9},88 L${x + 9},112 Q${x},116 ${x - 9},112Z" fill="${p.g('#b8622e', .3, .3)}" stroke="#7a3814" stroke-width=".8"/></g><ellipse cx="${x}" cy="100" rx="3.4" ry="7" fill="#5a2a10" opacity=".6"/>`;
    return handle(100 - R - 2) + handle(100 + R + 2) +
        `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R + 4}" fill="${p.rg('#c4703a', .3, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R + 2}" fill="none" stroke="#e8a06a" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${R - 4}" fill="${p.rg(inner, .2, .25, .6, .62)}"/>
        <path d="M${100 - R * .7},${100 - R * .55} A${R * .9},${R * .9} 0 0 1 ${100 - R * .1},${100 - R * .9}" stroke="#ffe0c0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// 黒い鉄のフライパン（柄は右）
function trPan(p, { cx = 92, R = 84 } = {}){
    return `<g ${p.sh(1.8)}><rect x="${cx + R - 6}" y="94" width="${200 - cx - R + 4}" height="12" rx="5" fill="${p.g('#3a3532', .2, .3)}"/>
        <circle cx="${cx}" cy="100" r="${R}" fill="${p.rg('#3e3936', .18, .3, .35, .3)}"/></g>
        <circle cx="${cx}" cy="100" r="${R - 6}" fill="${p.rg('#2a2523', .12, .2, .6, .62)}"/>
        <path d="M${cx - R * .72},${100 - R * .5} A${R * .88},${R * .88} 0 0 1 ${cx - R * .15},${100 - R * .86}" stroke="#8a8480" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 耐熱ガラスの角皿（ボルジャム）
function trGlassDish(p, { w = 186, h = 140 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#d9e8e6" opacity=".9"/></g>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="none" stroke="#a9c6c3" stroke-width="2"/>
        <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="13" fill="${p.rg('#cfe0dc', .2, .1, .5, .5)}" stroke="#b5ceca" stroke-width="1.2"/>
        <path d="M${x + 14},${y + 34} Q${x + 14},${y + 14} ${x + 34},${y + 14}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 柳のかご
function trBasket(p, { rx = 92, ry = 78, c = '#c99a58' } = {}){
    let weave = '';
    for (let k = 0; k < 3; k++) weave += `<ellipse cx="100" cy="100" rx="${f(rx - 3 - k * 4.2)}" ry="${f(ry - 3 - k * 4.2)}" fill="none" stroke="${k % 2 ? lt(c, .2) : dk(c, .12)}" stroke-width="4" stroke-dasharray="7 3" stroke-dashoffset="${k * 5}"/>`;
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(c, .25, .3, .38, .32)}"/></g>${weave}
        <ellipse cx="100" cy="100" rx="${rx - 14}" ry="${ry - 14}" fill="${p.rg(dk(c, .25), .1, .25, .6, .6)}"/>`;
}
// トルコのパン（ソムン）の厚切り: 金茶色の薄い皮、真っ白でふわふわの生地
function trBreadSlice(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'trbs' + seed);
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, cx = Math.cos(a), cy = Math.sin(a); return [Math.sign(cx) * Math.abs(cx) ** .7 * w / 2 * (1 + (R() - .5) * .04), Math.sign(cy) * Math.abs(cy) ** .8 * h / 2 * (cy < 0 ? 1.08 : 1)]; });
    const shape = smooth(pts);
    let holes = '';
    for (let i = 0; i < 20; i++){ const hx = (R() - .5) * w * .72, hy = (R() - .5) * h * .66; holes += `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(.7 + R() * 1.8)}" ry="${f(.5 + R() * 1.1)}" fill="#d9c49a" opacity=".8"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${shape}" fill="${p.g('#c98634', .25, .3)}" stroke="#8a5220" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .94, b * .9 + 1]))}" fill="${p.rg('#f6e9cc', .35, .12, .4, .4)}"/>${holes}
        <path d="M${f(-w * .3)},${f(-h * .3)} Q0,${f(-h * .44)} ${f(w * .28)},${f(-h * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// ソムンの丸パン（上から: 金茶色の皮に斜めの切り込み）
function trLoaf(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><ellipse rx="${w / 2}" ry="${h / 2}" fill="${p.g('#d08a38', .35, .35)}" stroke="#8a5220" stroke-width=".9"/></g>
        ${[-.25, 0, .25].map(t => `<path d="M${f(w * t - 6)},${f(-h * .3)} Q${f(w * t)},0 ${f(w * t + 6)},${f(h * .3)}" stroke="#f3d39a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${f(w * t - 6)},${f(-h * .3)} Q${f(w * t)},0 ${f(w * t + 6)},${f(h * .3)}" stroke="#a8682a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`).join('')}
        <path d="M${f(-w * .36)},${f(-h * .2)} Q${f(-w * .1)},${f(-h * .45)} ${f(w * .25)},${f(-h * .36)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 小さな粒（米・ひき肉・ハーブの刻み）。同じ色は1本のpathにまとめる
function trGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, long = 1 } = {}){
    const R = rng(p.id + 'trgr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.7 + R() * .6), k = Math.floor(R() * cols.length), a0 = R() * 6.28;
        ds[k] += 'M' + Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28, ux = Math.cos(aa) * rr * long, uy = Math.sin(aa) * rr * .7; return `${f(gx + ux * Math.cos(a0) - uy * Math.sin(a0))},${f(gy + ux * Math.sin(a0) + uy * Math.cos(a0))}`; }).join('L') + 'Z';
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .22)}" stroke-width=".45" stroke-linejoin="round"/>`).join('');
}
// 白いんげん豆（ソースの中のつやのある豆）
function trBean(p, x, y, s, r = 0, { c = '#f1e2c2' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .34)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/><ellipse cx="${f(s * .05)}" cy="${f(s * .2)}" rx="${f(s * .3)}" ry="${f(s * .1)}" fill="#c8552e" opacity=".35"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .1)}" rx="${f(s * .16)}" ry="${f(s * .07)}" fill="#fff" opacity=".85"/></g>`;
}
// 細長い青唐辛子（シヴリ・ビベル）
function trSivri(p, x, y, L, r = 0, { c = '#5a9a2e', bend = 4, cooked = false } = {}){
    const col = cooked ? mix(c, '#8a8a2a', .3) : c;
    const w = L * .13;
    const d = `M${-L / 2},0 C${f(-L * .2)},${f(-w - bend)} ${f(L * .25)},${f(-w * .7 - bend)} ${L / 2},${f(-bend * .4)} C${f(L * .25)},${f(w * .5 - bend)} ${f(-L * .2)},${f(w - bend)} ${-L / 2},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${d}" fill="${p.g(col, .35, .25)}" stroke="${dk(col, .35)}" stroke-width=".7"/></g>
        <path d="M${f(-L * .38)},${f(-w * .4 - bend * .5)} Q${f(-L * .05)},${f(-w * .9 - bend)} ${f(L * .3)},${f(-w * .5 - bend * .8)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${-L / 2},0 q${f(-w * .6)},${f(-w * .2)} ${f(-w * 1.2)},${f(-w * .9)}" stroke="#3f6a1c" stroke-width="${f(w * .55)}" fill="none" stroke-linecap="round"/>
        <ellipse cx="${f(-L / 2 + w * .3)}" cy="0" rx="${f(w * .6)}" ry="${f(w * .8)}" fill="#4a7a22"/></g>`;
}
// 輪切りのトマト
function trTomatoSlice(p, x, y, s, r = 0){
    const h = s / 2;
    const rooms = [0, 1, 2].map(i => `<g transform="rotate(${i * 120 + 30})"><path d="M${f(h * .15)},${f(-h * .12)} Q${f(h * .64)},${f(-h * .56)} ${f(h * .7)},0 Q${f(h * .64)},${f(h * .56)} ${f(h * .15)},${f(h * .12)}Z" fill="#f2694c"/><ellipse cx="${f(h * .42)}" cy="-1.2" rx="1.1" ry=".7" fill="#f7d36a"/><ellipse cx="${f(h * .42)}" cy="1.4" rx="1.1" ry=".7" fill="#f7d36a"/></g>`).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${h}" fill="${p.g('#de3a2a', .25, .25)}" stroke="#a51f17" stroke-width=".6"/></g><circle r="${f(h * .86)}" fill="#e8483a"/>${rooms}<path d="M${f(-h * .55)},${f(-h * .45)} Q${f(-h * .1)},${f(-h * .8)} ${f(h * .35)},${f(-h * .6)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// カルヌヤルク: 縞にむいた揚げなすを舟形に開き、ひき肉を詰めてトマトとししとうをのせる
function trKarni(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'trkn' + seed);
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.28, cx = Math.cos(a), cy = Math.sin(a); return [cx * L / 2, cy * W / 2 * (cx > 0 ? 1 - cx * .25 : 1)]; });
    const shape = smooth(pts);
    const cl = p.def('trknc' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    let stripes = '';
    for (let i = 0; i < 7; i++){ const sx = -L * .42 + i * L * .13; stripes += `<path d="M${f(sx)},${f(-W)} Q${f(sx + 4)},0 ${f(sx)},${f(W)}" stroke="#d9b876" stroke-width="${f(L * .045)}" fill="none" opacity=".85"/>`; }
    const fill = smooth(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.28; return [Math.cos(a) * L * .38 - L * .03, Math.sin(a) * W * .27]; }));
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${shape}" fill="${p.g('#3c1d42', .3, .25)}" stroke="#22102a" stroke-width=".9"/></g>
        <g clip-path="url(#${cl})">${stripes}<rect x="${-L / 2}" y="${f(W * .1)}" width="${L}" height="${W}" fill="#2a1430" opacity=".35"/></g>
        <path d="M${f(L / 2 - 2)},0 q8,-2 12,-8 q2,6 -3,10 q4,3 -2,6 q-4,-4 -7,-8Z" fill="${p.g('#6a8a3a', .3, .3)}" stroke="#3e5a1e" stroke-width=".6"/>
        <path d="${fill}" fill="#c9a26a" opacity=".9"/>
        <g ${p.sh(.6)}><g ${p.rough(1.6, .2)}><path d="${smooth(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.28; return [Math.cos(a) * L * .35 - L * .03, Math.sin(a) * W * .22]; }))}" fill="${p.g('#8a4a26', .25, .3)}"/></g></g>
        ${trGrains(p, -L * .03, 0, L * .62, { cols: ['#7a3a1c', '#9c5a30', '#5e2c14'], n: 46, size: 1.8, seed, sy: W * .4 / (L * .62) })}
        ${trTomatoSlice(p, -L * .12, 0, W * .5, R() * 90)}
        ${trSivri(p, L * .12, -1, L * .42, 4, { c: '#4f9a2c', bend: 2, cooked: true })}
        <path d="M${f(-L * .4)},${f(-W * .32)} Q${f(-L * .1)},${f(-W * .5)} ${f(L * .25)},${f(-W * .4)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// コーンミールをまぶして揚げたカタクチイワシ（頭なし、尾びれつき）
function trAnchovy(p, x, y, L, r = 0, { seed = 1 } = {}){
    const w = L * .24, R = rng(p.id + 'tran' + seed + x);
    const c = R() < .5 ? '#d99a3a' : '#cf8e30';
    const body = `M${-L / 2},${f(-w * .45)} Q${f(-L * .1)},${f(-w * .62)} ${f(L * .28)},${f(-w * .3)} L${f(L * .36)},${f(-w * .1)} L${L / 2},${f(-w * .55)} L${f(L * .46)},0 L${L / 2},${f(w * .55)} L${f(L * .36)},${f(w * .1)} L${f(L * .28)},${f(w * .3)} Q${f(-L * .1)},${f(w * .62)} ${-L / 2},${f(w * .45)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${body}" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .45)}" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M${f(L * .36)},${f(-w * .1)} L${L / 2},${f(-w * .55)} L${f(L * .46)},0 L${L / 2},${f(w * .55)} L${f(L * .36)},${f(w * .1)}Z" fill="${dk(c, .35)}" opacity=".8"/>
        <path d="M${f(-L * .44)},${f(-w * .1)} L${f(L * .25)},${f(-w * .05)}" stroke="${dk(c, .3)}" stroke-width=".7" opacity=".55"/>
        ${Array.from({ length: 5 }, () => `<circle cx="${f((R() - .5) * L * .6)}" cy="${f((R() - .5) * w * .6)}" r=".7" fill="#f6d68a"/>`).join('')}
        <path d="M${f(-L * .4)},${f(-w * .25)} Q${f(-L * .1)},${f(-w * .42)} ${f(L * .15)},${f(-w * .28)}" stroke="#fff3d0" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// レモンの輪切り
function trLemonRound(p, x, y, s){
    return `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="#f2cf3a" stroke="#c9a114" stroke-width=".6"/></g><circle cx="${x}" cy="${y}" r="${f(s / 2 - 1.8)}" fill="#fbeea0"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${x},${y} L${f(x + Math.cos(i * .785) * (s / 2 - 2.4))},${f(y + Math.sin(i * .785) * (s / 2 - 2.4))}" stroke="#fffbe0" stroke-width="1"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.4" fill="#fffbe0"/>`;
}
// レモンのくし切り
function trLemonWedge(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 Q0,-8 10,0 Q0,4.5 -10,0Z" fill="${p.g('#f2cf3a', .3, .2)}" stroke="#c9a114" stroke-width=".6"/></g>
        <path d="M-8.4,-.2 Q0,-6.2 8.4,-.2 Q0,2.4 -8.4,-.2Z" fill="#fbeea0"/>
        ${[-5, -2, 1.6, 5].map(a => `<path d="M${a},${f(-3.6 + Math.abs(a) * .35)} L${f(a * .8)},.8" stroke="#fff8d0" stroke-width=".7"/>`).join('')}</g>`;
}
// ルッコラの葉
function trRocket(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.4)}><path d="M-15,0 L-8,-2 L-6,-6 L-2,-3 L1,-7 L4,-3 L8,-6 L9,-2 L15,-1 L9,2 L8,6 L4,3 L1,7 L-2,3 L-6,6 L-8,2Z" fill="${p.g('#3f7f2a', .3, .25)}" stroke="#2a5a1a" stroke-width=".6" stroke-linejoin="round"/></g><path d="M-15,0 L14,-.5" stroke="#9cc46a" stroke-width=".9"/></g>`;
}
// マントゥ（小さな四角い包み: 4つの角を真ん中でつまんだ星形のひだ）
function trManti(p, x, y, s, r = 0, { c = '#f0deb4' } = {}){
    const h = s / 2;
    const body = `M0,${f(-h)} Q${f(h * .55)},${f(-h * .55)} ${h},0 Q${f(h * .55)},${f(h * .55)} 0,${h} Q${f(-h * .55)},${f(h * .55)} ${-h},0 Q${f(-h * .55)},${f(-h * .55)} 0,${f(-h)}Z`;
    return `<g ${T(x, y, r + 45)}><path d="${body}" fill="${p.rg(c, .3, .25, .4, .38)}" stroke="${dk(c, .35)}" stroke-width=".55" transform="scale(1.25)"/>
        <path d="M0,${f(-h * .9)} L0,${f(h * .9)} M${f(-h * .9)},0 L${f(h * .9)},0" stroke="${dk(c, .28)}" stroke-width=".7" opacity=".75"/>
        <circle r="${f(h * .2)}" fill="${dk(c, .1)}"/><path d="M${f(-h * .7)},${f(-h * .25)} Q${f(-h * .5)},${f(-h * .6)} ${f(-h * .2)},${f(-h * .7)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 赤いバター（唐辛子入り）を回しかけた筋と、唐辛子の粒
function trRedButter(p, x, y, s, { seed = 1, n = 8, op = .8 } = {}){
    const R = rng(p.id + 'trrb' + seed + x);
    let d = '';
    for (let i = 0; i < 2; i++){
        const a0 = R() * 6.28, rr = s * (.18 + i * .16);
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j * .55; return [x + Math.cos(a) * rr * (1 + (R() - .5) * .2), y + Math.sin(a) * rr * .85]; });
        d += smooth(pts, false);
    }
    let pools = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s * .4; pools += `<ellipse cx="${f(x + Math.cos(a) * dd)}" cy="${f(y + Math.sin(a) * dd)}" rx="${f(3 + R() * 4)}" ry="${f(2 + R() * 2.5)}" fill="#d9481c" opacity="${f(op * .7)}"/>`; }
    return `<g ${trBlur(p, .7)}><path d="${d}" stroke="#d9481c" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="${op}"/>${pools}</g><path d="${d}" stroke="#f08a4a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>` + K.sprinkle(p, x, y, s, { c: '#8a1a0a', n: Math.round(n * 3), r: .7 });
}
// 乾燥ミントの粒
function trMint(p, x, y, s, { n = 24, seed = 1 } = {}){
    return K.sprinkle(p, x, y, s, { c: '#5a7a34', n, r: .9 }) + K.sprinkle(p, x + 2, y + 1, s * .9, { c: '#7a9a48', n: Math.round(n / 2), r: .8 });
}
// ヨーグルトの面（不定形、とろり）
function trYogurt(p, x, y, s, { seed = 1, sy = .85, c = '#fbfaf3' } = {}){
    const R = rng(p.id + 'tryg' + seed + x);
    const pts = ring(s / 2, 11, .2, R, 1, sy);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(pts)}" fill="${p.rg(c, .2, .1, .38, .34)}" stroke="#e4e0d2" stroke-width=".7"/></g>
        <path ${T(x, y)} d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 角切り（トマト・きゅうり・ピーマン・じゃがいも）
function trDice(p, x, y, s, r = 0, { c = '#e5382a', skin = null, inner = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .92)}" rx="${f(s * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(skin || c, .3)}" stroke-width=".55"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        ${inner ? `<ellipse cx="0" cy="${f(-h * .1)}" rx="${f(s * .22)}" ry="${f(s * .16)}" fill="${inner}" opacity=".9"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .18)},${f(-s * .3)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`;
}
// 刻んだパセリ（イタリアンパセリの小片）
function trParsley(p, x, y, s, { n = 20, seed = 1 } = {}){
    const R = rng(p.id + 'trpa' + seed + x + y);
    const ds = ['', ''];
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1.4 + R() * 1.4; ds[R() < .5 ? 0 : 1] += 'M' + Array.from({ length: 6 }, (_, j) => { const aa = j / 6 * 6.28 + R(), r2 = rr * (j % 2 ? .55 : 1); return `${f(cx + Math.cos(aa) * r2)},${f(cy + Math.sin(aa) * r2)}`; }).join('L') + 'Z'; }
    return `<path d="${ds[0]}" fill="#3f8a2c" stroke="#2a6a1c" stroke-width=".4" stroke-linejoin="round"/><path d="${ds[1]}" fill="#5aa63c" stroke="#3a7a22" stroke-width=".4" stroke-linejoin="round"/>`;
}
// 具の配置（重なりすぎない）
function trSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('trspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
const trShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 油の粒
function trOil(p, x, y, s, { n = 12, c = '#e8642a', seed = 1, op = .6, rmax = 2.6 } = {}){
    const R = rng(p.id + 'troi' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = .9 + R() * rmax; d += `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr)} 0 1 0 ${f(2 * rr)},0`; h += `M${f(cx - rr * .5)},${f(cy - rr * .3)}l${f(rr * .4)},${f(-rr * .25)}`; }
    return `<path d="${d}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><path d="${h}" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;
}

// ご飯の山（e_rice_noodle の erRice を元にした、粒を1本ずつ描く版）
function trSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function trRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'trRice' + seed + x + y);
    const shape = trSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('trRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 煮込んだ牛肉の角切り
function trBeefChunk(p, x, y, s, r = 0, { c = '#8e4a2c', seed = 1 } = {}){
    const R = rng(p.id + 'trbc' + seed + x + y);
    const pts = [[-1, -.9], [.2, -1.05], [1, -.85], [1.05, .3], [.85, 1], [-.2, 1.05], [-1, .85], [-1.1, -.1]].map(([a, b]) => [a * s / 2 * (1 + (R() - .5) * .25), b * s * .42 * (1 + (R() - .5) * .25)]);
    return `<g ${T(x, y, r)}><g ${p.rough(2, .25)}><path d="${smooth(pts, true, .45)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .8 + 1, b * .7 + 1.5]), true, .45)}" fill="#b4441e" opacity=".35"/>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q${f(-s * .05)},${f(-s * .18)} ${f(s * .26)},${f(-s * .05)} M${f(-s * .2)},${f(s * .2)} Q${f(s * .05)},${f(s * .08)} ${f(s * .26)},${f(s * .18)}" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 炒めた鶏肉の角切り（白っぽい身に焼き色）
function trChickenCube(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'trck' + seed + x + y);
    const pts = [[-1, -1], [0, -1.1], [1, -.95], [1.05, 0], [.95, 1], [0, 1.05], [-1, .95], [-1.08, 0]].map(([a, b]) => [a * s / 2 * (1 + (R() - .5) * .2), b * s * .42 * (1 + (R() - .5) * .2)]);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .6)}" fill="${p.g('#e8c48c', .3, .28)}" stroke="#a8763e" stroke-width=".7"/></g>
        <g ${trBlur(p, 1.1)}><ellipse cx="${f((R() - .5) * s * .3)}" cy="${f((R() - .5) * s * .2)}" rx="${f(s * .26)}" ry="${f(s * .16)}" fill="#c07a32" opacity=".75"/><ellipse cx="${f(s * .25)}" cy="${f(s * .2)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="#a8642a" opacity=".7"/><ellipse cx="${f(-s * .28)}" cy="${f(s * .22)}" rx="${f(s * .14)}" ry="${f(s * .1)}" fill="#c9883e" opacity=".6"/></g>
        <path d="M${f(-s * .32)},${f(-s * .05)} L${f(s * .3)},${f(-s * .1)} M${f(-s * .28)},${f(s * .14)} L${f(s * .26)},${f(s * .1)}" stroke="#d9b888" stroke-width=".7" opacity=".7"/>
        <path d="M${f(-s * .34)},${f(-s * .24)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .16)},${f(-s * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ふんわり固まった卵（半透明のふちの雲。z_soup の zsEgg を元に）
function trEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f6c440', op = .95 } = {}){
    const R = rng(p.id + 'trec' + seed + x + y);
    const pts = ring(L / 2, 13, .45, R, 1, .62);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(3.2, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .3)}" opacity=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .72]), true, .9)}" fill="${p.g(c, .35, .15)}"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .4 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".7"/></g>`;
}
// ズッキーニのフリッター（ミュジヴェル）: きつね色の丸に緑の千切りとディル
function trMucver(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'trmc' + seed);
    const pts = ring(s / 2, 12, .14, R, 1.06, .94);
    let st = '';
    for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .36, cx = Math.cos(a) * d, cy = Math.sin(a) * d, ang = R() * 3.14, L = 3 + R() * 4; st += `M${f(cx - Math.cos(ang) * L)},${f(cy - Math.sin(ang) * L)}l${f(Math.cos(ang) * L * 2)},${f(Math.sin(ang) * L * 2)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.2, .16)}><path d="${smooth(pts)}" fill="${p.g('#d89a3c', .3, .3)}" stroke="#8a5418" stroke-width=".8"/></g></g>
        <g ${p.crumb(.7)}><path d="${smooth(pts.map(([a, b]) => [a * .86, b * .86]))}" fill="#e2aa4c"/></g>
        <g ${trBlur(p, 1)}><ellipse cx="${f(-s * .1)}" cy="${f(-s * .08)}" rx="${f(s * .22)}" ry="${f(s * .16)}" fill="#a8641c" opacity=".35"/></g>
        <path d="${st}" stroke="#4f8a2a" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
        <path d="${st}" stroke="#a9cf6a" stroke-width=".6" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .16)},${f(-s * .3)}" stroke="#fff4d6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 平たいいんげん（煮て柔らかい、オリーブ色）
function trFlatBean(p, x, y, L, r = 0, { c = '#7a9a3a' } = {}){
    const w = 6.4;
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".6"/>
        <path d="M${f(-L / 2 + 2)},${f(-w * .2)} L${f(L / 2 - 2)},${f(-w * .2)}" stroke="${lt(c, .4)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
        ${[-.25, 0, .25].map(t => `<ellipse cx="${f(L * t)}" cy="${f(w * .12)}" rx="1.8" ry="1.1" fill="${dk(c, .12)}" opacity=".5"/>`).join('')}</g>`;
}
// ねぎの小口切り
function trScallion(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'trsc' + seed + x);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = 1.8 + R() * .8; const seg = `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr * .85)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr * .85)} 0 1 0 ${f(2 * rr)},0`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" fill="#c6e09a" stroke="#4f9a34" stroke-width="1"/><path d="${d2}" fill="#eef4dc" stroke="#9cc46a" stroke-width="1"/>`;
}

// ---------- 料理 ----------
export default {
    // 主食: 柳のかごに、白くふわふわのトルコパン（ソムン）の厚切り
    tr_staple: p => [
        trBasket(p),
        trLoaf(p, 128, 76, 92, 52, 15),
        trBreadSlice(p, 60, 104, 66, 50, -70, { seed: 1 }),
        trBreadSlice(p, 86, 112, 70, 52, -50, { seed: 2 }),
        trBreadSlice(p, 114, 118, 70, 52, -30, { seed: 3 }),
        trBreadSlice(p, 140, 118, 66, 50, -10, { seed: 4 }),
    ].join(''),

    // クル・ファスリエ: イズニック風の鉢に、トマトペーストの赤いソースで煮た白いんげん、青唐辛子、パセリ
    tr_kurufasulye: p => [
        trIznikBowl(p),
        K.liquid(p, { R: 74, c: '#c64a24', op: 1 }),
        `<circle cx="96" cy="94" r="50" fill="#e0703a" opacity=".3"/>`,
        `<g ${p.sh(.6)}>`,
        ...trSpots('kf', 64, 64, 9).map(([x, y, r]) => trBean(p, x, y, 11.5, r)),
        `</g>`,
        trOil(p, 100, 100, 130, { n: 14, c: '#e85a1e', op: .55 }),
        trSivri(p, 120, 128, 44, 30, { cooked: true }),
        trParsley(p, 90, 92, 30, { n: 12 }),
        trShine(100, 100, 74, .45),
    ].join(''),

    // カルヌヤルク: ガラスの耐熱皿に、縞にむいて揚げたなす3本、ひき肉を詰めてトマトの輪切りとししとうをのせ、底にトマトの汁
    tr_karniyarik: p => [
        trGlassDish(p),
        `<rect x="16" y="40" width="168" height="120" rx="14" fill="#c8502a" opacity=".55"/>`,
        trKarni(p, 96, 66, 140, 40, -4, { seed: 1 }),
        trKarni(p, 100, 102, 146, 42, 2, { seed: 2 }),
        trKarni(p, 98, 138, 140, 40, -2, { seed: 3 }),
        trParsley(p, 100, 100, 110, { n: 14 }),
    ].join(''),

    // タヴク・ソテ: トルコ石の縁の皿に、角切りの鶏肉、青唐辛子とトマト、玉ねぎ、マッシュルームを赤いソースで
    tr_tavuksote: p => [
        trPlate(p),
        K.pool(p, 100, 100, 128, '#c2502a', { seed: 1, sy: .92 }),
        `<g ${p.sh(.9)}>`,
        ...[[78, 76, 20], [110, 70, -30], [138, 88, 40], [70, 110, 80], [100, 102, 10], [132, 120, -60], [88, 136, 30], [118, 140, 70], [60, 88, -20], [146, 110, 15]].map(([x, y, r], i) => trChickenCube(p, x, y, 24, r, { seed: i + 1 })),
        trSivri(p, 96, 84, 34, 30, { cooked: true, bend: 1 }), trSivri(p, 124, 104, 30, -50, { cooked: true, bend: 1 }), trSivri(p, 80, 124, 30, 110, { cooked: true, bend: 1 }),
        K.pepperPiece(p, 140, 136, 13, 20, { c: '#5a9a2e' }),
        K.tomatoWedge(p, 116, 86, 18, 30), K.tomatoWedge(p, 66, 130, 16, -40), K.tomatoWedge(p, 146, 72, 16, 80),
        K.onion(p, 104, 124, 16, 20, { c: '#e6c48a', layers: 1 }), K.onion(p, 84, 96, 14, -60, { c: '#e6c48a', layers: 1 }),
        `</g>`,
        trOil(p, 100, 100, 120, { n: 10, c: '#e2602a', op: .5 }),
        K.sprinkle(p, 100, 100, 110, { c: '#7a5a2a', n: 18, r: .7 }),
        K.sprinkle(p, 100, 100, 110, { c: '#a82a14', n: 16, r: .8 }),
    ].join(''),

    // ハムスィ・タヴァ: 黒い鉄のフライパンに、尾を中心に向けて輪に並べたコーンミールのカタクチイワシ、真ん中にレモンとルッコラ
    tr_hamsi: p => {
        const cx = 92, out = [];
        for (let i = 0; i < 17; i++){ const a = i / 17 * Math.PI * 2; out.push(trAnchovy(p, cx + Math.cos(a) * 54, 100 + Math.sin(a) * 54, 46, a * 57.3 + 180, { seed: i })); }
        for (let i = 0; i < 10; i++){ const a = (i + .5) / 10 * Math.PI * 2; out.push(trAnchovy(p, cx + Math.cos(a) * 30, 100 + Math.sin(a) * 30, 36, a * 57.3 + 180, { seed: 40 + i })); }
        return [
            trPan(p, { cx }),
            `<g>`, out.join(''), `</g>`,
            trRocket(p, cx - 10, 94, 30, 30), trRocket(p, cx + 10, 108, 28, -60), trRocket(p, cx + 4, 88, 24, -110),
            trLemonRound(p, cx + 2, 100, 24),
        ].join('');
    },

    // メネメン: 銅のサハンに、煮つめたトマトと青唐辛子に半熟の炒り卵、白チーズ、唐辛子
    tr_menemen: p => [
        trSahan(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#d2482a', .2, .25, .45, .42)}"/>`,
        `<g ${trBlur(p, 1.2)}>`,
        ...trSpots('mn', 16, 58, 18).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="#b8301c" opacity=".5"/>`),
        `</g>`,
        ...trSpots('mne', 11, 50, 26).map(([x, y, r], i) => trEggCloud(p, x, y, 38 + (i % 3) * 6, r, { seed: i + 1, c: i % 4 === 3 ? '#f8eccc' : i % 2 ? '#f6c84a' : '#f2b23a' })),
        `<g ${trBlur(p, 1)}>`, ...trSpots('mnb', 10, 56, 24).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="6" fill="#e8642a" opacity=".35"/>`), `</g>`,
        `<g ${p.sh(.5)}>`,
        ...[[100, 66, 20], [64, 104, 70], [140, 96, -30], [106, 134, 40], [96, 104, -60], [70, 74, 10], [134, 130, 80]].map(([x, y, r]) => K.pepperPiece(p, x, y, 13, r, { c: '#5f9a2e' })),
        `</g>`,
        trGrains(p, 104, 98, 80, { cols: ['#fbf8ee', '#efeadc'], n: 14, size: 3, seed: 7 }),
        K.sprinkle(p, 100, 100, 120, { c: '#9a1c0c', n: 30, r: .9 }),
        trParsley(p, 112, 92, 24, { n: 6 }),
    ].join(''),

    // タス・ケバブ: イズニック風の深鉢に、トマトとトマトペーストでやわらかく煮た牛肉、にんじん、玉ねぎ、ピーマン
    tr_taskebabi: p => [
        trIznikBowl(p),
        K.liquid(p, { R: 74, c: '#a8401e', op: 1 }),
        `<circle cx="96" cy="94" r="48" fill="#c8602e" opacity=".28"/>`,
        `<g ${p.sh(.9)}>`,
        ...[[80, 80, 0], [114, 72, 40], [140, 100, -20], [72, 114, 60], [106, 108, 20], [128, 134, -40], [90, 140, 80], [60, 90, 30], [140, 70, 70]].map(([x, y, r], i) => trBeefChunk(p, x, y, 26 + (i % 3) * 3, r, { seed: i + 1 })),
        ...[[96, 92], [124, 116], [80, 126], [108, 136], [148, 120]].map(([x, y], i) => trDice(p, x, y, 10, i * 30, { c: '#ec7b2d' })),
        K.onion(p, 98, 66, 16, 20, { c: '#d9a066', layers: 1 }), K.onion(p, 56, 108, 14, -70, { c: '#d9a066', layers: 1 }),
        K.pepperPiece(p, 122, 90, 12, -20, { c: '#5a9a2e', strip: true }), K.pepperPiece(p, 90, 112, 12, 60, { c: '#5a9a2e', strip: true }),
        `</g>`,
        `<path d="M70,98 q8,-4 14,1 M116,92 q6,-5 12,0 M100,124 q6,3 12,-1" stroke="#7a2a12" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        trParsley(p, 100, 100, 80, { n: 12 }),
        trShine(100, 100, 74, .4),
    ].join(''),

    // マントゥ: 白い皿に小さな四角いマントゥを山盛り、にんにくヨーグルト、唐辛子の赤いバター、乾燥ミント
    tr_manti: p => {
        const sp = trSpots('mt', 70, 70, 12.5, 100, 100);
        return [
            trPlate(p, { rim: COBALT }),
            `<g ${p.sh(.8)}>`, sp.map(([x, y, r]) => trManti(p, x, y, 12, r)).join(''), `</g>`,
            trYogurt(p, 100, 102, 104, { seed: 1, c: '#f9f6ea' }),
            trManti(p, 84, 92, 12, 20), trManti(p, 114, 112, 12, -30), trManti(p, 104, 84, 12, 50),
            trRedButter(p, 100, 102, 96, { n: 9 }),
            trMint(p, 100, 100, 100, { n: 30 }),
        ].join('');
    },

    // チョバン・サラタス: イズニック風の鉢に、細かい角切りのトマト・きゅうり・青唐辛子・玉ねぎ、パセリ、レモン
    tr_coban: p => {
        const sp = trSpots('cb', 80, 68, 9.5);
        return [
            trIznikBowl(p),
            `<circle cx="100" cy="100" r="74" fill="#e8d8b8" opacity=".6"/>`,
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => { const t = i % 7; return t < 3 ? trDice(p, x, y, 11, r, { c: '#e0352a', inner: '#f47a5c' }) : t < 5 ? trDice(p, x, y, 10.5, r, { c: '#dcecb4', skin: '#3f7d2e' }) : t === 5 ? trDice(p, x, y, 8.5, r, { c: '#6aaa3a' }) : trDice(p, x, y, 8, r, { c: '#f6f2ea' }); }).join(''),
            `</g>`,
            trParsley(p, 100, 100, 130, { n: 34 }),
            trOil(p, 100, 100, 120, { n: 10, c: '#e8d06a', op: .45 }),
            K.sprinkle(p, 100, 100, 110, { c: '#8a1a2a', n: 18, r: .8 }),
        ].join('');
    },

    // ピリンチ・ピラヴ: 白い鉢にバターでつやつやのピラフを丸く盛り、金色の炒った麦粒パスタ（アルパ・シェフリイェ）
    tr_pilav: p => [
        trIznikBowl(p),
        trRice(p, 100, 101, 142, { tint: '#f6eed6', density: 1.25, grain: 4, hiK: .7 }),
        trGrains(p, 100, 100, 120, { cols: ['#d9a24a', '#c48a34', '#e8bc66'], n: 26, size: 2.4, long: 1.6, seed: 3 }),
        `<path d="M52,84 Q60,60 86,50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // ジャジュク: 白い鉢に、水でのばしたヨーグルトときゅうりの角切り、乾燥ミント、オリーブオイル
    tr_cacik: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf9f2' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="${TURQ}" stroke-width="2"/>`,
        K.liquid(p, { R: 74, c: '#f7f5ec', op: 1 }),
        `<g ${p.sh(.35)}>`,
        ...trSpots('cc', 34, 60, 11).map(([x, y, r]) => trDice(p, x, y, 8.5, r, { c: '#d6eab0', skin: '#4a8a34' })),
        `</g>`,
        `<circle cx="100" cy="100" r="68" fill="#f7f5ec" opacity=".22"/>`,
        trOil(p, 96, 96, 70, { n: 9, c: '#d9c24a', op: .65, rmax: 3 }),
        trMint(p, 100, 100, 110, { n: 36 }),
        trParsley(p, 104, 100, 30, { n: 5 }),
        trShine(100, 100, 74, .5),
    ].join(''),

    // ゼイティンヤール・タゼ・ファスリエ: 楕円の皿に、オリーブオイルとトマトでくたくたに煮た平たいいんげん、玉ねぎ
    tr_taze: p => {
        const R = rng('trtz');
        const beans = Array.from({ length: 30 }, () => trFlatBean(p, 46 + R() * 108, 64 + R() * 72, 26 + R() * 10, -40 + R() * 80, { c: R() < .5 ? '#7a9a3a' : '#86a640' }));
        return [
            K.ovalDish(p, { rx: 96, ry: 78, rim: TURQ }),
            K.pool(p, 100, 100, 150, '#d0652e', { seed: 1, sy: .72, op: .9 }),
            `<g ${p.sh(.7)}>`, beans.join(''), `</g>`,
            K.onion(p, 80, 92, 16, 20, { c: '#e9b878', layers: 1 }), K.onion(p, 128, 112, 14, -40, { c: '#e9b878', layers: 1 }),
            trOil(p, 100, 100, 140, { n: 16, c: '#e88a3a', op: .55 }),
            K.sprinkle(p, 100, 100, 120, { c: '#d03a1e', n: 26, r: 1.2 }),
            trLemonWedge(p, 152, 70, 22, 30),
        ].join('');
    },

    // ミュジヴェル: トルコ石の縁の皿に、ズッキーニのきつね色のフリッター5枚、にんにくヨーグルト、ディル
    tr_mucver: p => [
        trPlate(p),
        trYogurt(p, 140, 132, 40, { seed: 2 }),
        trMucver(p, 72, 76, 50, 0, { seed: 1 }), trMucver(p, 122, 66, 48, 30, { seed: 2 }), trMucver(p, 62, 124, 48, 60, { seed: 3 }),
        trMucver(p, 104, 112, 52, 10, { seed: 4 }), trMucver(p, 148, 100, 42, -20, { seed: 5 }),
        K.shreds(p, 140, 132, 20, { c: '#4f8a2a', n: 6, w: .9, len: .6 }),
        K.sprinkle(p, 140, 130, 16, { c: '#a82a14', n: 6, r: .8 }),
    ].join(''),

    // パタテス・サラタス: 白い鉢に、ゆでたじゃがいもの角切り、ねぎの小口切り、パセリ、唐辛子、オリーブオイル
    tr_patates: p => [
        trIznikBowl(p),
        `<circle cx="100" cy="100" r="74" fill="#efe2b8" opacity=".6"/>`,
        `<g ${p.sh(.6)}>`,
        ...trSpots('pt', 30, 60, 17).map(([x, y, r], i) => trDice(p, x, y, 17 + (i % 3), r, { c: '#f2d98c' })),
        `</g>`,
        trScallion(p, 100, 100, 120, { n: 26 }),
        trParsley(p, 100, 100, 120, { n: 26 }),
        trOil(p, 100, 100, 110, { n: 10, c: '#e8cc5a', op: .45 }),
        K.sprinkle(p, 100, 100, 110, { c: '#c0301a', n: 30, r: .9 }),
    ].join(''),

    // メルジメッキ・チョルバス: イズニック風の鉢に、なめらかな黄橙色のレンズ豆のスープ、赤い唐辛子バター、ミント、レモンのくし切り
    tr_mercimek: p => [
        trIznikBowl(p),
        K.liquid(p, { R: 74, c: '#e8902c', op: 1 }),
        `<circle cx="96" cy="94" r="50" fill="#f3b04a" opacity=".35"/>`,
        trRedButter(p, 100, 100, 70, { n: 8, op: .7 }),
        trMint(p, 100, 100, 80, { n: 14 }),
        trLemonWedge(p, 142, 140, 34, -40),
        trShine(100, 100, 74, .45),
    ].join(''),

    // ヤイラ・チョルバス: 白い鉢に、とろりと白いヨーグルトのスープとご飯の粒、ミントを焦がしたバター
    tr_yayla: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf9f2' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="${COBALT}" stroke-width="2"/>`,
        K.liquid(p, { R: 74, c: '#f4eedc', op: 1 }),
        trGrains(p, 100, 102, 120, { cols: ['#fffdf6', '#efe7d2'], n: 60, size: 2.4, long: 1.5, seed: 1 }),
        `<circle cx="100" cy="100" r="70" fill="#f4eedc" opacity=".25"/>`,
        trOil(p, 100, 100, 90, { n: 12, c: '#e8c24a', op: .6, rmax: 3.4 }),
        trMint(p, 100, 100, 96, { n: 40 }),
        trShine(100, 100, 74, .5),
    ].join(''),

    // ドマテス・チョルバス: イズニック風の鉢に、ミルクでまろやかなトマトのスープ、すりおろしたカシャルチーズ
    tr_domates: p => [
        trIznikBowl(p),
        K.liquid(p, { R: 74, c: '#d9492c', op: 1 }),
        `<circle cx="96" cy="94" r="50" fill="#ec7a52" opacity=".35"/>`,
        `<g ${p.sh(.4)}>`, K.shreds(p, 104, 102, 60, { c: '#f6dc84', n: 30, w: 2, len: .4, seed: 2, curve: .7 }), `</g>`,
        trParsley(p, 104, 100, 30, { n: 6 }),
        trShine(100, 100, 74, .45),
    ].join(''),
};
