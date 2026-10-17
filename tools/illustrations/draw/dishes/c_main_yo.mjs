// 主菜（洋食・肉のおかず）
import * as K from '../kit.mjs';
const { smooth, ring, rng, lt, dk, mix, T, f } = K;

// ---------- この盛りつけファイル専用の部品（yo〜） ----------
// ぼかし（焼き色・ソースのにじみ）
const yoBlur = (p, s = 2) => `filter="url(#${p.def('yobl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

// 1枚の肉・カツを包丁で切りそろえたもの（L×W の長円を n 切れ、切れ目に断面）
// とんかつ・チキン南蛮・照り焼きに使う
function yoSliced(p, x, y, L, W, r, n, { c = '#d39a48', face = '#f4e6d2', fat = null, crumb = .75, seed = 1, gap = 2.2, jitter = .08, gloss = .5, char = 0, rough = 0, stagger = 1, faceW = .3, boxy = 0 } = {}){
    const R = rng(p.id + 'ysl' + seed);
    const pts = boxy ? Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, cx = Math.cos(a), cy = Math.sin(a), j = 1 + (R() - .5) * jitter; return [Math.sign(cx) * Math.abs(cx) ** boxy * L / 2 * j, Math.sign(cy) * Math.abs(cy) ** boxy * W / 2 * j]; }) : ring(1, 14, jitter, R, L / 2, W / 2);
    const shape = smooth(pts);
    const inner = smooth(pts.map(([a, b]) => [a * .97, b * .8]));
    const cs = p.def('ysls' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    const ci = p.def('ysli' + seed, id => `<clipPath id="${id}"><path d="${inner}"/></clipPath>`);
    const bw = L / n;
    let out = '';
    for (let i = 0; i < n; i++){
        const x0 = -L / 2 + i * bw;
        const cb = p.def(`yslb${seed}-${i}`, id => `<clipPath id="${id}"><rect x="${f(x0 + (i ? gap / 2 : -4))}" y="${f(-W)}" width="${f(bw - (i ? gap / 2 : -4) - (i < n - 1 ? gap / 2 : -4))}" height="${f(W * 2)}"/></clipPath>`);
        const dy = stagger * (i % 2 ? .9 : -.5) + (R() - .5) * stagger, dx = (i - (n - 1) / 2) * .5;
        const fw = Math.min(bw * faceW, 5);
        let marks = '';
        for (let j = 0; j < char; j++) marks += `<ellipse cx="${f(x0 + fw + R() * (bw - fw))}" cy="${f((R() - .5) * W * .7)}" rx="${f(2 + R() * 3)}" ry="${f(1.2 + R() * 1.6)}" fill="${dk(c, .55)}" opacity="${f(.25 + R() * .3)}"/>`;
        out += `<g transform="translate(${f(dx)} ${f(dy)})"><g clip-path="url(#${cb})"><g clip-path="url(#${cs})">
            <g ${crumb ? p.crumb(crumb) : rough ? p.rough(rough, .15) : ''}><path d="${shape}" fill="${p.g(c, .32, .32)}"/></g>
            ${marks}
            ${i ? `<g clip-path="url(#${ci})"><rect x="${f(x0 + gap / 2 - .5)}" y="${f(-W / 2)}" width="${f(fw)}" height="${W}" fill="${p.g(face, .2, .15)}"/>
                ${fat ? `<rect x="${f(x0 + gap / 2 - .5)}" y="${f(-W / 2)}" width="${f(fw)}" height="${f(W * .26)}" fill="${fat}"/>` : ''}
                <path d="M${f(x0 + gap / 2 + fw - .3)},${f(-W / 2)} L${f(x0 + gap / 2 + fw - .3)},${f(W / 2)}" stroke="${dk(c, .2)}" stroke-width=".9" opacity=".6"/></g>` : ''}
            <path d="M${f(x0 + fw + 1.5)},${f(-W * .3)} Q${f(x0 + bw * .62)},${f(-W * .42)} ${f(x0 + bw - 2)},${f(-W * .28)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${gloss}"/>
            <path d="${shape}" fill="none" stroke="${dk(c, .4)}" stroke-width="1.6"/>
            <rect x="${f(x0)}" y="${f(-W)}" width="${f(bw)}" height="${f(W * 2)}" fill="none" stroke="${dk(c, .35)}" stroke-width="1.4"/>
        </g></g></g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}>${out}</g></g>`;
}

// むね肉のそぎ切り（ピカタ・ねぎ塩）
function yoBreast(p, x, y, w, h, r = 0, { c = '#ecd3a6', brown = '#c08a45', seed = 1, nb = 4, jit = .22 } = {}){
    const R = rng(p.id + 'ybr' + seed + x + y);
    const pts = ring(1, 13, jit, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < nb; i++) spots += `<ellipse cx="${f((R() - .5) * w * .6)}" cy="${f((R() - .5) * h * .5)}" rx="${f(w * (.1 + R() * .12))}" ry="${f(h * (.08 + R() * .1))}" fill="${brown}" opacity="${f(.35 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .15, .12)}" stroke="${dk(c, .4)}" stroke-width=".8"/>
        <g ${yoBlur(p, 1.6)}><path d="${smooth(pts.map(([a, b]) => [a * .93, b * .9]))}" fill="none" stroke="${brown}" stroke-width="3.4" opacity=".6"/>${spots}</g>
        <path d="M${f(-w * .3)},${f(-h * .22)} Q${f(-w * .08)},${f(-h * .34)} ${f(w * .16)},${f(-h * .28)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}

