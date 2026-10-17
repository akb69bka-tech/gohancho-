// 副菜（小鉢）その1
import * as K from '../kit.mjs';

const { T, f, rng, smooth, ring, lt, dk } = K;

// ---------- このファイル専用の部品（s1 で始まる） ----------
// 楕円の中にばらまく点
function s1Pts(R, n, cx, cy, rx, ry){
    return Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()); return [cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry]; });
}
// 盛りの下地（山のかたまり感）
function s1Mound(p, x, y, rx, ry, c, { seed = 1, op = 1, l = .25, d = .3 } = {}){
    const R = rng(p.id + 'mnd' + seed);
    return `<path ${T(x, y)} d="${smooth(ring(rx, 12, .14, R, 1, ry / rx))}" fill="${p.rg(c, l, d, .4, .38)}" opacity="${op}"/>`;
}
// 棒（細切り・拍子木）: 長さ L、太さ w
function s1Stick(p, x, y, L, w, r, c, { gloss = .5 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`
        + (gloss ? `<path d="M${f(-L / 2 + w * .7)},${f(-w * .2)} L${f(L / 2 - w)},${f(-w * .2)}" stroke="#fff" stroke-width="${f(w * .24)}" stroke-linecap="round" opacity="${gloss}"/>` : '') + `</g>`;
}
// ゆるく曲がった細い帯（切り干し大根・千切り）
function s1Strand(p, x, y, L, w, ang, c, R, { wob = .3, gloss = .4, line = .35 } = {}){
    const rad = ang * Math.PI / 180, ca = Math.cos(rad), sa = Math.sin(rad);
    const pts = [0, 1, 2, 3].map(i => { const t = i / 3 - .5, off = (R() - .5) * L * wob; return [x + ca * t * L - sa * off, y + sa * t * L + ca * off]; });
    const d = smooth(pts, false);
    return (line ? `<path d="${d}" stroke="${dk(c, line)}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/>` : '') + `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/>`
        + (gloss ? `<path d="${d}" stroke="#fff" stroke-width="${f(w * .26)}" fill="none" stroke-linecap="round" opacity="${gloss}" transform="translate(${f(-w * .2)} ${f(-w * .25)})"/>` : '');
}
// 軽い細切り（Q 1本）。outline があれば下に輪郭を引く
function s1Q(x, y, L, w, ang, c, R, { bend = .4, outline = null } = {}){
    const rad = ang * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * L * bend;
    const g = n => Math.round(n * 10) / 10;
    const d = `M${g(x - dx)},${g(y - dy)}q${g(dx - dy * b / L * 2)},${g(dy + dx * b / L * 2)} ${g(dx * 2)},${g(dy * 2)}`;
    return (outline ? `<path d="${d}" stroke="${outline}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/>` : '') + `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
// かつお節（薄く削った、透けるような淡い桃茶のひらひら）
function s1Bonito(p, x, y, s, n, seed = 1){
    const R = rng(p.id + 'bon' + seed);
    const cols = ['#ecd2b8', '#ddb594', '#f5e4d2', '#cfa07c', '#e6c2a2'];
    let o = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.283, d = Math.pow(R(), .7) * s / 2, tr = T(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, R() * 360, 1.1 + R() * .7), col = cols[Math.floor(R() * cols.length)];
        o += `<path ${tr} d="M-6.5,-.5 Q-3,-4.2 2,-3 Q5.6,-2 6.5,1.4 Q3,-.2 .5,.8 Q-3,2.4 -6.5,-.5Z" fill="${col}" stroke="${dk(col, .22)}" stroke-width=".4" opacity=".95"/>`;
    }
    return o;
}
// 大きめのごま
function s1Sesame(p, x, y, rx, ry, n, { c = '#f4e8c8', seed = 1, size = 1 } = {}){
    const R = rng(p.id + 'ses' + seed + c);
    return s1Pts(R, n, x, y, rx, ry).map(([cx, cy]) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(1.7 * size)}" ry="${f(1 * size)}" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".35"/>`).join('');
}
// おろし（大根・生姜）
function s1Grated(p, x, y, s, { c = '#f6f4ee', fleck = '#e2ddcf', seed = 1 } = {}){
    const R = rng(p.id + 'grt' + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 9, .25, R, 1.1, .85))}" fill="${p.rg(c, .3, .14)}" stroke="${dk(c, .12)}" stroke-width=".5"/></g>`
        + Array.from({ length: 9 }, () => { const cx = x + (R() - .5) * s * .65, cy = y + (R() - .5) * s * .5; return `<path d="M${f(cx - 1.6)},${f(cy)} l3.2,${f((R() - .5) * 1.6)}" stroke="${fleck}" stroke-width="1" stroke-linecap="round"/>`; }).join('');
}
// 小口ねぎ（大きめの輪）
function s1Negi(p, x, y, rx, ry, n, { seed = 1, r = 2.8 } = {}){
    const R = rng(p.id + 'ngi' + seed);
    return s1Pts(R, n, x, y, rx, ry).map(([cx, cy]) => { const c = R() < .65 ? '#58a336' : '#a9d47a'; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * .85)}" fill="${lt(c, .55)}" stroke="${c}" stroke-width="1.5"/>`; }).join('');
}
// 油揚げの短冊
function s1Age(p, x, y, w, h, r, { c = '#d39a48' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="1.8" fill="${p.g(c, .28, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-w / 2 + 2)},${f(-h * .15)} L${f(w / 2 - 2)},${f(-h * .15)}" stroke="${lt(c, .45)}" stroke-width="${f(h * .18)}" stroke-linecap="round" opacity=".7"/>
        <circle cx="${f(-w * .2)}" cy="${f(h * .18)}" r=".6" fill="${dk(c, .3)}"/><circle cx="${f(w * .15)}" cy="${f(h * .22)}" r=".6" fill="${dk(c, .3)}"/></g>`;
}
// ほうれん草を束ねて切ったもの（横に寝かせた1切れ）: 濃い葉のひだと、明るい茎、切り口
function s1Bundle(p, x, y, w, h, r, { c = '#2f6e2a', stem = '#8fc45a', seed = 1, stems = 3 } = {}){
    const R = rng(p.id + 'bun' + seed);
    let s = '';
    const id = p.uid();
    for (let i = 0; i < 9; i++){
        const lx = -w / 2 + 8 + R() * (w - 16), ly = -h / 2 + 6 + R() * (h - 12), col = R() < .5 ? dk(c, .18) : lt(c, .12);
        s += `<path ${T(lx, ly, (R() - .5) * 30, h / 22)} d="M-14,0 Q-7,-6.5 3,-5.5 Q12,-3 14,0 Q10,4.5 1,5.5 Q-8,5 -14,0Z" fill="${col}" stroke="${dk(c, .4)}" stroke-width=".6" opacity=".95"/><path ${T(lx, ly, 0, h / 22)} d="M-12,0 Q0,-1 12,0" stroke="${lt(c, .3)}" stroke-width=".8" fill="none" opacity=".7"/>`;
    }
    s = `<clipPath id="${id}"><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h * .3)}"/></clipPath><g clip-path="url(#${id})">${s}</g>`;
    for (let i = 0; i < stems; i++){
        const yy = -h / 2 + h * (i + .7) / (stems + .4), x0 = -w / 2 + 3 + R() * w * .1, x1 = w / 2 - 3 - R() * w * .25;
        s += `<path d="M${f(x0)},${f(yy)} Q0,${f(yy + (R() - .5) * 3)} ${f(x1)},${f(yy + (R() - .5) * 2)}" stroke="${dk(stem, .25)}" stroke-width="${f(h * .1 + 1)}" fill="none" stroke-linecap="round"/><path d="M${f(x0)},${f(yy)} Q0,${f(yy + (R() - .5) * 3)} ${f(x1)},${f(yy + (R() - .5) * 2)}" stroke="${stem}" stroke-width="${f(h * .1)}" fill="none" stroke-linecap="round"/>`;
    }
    let ends = '';
    for (let i = 0; i < 4; i++) ends += `<ellipse cx="${f(-w / 2 + 2.8)}" cy="${f(-h / 2 + h * (i + .7) / 4.4)}" rx="1.8" ry="${f(h * .075)}" fill="${lt(stem, .3)}" stroke="${dk(stem, .2)}" stroke-width=".4"/>`;
    return `<g ${T(x, y, r)}><g ${p.rough(2.4, .09)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h * .3)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .45)}" stroke-width="1"/></g>${s}${ends}
        <path d="M${f(-w / 2 + 7)},${f(-h / 2 + 3.4)} Q0,${f(-h / 2 + 1.6)} ${f(w / 2 - 9)},${f(-h / 2 + 3.6)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 青菜の葉
function s1Leaf(p, x, y, L, r, c){
    const k = L / 24;
    return `<g ${T(x, y, r, k)}><path d="M-12,0 Q-6,-7.5 3,-6.5 Q11,-3.5 12,0 Q9,5 1,6 Q-7,6 -12,0Z" fill="${p.g(c, .25, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M-11,0 Q0,-1 11,0 M-4,-.4 L-1,-4 M2,-.3 L5,-3.6 M-2,.3 L1,3.6" stroke="${lt(c, .35)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}
// だし巻き卵の1切れ（断面に、巻き重ねた薄い層）
function s1Tamago(p, x, y, w, h, r){
    const pts = [];
    const N = 64, turns = 3;
    for (let i = 0; i <= N; i++){
        const t = i / N, th = t * turns * 6.283 + .6, rr = .9 - t * .8, c = Math.cos(th), s = Math.sin(th);
        pts.push([Math.sign(c) * Math.pow(Math.abs(c), .3) * w / 2 * rr, Math.sign(s) * Math.pow(Math.abs(s), .3) * h / 2 * rr]);
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .26)}" fill="${p.rg('#f9da6c', .35, .14, .4, .38)}" stroke="#d3a038" stroke-width="2"/></g>
        <path d="${smooth(pts, false)}" stroke="#e6b847" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(-w / 2 + 5)},${f(-h / 2 + 3.2)} L${f(w / 2 - 8)},${f(-h / 2 + 3.2)}" stroke="#fffbe6" stroke-width="2.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// かぼちゃの煮物の1切れ。上が切り口、下の弧が皮（緑）。skinUp で皮を上に（面取りした縁が黄色く見える）
