// 花森ゆず 案（採用: ソパ・デ・ハバス、蓮根とスペアリブのスープ＝第1回、ブルギニョン＝第1回b）。器の縁は藍（統合は白石）
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// 重ならないよう位置を散らす（円の中。ex は避けたい既存の点）
function spots(seed, n, rmax, minD, { cx = 100, cy = 100, sy = 1, ex = [], exD = 0 } = {}){
    const R = rng('yz' + seed), out = [];
    for (let t = 0; t < 9000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD) && ex.every(([u, v]) => Math.hypot(u - x, v - y) >= exD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
const shine = (cx, cy, R, op = .4, w = 1.8) => `<path d="M${f(cx - R * .6)},${f(cy + R * .1)} A${f(R * .62)},${f(R * .62)} 0 0 1 ${f(cx - R * .08)},${f(cy - R * .56)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function oil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 2.6 } = {}){
    const R = rng(p.id + 'yzoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
const veil = (cx, cy, R, c, op) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" opacity="${op}"/>`;

export default {
    // ブフ・ブルギニョン（1b）: 材料どおり牛肉・にんじん・玉ねぎ・ベーコン・マッシュルームと赤ワインだけ（香草は描かない）。牛肉は大きく5つ、ソースより明るい赤茶で分ける。藍のほうろう鍋
    fr_bourguignon: p => {
        const R = 86, c = '#2c4c7c';
        const hd = s => `<rect x="${s < 0 ? 100 - R - 11 : 100 + R - 9}" y="86" width="20" height="28" rx="9" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/>`;
        const out = [`<g ${p.sh(1.8)}>${hd(-1)}${hd(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g><circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.4" opacity=".7"/><circle cx="100" cy="100" r="${f(R * .88)}" fill="${p.rg('#f1e8d8', .1, .3, .62, .64)}"/>`,
            K.liquid(p, { R: 75, c: '#4a1420', op: 1, shine: false }), `<circle cx="94" cy="92" r="50" fill="#6e2232" opacity=".35"/>`];
        const beef = [[80, 78, 20], [126, 76, -30], [70, 122, 60], [118, 124, 10], [100, 100, 40]];
        out.push(...beef.map(([x, y, r], i) => K.yzBraisedBeef(p, x, y, 40, r, { seed: i, c: '#b06a42' })));
        [[100, 56], [150, 100], [58, 98], [96, 150], [140, 140]].forEach(([x, y]) => out.push(K.carrotRound(p, x, y, 20, { c: '#f58a2a' })));
        [[148, 70, -30], [60, 150, 20], [140, 120, 60]].forEach(([x, y, r]) => out.push(K.yzMushroomHalf(p, x, y, 22, r)));
        [[56, 70, 30], [126, 154, -20], [100, 78, 80], [80, 146, 0]].forEach(([x, y, r]) => out.push(K.yzLardon(p, x, y, 16, r)));
        [[124, 100, 30], [80, 100, -40]].forEach(([x, y, r]) => out.push(K.onion(p, x, y, 20, r, { c: '#f4dcae', layers: 2 })));
        out.push(shine(100, 100, 74, .35, 2.2));
        return out.join('');
    },

    // そら豆のスープ（ソパ・デ・ハバス）: クリーム色の豆のスープに、割れたそら豆・トマト・玉ねぎ・ノパル・パクチー、揚げた乾燥唐辛子
    mx_sopa_habas: p => {
        const n = 16, r0 = 85;
        let deco = '';
        for (let i = 0; i < n; i++){ const a = i / n * 6.28, cx = 100 + Math.cos(a) * r0, cy = 100 + Math.sin(a) * r0; deco += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="3.6" ry="1.4" transform="rotate(${f(a * 57.3 + 90)} ${f(cx)} ${f(cy)})" fill="#f3e2be" opacity=".9"/>`; }
        const out = [`<g ${p.sh(1.8)}><circle cx="100" cy="100" r="92" fill="${p.rg('#a8562a', .2, .3, .35, .3)}"/></g>${deco}<circle cx="100" cy="100" r="89.5" fill="none" stroke="#2c4c7c" stroke-width="2.2"/><circle cx="100" cy="100" r="77" fill="${p.rg('#7a3a18', .15, .35, .62, .64)}"/>`,
            K.liquid(p, { R: 75, c: '#d8b362', op: 1, shine: false }), `<circle cx="95" cy="92" r="48" fill="#ecd290" opacity=".5"/>`];
        const fav = spots('hb0', 7, 56, 22);
        fav.forEach(([x, y, r]) => out.push(K.yzFavaHalf(p, x, y, 15, r)));
        out.push(veil(100, 100, 75, '#d8b362', .22));
        const tm = spots('hb1', 8, 56, 17, { ex: fav, exD: 12 });
        tm.forEach(([x, y, r]) => out.push(K.yzDice(p, x, y, 11, r, 'tomato')));
        spots('hb2', 8, 58, 17, { ex: tm, exD: 12 }).forEach(([x, y, r]) => out.push(K.yzDice(p, x, y, 11, r, 'nopal')));
        spots('hb3', 7, 58, 16).forEach(([x, y, r]) => out.push(K.yzDice(p, x, y, 8, r, 'onion')));
        [[108, 92, 30, 30], [90, 112, -30, 26], [124, 116, 70, 22]].forEach(([x, y, r, L]) => out.push(K.yzPasilla(p, x, y, L, r)));
        [[78, 82, 20], [116, 126, -50]].forEach(([x, y, r]) => out.push(K.yzCilantro(p, x, y, 20, r)));
        out.push(`<path d="M62,96 C78,86 94,100 110,90" stroke="#f3dc88" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`, shine(100, 100, 74, .45));
        return out.join('');
    },

    // 蓮根と豚スペアリブのスープ: 7つの穴が見える蓮根の輪切りと、骨つきの豚ぶつ切り。白く濁ったスープに青ねぎ
    cn_lianou_paigu: p => {
        const R = 86;
        const ear = sx => `<g ${T(100 + sx * (R + 1), 100)}><rect x="-9" y="-11" width="18" height="22" rx="7" fill="${p.g('#5a3c2c', .25, .3)}" stroke="#2a1810" stroke-width=".8"/><rect x="-5" y="-6" width="10" height="12" rx="4" fill="#2a1a12" opacity=".5"/></g>`;
        const out = [`<g ${p.sh(2)}>${ear(-1)}${ear(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg('#4a3226', .2, .3, .35, .3)}"/></g><circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="#2c4c7c" stroke-width="2.4" opacity=".95"/><circle cx="100" cy="100" r="${f(R * .86 + 1.4)}" fill="none" stroke="#1e120c" stroke-width="2"/><circle cx="100" cy="100" r="${f(R * .86)}" fill="${p.rg('#3a2418', .1, .2, .62, .64)}"/>`,
            K.liquid(p, { R: 74, c: '#e6d6bd', op: 1, shine: false }), `<circle cx="96" cy="94" r="48" fill="#f4eadb" opacity=".5"/>`];
        const lo = [[100, 66, 0], [136, 104, 20], [66, 106, 8], [102, 138, 30]];
        const rb = [[126, 70, 20], [76, 72, -30], [96, 104, 55], [136, 136, -50], [64, 140, 110], [54, 100, 100]];
        rb.forEach(([x, y, r], i) => out.push(K.yzRib(p, x, y, 32, r, { seed: i, c: i % 2 ? '#c48666' : '#cf9272' })));
        lo.forEach(([x, y, r], i) => out.push(K.lotus(p, x, y, 40, r, { c: '#ead5b4' })));
        out.push(veil(100, 100, 74, '#efe4d2', .12), oil(p, 100, 100, 130, { n: 12, c: '#f2d27a', op: .6, rmax: 1.8, seed: 2 }));
        out.push(K.scallions(p, 100, 100, 118, { n: 22, c: '#4f9a34' }), shine(100, 100, 74, .4));
        return out.join('');
    },
};