// 小さな不定形のつぶ（ねぎ塩・タルタルの具・トマトの角切り）
function yoBits(p, x, y, s, n, cols, { seed = 1, size = 1.8, sy = .8 } = {}){
    const R = rng(p.id + 'ybt' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, col = cols[Math.floor(R() * cols.length)];
        out += `<rect ${T(x + Math.cos(a) * d, y + Math.sin(a) * d * sy, R() * 360)} x="${-size}" y="${f(-size * .7)}" width="${2 * size}" height="${f(size * 1.4)}" rx="${f(size * .4)}" fill="${col}" stroke="${dk(col, .2)}" stroke-width=".3"/>`;
    }
    return out;
}

// タルタルソース（白いソースに刻んだゆで卵・玉ねぎ・パセリ）
function yoTartar(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'ytt' + seed);
    const body = smooth(ring(1, 12, .22, R, w / 2, h / 2));
    let bits = '';
    for (let i = 0; i < 16; i++){
        const bx = (R() - .5) * w * .72, by = (R() - .5) * h * .62, k = R();
        const col = k < .45 ? '#f6c23e' : k < .75 ? '#ffffff' : k < .88 ? '#e6edc8' : '#4f9a34';
        bits += `<path ${T(bx, by, R() * 360)} d="${smooth(ring(col === '#4f9a34' ? 1 : 1.6 + R() * 1.4, 5, .5, R), true, .7)}" fill="${col}" stroke="${dk(col, .18)}" stroke-width=".35"/>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${body}" fill="${p.rg('#fbf6e4', .2, .12, .38, .34)}" stroke="#e3d9bd" stroke-width=".7"/></g>
        ${bits}
        <path d="M${f(-w * .3)},${f(-h * .18)} Q${f(-w * .1)},${f(-h * .38)} ${f(w * .18)},${f(-h * .32)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}

// つやのある照りソース（デミグラス・ケチャップソース）を具の上にかける
function yoSauceTop(p, x, y, w, h, r = 0, { c = '#5a2a12', seed = 1, op = .95, drips = 5 } = {}){
    const R = rng(p.id + 'yst' + seed);
    const pts = ring(1, 11, .22, R, w / 2, h / 2);
    let dr = '';
    for (let i = 0; i < drips; i++){
        const a = R() * 6.28, px = Math.cos(a) * w / 2 * .9, py = Math.sin(a) * h / 2 * .9;
        dr += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(3 + R() * 3)}" ry="${f(2.4 + R() * 2)}" fill="${c}"/>`;
    }
    return `<g ${T(x, y, r)} opacity="${op}"><path d="${smooth(pts)}" fill="${p.rg(c, .22, .25, .4, .36)}"/>${dr}
        <path d="M${f(-w * .3)},${f(-h * .16)} Q${f(-w * .12)},${f(-h * .36)} ${f(w * .14)},${f(-h * .32)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(w * .05)},${f(h * .12)} Q${f(w * .18)},${f(h * .04)} ${f(w * .26)},${f(h * .1)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}

// にんじんのグラッセ（面取りした丸いにんじん、照り）
function yoGlace(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f(-s / 2)}" y="${f(-s * .34)}" width="${s}" height="${f(s * .68)}" rx="${f(s * .32)}" fill="${p.g('#f07a26', .3, .25)}" stroke="#b9531a" stroke-width=".7"/></g>
        <ellipse cx="${f(s * .18)}" cy="0" rx="${f(s * .2)}" ry="${f(s * .22)}" fill="#f6a35a" opacity=".7"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .05)},${f(-s * .3)} ${f(s * .22)},${f(-s * .2)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}

// ロールキャベツ（葉で巻いた俵形。葉脈と巻き終わり）
function yoRoll(p, x, y, L, W, r = 0, { seed = 1, c = '#cfd68a' } = {}){
    const R = rng(p.id + 'yrl' + seed);
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.28, cx = Math.cos(a), cy = Math.sin(a); return [Math.sign(cx) * Math.abs(cx) ** .55 * L / 2 * (1 + (R() - .5) * .04), Math.sign(cy) * Math.abs(cy) ** .7 * W / 2 * (1 + (R() - .5) * .06)]; });
    const shape = smooth(pts);
    const cl = p.def('yrlc' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    let br = '';
    for (let i = 0; i < 4; i++){ const t = -.3 + i * .2; br += `<path d="M${f(L * t)},${f(W * (-.04 + t * .2))} q${f(L * .08)},${f(-W * .3)} ${f(L * .18)},${f(-W * .5)} M${f(L * t)},${f(W * (-.04 + t * .2))} q${f(L * .07)},${f(W * .3)} ${f(L * .16)},${f(W * .5)}" stroke="${lt(c, .5)}" stroke-width="1.2" fill="none" opacity=".8"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${shape}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .32)}" stroke-width=".9"/></g>
        <g clip-path="url(#${cl})">
            <rect x="${-L / 2}" y="${f(W * .18)}" width="${L}" height="${f(W * .4)}" fill="${dk(c, .2)}" opacity=".35"/>
            <rect x="${-L / 2}" y="${f(-W * .42)}" width="${L}" height="${f(W * .2)}" fill="${lt(c, .3)}" opacity=".4"/>
            <path d="M${f(L * .22)},${f(-W * .6)} C${f(L * .32)},${f(-W * .1)} ${f(L * .16)},${f(W * .2)} ${f(L * .3)},${f(W * .6)}" stroke="${dk(c, .3)}" stroke-width="1" fill="none"/>
            <path d="M${f(L * .22)},${f(-W * .6)} C${f(L * .32)},${f(-W * .1)} ${f(L * .16)},${f(W * .2)} ${f(L * .3)},${f(W * .6)} L${f(L * .6)},${f(W * .6)} L${f(L * .6)},${f(-W * .6)}Z" fill="${lt(c, .12)}" opacity=".5"/>
            <path d="M${f(-L * .5)},${f(W * .1)} Q${f(-L * .1)},${f(-W * .08)} ${f(L * .24)},${f(-W * .02)}" stroke="${lt(c, .55)}" stroke-width="${f(W * .1)}" fill="none" stroke-linecap="round" opacity=".85"/>
            ${br}
        </g>
        <path d="M${f(-L * .36)},${f(-W * .3)} Q${f(-L * .05)},${f(-W * .44)} ${f(L * .2)},${f(-W * .36)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// 厚めのベーコン（波打つ短冊）