function s1Kabo(p, x, y, s, r, { skinUp = false, seed = 1 } = {}){
    const R = rng(p.id + 'kab' + seed);
    const w = s, h = s * .8, j = () => (R() - .5) * 3;
    const pts = [[-w / 2, -h / 2 + 3 + j()], [-w * .1, -h / 2 + j()], [w / 2, -h / 2 + 2 + j()], [w / 2 - 1, h * .05], [w * .28, h / 2 - 1], [-w * .28, h / 2 + j()], [-w / 2 + 1, h * .08]];
    const body = smooth(pts, true, .7);
    const flesh = '#eb9a2a';
    if (skinUp){
        const inner = smooth(pts.map(([a, b]) => [a * .78 + .6, b * .74 + .6]), true, .7);
        return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${body}" fill="${p.g('#c9b24a', .3, .3)}" stroke="#7a6a22" stroke-width=".8"/></g>
            <path d="${inner}" fill="${p.g('#2f5a2a', .3, .3)}"/>
            <ellipse cx="${f(w * .1)}" cy="${f(-h * .05)}" rx="${f(w * .12)}" ry="${f(h * .08)}" fill="#a9a640" opacity=".9"/>
            <path d="M${f(-w * .26)},${f(-h * .18)} Q${f(-w * .05)},${f(-h * .32)} ${f(w * .18)},${f(-h * .25)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
    }
    const top = smooth(pts.map(([a, b]) => [a * .94, b * .78 - h * .1]), true, .7);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${body}" fill="${p.g('#2d5728', .3, .25)}" stroke="#1d3a1a" stroke-width=".8"/></g>
        <path d="${top}" fill="${p.g(flesh, .32, .3)}" stroke="${dk(flesh, .25)}" stroke-width=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - 1.5, b * .44 - h * .16]), true, .7)}" fill="${lt(flesh, .22)}" opacity=".7"/>
        <path d="M${f(-w * .3)},${f(-h * .28)} Q${f(-w * .06)},${f(-h * .42)} ${f(w * .22)},${f(-h * .34)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 揚げなす（縦半分を切ったもの。皮に格子の切り目）
