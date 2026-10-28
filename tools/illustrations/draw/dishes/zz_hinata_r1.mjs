// 江口 ひなた 案（第1回競作で採用された3品: 酸辣湯・フール・バルク）。器の縁は統一画風の藍にそろえた（白石）
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

function lemonWedge(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-11,3 A11,10 0 0 1 11,3 Q0,8 -11,3Z" fill="#e6b81c" stroke="#b88a0c" stroke-width=".6"/></g>
        <path d="M-8.6,3 A8.6,7.6 0 0 1 8.6,3 Q0,6.4 -8.6,3Z" fill="${p.g('#f9e063', .35, .12)}"/>
        ${[-50, -25, 0, 25, 50].map(a => `<path transform="rotate(${a} 0 4)" d="M0,4 L0,-3.4" stroke="#fff6c6" stroke-width=".8"/>`).join('')}
        <path d="M-7,1.6 Q-2,-2 4,-1.4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}

function strip(p, x, y, L, w, r, c, { bend = .15, edge = null, gloss = .5 } = {}){
    const h = w / 2, b = L * bend * .15;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},${-h} Q0,${f(-h - b)} ${L / 2},${-h} Q${f(L / 2 + 1.2)},0 ${L / 2},${h} Q0,${f(h - b)} ${-L / 2},${h} Q${f(-L / 2 - 1.2)},0 ${-L / 2},${-h}Z" fill="${p.g(c, .3, .24)}" stroke="${edge || dk(c, .32)}" stroke-width=".5"/><path d="M${f(-L * .36)},${f(-h * .3)} Q0,${f(-h * .6 - b)} ${f(L * .3)},${f(-h * .3)}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity="${gloss}"/></g>`;
}

function eggWisp(p, x, y, L, r, seed){
    const R = rng(p.id + 'egw' + seed);
    const pts = ring(L / 2, 14, .32, R, 1, .5);
    const d = smooth(pts, true, .8);
    return `<g ${T(x, y, r)}><path d="${d}" fill="#f4d466" opacity=".5" transform="scale(1.1 1.35)"/><path d="${d}" fill="${p.g('#f8dc78', .4, .12)}" stroke="#d8aa3c" stroke-width=".6" opacity=".92"/>
        <path d="M${f(-L * .3)},${f(-1)} Q0,${f(-3 - R() * 2)} ${f(L * .28)},${f(1)}" stroke="#fff6c8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M${f(-L * .2)},${f(2.4)} Q${f(L * .04)},${f(.6)} ${f(L * .24)},${f(2.6)}" stroke="#e0b440" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}

