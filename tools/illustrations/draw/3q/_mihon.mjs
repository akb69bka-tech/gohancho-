// kit3q.mjs の見本（器ごとに1品）。本番の絵ではない（_ で始まるファイルは書き出しに入れない）
import * as Q from '../kit3q.mjs';
const { f, rng, lt, dk } = Q;

export default {
    // 煮物の鉢（藍の線）: 煮汁の面＋glossLump の山（江口の描き方）
    nikujaga: p => {
        const V = Q.hachi(p), S = Q.surface(p, V, { drop: 12, c: '#b9853f', glow: .3 });
        const o = { cx: 100, cy: V.cy + 6 }, m = (u, v) => 30 * Math.max(0, 1 - (u * u + v * v) / 80 / 80);
        const it = [['pot', -40, -24], ['pot', 14, -30], ['carrot', 46, -10], ['pot', -10, 6], ['carrot', -40, 26], ['pot', 30, 26]]
            .map(([k, u, v], i) => { const [x, y] = Q.at(o, u, v, m(u, v)); return [y, () => k === 'pot' ? Q.glossLump(p, x, y, 34, i) : Q.rangiri(p, x, y, 20, i * 40, '#e97a2a', i)]; });
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 140) + V.shine(.45);
    },
    // 平皿（白・藍）: たれだまりに slice3q の豚肉を重ね、奥にキャベツの山（江口の描き方）
    shogayaki: p => {
        const D = Q.plate(p);
        let s = D.s + Q.shredMound(p, 138, 88, 32, 28) + Q.tarePool(p, 90, 114, 46);
        [[82, 88, 14, 4, '#bd7c38'], [98, 102, -10, 3, '#c4843e'], [80, 114, 8, 2, '#b9783a'], [100, 128, -16, 1, '#c0803a']].forEach(([x, y, r, sd, c]) => { s += Q.slice3q(p, x, y, 72, r, { c, seed: sd, gloss: .8 }, { th: 2.6, tc: '#6a3010', sq: .72 }); });
        return s + Q.shine(78, 120, 18, -4) + Q.shine(96, 132, 14, -8);
    },
    // 汁椀（朱・細い藍）: 汁の面に豆腐を沈め、わかめとねぎ
    misoshiru: p => {
        const V = Q.wan(p), S = Q.surface(p, V, { drop: 9, c: '#c99a5a', glow: .32, rimShade: .3 });
        const R = rng('ms');
        const it = [[90, 76, 20], [116, 80, 50], [74, 94, 35], [106, 96, 10], [130, 100, 60], [90, 110, 45]].map(([x, y, a]) => [y, () => Q.cube(p, x, y, 15, a, '#f6f1e2', { sink: 5, liquid: '#c99a5a' })]);
        it.push([80, () => Q.leaf(p, 66, 80, 28, 15, '#2f5a2a', 1)], [96, () => Q.leaf(p, 132, 90, 24, -25, '#2f5a2a', 2)]);
        for (let i = 0; i < 9; i++){ const x = 66 + R() * 70, y = 80 + R() * 30; it.push([y, () => Q.negi(p, x, y)]); }
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.5);
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