function s1Nasu(p, x, y, L, h, r, { skinUp = true } = {}){
    const id = p.uid();
    const body = `M${f(-L / 2)},0 C${f(-L / 2)},${f(-h * .55)} ${f(-L * .3)},${f(-h / 2)} 0,${f(-h / 2)} C${f(L * .35)},${f(-h / 2)} ${f(L / 2)},${f(-h * .4)} ${f(L / 2)},0 C${f(L / 2)},${f(h * .4)} ${f(L * .35)},${f(h / 2)} 0,${f(h / 2)} C${f(-L * .3)},${f(h / 2)} ${f(-L / 2)},${f(h * .55)} ${f(-L / 2)},0Z`;
    let cuts = '';
    for (let i = -6; i <= 6; i++){ const cx = i * 6; cuts += `<path d="M${cx - h},${f(-h)} L${cx + h},${f(h)}" stroke="${skinUp ? '#9a76a8' : '#9a6a32'}" stroke-width="1.1" opacity=".55"/>`; }
    if (skinUp) return `<g ${T(x, y, r)}><clipPath id="${id}"><path d="${body}"/></clipPath><g ${p.sh(1)}><path d="${body}" fill="${p.g('#55265f', .3, .35)}" stroke="#2a1131" stroke-width=".8"/></g>
        <g clip-path="url(#${id})">${cuts}</g>
        <path d="M${f(-L * .36)},${f(-h * .18)} Q${f(-L * .1)},${f(-h * .36)} ${f(L * .3)},${f(-h * .24)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>
        <circle cx="${f(L * .34)}" cy="${f(h * .08)}" r="1.4" fill="#fff" opacity=".6"/></g>`;
    const inner = `M${f(-L / 2 + 2.5)},0 C${f(-L / 2 + 2.5)},${f(-h * .4)} ${f(-L * .3)},${f(-h / 2 + 2.5)} 0,${f(-h / 2 + 2.5)} C${f(L * .35)},${f(-h / 2 + 2.5)} ${f(L / 2 - 2.5)},${f(-h * .3)} ${f(L / 2 - 2.5)},0 C${f(L / 2 - 2.5)},${f(h * .3)} ${f(L * .35)},${f(h / 2 - 2.5)} 0,${f(h / 2 - 2.5)} C${f(-L * .3)},${f(h / 2 - 2.5)} ${f(-L / 2 + 2.5)},${f(h * .4)} ${f(-L / 2 + 2.5)},0Z`;
    return `<g ${T(x, y, r)}><clipPath id="${id}"><path d="${inner}"/></clipPath><g ${p.sh(1)}><path d="${body}" fill="${p.g('#55265f', .3, .35)}" stroke="#2a1131" stroke-width=".8"/></g>
        <path d="${inner}" fill="${p.g('#c99a55', .3, .3)}"/><g clip-path="url(#${id})">${cuts}</g>
        <path d="M${f(-L * .32)},${f(-h * .14)} Q${f(-L * .1)},${f(-h * .3)} ${f(L * .26)},${f(-h * .2)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// たたいて割ったきゅうり（ぎざぎざの割れ目、皮の緑と白っぽい中身）
function s1Kyuri(p, x, y, s, r, { seed = 1 } = {}){
    const R = rng(p.id + 'kyu' + seed);
    const pts = ring(s / 2, 9, .55, R, 1.18, .88);
    const body = smooth(pts, true, .2);
    const inner = smooth(pts.map(([a, b]) => [a * .74 + s * .1, b * .62 + s * .08]), true, .2);
    let seeds = '';
    for (let i = 0; i < 4; i++) seeds += `<ellipse cx="${f(s * .1 + (R() - .5) * s * .35)}" cy="${f(s * .08 + (R() - .5) * s * .16)}" rx="1.7" ry="1.1" fill="#f6f8e8" stroke="#b9cf8a" stroke-width=".3"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${body}" fill="${p.g('#3a7a2a', .3, .3)}" stroke="#22501a" stroke-width=".8" stroke-linejoin="round"/></g>
        <path d="M${f(-s * .5)},${f(-s * .12)} L${f(s * .3)},${f(-s * .2)} M${f(-s * .4)},${f(-s * .26)} L${f(s * .1)},${f(-s * .3)}" stroke="#6aa04a" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
        <path d="${inner}" fill="${p.g('#d6eaa6', .3, .15)}" stroke="#a9c97a" stroke-width=".5" stroke-linejoin="round"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .36 + s * .1, b * .28 + s * .08]), true, .3)}" fill="#e8f2c8"/>${seeds}
        <path d="M${f(-s * .2)},${f(-s * .06)} Q${f(0)},${f(-s * .14)} ${f(s * .24)},${f(-s * .08)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 口の開いたあさり: 左の殻は内側（白〜薄紫）と身、右の殻は外側の模様（立ち気味で少し細く見える）
