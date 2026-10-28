#!/usr/bin/env node
/*
 * 白石 凪の研修（Web 出張のあと）: 第1回の弱かった6品の描き直し
 *   node tools/illustrations/draw/study/nagi_r1b.mjs <出力フォルダ>
 * 本体の dishes/ には入れない（ID が重複するため build.mjs は読まない）。<id>.svg を出力フォルダに書き、
 * 主役の具と下地の「明るさの比（コントラスト比）」を表で出す。
 *
 * 使った原則（出典は scratchpad/meeting/shiraishi_study.md）
 *   1. 主役を1つ決め、形の数を減らす（細部より、まとまった形）
 *   2. 色相だけでなく明るさ（トーン）で分ける。同じ明るさの色は並べない
 *   3. 色だけに頼らず、形でも区別する（赤と緑の具は形も変える）
 *   4. 細すぎる線・小さな粒は小さい表示で消えるので使わない
 *   5. 具の縁をはっきりさせる（ぼかしで溶かさない）
 *   6. 余白（下地が見える隙間）でまとまりを作る
 */
import fs from 'node:fs';
import path from 'node:path';
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const INDIGO = '#2c4c7c';

// ---------- 明るさの比（WCAG の相対輝度の式） ----------
const lum = c => { const v = c.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255).map(u => u <= .03928 ? u / 12.92 : ((u + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

// 重ならない位置（中心からの距離 R 以内、互いに minD 以上離す）
function spots(seed, n, R, minD, { cx = 100, cy = 100, sy = 1, avoid = [], avoidD = 0 } = {}){
    const r = rng('nb' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = r() * 6.283, d = Math.sqrt(r()) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD) && avoid.every(([u, v]) => Math.hypot(u - x, v - y) >= avoidD)) out.push([x, y, Math.round(r() * 360)]);
    }
    return out;
}
const sheen = (R, op = .45) => `<path d="M${f(100 - R * .62)},${f(100 - R * .3)} A${f(R * .72)},${f(R * .72)} 0 0 1 ${f(100 - R * .15)},${f(100 - R * .66)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 白磁の深鉢（藍の縁）
function whiteBowl(p, { R = 92, inside = '#f6f3ec' } = {}){
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${INDIGO}" stroke-width="3"/>
        <circle cx="100" cy="100" r="${R - 8.5}" fill="none" stroke="${INDIGO}" stroke-width="1"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg(inside, .1, .24, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}

// ---------- 部品 ----------
// 揚げて甘酢をからめた豚肉: 明るい揚げ色の地に、赤い甘酢の照りを半分だけかける（下地の赤より明るく）
function porkChunk(p, x, y, s, r, seed){
    const R = rng('nbpk' + seed), pts = ring(s / 2, 9, .26, R, 1.12, .9), d = smooth(pts, true, .85);
    const coat = smooth(pts.map(([a, b]) => [a * .86 + s * .04, b * .86 + s * .05]), true, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g('#c77a34', .3, .3)}" stroke="#6e3210" stroke-width="1"/></g>
        <path d="${coat}" fill="#c43a18" opacity=".55"/>
        <path d="M${f(-s * .28)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .32)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="${f(s * .08)}" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="${f(s * .2)}" cy="${f(-s * .05)}" r="${f(s * .04)}" fill="#fff" opacity=".7"/></g>`;
}
// ふんわり卵（輪郭のはっきりした大きな黄色い花びら形。明るい黄色で、汁より十分明るく）
function eggCloud(p, x, y, s, r, seed){
    const R = rng('nbeg' + seed), pts = ring(s / 2, 11, .38, R, 1.35, .7), d = smooth(pts, true, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${d}" fill="${p.g('#ffe684', .35, .12)}" stroke="#c8962a" stroke-width="1"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .5 - 2, b * .45 - 1]), true, .9)}" fill="#fff6c4" opacity=".8"/>
        <path d="M${f(-s * .3)},${f(s * .08)} Q0,${f(s * .2)} ${f(s * .32)},${f(s * .04)}" stroke="#e0b040" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 細切り（太めに。色ごとに明るさを離す）
function bar(p, x, y, L, w, r, c, edge){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w * .4)}" fill="${p.g(c, .25, .25)}" stroke="${edge}" stroke-width=".9"/><path d="M${f(-L * .35)},${f(-w * .18)} L${f(L * .2)},${f(-w * .18)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// そら豆（丸のまま。暗い豆に明るい照りで形を出す）
function favaBean(p, x, y, s, r){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><ellipse rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${p.g('#6e4222', .3, .3)}" stroke="#3a1e0a" stroke-width=".8"/></g>
        <path d="M${f(s * .33)},${f(-s * .14)} Q${f(s * .44)},0 ${f(s * .33)},${f(s * .14)}" stroke="#2a1404" stroke-width="1.4" fill="none"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .17)}" ry="${f(s * .08)}" fill="#e8c49a" opacity=".85"/></g>`;
}
// 角切り（トマト・パセリ用の小片は大きめ・縁つき）
function dice(p, x, y, s, r, c){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g><path d="M${f(-s * .28)},${f(-s * .26)} L${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`;
}
// パセリの葉（ぎざぎざの小さな葉の房）
function parsleyLeaf(p, x, y, s, r){
    const k = s / 12;
    return `<g ${T(x, y, r, k)}><path d="M0,0 C-5,-1 -7,-6 -4,-8 C-3,-11 1,-11 2,-8 C5,-9 7,-5 5,-3 C7,-1 4,2 0,0Z" fill="${p.g('#3e9a2c', .3, .25)}" stroke="#1e5a12" stroke-width=".7"/><path d="M0,0 L-1,-6 M0,0 L3,-5" stroke="#9ad070" stroke-width=".7" fill="none"/></g>`;
}
// ほぐした白身魚（身の層＝くの字の筋を太めに。白い身と、皮側の薄い灰色の帯で魚らしさを出す）
function fishFlake(p, x, y, s, r, seed){
    const R = rng('nbff' + seed), pts = ring(s / 2, 8, .22, R, 1.35, .8), d = smooth(pts, true, .7);
    const w = s * .5, myo = [-.3, 0, .3].map(t => `M${f(t * w - s * .08)},${f(-s * .3)} L${f(t * w + s * .08)},0 L${f(t * w - s * .08)},${f(s * .3)}`).join(' ');
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${d}" fill="${p.g('#fffaf0', .1, .14)}" stroke="#6a5a3c" stroke-width="1.2"/></g>
        <path d="${myo}" stroke="#d8c8a6" stroke-width="1.2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q${f(-s * .1)},${f(-s * .16)} ${f(s * .14)},${f(-s * .1)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// レモンのくし形（大きく。皮の濃い黄と果肉の淡い黄で2段の明るさ）
function lemonWedge(p, x, y, s, r){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-11,3 A11,10 0 0 1 11,3 Q0,8 -11,3Z" fill="#e2b010" stroke="#8a6a04" stroke-width=".8"/></g>
        <path d="M-8.6,3 A8.6,7.6 0 0 1 8.6,3 Q0,6.4 -8.6,3Z" fill="${p.g('#fbe878', .35, .1)}"/>
        ${[-50, -25, 0, 25, 50].map(a => `<path transform="rotate(${a} 0 4)" d="M0,4 L0,-3.4" stroke="#fffbe0" stroke-width="1"/>`).join('')}</g>`;
}
// いわし（缶詰の切り身）: 銀色の背（明るい）と、トマトソースの腹（暗め）で、赤いソースから浮かせる
function sardine(p, x, y, L, r, seed){
    const h = L * .42, R = rng('nbsd' + seed), j = () => (R() - .5) * 2;
    const body = [[-L / 2, -h * .2], [-L * .2, -h / 2 + j()], [L * .3, -h * .45], [L / 2, -h * .08], [L * .46, h * .4], [0, h / 2 + j()], [-L * .46, h * .32]];
    const back = `M${f(-L * .46)},${f(-h * .18)} Q${f(-L * .1)},${f(-h * .56)} ${f(L * .48)},${f(-h * .12)} L${f(L * .44)},${f(h * .02)} Q0,${f(-h * .18)} ${f(-L * .44)},${f(h * .02)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(body, true, .7)}" fill="${p.g('#c8806a', .25, .3)}" stroke="#5a1a0a" stroke-width="1"/></g>
        <path d="${back}" fill="${p.g('#c4ccd2', .35, .3)}" stroke="#5a6670" stroke-width=".7"/>
        <path d="M${f(-L * .3)},${f(-h * .3)} L${f(L * .26)},${f(-h * .32)}" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>
        <ellipse cx="${f(L * .1)}" cy="${f(h * .22)}" rx="${f(L * .06)}" ry="${f(h * .1)}" fill="#f2e4d0" stroke="#b89a7a" stroke-width=".5"/></g>`;
}
// エシャロットの輪切り（紫の輪。中は白に近い）
function shallotRing(p, x, y, s){
    return `<g ${T(x, y)}><circle r="${f(s / 2)}" fill="#f6e8f0" stroke="#8a3a6a" stroke-width="${f(s * .16)}"/><circle r="${f(s * .26)}" fill="none" stroke="#c07aa4" stroke-width="${f(s * .08)}"/></g>`;
}
// レモングラスの輪切り（淡い黄緑の小さな輪）
function lemongrass(p, x, y, s){
    return `<g ${T(x, y)}><circle r="${f(s / 2)}" fill="#eef2b8" stroke="#6a7a24" stroke-width="1"/><circle r="${f(s * .22)}" fill="none" stroke="#b0b85a" stroke-width=".9"/></g>`;
}
// ミントの葉（とがった卵形・明るい緑・葉脈）
function mintLeaf(p, x, y, s, r){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M-10,0 Q-6,-7.5 1,-7.5 Q9,-6 12,0 Q8,6.5 0,7.5 Q-7,6.5 -10,0Z" fill="${p.g('#4cae3a', .3, .25)}" stroke="#1c5a12" stroke-width=".9"/></g>
        <path d="M-9,0 Q0,-1 11,0 M-2,0 L-5,-4.4 M3,-.3 L1,-4.8 M0,.2 L-2,4.6 M5,.2 L3,4.2" stroke="#c4ec9a" stroke-width="1" fill="none" stroke-linecap="round"/></g>`;
}
// 唐辛子の輪切り（赤い輪＋白い種。赤いソースの上では白い種で形を見せる）
function chiliRing(p, x, y, s, c = '#e02a14'){
    return `<g ${T(x, y)}><circle r="${f(s / 2)}" fill="#fff4dc" stroke="${c}" stroke-width="${f(s * .2)}"/>${[0, 2.1, 4.2].map(a => `<circle cx="${f(Math.cos(a) * s * .12)}" cy="${f(Math.sin(a) * s * .12)}" r="${f(s * .07)}" fill="#f0d070"/>`).join('')}</g>`;
}
// ほうれん草の葉（さじ形の葉身＋明るい茎。3段の緑で重なりを見せる）
function spinachLeaf(p, x, y, s, r, tone){
    const c = ['#2f7a22', '#3f9230', '#56aa3c'][tone], k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-15,0 C-13,-9 -2,-11 6,-8 C13,-6 16,-2 15,1 C13,7 3,10 -5,8 C-11,7 -15,4 -15,0Z" fill="${p.g(c, .3, .3)}" stroke="#123a0c" stroke-width="1"/></g>
        <path d="M-15,0 C-5,-1 5,-1 14,0" stroke="${lt(c, .55)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M-6,-.5 L-3,-6 M2,-.8 L5,-6 M-4,0 L-1,5.6 M4,0 L7,5" stroke="${lt(c, .4)}" stroke-width=".9" fill="none" stroke-linecap="round"/>
        <path d="M-15,0 L-20,1" stroke="#b6d884" stroke-width="3" stroke-linecap="round"/></g>`;
}
// にんにく1片（つぶしたもの。油で金色）
function garlicClove(p, x, y, s, r){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-9,4 C-10,-3 -4,-9 2,-8 C8,-7 10,-1 8,4 C5,8 -6,8 -9,4Z" fill="${p.g('#f2d48a', .35, .25)}" stroke="#8a5a14" stroke-width="1"/></g>
        <path d="M-4,-5 C-1,-1 1,2 6,4" stroke="#c8962a" stroke-width="1.1" fill="none"/><path d="M-6,-2 Q-3,-6 1,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}

// ---------- 6品 ----------
const DISH = {
    // 酢豚: 豚5・ピーマン4・にんじん4・玉ねぎ3 に絞る。豚は明るい揚げ色（下地の赤より明るい）、余白を残して並べる
    subuta: p => {
        const pork = [[76, 78, 10], [124, 76, 70], [100, 112, -20], [64, 128, 40], [136, 124, 120]];
        return [
            K.plate(p),
            K.pool(p, 100, 102, 146, '#9e2814', { op: .95, seed: 4, sy: .9 }),
            `<g ${p.sh(1)}>`, ...[[100, 66, 20], [54, 98, -50], [146, 98, 70], [104, 150, 160]].map(([x, y, r]) => K.onion(p, x, y, 30, r, { c: '#f8e2c0' })), `</g>`,
            ...pork.map(([x, y, r], i) => porkChunk(p, x, y, 40, r, i)),
            `<g ${p.edge('#123a0c', .9, .6)}>`, ...[[100, 82, 20], [146, 72, -30], [84, 148, 60], [44, 112, 100]].map(([x, y, r]) => K.pepperPiece(p, x, y, 32, r, { c: '#3cb02e' })), `</g>`,
            `<g ${p.edge('#6a2604', .9, .55)}>`, ...[[120, 140, 30], [54, 74, -40], [150, 146, 80], [132, 100, 10]].map(([x, y, r]) => K.carrotChunk(p, x, y, 22, r, { c: '#ff8a20' })), `</g>`,
        ].join('');
    },

    // 酸辣湯: 主役は卵。卵は4つの大きな明るい黄色のかたまりにし、豆腐（白）・しいたけ（黒褐）・たけのこ（淡黄）は太く少なく。ねぎは材料にないので描かない
    sanratan: p => {
        const R = rng('nbst'), bars = [];
        const eggs = [[86, 82, 20, 50], [124, 116, -30, 46], [72, 124, 60, 38], [126, 72, -10, 36]];
        for (const [x, y, r] of spots('st', 14, 60, 18, { avoid: eggs, avoidD: 18 })){
            const t = bars.length % 3;
            bars.push(t === 0 ? bar(p, x, y, 26, 7, r, '#fbf6ea', '#a8987a') : t === 1 ? bar(p, x, y, 22, 6, r, '#4a2a14', '#1e0e04') : bar(p, x, y, 20, 6, r, '#ecd690', '#9a8240'));
        }
        return [
            whiteBowl(p),
            `<circle cx="100" cy="100" r="78" fill="${p.rg('#8e4a20', .25, .3, .42, .4)}"/>`,
            `<g ${p.sh(.4)}>${bars.join('')}</g>`,
            ...eggs.map(([x, y, r, s], i) => eggCloud(p, x, y, s, r, i)),
            ...spots('oil', 9, 64, 16).map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${2.4 + (i % 3) * .6}" fill="#ff4a1a" stroke="#8a1a04" stroke-width=".5"/><circle cx="${f(x - .8)}" cy="${f(y - .8)}" r=".8" fill="#fff" opacity=".8"/>`),
            K.sprinkle(p, 100, 100, 110, { c: '#1e120a', n: 12, r: .7 }),
            sheen(78, .5),
        ].join('');
    },

    // フール: 同じ茶色の層を、明るさで3段に分ける（外側の豆＝暗い／豆のペースト＝中間／中央の油＝明るい金）。中央にトマトの赤とパセリの緑、手前にレモン
    eg_ful: p => {
        const mash = rng('nbful');
        let lumps = '';
        for (let i = 0; i < 14; i++){ const a = mash() * 6.28, d = 30 + mash() * 40; lumps += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d)} d="${smooth(ring(5 + mash() * 5, 7, .5, mash))}" fill="#b88a58" opacity=".7"/>`; }
        return [
            K.bowl(p, { glaze: '#d6dade', inside: '#c8ccd0', lip: .9 }), `<circle cx="100" cy="100" r="88" fill="none" stroke="${INDIGO}" stroke-width="2.6"/>`,
            `<circle cx="100" cy="100" r="78" fill="${p.rg('#a07040', .2, .25, .42, .4)}"/>`, lumps,
            ...spots('fb', 14, 70, 15, { avoid: [[100, 100]], avoidD: 46 }).map(([x, y, r]) => favaBean(p, x, y, 16, r)),
            `<path ${T(100, 100)} d="${smooth(ring(38, 10, .22, rng('nbo'), 1, .92))}" fill="${p.rg('#f4c430', .3, .2)}" stroke="#b08410" stroke-width="1" opacity=".95"/>`,
            `<circle cx="88" cy="88" r="10" fill="#fff4b0" opacity=".6"/>`,
            ...[[92, 92, 10], [110, 90, 40], [100, 108, -20], [116, 108, 15], [86, 110, 60]].map(([x, y, r]) => dice(p, x, y, 11, r, '#e83a22')),
            ...[[102, 82, 20], [124, 98, -40], [80, 100, 90], [104, 120, 160]].map(([x, y, r]) => parsleyLeaf(p, x, y, 14, r)),
            K.sprinkle(p, 100, 100, 70, { c: '#6a3410', n: 8, r: 1 }),
            lemonWedge(p, 140, 146, 42, -35),
        ].join('');
    },

    // バルク・チョルバス: 主役の魚を5切れ・大きく、身の層（くの字の筋）と皮の灰色の帯で「魚」と分かる形に。にんじん・じゃがいもは角切りで縁つき、レモンを手前に
    tr_balik: p => {
        const fish = [[76, 80, 20], [124, 80, -25], [98, 112, 10], [66, 124, 50], [134, 122, -40]];
        return [
            whiteBowl(p),
            `<circle cx="100" cy="100" r="78" fill="${p.rg('#deb444', .3, .2, .42, .4)}"/>`,
            `<circle cx="96" cy="94" r="50" fill="#f6e4a0" opacity=".45"/>`,
            ...fish.map(([x, y, r], i) => fishFlake(p, x, y, 34, r, i)),
            ...[[100, 66, 10], [46, 100, -20], [102, 146, 30], [150, 98, 0]].map(([x, y, r]) => dice(p, x, y, 11, r, '#f27a1c')),
            ...[[58, 152, 20], [146, 70, -10], [118, 150, 40]].map(([x, y, r]) => dice(p, x, y, 12, r, '#f8eccc')),
            ...[[90, 96, 20], [112, 98, -40], [84, 146, 70], [140, 148, 10], [58, 70, 120]].map(([x, y, r]) => parsleyLeaf(p, x, y, 11, r)),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 8, r: .8 }),
            lemonWedge(p, 148, 142, 44, -40),
            sheen(78, .5),
        ].join('');
    },

    // ヤムプラーガポン: いわしは銀の背で赤いソースから浮かせ、エシャロット（紫の輪）・レモングラス（淡い輪）・ミント（緑の葉）・唐辛子（赤い輪＋白い種）を形で分ける
    th_yamplakrapong: p => [
        whiteBowl(p, { R: 92 }),
        K.pool(p, 100, 102, 140, '#c0361a', { op: .95, seed: 3, sy: .92 }),
        ...[[78, 80, 20], [126, 82, -30], [100, 118, 100], [62, 120, 70], [138, 124, 10]].map(([x, y, r], i) => sardine(p, x, y, 46, r, i)),
        ...[[102, 64], [56, 96], [148, 100], [86, 148], [120, 104]].map(([x, y]) => shallotRing(p, x, y, 15)),
        ...[[70, 66], [134, 56], [150, 140], [100, 92], [120, 150]].map(([x, y]) => lemongrass(p, x, y, 9)),
        ...[[100, 80, -20], [84, 104, 50], [138, 104, 100], [70, 146, 20], [116, 136, -50], [52, 80, -80]].map(([x, y, r]) => mintLeaf(p, x, y, 20, r)),
        ...[[112, 72], [64, 106], [128, 140], [90, 130]].map(([x, y]) => chiliRing(p, x, y, 9)),
    ].join(''),

    // ほうれん草のソテー: 1つの暗い塊ではなく、3段の緑の葉を重ねて葉の形を見せる。茎は明るい黄緑、オリーブ油のつや、にんにく1片、唐辛子は少し
    it_spinaci: p => {
        const L = [];
        const pos = spots('sp', 15, 46, 17);
        pos.forEach(([x, y, r], i) => L.push(spinachLeaf(p, x, y, 38, r, (i * 7) % 3)));
        return [
            whiteBowl(p),
            `<path ${T(100, 100)} d="${smooth(ring(64, 12, .14, rng('nbspb')))}" fill="${p.rg('#3a6a20', .2, .3)}" opacity=".9"/>`,
            `<path ${T(100, 100)} d="${smooth(ring(66, 12, .1, rng('nbspo')))}" fill="#c8b440" opacity=".18"/>`,
            L.join(''),
            garlicClove(p, 108, 102, 24, 30),
            K.sprinkle(p, 100, 100, 90, { c: '#d02a14', n: 7, r: 1.2 }),
        ].join('');
    },
};

// 主役の具と、その下地の明るさの比（大きいほど小さい表示でも分かれる）
const PAIRS = {
    subuta: [['豚（揚げ色）', '#c77a34', '甘酢', '#9e2814'], ['ピーマン', '#3cb02e', '甘酢', '#9e2814'], ['にんじん', '#ff8a20', '甘酢', '#9e2814']],
    sanratan: [['卵', '#ffe684', '汁', '#8e4a20'], ['豆腐', '#fbf6ea', '汁', '#8e4a20'], ['しいたけ', '#4a2a14', '汁', '#8e4a20']],
    eg_ful: [['豆', '#6e4222', 'ペースト', '#a07040'], ['オイル', '#f4c430', 'ペースト', '#a07040'], ['トマト', '#e83a22', 'オイル', '#f4c430']],
    tr_balik: [['魚', '#fffaf0', '汁', '#deb444'], ['にんじん', '#f27a1c', '汁', '#deb444'], ['レモン果肉', '#fbe878', '皮', '#e2b010']],
    th_yamplakrapong: [['いわしの背', '#c4ccd2', 'ソース', '#c0361a'], ['ミント', '#4cae3a', 'ソース', '#c0361a'], ['エシャロット', '#f6e8f0', 'ソース', '#c0361a']],
    it_spinaci: [['明るい葉', '#56aa3c', '暗い葉', '#2f7a22'], ['茎', '#b6d884', '葉', '#3f9230'], ['にんにく', '#f2d48a', '葉', '#3f9230']],
};

const out = process.argv[2] || '.';
fs.mkdirSync(out, { recursive: true });
for (const [id, fn] of Object.entries(DISH)){
    const p = new K.Pic(id);
    fs.writeFileSync(path.join(out, `${id}.svg`), p.svg(fn(p)));
    console.log(id, PAIRS[id].map(([a, ca, b, cb]) => `${a}/${b} ${ratio(ca, cb).toFixed(2)}`).join('  '));
}