function sanratan(p){
    const R = rng(p.id + 'st');
    const tf = [], sh = [], bm = [];
    for (let i = 0; i < 40; i++){
        const a = R() * 6.283, d = Math.sqrt(R()) * 58, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d, r = R() * 180, t = R();
        if (t < .4) tf.push(strip(p, x, y, 20 + R() * 6, 4.4, r, '#f7f1e0', { edge: '#cdbf9c' }));
        else if (t < .7) sh.push(strip(p, x, y, 17 + R() * 5, 3.8, r, '#6a4126', { edge: '#2e1a0c', gloss: .35 }));
        else bm.push(strip(p, x, y, 16 + R() * 5, 3.6, r, '#efdc9c', { edge: '#bfa660' }));
    }
    const eggs = [[88, 86, 20, 40], [120, 76, -25, 34], [74, 120, 55, 32], [124, 124, -35, 36], [100, 106, 90, 28], [66, 90, -70, 26], [138, 100, 80, 24]]
        .map(([x, y, r, L], i) => eggWisp(p, x, y, L, r, i));
    return [
        whiteBowl(p, { band: INDIGO, line: INDIGO }),
        broth(p, 76, '#a8642a', { glow: .4 }),
        `<circle cx="100" cy="100" r="66" fill="#c98a3e" opacity=".22"/>`,
        `<g ${p.sh(.4)}>${bm.join('')}${sh.join('')}${tf.join('')}</g>`,
        `<g ${p.sh(.4)}>${eggs.join('')}</g>`,
        // 酢と黒こしょうのとろみ: 表面に透ける面と、赤いラー油の粒
        `<circle cx="100" cy="100" r="76" fill="#d49a48" opacity=".1"/>`,
        beads(p, 100, 100, 130, { n: 26, c: '#e2381a', op: .8, rmax: 2.4, seed: 2 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a1d14', n: 40, r: .6 }),
        K.sprinkle(p, 100, 100, 110, { c: '#f4ecd8', n: 20, r: .6 }),
        sheen(100, 100, 76, .5),
    ].join('');
}

function fulBean(p, x, y, s, r, seed){
    const k = s / 14;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M-7,0 Q-6,-5 0,-5.4 Q6.4,-5 7.4,0 Q6,5 0,5.4 Q-6,4.6 -7,0Z" fill="${p.g('#9a6a3a', .35, .3)}" stroke="#4a2a10" stroke-width=".7"/></g><path d="M-3,-3 Q0,-4.4 3.6,-3" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/><path d="M-4.6,.4 Q-5,-1.6 -3.6,-2.8" stroke="#d8b080" stroke-width=".8" fill="none"/></g>`;
}

function tomatoDice(p, x, y, s, r){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="1.4" fill="${p.g('#e04030', .35, .2)}" stroke="#a42216" stroke-width=".6"/></g><path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .1)},${f(-s * .32)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".75"/></g>`;
}

function parsleyBit(p, x, y, s, r){
    return `<g ${T(x, y, r)}><path d="M0,0 Q${-s * .4},${-s * .5} ${-s * .1},${-s} Q${s * .3},${-s * .6} 0,0Z" fill="#3f9a2c" stroke="#256a18" stroke-width=".4"/><path d="M0,0 Q${s * .5},${-s * .1} ${s * .8},${-s * .5} Q${s * .5},${-s * .9} 0,0Z" fill="#4fae3a" stroke="#256a18" stroke-width=".4"/></g>`;
}

function eg_ful(p){
    const out = [K.bowl(p, { R: 92, glaze: '#cfd6dc', inside: '#eef0f1', lip: .9 }),
        `<circle cx="100" cy="100" r="82" fill="none" stroke="${INDIGO}" stroke-width="2.2" opacity=".9"/>`,
        // 煮て軽くつぶしたそら豆（濃い茶のペースト）
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#9a6a38', .25, .3, .42, .4)}"/>`];
    const R = rng('fulmash2');
    let mash = '';
    for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 68; mash += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d)} d="${smooth(ring(4 + R() * 6, 7, .5, R))}" fill="${R() < .5 ? '#b8834a' : '#7a4c24'}" opacity=".55"/>`; }
    out.push(mash);
    // 丸のまま残した豆
    const beans = spots('fulb', 30, 68, 14);
    out.push(...beans.map(([x, y, r], i) => fulBean(p, x, y, 14, r, i)));
    // オリーブオイルのつや（金色）
    out.push(`<path d="${smooth(ring(34, 9, .35, rng('fuloil'), 1, .85))}" transform="translate(100 100)" fill="#f2c438" opacity=".45"/>`,
        beads(p, 100, 100, 74, { n: 12, c: '#f4cc40', op: .75, rmax: 2.6, seed: 4 }));
    // クミンと唐辛子フレーク
    out.push(K.sprinkle(p, 100, 100, 110, { c: '#6a3a14', n: 20, r: .9 }), K.sprinkle(p, 100, 100, 80, { c: '#c8301a', n: 14, r: .9 }));
    // 角切りトマトとパセリを中央に
    const td = spots('fult', 8, 26, 10);
    out.push(...td.map(([x, y, r]) => tomatoDice(p, x, y, 8.5, r)));
    const pb = spots('fulp', 12, 30, 9);
    out.push(...pb.map(([x, y, r]) => parsleyBit(p, x, y, 6.5, r)));
    // ふちに添えたレモン
    out.push(lemonWedge(p, 148, 150, 34, -35));
    out.push(sheen(100, 100, 76, .35));
    return out.join('');
}

function fishFlake(p, x, y, s, r, seed){
    const R = rng(p.id + 'ff' + seed);
    const pts = ring(s / 2, 7, .3, R, 1.25, .85);
    const d = smooth(pts, true, .65);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${d}" fill="${p.g('#fbf1d8', .14, .22)}" stroke="#c8b690" stroke-width=".8"/></g>
        <path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .05)},${f(-s * .26)} ${f(s * .3)},${f(-s * .08)} M${f(-s * .26)},${f(s * .16)} Q${f(s * .04)},${f(s * .04)} ${f(s * .32)},${f(s * .18)} M${f(-s * .1)},${f(s * .3)} Q${f(s * .08)},${f(s * .24)} ${f(s * .22)},${f(s * .32)}" stroke="#dccaa2" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-s * .34)},${f(-s * .18)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .18)},${f(-s * .28)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}

function cube(p, x, y, s, r, c){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="1.8" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g><path d="M${f(-s * .32)},${f(-s * .3)} L${f(s * .12)},${f(-s * .32)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".75"/></g>`;
}

function tr_balik(p){
    const out = [whiteBowl(p, { band: INDIGO, line: null, dots: INDIGO }),
        // 卵黄とレモンでとろみをつけた、なめらかなクリーム色のスープ
        broth(p, 74, '#f0dc94', { glow: .3 }),
        `<circle cx="100" cy="100" r="68" fill="#f8ecb4" opacity=".4"/>`];
    const fish = spots('trb', 8, 48, 26);
    out.push(...fish.map(([x, y, r], i) => fishFlake(p, x, y, 32 + (i % 3) * 2, r, i)));
    const pots = spots('trp', 9, 54, 17);
    pots.forEach(([x, y, r], i) => out.push(cube(p, x, y, 9.5, r, i % 2 ? '#f2d278' : '#e8c668')));
    const ca = spots('trc', 8, 54, 17);
    ca.forEach(([x, y, r]) => out.push(cube(p, x, y, 8.5, r, '#ee7a26')));
    // ゆるいとろみのつや・黒こしょう・刻みパセリ
    out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 18, r: .7 }));
    const ps = spots('trs', 26, 60, 8);
    out.push(...ps.map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M0,0 Q-2,-3 0,-4.6 Q2.4,-3 0,0Z" fill="#46a032"/><path d="M0,0 Q3,-1 4,-3 Q2,-4.6 0,0Z" fill="#5fb844"/></g>`));
    out.push(beads(p, 100, 100, 110, { n: 8, c: '#f2c85a', op: .55, rmax: 1.6, seed: 2 }));
    out.push(lemonWedge(p, 146, 142, 32, -40), sheen(100, 100, 74, .5));
    return out.join('');
}

export default {
    sanratan: p => sanratan(p),
    eg_ful: p => eg_ful(p),
    tr_balik: p => tr_balik(p),
};