function s1Clam(p, x, y, s, r){
    const k = s / 34;
    const shell = 'M0,-2 C-3,-10.5 -14,-11.5 -17,-2 C-18.5,5.5 -10,11.5 0,5Z';
    const inner = 'M-1.8,-1.8 C-4,-8 -12.5,-8.6 -15,-2 C-16,3.6 -9.5,8.4 -1.8,3.8Z';
    const ribs = 'M-14,-8 Q-9,-1 -10,9 M-9,-10 Q-5,-2 -4,7.5 M-17,-3 Q-12,0 -14,6';
    const rings = 'M-3,-6 C-6,-8 -12,-8 -14,-2 C-14.5,3 -9,7 -2,3.5 M-6,-4 C-8,-5 -10,-4 -11,-1 C-11,2 -8,4 -4,2.6';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>
        <g transform="scale(-.82 1)"><path d="${shell}" fill="${p.g('#a08a72', .35, .35)}" stroke="#4a3a2c" stroke-width=".8"/><path d="${rings}" stroke="#6a5644" stroke-width="1" fill="none" opacity=".7"/><path d="${ribs}" stroke="#4f4032" stroke-width="1.4" fill="none" stroke-dasharray="2 2" opacity=".55"/></g>
        <path d="${shell}" fill="${p.g('#8f7864', .35, .3)}" stroke="#4a3a2c" stroke-width=".8"/><path d="${inner}" fill="${p.rg('#f6f1f2', .2, .1, .6, .45)}"/><path d="M-15,-2 C-15.5,3 -10,8 -2,4" stroke="#a98aa8" stroke-width="1.8" fill="none" opacity=".55"/></g>
        <path d="M-14,1 C-14,-6.5 -6,-8 -1.5,-3.5 C1,-1 1,3 -1.5,4.6 C-6,7.4 -14,6.4 -14,1Z" fill="${p.g('#ecb47c', .3, .25)}" stroke="#b97c48" stroke-width=".6"/>
        <path d="M-12,2 Q-8,5 -3,3" stroke="#c98a52" stroke-width="1" fill="none" opacity=".8"/>
        <path d="M-11,-2 Q-8,-5 -4,-4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".75"/>
        <ellipse cx="0" cy="-3" rx="1.7" ry="1.1" fill="#5b4535"/></g>`;
}
// 炒めたトマトのくし切り（皮の赤い面と、少し崩れた切り口の果肉・種のゼリー）
function s1Tomato(p, x, y, s, r){
    const k = s / 24;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-12,5 C-11,-4 -4,-10 3,-10 C9,-9 12,-3 11,4 C6,8 -6,8.5 -12,5Z" fill="${p.g('#d8301f', .32, .25)}" stroke="#9a1f14" stroke-width=".7"/></g>
        <path d="M-9,4.4 C-8,-1.5 -3,-5 2,-5.4 C6.5,-5 8.6,-1 8,3.8 C3,6.4 -5,6.6 -9,4.4Z" fill="${p.g('#f0563c', .25, .2)}"/>
        <path d="M-5.5,3.6 C-5,0 -1.5,-1.6 1.5,-1 C3,1 1.6,4.4 -5.5,3.6Z" fill="#f6a45a" opacity=".9"/>
        <circle cx="-2.6" cy="1.6" r=".9" fill="#fbe08a"/><circle cx=".2" cy=".6" r=".9" fill="#fbe08a"/><circle cx="-1" cy="3" r=".8" fill="#fbe08a"/>
        <path d="M-8,-3 Q-3,-9 4,-8.6" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// ふわふわの炒り卵のかたまり
function s1Egg(p, x, y, s, r, { seed = 1 } = {}){
    const R = rng(p.id + 'egg' + seed);
    const body = smooth(ring(s / 2, 10, .4, R, 1.15, .9));
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${body}" fill="${p.g('#f8cf48', .42, .22)}" stroke="#d9a42a" stroke-width=".7"/></g>
        <path d="${smooth(ring(s * .26, 7, .4, R, 1.1, .8).map(([a, b]) => [a - s * .08, b - s * .08]))}" fill="#fde98f" opacity=".85"/>
        <path d="M${f(-s * .2)},${f(s * .14)} q${f(s * .1)},${f(-s * .06)} ${f(s * .22)},${f(s * .02)} M${f(s * .05)},${f(-s * .02)} q${f(s * .08)},${f(s * .06)} ${f(s * .18)},${f(-s * .02)}" stroke="#e2ae33" stroke-width="1" fill="none" opacity=".7"/></g>`;
}
// わかめ（大きめ・つや）
function s1Wakame(p, x, y, s, r, { seed = 1 } = {}){
    const R = rng(p.id + 'wak' + seed);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 9, .45, R, 1.3, .65))}" fill="${p.g('#2d5f2a', .3, .3)}" stroke="#1b3d19" stroke-width=".6"/><path d="M${f(-s * .38)},0 Q0,${f(-s * .12)} ${f(s * .38)},${f(s * .02)}" stroke="#6a9a4c" stroke-width="1.2" fill="none" opacity=".8"/><path d="M${f(-s * .25)},${f(-s * .14)} Q0,${f(-s * .24)} ${f(s * .2)},${f(-s * .16)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 薄切りきゅうり（透けた輪）
