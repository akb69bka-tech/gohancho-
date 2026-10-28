// kit3q.mjs の見本（器ごとに1品）。本番の絵ではない（_ で始まるファイルは書き出しに入れない）
import * as Q from '../kit3q.mjs';
const { f, rng, lt, dk } = Q;

export default {
    // 深めの鉢（線なし）: 煮汁の面＋じゃがいもの山
    nikujaga: p => {
        const V = Q.hachi(p), S = Q.surface(p, V, { drop: 12, c: '#b98a4a', glow: .3 });
        const o = { cx: 100, cy: V.cy + 6 }, m = (u, v) => 34 * Math.max(0, 1 - (u * u + v * v) / 80 / 80);
        const it = [['pork', -34, -50], ['onion', 6, -60], ['carrot', 44, -30], ['pot', -46, -22], ['pot', 10, -26], ['pork', 52, 2], ['onion', -58, 12], ['carrot', -20, 4], ['pot', 26, 14], ['pot', -36, 34], ['carrot', 54, 34], ['pork', 4, 44], ['pot', -6, 52]]
            .map(([k, u, v], i) => { const [x, y] = Q.at(o, u, v, m(u, v)); return [y, () => k === 'pot' ? Q.lump(p, x, y, 20, 15, '#e0b458', 'nj' + i, { hi: .3 })
                : k === 'carrot' ? Q.rangiri(p, x, y, 20, i * 40, '#e97a2a', i)
                : k === 'pork' ? Q.slab(p, x, y, 19, 8, 2, '#a8694a', 'pk' + i, { rot: i * 17 % 40 - 20 }).s
                : `<g ${Q.T(x, y, i * 13 % 50 - 25)}><path d="M-17,3 Q0,-14 17,3 Q0,-7 -17,3Z" fill="#e8d49a" stroke="#b39456" stroke-width=".6"/></g>`]; });
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + V.shine(.45);
    },
    // 平皿（白・藍）: 豚肉を重ね、奥にキャベツの山
    shogayaki: p => {
        const P = Q.plate(p);
        let s = P.s + Q.shredMound(p, 132, 86, 30, 26);
        [[80, 92, -16], [114, 108, 12], [70, 112, 4], [104, 126, -8]].forEach(([x, y, r], i) => { const sl = Q.slab(p, x, y, 31, 14, 1.8, '#a85a28', 'sg' + i, { n: 15, jit: .3, rot: r }); s += sl.s + Q.shine(x - 8, y - 4, 16, -8, .7); });
        return s;
    },
    // 汁椀（朱・細い藍）: 汁の面に豆腐を沈め、わかめとねぎ
    misoshiru: p => {
        const V = Q.wan(p), S = Q.surface(p, V, { drop: 9, c: '#c99a5a', glow: .32, rimShade: .3 });
        const R = rng('ms');
        const it = [[90, 76, 20], [116, 80, 50], [74, 94, 35], [106, 96, 10], [130, 100, 60], [90, 110, 45]].map(([x, y, a]) => [y, () => Q.cube(p, x, y, 15, a, '#f6f1e2', { sink: 5, liquid: '#c99a5a' })]);
        it.push([80, () => Q.leaf(p, 66, 80, 28, 15, '#2f5a2a', 1)], [96, () => Q.leaf(p, 132, 90, 24, -25, '#2f5a2a', 2)]);
        for (let i = 0; i < 9; i++){ const x = 66 + R() * 70, y = 80 + R() * 30; it.push([y, () => Q.negi(p, x, y)]); }
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + V.shine(.5);
    },
    // 茶碗（白・藍の線と帯）: ご飯の山。輪郭は淡い影
    rice: p => {
        const V = Q.chawan(p);
        return V.s + `<g ${V.above}>${Q.riceDome(p, 100, V.cy + 2, V.irx - 1, V.iry, 46)}</g>`;
    },
    // 浅い鍋（鋼・細い藍・赤い取っ手）
    es_paella: p => {
        const V = Q.pan(p), S = Q.surface(p, V, { drop: 4, c: '#e4a838', glow: .2 });
        const g = Q.grainsPlane(p, 100, S.cy, S.rx - 2, { n: 420, color: d => d > .85 ? '#c07a26' : (d * 7 % 1 < .5 ? '#f6cc62' : '#eab040') });
        const it = [[70, 90], [126, 86], [96, 110], [146, 108]].map(([x, y], i) => [y, () => Q.lump(p, x, y, 11, 8, '#b8743a', 'ch' + i)]);
        const R = rng('pe'); for (let i = 0; i < 14; i++){ const x = 50 + R() * 100, y = 84 + R() * 40; it.push([y, () => Q.pea(p, x, y)]); }
        it.push([100, () => Q.prism(p, 110, 100, [[-12, -2], [12, -2], [12, 2], [-12, 2]], 3.5, '#d92e22', { rot: 30 })]);
        return V.s + S.s + `<g ${V.inside}>${g}${Q.byDepth(it)}</g>` + V.shine();
    },
    // 小鉢（青磁・線なし）: 葉物の山
    ohitashi: p => {
        const V = Q.kobachi(p);
        return V.s + `<g ${V.above}>${Q.greensMound(p, 100, V.cy + 8, 52, 30, '#3d7d2a', 1, { n: 22 })}</g>` + V.shine(.5);
    },
    // どんぶり（白・藍の点）: 面に具
    oyakodon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 6, c: '#f2c84a', glow: .3 });
        const it = [[78, 86], [118, 88], [96, 104], [130, 106]].map(([x, y], i) => [y, () => Q.lump(p, x, y, 13, 9, '#d8a050', 'ok' + i)]);
        const R = rng('ok'); for (let i = 0; i < 10; i++){ const x = 60 + R() * 80, y = 84 + R() * 28; it.push([y, () => Q.negi(p, x, y)]); }
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + V.shine(.6);
    },
    // 土鍋（耳つき・細い藍）
    yudofu: p => {
        const V = Q.donabe(p), S = Q.surface(p, V, { drop: 10, c: '#efe7d2', glow: .2 });
        const it = [[80, 84, 10], [112, 84, 40], [96, 100, 20], [128, 102, 0], [70, 104, 30]].map(([x, y, a]) => [y, () => Q.cube(p, x, y, 22, a, '#f6f1e2', { sink: 6, liquid: '#efe7d2' })]);
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + V.shine(.4);
    },
    // 長皿（白・藍）: 焼き魚の代わりに板の形だけ確かめる
    sanma: p => {
        const P = Q.slabPlate(p, { d: 96 });
        const sl = Q.slab(p, 100, P.cy - 2, 70, 12, 4, '#8a95a0', 'fish', { n: 14, jit: .1 });
        return P.s + sl.s;
    },
};