function yoBacon(p, x, y, w, h, r = 0){
    const top = `M${-w / 2},${-h / 2} Q${-w / 4},${-h / 2 - 2} 0,${-h / 2} T${w / 2},${-h / 2}`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${top} L${w / 2},${h / 2} Q${w / 4},${h / 2 + 2} 0,${h / 2} T${-w / 2},${h / 2}Z" fill="${p.g('#c25a44', .25, .25)}" stroke="#8c3727" stroke-width=".6"/></g>
        <path d="M${-w / 2 + 1},${f(-h * .05)} Q${-w / 4},${f(-h * .2)} 0,${f(-h * .05)} T${w / 2 - 1},${f(-h * .05)}" stroke="#f3dcc4" stroke-width="${f(h * .26)}" fill="none"/>
        <path d="M${-w / 2 + 1},${f(h * .32)} L${w / 2 - 1},${f(h * .32)}" stroke="#ecc9b0" stroke-width="${f(h * .1)}" opacity=".8"/></g>`;
}

// つまようじ
function yoPick(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 L${L / 2},0" stroke="#b58a52" stroke-width="2.6" stroke-linecap="round"/><path d="M${-L / 2},0 L${L / 2},0" stroke="#e8c98f" stroke-width="1.6" stroke-linecap="round"/></g>`;
}

// ローリエ
function yoBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-2,-6 10,0 Q-2,6 -10,0Z" fill="${p.g('#6f8a43', .25, .25)}" stroke="#4a5f2a" stroke-width=".6"/><path d="M-9,0 L9,0" stroke="#a8bb7a" stroke-width=".7"/></g>`;
}

// ピーマンの肉詰め（縦半分、肉の面を上に）
function yoPiman(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'ypm' + seed);
    const pts = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.28, wob = 1 + Math.sin(a * 3 + 1) * .05 + (R() - .5) * .05; return [Math.cos(a) * L / 2 * wob * (Math.cos(a) > 0 ? 1 : .94), Math.sin(a) * W / 2 * wob]; });
    const outer = smooth(pts);
    const inner = smooth(pts.map(([a, b]) => [a * .86 - 1, b * .78]));
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${outer}" fill="${p.g('#2f7d2a', .35, .3)}" stroke="#1d4f1a" stroke-width=".8"/></g>
        <path d="M${f(-L / 2 + 2)},${f(-W * .24)} Q${f(-L * .1)},${f(-W * .52)} ${f(L * .3)},${f(-W * .4)}" stroke="#9fd06c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
        <g ${p.rough(1.6, .2)}><path d="${inner}" fill="${p.g('#7b4223', .25, .3)}" stroke="#4a2410" stroke-width=".6"/></g>
        <g ${p.crumb(.8)}><path d="${smooth(pts.map(([a, b]) => [a * .7 - 1, b * .6]))}" fill="#8e5230" opacity=".7"/></g>
        <rect x="${f(L / 2 - 4)}" y="-3" width="7" height="6" rx="2" fill="${p.g('#7a8a3a', .3, .3)}" stroke="#4b5520" stroke-width=".5"/>
        <path d="M${f(-L * .26)},${f(-W * .16)} Q${f(-L * .05)},${f(-W * .28)} ${f(L * .16)},${f(-W * .18)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}