function s1Cuke(p, x, y, s, r){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s * .62)}" ry="${f(s / 2)}" fill="#3d7a2c"/><ellipse rx="${f(s * .62 - 1.6)}" ry="${f(s / 2 - 1.6)}" fill="${p.rg('#cfe6a0', .25, .12)}" opacity=".97"/>
        <ellipse rx="${f(s * .3)}" ry="${f(s * .24)}" fill="#e4f0c4"/>${[0, 1, 2].map(i => `<ellipse cx="${f(Math.cos(i * 2.09 + .5) * s * .14)}" cy="${f(Math.sin(i * 2.09 + .5) * s * .11)}" rx="1.3" ry=".8" fill="#fbfdf0"/>`).join('')}</g>`;
}
// にんじんのいちょう切り
function s1CarrotQ(p, x, y, s, r){
    return `<g ${T(x, y, r)}><path d="M0,0 L${f(s)},0 A${f(s)},${f(s)} 0 0 0 0,${f(-s)}Z" fill="${p.g('#ee7d2c', .3, .25)}" stroke="#b2521a" stroke-width=".5"/><path d="M0,0 L${f(s * .35)},0 A${f(s * .35)},${f(s * .35)} 0 0 0 0,${f(-s * .35)}Z" fill="#f6a35e"/></g>`;
}

export default {
    // ほうれん草のおひたし: 藍の鉢に、束ねて切った3切れ、だしを少し、上にかつお節
    ohitashi: p => [
        K.bowl(p, { glaze: '#2c4c7c', inside: '#f3efe6' }),
        K.liquid(p, { R: 66, c: '#d9b876', op: .6, shine: false }),
        `<g ${p.sh(1.3)}>`,
        s1Bundle(p, 98, 78, 112, 40, -4, { seed: 1 }),
        s1Bundle(p, 102, 124, 114, 40, 3, { seed: 2, stems: 2 }),
        s1Bundle(p, 100, 101, 104, 42, -1, { seed: 3, c: '#2c6a28', stems: 4 }),
        `</g>`,
        `<g ${p.sh(.5)}>`, s1Bonito(p, 102, 98, 54, 34, 1), `</g>`,
    ].join(''),

    // きんぴらごぼう: 生成りの小鉢に、照りのあるごぼうとにんじんの細切りの山、白ごま・輪切り唐辛子
    kinpira: p => {
        const R = rng(p.id + 'pile');
        const sticks = s1Pts(R, 52, 100, 100, 52, 46).map(([x, y], i) => {
            const carrot = i % 4 === 0;
            const c = carrot ? '#e8742a' : (R() < .5 ? '#7d4f2a' : '#9a6a3c');
            return s1Stick(p, x, y, 28 + R() * 12, carrot ? 4.2 : 4.8, R() * 180, c, { gloss: .55 });
        }).join('');
        const chili = s1Pts(R, 7, 100, 98, 44, 40).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="none" stroke="#d6281a" stroke-width="1.8"/>`).join('');
        return [
            K.kobachi(p, { glaze: '#e3d8c2', inside: '#f6f1e6' }),
            `<g ${p.sh(1.2)}>`, s1Mound(p, 100, 100, 50, 44, '#86562c', { seed: 1 }), sticks, `</g>`,
            s1Sesame(p, 100, 98, 46, 40, 30, { c: '#f6ecd0' }), chili,
        ].join('');
    },

    // ポテトサラダ: 藍色の小鉢に、マヨネーズで和えたじゃがいもの山、きゅうり・ハム・にんじん
    potesala: p => {
        const R = rng(p.id + 'pt');
        let lumps = '';
        for (const [x, y] of s1Pts(R, 12, 100, 100, 44, 40)) lumps += `<path ${T(x, y)} d="${smooth(ring(8 + R() * 4, 7, .35, R), true, .6)}" fill="${p.g('#f5e2a6', .4, .16)}" stroke="#dcc27e" stroke-width=".7"/>`;
        const cukes = s1Pts(R, 8, 100, 100, 46, 42).map(([x, y]) => `<g ${T(x, y, R() * 180)}><path d="M-11,1 A11,9 0 0 1 11,1Z" fill="#3d7a2c"/><path d="M-9.4,1 A9.4,7.4 0 0 1 9.4,1Z" fill="#cfe6a0"/><path d="M-4.4,1 A4.4,3.4 0 0 1 4.4,1Z" fill="#e6f1c8"/></g>`).join('');
        const hams = s1Pts(R, 6, 100, 100, 44, 40).map(([x, y]) => K.ham(p, x, y, 16, 9, R() * 180)).join('');
        const carrots = s1Pts(R, 6, 100, 100, 44, 40).map(([x, y]) => s1CarrotQ(p, x, y, 8, R() * 360)).join('');
        return [
            K.kobachi(p, { glaze: '#4f79a6', inside: '#f6f5f0' }),
            `<g ${p.sh(1.3)}><g ${p.rough(3, .07)}>`, s1Mound(p, 100, 102, 64, 58, '#f0d283', { seed: 2, l: .3, d: .25 }), `</g></g>`,
            lumps, cukes, hams, carrots,
            `<path d="M58,82 Q72,58 102,52" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
            K.sprinkle(p, 100, 100, 90, { c: '#5a4a3a', n: 18, r: .6 }),
        ].join('');
    },

    // ひじきの煮物: 灰釉の小鉢に、黒いひじき・にんじん・油揚げ
    hijiki: p => {
        const R = rng(p.id + 'hj');
        let rods = '';
        for (const [x, y] of s1Pts(R, 62, 100, 100, 56, 50)){
            const a = R() * 180, L = 8 + R() * 5;
            rods += `<g ${T(x, y, a)}><rect x="${f(-L / 2)}" y="-1.7" width="${f(L)}" height="3.4" rx="1.7" fill="${R() < .5 ? '#231d19' : '#3a302a'}"/>${R() < .5 ? `<path d="M${f(-L / 2 + 1.5)},-.7 L${f(L / 2 - 2)},-.7" stroke="#8c7f74" stroke-width=".7" stroke-linecap="round"/>` : ''}</g>`;
        }
        const carrots = s1Pts(R, 14, 100, 100, 50, 44).map(([x, y]) => s1Stick(p, x, y, 18 + R() * 6, 3.8, R() * 180, '#ec7a2c', { gloss: .5 })).join('');
        const age = s1Pts(R, 8, 100, 100, 46, 40).map(([x, y]) => s1Age(p, x, y, 18, 6, R() * 180, { c: '#c99042' })).join('');
        return [
            K.kobachi(p, { glaze: '#bfa67a', inside: '#f2ebdb' }),
            `<g ${p.sh(1.2)}>`, s1Mound(p, 100, 100, 62, 56, '#2e2620', { seed: 3 }), rods, age, carrots, `</g>`,
        ].join('');
    },

    // だし巻き卵: 青磁の小鉢に、巻いた層の見える厚切り3切れを並べ、手前に大葉と大根おろし（しょうゆ1滴）
    dashimaki: p => [
        K.kobachi(p, { glaze: '#9fbfae', inside: '#eef2ea' }),
        `<g ${p.sh(1)}>`,
        s1Tamago(p, 58, 94, 54, 42, -8),
        s1Tamago(p, 100, 90, 54, 42, -8),
        s1Tamago(p, 142, 86, 54, 42, -8),
        `</g>`,
        K.shiso(p, 116, 142, 42, 70),
        s1Grated(p, 106, 140, 36),
        `<ellipse cx="108" cy="137" rx="5" ry="3.4" fill="#8a4a1c" opacity=".75"/>`,
    ].join(''),

    // かぼちゃの煮物: 黒釉の鉢に、皮の緑が見える煮たかぼちゃ、少しの煮汁
    kabocha: p => [
        K.bowl(p, { glaze: '#2c2826', inside: '#efe6d4' }),
        K.liquid(p, { R: 64, c: '#c98c3e', op: .8 }),
        s1Kabo(p, 72, 76, 44, -20, { seed: 1 }),
        s1Kabo(p, 126, 72, 42, 25, { seed: 2 }),
        s1Kabo(p, 66, 120, 42, 35, { seed: 3, skinUp: true }),
        s1Kabo(p, 134, 118, 42, -35, { seed: 4 }),
        s1Kabo(p, 100, 140, 40, 5, { seed: 5 }),
        s1Kabo(p, 100, 102, 46, 8, { seed: 6 }),
    ].join(''),

    // なすの揚げびたし: 白い小鉢にだし、つやのある紫の揚げなす（格子の切り目）、おろし生姜と大葉のせん切り
    nasubitashi: p => [
        K.kobachi(p, { glaze: '#d6cdbb', inside: '#f6f3ec' }),
        K.liquid(p, { R: 66, c: '#c48d42', op: .9 }),
        s1Nasu(p, 82, 74, 60, 27, 30),
        s1Nasu(p, 130, 92, 58, 27, 100),
        s1Nasu(p, 74, 118, 58, 27, -20, { skinUp: false }),
        s1Nasu(p, 114, 136, 58, 27, -10),
        s1Nasu(p, 100, 100, 60, 29, -50),
        `<g ${p.sh(.6)}>`, K.shreds(p, 100, 96, 28, { c: '#4c9636', n: 9, w: 2, len: .9, seed: 3 }), `</g>`,
        s1Grated(p, 104, 100, 20, { c: '#f2dc90', fleck: '#d8b450' }),
    ].join(''),

    // 小松菜と油揚げの煮びたし: 茶の鉢に、淡いだし、小松菜の茎と葉、油揚げの短冊
    komatsuna: p => {
        const R = rng(p.id + 'km');
        let g = '';
        for (const [x, y] of s1Pts(R, 9, 100, 100, 46, 42)) g += s1Leaf(p, x, y, 36 + R() * 8, -30 + R() * 60 + (R() < .5 ? 180 : 0), R() < .5 ? '#2f7a2c' : '#3a8a32');
        for (const [x, y] of s1Pts(R, 10, 100, 100, 46, 42)) g += s1Stick(p, x, y, 30 + R() * 8, 5.4, -25 + R() * 50, '#9ccb62', { gloss: .5 });
        for (const [x, y] of s1Pts(R, 4, 100, 100, 40, 36)) g += s1Leaf(p, x, y, 34, -30 + R() * 60, '#347f2e');
        const age = s1Pts(R, 6, 100, 100, 44, 40).map(([x, y]) => s1Age(p, x, y, 26, 10, -40 + R() * 80, { c: '#d8a250' })).join('');
        return [
            K.bowl(p, { glaze: '#7a5638', inside: '#efe5d3' }),
            K.liquid(p, { R: 70, c: '#dcb874', op: .8 }),
            `<g ${p.sh(1)}>`, g, age, `</g>`,
        ].join('');
    },

    // たたききゅうり: 朱の鉢に、割れたきゅうり（皮の緑と白っぽい断面）、ごま油のつやと白ごま
    tatakikyuri: p => {
        const pos = [[74, 74, 36], [114, 68, 36], [142, 100, 32], [68, 114, 36], [106, 104, 40], [132, 134, 34], [90, 140, 34], [56, 92, 26], [128, 80, 26]];
        return [
            K.bowl(p, { glaze: '#a8372a', inside: '#f4efe6' }),
            K.liquid(p, { R: 60, c: '#d8c48a', op: .45, shine: false }),
            pos.map(([x, y, s], i) => s1Kyuri(p, x, y, s, i * 47, { seed: i })).join(''),
            s1Sesame(p, 102, 102, 50, 46, 30, { c: '#f6ecd0' }),
        ].join('');
    },

    // もやしのナムル: 銀色の小鉢に、もやし・ほうれん草・にんじんの3つの山、白ごま
    namul: p => {
        const R = rng(p.id + 'nm');
        let spr = '';
        for (const [x, y] of s1Pts(R, 18, 74, 80, 26, 22)){
            const a = R() * 180, L = 18 + R() * 8, rad = a * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * 6;
            const d = `M${f(x - dx)},${f(y - dy)} Q${f(x + b)},${f(y - b)} ${f(x + dx)},${f(y + dy)}`;
            spr += `<path d="${d}" stroke="#cfc7a6" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fbf8ec" stroke-width="2.8" fill="none" stroke-linecap="round"/><ellipse cx="${f(x + dx)}" cy="${f(y + dy)}" rx="2.6" ry="1.8" fill="#e6cf5c" stroke="#bfa53a" stroke-width=".4"/>`;
        }
        let spin = '';
        for (const [x, y] of s1Pts(R, 9, 128, 82, 22, 20)) spin += s1Leaf(p, x, y, 22 + R() * 6, R() * 360, R() < .5 ? '#2f6e2a' : '#3b8030');
        for (const [x, y] of s1Pts(R, 5, 128, 82, 20, 18)) spin += s1Stick(p, x, y, 18, 3.4, R() * 180, '#7fb850', { gloss: .4 });
        let car = '';
        for (const [x, y] of s1Pts(R, 22, 102, 128, 28, 20)) car += s1Stick(p, x, y, 18 + R() * 6, 3.4, -30 + R() * 60 + (R() < .3 ? 90 : 0), '#ec7a2c', { gloss: .5 });
        return [
            K.kobachi(p, { glaze: '#b9b8b2', inside: '#f4f3ef' }),
            `<g ${p.sh(1)}>`,
            s1Mound(p, 74, 80, 34, 30, '#e8e2c8', { seed: 1 }), spr,
            s1Mound(p, 128, 82, 32, 28, '#2a5e26', { seed: 2 }), spin,
            s1Mound(p, 102, 128, 36, 26, '#e06a24', { seed: 3 }), car,
            `</g>`,
            s1Sesame(p, 100, 98, 54, 46, 26, { c: '#f6ecd0', seed: 2 }),
        ].join('');
    },

    // あさりの酒蒸し: 灰色の鉢に、うっすらにごった酒蒸しの汁、口の開いたあさり、小口ねぎ
    sakamushi: p => {
        const pos = [[74, 72, -20], [124, 70, 20], [144, 112, 75], [60, 114, -65], [102, 106, 5], [104, 144, -5]];
        return [
            K.bowl(p, { glaze: '#4a4440', inside: '#efeae0' }),
            K.liquid(p, { R: 72, c: '#e2cf9e', op: .9 }),
            pos.map(([x, y, r]) => s1Clam(p, x, y, 50, r)).join(''),
            K.clam(p, 142, 76, 26, 30, { open: false }), K.clam(p, 62, 146, 24, -20, { open: false }),
            s1Negi(p, 102, 102, 58, 54, 18, { r: 3 }),
        ].join('');
    },

    // コールスロー: 緑釉の鉢に、マヨネーズで和えた細切りキャベツ・にんじん・コーン
    coleslaw: p => {
        const R = rng(p.id + 'cs');
        let sh = '';
        const cols = ['#f8f9ea', '#dcecb2', '#c6df8e', '#fbfcf2', '#a9cc6c', '#eef5d6', '#d9d6b0'];
        for (const [x, y] of s1Pts(R, 140, 100, 100, 54, 50)) sh += s1Q(x, y, 10 + R() * 7, 2.6, R() * 180, cols[Math.floor(R() * cols.length)], R);
        for (const [x, y] of s1Pts(R, 20, 100, 100, 50, 46)) sh += s1Q(x, y, 13 + R() * 5, 2.4, R() * 180, '#ee7d2c', R, { outline: '#c45a1a' });
        const corn = s1Pts(R, 12, 100, 100, 48, 44).map(([x, y]) => `<rect x="${f(x - 2.8)}" y="${f(y - 2.4)}" width="5.6" height="4.8" rx="1.8" fill="${p.g('#f6cc34', .35, .2)}" stroke="#c99a12" stroke-width=".4"/>`).join('');
        return [
            K.bowl(p, { glaze: '#4f7a5a', inside: '#f5f2ea' }),
            `<g ${p.sh(1.2)}>`, s1Mound(p, 100, 100, 62, 58, '#e9ebc8', { seed: 4, l: .3, d: .25 }), `</g>`,
            `<g ${p.sh(.5)}>`, sh, `</g>`, corn,
            `<path d="M60,84 Q74,58 104,52" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`,
            K.sprinkle(p, 100, 100, 92, { c: '#4a3f36', n: 12, r: .55 }),
        ].join('');
    },

    // 冷ややっこ: 藍の小鉢に、絹ごし豆腐のかたまり、小口ねぎ・おろし生姜・かつお節、しょうゆ
    hiyayakko: p => [
        K.kobachi(p, { glaze: '#2c4c7c', inside: '#3d659c' }),
        `<g ${p.sh(1.4)}>`,
        `<rect x="52" y="60" width="104" height="90" rx="10" fill="#d6cdb8"/>`,
        `<rect x="47" y="53" width="104" height="90" rx="10" fill="${p.rg('#fbf8ee', .3, .1, .35, .3)}" stroke="#d9d1bd" stroke-width=".8"/>`,
        `</g>`,
        `<path d="M55,61 L140,61" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`,
        K.pool(p, 102, 102, 56, '#8a4a18', { op: .35, seed: 2 }),
        `<g ${p.sh(.6)}>`, s1Bonito(p, 96, 92, 58, 34, 2), `</g>`,
        s1Negi(p, 90, 118, 30, 16, 20, { r: 3.4 }),
        s1Grated(p, 124, 106, 28, { c: '#f2d478', fleck: '#d4a838' }),
    ].join(''),

    // きゅうりとわかめの酢の物: 水色の小鉢に、薄切りきゅうりとわかめ、甘酢
    sunomono: p => {
        const R = rng(p.id + 'sn');
        const wk = s1Pts(R, 7, 100, 100, 48, 44).map(([x, y], i) => s1Wakame(p, x, y, 32 + R() * 8, R() * 180, { seed: i })).join('');
        const ck = s1Pts(R, 22, 100, 100, 50, 46).map(([x, y]) => s1Cuke(p, x, y, 19 + R() * 3, R() * 180)).join('');
        return [
            K.kobachi(p, { glaze: '#a9cdd6', inside: '#eef6f6' }),
            K.liquid(p, { R: 66, c: '#efe3b8', op: .55 }),
            `<g ${p.sh(1)}>`, wk, ck, s1Wakame(p, 104, 98, 32, 30, { seed: 9 }), `</g>`,
            s1Sesame(p, 100, 98, 40, 36, 14, { c: '#f6ecd0' }),
        ].join('');
    },

    // トマトと卵の炒め物: 白い鉢に、赤いくし切りトマトと黄色いふわふわ卵、汁と小口ねぎ
    tomatotamago: p => {
        const tom = [[80, 74, -30], [130, 82, 40], [68, 118, 160], [118, 134, -150], [102, 106, 15], [144, 114, 100], [100, 60, 10]];
        const egg = [[106, 82, 38, 1], [74, 96, 36, 2], [128, 108, 36, 3], [90, 132, 36, 4], [124, 60, 26, 5], [58, 102, 24, 6], [140, 136, 24, 7]];
        return [
            K.bowl(p, { glaze: '#e4ddd0', inside: '#fbfaf6' }),
            K.liquid(p, { R: 66, c: '#e8854a', op: .6, shine: false }),
            egg.slice(0, 4).map(([x, y, s, i]) => s1Egg(p, x, y, s, i * 40, { seed: i })).join(''),
            tom.map(([x, y, r]) => s1Tomato(p, x, y, 34, r)).join(''),
            egg.slice(4).map(([x, y, s, i]) => s1Egg(p, x, y, s, i * 40, { seed: i })).join(''),
            s1Negi(p, 102, 100, 48, 44, 9, { r: 2.6 }),
        ].join('');
    },

    // 切り干し大根の煮物: 鉄釉の小鉢に、薄茶でちぢれた切り干し大根、にんじん、油揚げ
    kiriboshi: p => {
        const R = rng(p.id + 'kb');
        let st = '';
        const kc = ['#cfa468', '#b98a50', '#dcbb86', '#c49658'];
        for (const [x, y] of s1Pts(R, 62, 100, 100, 54, 50)) st += s1Q(x, y, 22 + R() * 14, 2.4, R() * 180, kc[Math.floor(R() * 4)], R, { bend: 1.1, outline: '#8a6034' });
        const carrots = s1Pts(R, 12, 100, 100, 48, 44).map(([x, y]) => s1Stick(p, x, y, 20 + R() * 6, 3.6, R() * 180, '#ec7a2c', { gloss: .5 })).join('');
        const age = s1Pts(R, 7, 100, 100, 44, 40).map(([x, y]) => s1Age(p, x, y, 20, 7, R() * 180, { c: '#c28a40' })).join('');
        const shine = s1Pts(R, 10, 100, 100, 46, 42).map(([x, y]) => `<path d="M${f(x - 3)},${f(y)} q3,-2 6,0" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`).join('');
        return [
            K.kobachi(p, { glaze: '#8a5236', inside: '#efe5d3' }),
            K.liquid(p, { R: 64, c: '#c4904a', op: .7, shine: false }),
            `<g ${p.sh(1.1)}>`, s1Mound(p, 100, 100, 56, 52, '#b08250', { seed: 5 }), st, age, carrots, `</g>`, shine,
        ].join('');
    },

    // ほうれん草の胡麻和え: 黒釉の小鉢に、すりごまの衣をまとったほうれん草の山、白ごま
    gomaae: p => {
        const R = rng(p.id + 'gm');
        let g = '';
        for (const [x, y] of s1Pts(R, 14, 100, 100, 44, 40)) g += s1Leaf(p, x, y, 34 + R() * 8, R() * 360, R() < .5 ? '#2f7a2c' : '#3c8c33');
        for (const [x, y] of s1Pts(R, 10, 100, 100, 44, 40)) g += s1Stick(p, x, y, 28 + R() * 6, 4.6, R() * 180, '#8fc05a', { gloss: .4 });
        let coat = '';
        for (const [x, y] of s1Pts(R, 12, 100, 100, 42, 38)) coat += `<path ${T(x, y)} d="${smooth(ring(6 + R() * 5, 7, .5, R))}" fill="#c9a068" opacity=".75"/>`;
        return [
            K.kobachi(p, { glaze: '#2f2b29', inside: '#ece5d7' }),
            `<g ${p.sh(1.2)}>`, s1Mound(p, 100, 100, 58, 52, '#2a5a25', { seed: 6 }), g, `</g>`,
            s1Mound(p, 100, 100, 56, 50, '#c49c62', { seed: 6, op: .3 }),
            `<g ${p.rough(2.5, .14)}>`, coat, `</g>`,
            K.sprinkle(p, 100, 100, 100, { c: '#7a5630', n: 70, r: .9 }),
            s1Sesame(p, 100, 98, 44, 40, 24, { c: '#f3e3bd' }),
        ].join('');
    },
};
