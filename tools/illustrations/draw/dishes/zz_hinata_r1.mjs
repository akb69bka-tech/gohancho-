// 江口 ひなた 案（再審査で採用: 玉ねぎ漬け=第1回b、ほうれん草のソテー=第1回）。統合は白石
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const INDIGO = '#2c4c7c';

function spots(seed, n, R, minD, { cx = 100, cy = 100, sy = 1 } = {}){
    const r = rng(seed), out = [];
    let d = minD, tries = 0;
    while (out.length < n && tries < 6000){
        tries++;
        const a = r() * 6.283, rr = Math.sqrt(r()) * R, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * sy;
        if (out.every(([px, py]) => Math.hypot(px - x, py - y) >= d)) out.push([x, y, r() * 360]);
        if (tries % 300 === 0) d *= .9;
    }
    return out;
}

function beads(p, x, y, s, { n = 10, c = '#f0b84a', op = .7, rmax = 2.6, seed = 1 } = {}){
    const r = rng(p.id + 'bd' + seed);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = r() * 6.283, d = Math.sqrt(r()) * s / 2, rr = 1.1 + r() * rmax, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
        o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".3"/><circle cx="${f(cx - rr * .35)}" cy="${f(cy - rr * .35)}" r="${f(rr * .32)}" fill="#fff" opacity=".85"/>`;
    }
    return o;
}

function sheen(cx, cy, R, op = .45){
    return `<path d="M${f(cx - R * .62)},${f(cy - R * .3)} A${f(R * .72)},${f(R * .72)} 0 0 1 ${f(cx - R * .15)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}

function whiteBowl(p, { R = 92, band = '#b8321f', inside = '#f6f3ec', line = null, dots = null } = {}){
    const dd = dots ? Array.from({ length: 30 }, (_, i) => { const a = i / 30 * 6.283; return `<circle cx="${f(100 + Math.cos(a) * (R - 5))}" cy="${f(100 + Math.sin(a) * (R - 5))}" r="1.7" fill="${dots}"/>`; }).join('') : '';
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${band}" stroke-width="3.2"/>
        ${line ? `<circle cx="100" cy="100" r="${R - 8.5}" fill="none" stroke="${line}" stroke-width="1.1"/>` : ''}${dd}
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg(inside, .1, .24, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}

function broth(p, R, c, { glow = .3, op = 1 } = {}){
    return `<circle cx="100" cy="100" r="${R}" fill="${p.rg(c, glow, .3, .42, .4)}" opacity="${op}"/>`;
}

function slice(x, y, rr, c, { inner = null, seeds = '#f6efc0', stroke = null, n = 0 } = {}){
    let s = '';
    for (let i = 0; i < n; i++){ const a = i / n * 6.283; s += `<circle cx="${f(x + Math.cos(a) * rr * .45)}" cy="${f(y + Math.sin(a) * rr * .45)}" r="${f(rr * .16)}" fill="${seeds}"/>`; }
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${inner || lt(c, .5)}" stroke="${stroke || c}" stroke-width="${f(Math.max(1, rr * .3))}"/>${s}`;
}

function onionPickle(p, x, y, s, r, seed){
    const R = rng(p.id + 'opk' + seed);
    const band = (r1, r2, a) => {
        const a0 = -a / 2, a1 = a / 2, P = (rr, t) => [f(Math.cos(t) * rr), f(Math.sin(t) * rr)];
        const [x1, y1] = P(r2, a0), [x2, y2] = P(r2, a1), [x3, y3] = P(r1, a1), [x4, y4] = P(r1, a0);
        return `M${x1},${y1} A${r2},${r2} 0 0 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 0 ${x4},${y4}Z`;
    };
    const R0 = s * 1.1, th = s * .2, ang = s / R0 * .95 + R() * .1;
    const tones = ['#f2d496', '#ecc67e', '#f6dca8'];
    let layers = '';
    for (let i = 0; i < 3; i++){
        const r1 = R0 + i * th, r2 = r1 + th * .92, c = tones[(i + seed) % 3];
        layers += `<path d="${band(r1, r2, ang)}" fill="${p.g(c, .3, .25)}" stroke="#8a5a22" stroke-width=".8" stroke-linejoin="round"/>`;
        layers += `<path d="M${f(Math.cos(-ang * .38) * (r2 - 1.4))},${f(Math.sin(-ang * .38) * (r2 - 1.4))} A${f(r2 - 1.4)},${f(r2 - 1.4)} 0 0 1 ${f(Math.cos(ang * .1) * (r2 - 1.4))},${f(Math.sin(ang * .1) * (r2 - 1.4))}" stroke="#fffbea" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>`;
    }
    // 帯の中心が (0,0) にくるようにずらす
    return `<g ${T(x, y, r)}><g transform="translate(${f(-(R0 + th * 1.5))} 0)"><g ${p.sh(.7)}>${layers}</g></g></g>`;
}

function kr_yangpajangajji(p){
    const out = [whiteBowl(p, { band: INDIGO, line: INDIGO }),
        // 醤油・酢・砂糖の漬け汁（明るめの醤油色。玉ねぎより暗く、器より暗い中間の明るさ）
        broth(p, 70, '#8a5226', { glow: .3 }),
        `<circle cx="100" cy="100" r="62" fill="#a8682e" opacity=".2"/>`];
    const pos = [[76, 76, 30], [124, 72, 120], [70, 120, 200], [118, 122, 300], [100, 98, 70], [100, 60, 180], [142, 100, 260], [58, 98, 10], [100, 140, 100]];
    out.push(...pos.map(([x, y, r], i) => onionPickle(p, x, y, 30, r, i)));
    // 青唐辛子（チョンヤンコチュ）の輪切り: 大きめ・明るい緑で、玉ねぎと色で分ける
    const chili = [[90, 82], [116, 96], [80, 106], [128, 130], [64, 134], [134, 64], [104, 120], [146, 116]];
    out.push(`<g ${p.sh(.4)}>${chili.map(([x, y], i) => slice(x, y, 6 + (i % 2), '#2f8a24', { inner: '#cde89a', n: 5, seeds: '#fbf6d0' })).join('')}</g>`);
    out.push(sheen(100, 100, 70, .55));
    return out.join('');
}

function spLeaf(p, x, y, s, r, c, seed){
    const R = rng(p.id + 'spl' + seed);
    const k = s / 20;
    const a = 7 + R() * 2, b = 5 + R() * 2;
    const d = `M${f(-a - 3)},${f((R() - .5) * 2)} Q${f(-a)},${f(-b - 1)} ${f(-1)},${f(-b)} Q${f(a)},${f(-b + R() * 2)} ${f(a + 4)},${f((R() - .5) * 3)} Q${f(a)},${f(b)} ${f(-1)},${f(b + 1)} Q${f(-a)},${f(b - 1)} ${f(-a - 3)},${f((R() - .5) * 2)}Z`;
    return `<g ${T(x, y, r, k)}><path d="M${f(-a - 3)},0 L${f(-a - 6)},${f((R() - .5) * 2)}" stroke="#8fb85a" stroke-width="1.5" stroke-linecap="round"/>
        <path d="${d}" fill="${p.g(c, .34, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/>
        <path d="M${f(-a - 1)},0 Q0,${f((R() - .5) * 2)} ${f(a + 2)},0" stroke="${lt(c, .3)}" stroke-width=".7" fill="none" opacity=".55"/>
        <path d="M${f(-a * .7)},${f(-b * .5)} Q${f(-a * .1)},${f(-b * .95)} ${f(a * .5)},${f(-b * .7)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}

function it_spinaci(p){
    const R = rng(p.id + 'spn');
    const cols = ['#245c1c', '#2e6c22', '#3a7c2a', '#4a8c32', '#5a9a3a'];
    const leaves = [];
    for (let i = 0; i < 52; i++){
        const a = R() * 6.283, d = Math.sqrt(R()) * 50, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d * .88;
        // 中心に近いほど明るい（上に重なる）葉
        const k = Math.min(4, Math.floor((1 - d / 50) * 4.6 + R() * .8));
        leaves.push({ x, y, r: R() * 360, s: 22 + R() * 12, c: cols[k], d });
    }
    leaves.sort((a, b) => b.d - a.d);   // まわりが下、中心が上
    const out = [K.plate(p, { well: .8 }),
        // 皿にしみ出したオリーブオイルと水分
        `<path d="${smooth(ring(60, 11, .12, rng('spo'), 1, .92))}" transform="translate(100 102)" fill="#c4cf72" opacity=".28"/>`,
        `<path d="${smooth(ring(52, 11, .15, rng('spo2'), 1, .9))}" transform="translate(100 102)" fill="#1f4a14" opacity=".4"/>`];
    out.push(`<g ${p.sh(.8)}>${leaves.map((l, i) => spLeaf(p, l.x, l.y, l.s, l.r, l.c, i)).join('')}</g>`);
    // オリーブオイルのつや
    out.push(beads(p, 100, 100, 100, { n: 10, c: '#d8c24a', op: .55, rmax: 1.5, seed: 2 }));
    // ガーリック1片（色づいた）と唐辛子フレーク
    out.push(`<g ${T(108, 92, 25)}><g ${p.sh(.6)}><path d="M-8,0 Q-6,-6 1,-6 Q9,-5 8,1 Q5,6 -3,5 Q-8,4 -8,0Z" fill="${p.g('#f2dc9a', .35, .2)}" stroke="#b8923a" stroke-width=".8"/></g><path d="M-6,-1 Q0,-4 6,-1" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/><path d="M-6,2 Q-2,3.6 3,2.6" stroke="#c89a40" stroke-width=".8" fill="none"/></g>`);
    out.push(K.sprinkle(p, 100, 100, 90, { c: '#d42a1c', n: 12, r: .8 }));
    return out.join('');
}

export default {
    kr_yangpajangajji: p => kr_yangpajangajji(p),
    it_spinaci: p => it_spinaci(p),
};