// 大きめのかつお節（ひらひら）
function yoBonito(p, x, y, s, { n = 12, seed = 1 } = {}){
    const R = rng(p.id + 'ybn' + seed);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, col = R() < .5 ? '#e7b394' : '#d49573';
        out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360, .9 + R() * .5)} d="M-5,-2 Q-1,-4.5 5,-2.5 Q4,1 5,3 Q0,1.5 -4.5,3 Q-3,0 -5,-2Z" fill="${col}" stroke="${dk(col, .25)}" stroke-width=".35" opacity=".96"/>`;
    }
    return out;
}

// トマトの角切り・煮崩れたトマト
function yoTomatoBits(p, x, y, s, n, { seed = 1 } = {}){
    const R = rng(p.id + 'ytm' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, sz = 3 + R() * 3;
        out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(sz, 6, .4, R), true, .6)}" fill="${p.g('#d8382a', .3, .3)}" stroke="#9a1f15" stroke-width=".4"/>`;
    }
    return out;
}

// 千切りキャベツの山（軽量版: 線を減らし、1本1本を少し太く）
function yoCabbage(p, x, y, s, { seed = 1, sy = .8, k = .5 } = {}){
    const R = rng(p.id + 'ycb' + seed);
    let out = `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .25, R, 1, sy))}" fill="${p.rg('#e8f3d0', .3, .1)}"/>`;
    const n = Math.round(s * k);
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .46, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * Math.PI, L = 8 + R() * 11;
        const col = R() < .35 ? '#fbfdf2' : R() < .6 ? '#d4e9a8' : R() < .85 ? '#b5d67f' : '#8fbf5a';
        const x1 = cx - Math.cos(ang) * L / 2, y1 = cy - Math.sin(ang) * L / 2;
        out += `<path d="M${f(x1)},${f(y1)} q${f(Math.cos(ang + 1.3) * 2.4)},${f(Math.sin(ang + 1.3) * 2.4)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}" stroke="${col}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    }
    return `<g ${p.sh(.6)}><g ${p.sh(.25)}>${out}</g></g>`;
}

// レタス（ふちが波打つ葉）
function yoLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'ylt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="#eef8d8" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(i % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}

// ---------- 料理 ----------
const yoHole = (cx, cy, rx, ry) => `M${cx - rx},${cy} a${rx},${ry} 0 1 0 ${2 * rx},0 a${rx},${ry} 0 1 0 ${-2 * rx},0Z`;

export default {
    // 照り焼きチキン: 白い皿に、切り分けた鶏ももの照り焼き（皮に照り・焼き目）、たれ、ブロッコリー
    teriyaki: p => [
        K.plate(p),
        K.pool(p, 90, 110, 128, '#6e3510', { op: .85, seed: 2, sy: .64 }),
        yoSliced(p, 88, 106, 128, 70, -14, 6, { c: '#985020', face: '#d9a462', faceW: .15, crumb: 0, seed: 1, gap: 3.6, jitter: .12, boxy: .5, gloss: .85, char: 4 }),
        `<g ${p.sh(.8)}>`,
        K.broccoli(p, 146, 60, 30, 20), K.broccoli(p, 162, 90, 28, -30), K.broccoli(p, 142, 148, 28, 60),
        `</g>`,
        K.sesame(p, 86, 104, 70, { n: 10 }),
    ].join(''),

    // ハンバーグ: 焼き目のパティにデミグラスソース、にんじんのグラッセとブロッコリー
    hamburg: p => [
        K.plate(p, { rim: '#7a4a2a' }),
        K.pool(p, 86, 108, 126, '#5c2c12', { op: .9, seed: 3, sy: .78 }),
        K.patty(p, 84, 104, 112, 84, -8, { c: '#6e3b1d' }),
        yoSauceTop(p, 86, 100, 82, 58, -8, { c: '#55260e', seed: 1 }),
        `<g ${p.sh(.8)}>`,
        ...[[152, 66, 22], [166, 90, 20], [146, 88, 19]].map(([x, y, s]) => K.carrotRound(p, x, y, s, { c: '#f07a26' }) + `<ellipse cx="${x - s * .18}" cy="${y - s * .2}" rx="${s * .16}" ry="${s * .08}" fill="#fff" opacity=".8"/>`),
        K.broccoli(p, 154, 124, 30, 10), K.broccoli(p, 134, 150, 26, -40),
        `</g>`,
        K.parsley(p, 92, 94, 10),
    ].join(''),

    // クリームシチュー: 素焼き色の鉢に白いシチュー、鶏肉・じゃがいも・にんじん・ブロッコリーが半分沈む
    stew: p => [
        K.bowl(p, { glaze: '#b8794a', inside: '#f7f1e6' }),
        K.liquid(p, { R: 74, c: '#f1e0b8', op: 1, shine: false }),
        `<g ${p.sh(.7)}>`,
        K.chickenPiece(p, 70, 80, 34, 20, { c: '#ecd6b0', skin: '#ecd6b0', seed: 1 }),
        K.chickenPiece(p, 128, 122, 34, -40, { c: '#ecd6b0', skin: '#ecd6b0', seed: 2 }),
        K.chickenPiece(p, 122, 70, 30, 70, { c: '#ecd6b0', skin: '#ecd6b0', seed: 3 }),
        K.chickenPiece(p, 80, 134, 30, 160, { c: '#ecd6b0', skin: '#ecd6b0', seed: 4 }),
        K.potato(p, 100, 100, 38, 20, { c: '#f1d58e', seed: 1 }), K.potato(p, 64, 112, 32, -30, { c: '#f1d58e', seed: 2 }), K.potato(p, 142, 94, 32, 60, { c: '#f1d58e', seed: 3 }),
        K.potato(p, 108, 140, 28, 100, { c: '#f1d58e', seed: 4 }),
        K.carrotChunk(p, 94, 70, 22, 20), K.carrotChunk(p, 118, 112, 22, -50), K.carrotChunk(p, 148, 124, 20, 100), K.carrotChunk(p, 60, 92, 20, 40), K.carrotChunk(p, 96, 128, 18, 150),
        `</g>`,
        // 具のまわりにシチューがからむ
        `<g opacity=".92">`,
        ...[[86, 96, 18], [114, 120, 16], [128, 98, 14], [72, 148, 16], [146, 140, 14], [52, 114, 12], [138, 72, 12], [60, 72, 12]].map(([x, y, s], i) => K.pool(p, x, y, s * 1.6, '#f4e5c4', { seed: 10 + i, sy: .7 })),
        `</g>`,
        `<g ${p.sh(.7)}>`,
        K.broccoli(p, 80, 110, 28, 30), K.broccoli(p, 126, 96, 26, -20), K.broccoli(p, 104, 58, 24, 0), K.broccoli(p, 136, 146, 22, 50),
        `</g>`,
        `<path d="M44,86 A62,62 0 0 1 84,40" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.sprinkle(p, 100, 100, 120, { c: '#3a2a1a', n: 14, r: .5 }),
    ].join(''),

    // チキン南蛮: 甘酢にからめた鶏むねの揚げ物を切り分け、たっぷりのタルタル、千切りキャベツとトマト
    nanban: p => [
        K.plate(p),
        yoCabbage(p, 132, 62, 64, { seed: 4 }),
        K.cherryTomato(p, 162, 96, 20),
        K.pool(p, 86, 120, 110, '#a35a18', { op: .6, seed: 5, sy: .6 }),
        yoSliced(p, 86, 118, 126, 62, -18, 5, { c: '#c47c2c', face: '#f6ecdc', faceW: .2, crumb: 0, rough: 2.4, seed: 2, gap: 2.6, jitter: .16, gloss: .75, char: 3 }),
        yoTartar(p, 88, 114, 88, 42, -18, { seed: 1 }),
        K.sprinkle(p, 88, 114, 46, { c: '#3d8a2c', n: 12, r: .8 }),
    ].join(''),

    // マカロニグラタン: 白い楕円のグラタン皿、焼き色のついたチーズ、すき間にのぞくマカロニとホワイトソース、パセリ
    gratin: p => {
        const holes = [[64, 98, 11, 7], [138, 122, 12, 8], [118, 70, 10, 7], [90, 138, 11, 7], [148, 88, 8, 6]];
        const cheese = smooth(ring(1, 18, .14, rng('gratin-ch'), 72, 56).map(([a, b]) => [a + 100, b + 100])) + holes.map(h => yoHole(...h)).join('');
        return [
            K.ovalDish(p, { rx: 94, ry: 76, rim: null, deep: true, base: '#f5f1e8' }),
            `<ellipse cx="100" cy="100" rx="79" ry="63" fill="${p.rg('#f0dcae', .2, .2)}"/>`,
            `<g ${yoBlur(p, 2.5)}><ellipse cx="100" cy="100" rx="76" ry="60" fill="none" stroke="#b8742c" stroke-width="6" opacity=".55"/></g>`,
            ...holes.map(([x, y], i) => K.macaroni(p, x, y, 18, i * 70 + 20)),
            `<g ${p.sh(.5)}><g ${p.rough(3, .06)}><path d="${cheese}" fill-rule="evenodd" fill="${p.rg('#ebb94e', .3, .25)}"/></g></g>`,
            `<g ${yoBlur(p, 3.2)}>`,
            ...[[84, 90, 20, 13], [120, 102, 22, 14], [98, 124, 18, 11], [134, 80, 14, 10], [66, 116, 14, 10], [104, 74, 14, 9], [148, 106, 10, 9], [76, 76, 10, 7]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#c27424" opacity=".8"/>`),
            `</g>`,
            `<g ${yoBlur(p, 1.3)}>`,
            ...[[86, 90, 8, 5], [122, 104, 10, 6], [136, 80, 6, 4], [98, 126, 8, 4.5], [68, 116, 6, 4], [104, 74, 5, 3], [112, 92, 4, 3]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#8a4614" opacity=".85"/>`),
            `</g>`,
            ...[[78, 100, 2.6], [112, 86, 2.2], [96, 108, 2.6], [140, 100, 2], [86, 128, 2.2], [124, 126, 2.4], [70, 88, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbe39a" opacity=".9"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .35}" fill="#fff" opacity=".8"/>`),
            K.crumbs(p, 100, 100, 90, { n: 22, c: '#d9973c' }),
            K.sprinkle(p, 102, 100, 70, { c: '#3f8a2c', n: 26, r: 1 }),
            `<path d="M40,84 Q52,52 92,40" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
        ].join('');
    },

    // 鶏むね肉のねぎ塩焼き: こんがり焼いたそぎ切りに、ごま油で光るねぎ塩だれ、黒こしょう、レモン
    negishio: p => [
        K.plate(p, { rim: '#4f7a5a' }),
        `<g ${p.sh(1.1)}>`,
        yoBreast(p, 62, 84, 56, 38, -30, { c: '#e6be82', brown: '#a8621f', seed: 1, nb: 6 }),
        yoBreast(p, 100, 68, 58, 38, -6, { c: '#e6be82', brown: '#a8621f', seed: 2, nb: 6 }),
        yoBreast(p, 136, 92, 54, 38, 30, { c: '#e6be82', brown: '#a8621f', seed: 3, nb: 6 }),
        yoBreast(p, 74, 128, 58, 38, 14, { c: '#e6be82', brown: '#a8621f', seed: 4, nb: 6 }),
        yoBreast(p, 112, 112, 58, 40, -12, { c: '#e6be82', brown: '#a8621f', seed: 5, nb: 6 }),
        `</g>`,
        K.glaze(p, 98, 98, 84, '#f5e7a0', { seed: 2, op: .4 }),
        yoBits(p, 98, 98, 78, 78, ['#f6f7ea', '#eef3d6', '#d9eaa8', '#b2d67a', '#6fa845', '#5d9a38'], { seed: 1, size: 2, sy: .8 }),
        K.sprinkle(p, 98, 98, 82, { c: '#2b241f', n: 30, r: .75 }),
        K.lemon(p, 150, 140, 32, -40),
    ].join(''),

    // ロールキャベツ: 藍の鉢にコンソメスープ、ロールキャベツ2個（つまようじ）、ベーコン、ローリエ、パセリ
    rollcabbage: p => [
        K.bowl(p, { glaze: '#3f5f80', inside: '#f3ede2' }),
        K.liquid(p, { R: 72, c: '#d49c48', op: .92 }),
        `<circle cx="100" cy="100" r="62" fill="#e8c27a" opacity=".25"/>`,
        yoRoll(p, 98, 74, 100, 50, -6, { seed: 1 }),
        yoRoll(p, 102, 128, 100, 50, 4, { seed: 2 }),
        yoPick(p, 118, 72, 28, 70), yoPick(p, 124, 128, 28, 110),
        yoBacon(p, 50, 104, 30, 10, -80), yoBacon(p, 152, 100, 28, 10, 75),
        `<g ${p.sh(.5)}>`, yoBay(p, 146, 150, 26, -30), `</g>`,
        K.carrotRound(p, 56, 140, 12, { half: true, r: 20 }), K.carrotRound(p, 146, 58, 11, { half: true, r: -30 }),
        K.parsley(p, 74, 98, 10), K.sprinkle(p, 100, 100, 110, { c: '#3a2a1a', n: 12, r: .5 }),
    ].join(''),

    // お好み焼き: 丸い生地にお好みソース、マヨネーズの線、青のり、かつお節、紅しょうが
    okonomi: p => [
        K.plate(p, { rim: '#8a3a2a' }),
        `<g ${p.sh(1.4)}><g ${p.rough(2.4, .08)}><circle cx="100" cy="100" r="70" fill="${p.rg('#c98a3a', .25, .3)}" stroke="#8a5222" stroke-width="1"/></g></g>`,
        `<g ${p.crumb(.6)}><circle cx="100" cy="100" r="66" fill="#d39a4a" opacity=".6"/></g>`,
        `<path d="${smooth(ring(1, 16, .1, rng('okonomi-s'), 59, 59).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#5a2a10', .25, .2)}"/>`,
        `<path d="M58,76 Q70,56 98,50" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        `<g transform="rotate(-30 100 100)">${[-40, -24, -8, 8, 24, 40].map(d => { const h = Math.sqrt(52 * 52 - d * d); return `<path d="M${f(100 - h)},${100 + d} L${f(100 + h)},${100 + d}" stroke="#d9cfa8" stroke-width="3" stroke-linecap="round"/><path d="M${f(100 - h)},${100 + d} L${f(100 + h)},${100 + d}" stroke="#fffbe8" stroke-width="2" stroke-linecap="round"/>`; }).join('')}</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#3e7a26', n: 70, r: .9 }),
        yoBonito(p, 96, 94, 66, { n: 18 }),
        `<g ${p.sh(.4)}>${K.shreds(p, 130, 128, 22, { c: '#d9304b', n: 10, w: 1.6, len: .7, seed: 9 })}</g>`,
    ].join(''),

    // とんかつ: 切り分けたとんかつ（断面の白い肉と脂）、千切りキャベツ、ミニトマト、レモン、からし
    tonkatsu: p => [
        K.plate(p),
        yoCabbage(p, 122, 64, 76, { seed: 5 }),
        K.cherryTomato(p, 162, 96, 20),
        yoSliced(p, 90, 124, 146, 64, -10, 7, { c: '#c98634', face: '#f5e6d4', fat: '#fdf8ee', faceW: .26, crumb: .75, seed: 3, gap: 2, jitter: .07, gloss: .4 }),
        K.lemon(p, 56, 72, 30, -30),
        `<g ${p.sh(.4)}><path d="${smooth(ring(5.5, 7, .3, rng('tk-mus'), 1.3, .9).map(([a, b]) => [a + 156, b + 144]))}" fill="${p.rg('#e9b528', .3, .2)}" stroke="#b9861a" stroke-width=".5"/></g>`,
    ].join(''),

    // 鶏むね肉のピカタ: 卵の衣で黄色く焼いたそぎ切り、ケチャップ、レタスとミニトマト
    piccata: p => [
        K.plate(p),
        yoLettuce(p, 140, 62, 60, -30, { seed: 1 }), yoLettuce(p, 156, 98, 50, 70, { seed: 2, c: '#9bcc5c' }),
        K.cherryTomato(p, 150, 132, 22),
        `<g ${p.sh(1.1)}>`,
        yoBreast(p, 68, 76, 58, 40, -24, { c: '#f2cf62', brown: '#c47c22', seed: 1, nb: 6 }),
        yoBreast(p, 106, 94, 60, 42, 8, { c: '#f0cb5c', brown: '#c47c22', seed: 2, nb: 6 }),
        yoBreast(p, 64, 118, 58, 40, 24, { c: '#f2d068', brown: '#c47c22', seed: 3, nb: 6 }),
        yoBreast(p, 104, 140, 58, 40, -10, { c: '#f0cb5c', brown: '#c47c22', seed: 4, nb: 6 }),
        `</g>`,
        K.sprinkle(p, 86, 108, 80, { c: '#fff6dc', n: 18, r: .7 }),
        yoSauceTop(p, 108, 94, 20, 13, 8, { c: '#c8261a', seed: 2, drips: 2 }), yoSauceTop(p, 68, 76, 18, 12, -24, { c: '#c8261a', seed: 3, drips: 2 }), yoSauceTop(p, 104, 140, 18, 12, -10, { c: '#c8261a', seed: 4, drips: 2 }), yoSauceTop(p, 64, 118, 18, 12, 24, { c: '#c8261a', seed: 5, drips: 2 }),
        K.parsley(p, 92, 104, 9), K.parsley(p, 82, 140, 8),
    ].join(''),

    // 豆腐ハンバーグ: 淡い色の豆腐ハンバーグ2個、大葉に大根おろし、ポン酢、しめじ、小口ねぎ
    tofuhamburg: p => [
        K.plate(p, { rim: '#5a6f8a' }),
        K.pool(p, 92, 106, 124, '#8e5a1e', { op: .5, seed: 4, sy: .82 }),
        K.patty(p, 72, 88, 76, 60, -20, { c: '#bd8a52' }),
        K.patty(p, 114, 126, 76, 60, 15, { c: '#bd8a52' }),
        K.shiso(p, 74, 84, 38, -40), K.shiso(p, 114, 120, 38, 20),
        K.grated(p, 74, 86, 32), K.grated(p, 114, 122, 32),
        K.scallions(p, 74, 84, 20, { n: 7 }), K.scallions(p, 114, 120, 20, { n: 7, seed: 2 }),
        K.shimeji(p, 140, 72, 34, -60, { n: 4 }), K.shimeji(p, 152, 100, 30, -10, { n: 3 }), K.shimeji(p, 70, 136, 30, 130, { n: 3 }),
    ].join(''),

    // ピーマンの肉詰め: 縦半分のピーマン6個に焼いた肉だね、照りのあるケチャップソース
    pimannikuzume: p => [
        K.plate(p),
        K.pool(p, 98, 102, 124, '#6e2412', { op: .7, seed: 6, sy: .78 }),
        yoPiman(p, 66, 78, 54, 38, -20, { seed: 1 }), yoPiman(p, 116, 70, 54, 38, 10, { seed: 2 }),
        yoPiman(p, 148, 106, 52, 36, 70, { seed: 3 }), yoPiman(p, 60, 122, 54, 38, 20, { seed: 4 }),
        yoPiman(p, 106, 138, 54, 38, -15, { seed: 5 }), yoPiman(p, 98, 102, 52, 36, 100, { seed: 6 }),
        ...[[64, 78, -20, 1], [114, 70, 10, 2], [146, 106, 70, 3], [58, 122, 20, 4], [104, 138, -15, 5], [98, 102, 100, 6]].map(([x, y, r, s]) => yoSauceTop(p, x, y, 28, 17, r, { c: '#7a2814', seed: s, op: .8, drips: 2 })),
    ].join(''),

    // 鶏肉のトマト煮: 黒い鉢にトマトソース、焼き目のついた鶏もも、玉ねぎ、しめじ、パセリ
    torinotomatoni: p => [
        K.bowl(p, { glaze: '#2f2a28', inside: '#f1ebdf' }),
        K.liquid(p, { R: 72, c: '#c63a22', op: 1 }),
        yoTomatoBits(p, 100, 100, 124, 10, { seed: 1 }),
        `<g ${p.sh()}>`,
        K.onion(p, 62, 86, 26, 30, { c: '#efc49a' }), K.onion(p, 138, 132, 24, -150, { c: '#efc49a' }),
        yoBreast(p, 78, 116, 46, 36, 20, { c: '#d89250', brown: '#8a3a14', seed: 1, nb: 5, jit: .3 }),
        yoBreast(p, 124, 88, 46, 36, -30, { c: '#d89250', brown: '#8a3a14', seed: 2, nb: 5, jit: .3 }),
        yoBreast(p, 122, 132, 42, 34, 60, { c: '#d89250', brown: '#8a3a14', seed: 3, nb: 5, jit: .3 }),
        yoBreast(p, 84, 72, 40, 32, 100, { c: '#d89250', brown: '#8a3a14', seed: 4, nb: 5, jit: .3 }),
        `</g>`,
        ...[[78, 116, 40], [124, 88, 40], [122, 132, 36], [84, 72, 34]].map(([x, y, s], i) => K.glaze(p, x + 3, y + 4, s * .9, '#c8341c', { seed: 20 + i, op: .3 })),
        yoTomatoBits(p, 100, 104, 70, 5, { seed: 3 }),
        K.shimeji(p, 144, 70, 30, -40, { n: 3 }), K.shimeji(p, 56, 124, 30, 150, { n: 3 }), K.shimeji(p, 104, 152, 26, 80, { n: 3 }),
        K.sprinkle(p, 100, 100, 96, { c: '#3f8a2c', n: 28, r: 1 }),
    ].join(''),

    // 厚揚げと豚肉の味噌炒め: 厚揚げ・豚こま・キャベツ・ピーマンを味噌だれでからめる
    atsuage: p => [
        K.plate(p, { rim: '#6e5a3a' }),
        K.pool(p, 98, 102, 124, '#94541c', { op: .55, seed: 7, sy: .86 }),
        `<g ${p.sh(.9)}>`,
        K.leafPiece(p, 66, 72, 40, 20, { c: '#c6d98c', vein: '#f2f4d8', seed: 1, cooked: true }), K.leafPiece(p, 140, 128, 40, -40, { c: '#c6d98c', vein: '#f2f4d8', seed: 2, cooked: true }),
        K.leafPiece(p, 132, 62, 36, 70, { c: '#cfdf9c', vein: '#f2f4d8', seed: 3, cooked: true }), K.leafPiece(p, 60, 132, 36, -10, { c: '#cfdf9c', vein: '#f2f4d8', seed: 4, cooked: true }),
        K.porkSlice(p, 100, 102, 48, -20, { c: '#a0602a', seed: 1, gloss: .6 }), K.porkSlice(p, 72, 104, 40, 70, { c: '#9a5c2a', seed: 2, gloss: .6 }),
        K.porkSlice(p, 118, 146, 40, 10, { c: '#a0602a', seed: 3, gloss: .6 }), K.porkSlice(p, 140, 84, 36, -60, { c: '#9a5c2a', seed: 4, gloss: .6 }),
        K.atsuage(p, 98, 70, 30, 15), K.atsuage(p, 146, 104, 28, -20), K.atsuage(p, 88, 134, 30, 40), K.atsuage(p, 56, 98, 26, -10), K.atsuage(p, 118, 114, 26, 70),
        K.pepperPiece(p, 120, 84, 22, 30), K.pepperPiece(p, 72, 122, 22, -50), K.pepperPiece(p, 150, 70, 18, 120), K.pepperPiece(p, 98, 156, 18, 10), K.pepperPiece(p, 54, 78, 18, 60), K.pepperPiece(p, 128, 136, 16, -20),
        `</g>`,
        ...[[98, 70], [146, 104], [88, 134], [56, 98], [118, 114]].map(([x, y], i) => K.glaze(p, x, y, 28, '#94501a', { seed: 30 + i, op: .6 })),
        K.sesame(p, 100, 104, 84, { n: 14 }),
    ].join(''),
};
