/*
 * 第2回 競作 B組（ピューレ・マッシュ・粥）白石 凪 案
 *   node tools/illustrations/draw/r2/render_r2.mjs tools/illustrations/draw/r2/nagi_r2.mjs <出力フォルダ>
 *
 * 方針
 *   - 同じ「黄色い円盤」に見えないよう、品ごとに 器の形・盛りの形・材料にある目印 を1つずつ決め、96px でも分かる大きさで描く
 *     （器の形: 丸皿・深鉢・楕円皿・小鉢・土鍋・金属の鉢／盛りの形: 渦・くぼみ・山・櫛目・平ら／目印: 材料と調味料に書かれたものだけ）
 *   - 白い器に淡いピューレは明るさの差が小さいので、盛りの縁を少し暗い線と影で締める
 *   - 器の縁は藍。材料にない具（クルトン・パセリ・梅干し等）は描かない
 */
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk } = K;
const INDIGO = '#2c4c7c';

// ---------- 器（すべて藍の縁） ----------
// 白い深鉢: 外側は白磁、縁に藍の太線と細線
function deepBowl(p, { R = 92, inside = '#f4f1ea' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#fbfaf6', .2, .16, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${INDIGO}" stroke-width="3"/>
        <circle cx="100" cy="100" r="${R - 9}" fill="none" stroke="${INDIGO}" stroke-width="1"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg(inside, .08, .26, .62, .64)}"/>`;
}
// 小鉢（白・藍の縁）
function smallBowl(p){ return deepBowl(p, { R: 84 }); }
// 楕円皿（藍の縁）
function oval(p){ return K.ovalDish(p, { rx: 94, ry: 70 }); }
// 土鍋（黒釉・縁に藍の線）: 白い粥を引き立てる
function donabe(p){
    const R = 90;
    const ear = sx => `<g ${T(100 + sx * (R + 2), 100)}><rect x="-8" y="-12" width="16" height="24" rx="7" fill="${p.g('#4a3a30', .25, .3)}" stroke="#1e1610" stroke-width=".8"/></g>`;
    return `<g ${p.sh(2)}>${ear(-1)}${ear(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg('#3e322a', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${INDIGO}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="${R - 8}" fill="${p.rg('#2a201a', .1, .2, .6, .62)}"/>`;
}
// 金属の小鉢（カトリ。縁に藍の線）
function katori(p){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="90" fill="${p.rg('#d8dde2', .3, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="86" fill="none" stroke="${INDIGO}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="80" fill="${p.rg('#b8bec4', .2, .2, .62, .64)}"/>
        <path d="M34,62 A74,74 0 0 1 70,30" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}

// ---------- 盛り ----------
// マッシュの山: 輪郭を暗めの線で締め、影で器から浮かせる。style で表面の模様を変える
function mash(p, { x = 100, y = 100, rx = 58, ry = 52, c = '#f2dfa2', seed = 1, style = 'swirl', well = 0 } = {}){
    const R = rng('nmash' + p.id + seed);
    const pts = ring(1, 14, .1, R, rx, ry), d = smooth(pts, true, .9);
    let surf = '';
    const hi = lt(c, .6), lo = dk(c, .22);
    if (style === 'swirl'){
        // 2周の渦（太い明暗の帯）
        const sp = (k, o) => Array.from({ length: 30 }, (_, i) => { const t = i / 29, a = t * 4 * Math.PI + o, r = (1 - t) * .82 + .08; return [x + Math.cos(a) * rx * r * k, y + Math.sin(a) * ry * r * k]; });
        const s1 = smooth(sp(1, 0), false), s2 = smooth(sp(1, .35), false);
        surf += `<path d="${s2}" stroke="${lo}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".55"/><path d="${s1}" stroke="${hi}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".95"/>`;
    } else if (style === 'fork'){
        // フォークの櫛目（平行な波線）
        for (let i = -3; i <= 3; i++){
            const yy = y + i * ry * .22, w = rx * Math.sqrt(Math.max(0, 1 - (i * .22) ** 2)) * .82;
            const dd = `M${f(x - w)},${f(yy)} Q${f(x - w / 2)},${f(yy - 4)} ${f(x)},${f(yy)} T${f(x + w)},${f(yy)}`;
            surf += `<path d="${dd}" stroke="${lo}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6" transform="translate(1 1.6)"/><path d="${dd}" stroke="${hi}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
        }
    } else if (style === 'peaks'){
        // ふんわりした山: 丸いひと盛りを重ね、それぞれに明暗をつけて量感を出す（中心ほど上・明るい）
        const lobes = [[-.4, -.28, .5], [.36, -.3, .48], [-.42, .3, .48], [.38, .3, .5], [0, -.02, .56]];
        for (const [u, v, k] of lobes){
            const lx = x + u * rx, ly = y + v * ry, lr = Math.min(rx, ry) * k;
            const ld = smooth(ring(lr, 9, .16, R, 1, .9), true, .9);
            surf += `<path ${T(lx, ly)} d="${ld}" fill="${p.rg(c, .45, .22, .34, .3)}" stroke="${dk(c, .2)}" stroke-width=".8" stroke-dasharray="${f(lr * 2.2)} ${f(lr * 1.6)}"/><path d="M${f(lx - lr * .5)},${f(ly - lr * .2)} Q${f(lx - lr * .3)},${f(ly - lr * .6)} ${f(lx + lr * .15)},${f(ly - lr * .55)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>`;
        }
    } else if (style === 'ricer'){
        // ポテトライサーで押し出した、ふわふわの細い帯（太さは保つ）
        for (let i = 0; i < 16; i++){
            const a = R() * 6.28, dd = Math.sqrt(R()) * .78, px = x + Math.cos(a) * rx * dd, py = y + Math.sin(a) * ry * dd, b = R() * 3;
            surf += `<path d="M${f(px - 7)},${f(py)} q4,${f(-4 - b)} 8,0 t7,0" stroke="${lo}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45" transform="translate(1 1.4)"/><path d="M${f(px - 7)},${f(py)} q4,${f(-4 - b)} 8,0 t7,0" stroke="${hi}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        }
    } else if (style === 'smooth'){
        surf += `<path d="M${f(x - rx * .6)},${f(y - ry * .2)} Q${f(x - rx * .3)},${f(y - ry * .7)} ${f(x + rx * .2)},${f(y - ry * .6)}" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    }
    const wellSvg = well ? `<ellipse cx="${f(x + 2)}" cy="${f(y + 1)}" rx="${f(well)}" ry="${f(well * .82)}" fill="${dk(c, .3)}" opacity=".55"/><ellipse cx="${x}" cy="${y}" rx="${f(well * .9)}" ry="${f(well * .74)}" fill="${p.rg(dk(c, .12), .1, .1, .7, .7)}"/>` : '';
    return `<g ${p.sh(1.3)}><path ${T(x, y)} d="${d}" fill="${p.rg(c, .45, .3, .34, .3)}" stroke="${dk(c, .45)}" stroke-width="1.3"/></g>${surf}${wellSvg}`;
}
// とけかけのバター（角＋とけた池）
function butter(p, x, y, s, { melt = .6 } = {}){
    const pool = melt ? `<path ${T(x + 2, y + 2)} d="${smooth(ring(s * .9 * (.6 + melt * .6), 9, .3, rng('nbt' + p.id + x)))}" fill="#f8d54a" opacity=".75"/>` : '';
    return `${pool}<g ${T(x, y, -12)}><g ${p.sh(.6)}><rect x="${f(-s / 2)}" y="${f(-s * .4)}" width="${s}" height="${f(s * .8)}" rx="${f(s * .16)}" fill="${p.g('#fbe27a', .4, .15)}" stroke="#b8901a" stroke-width="1"/></g><path d="M${f(-s * .3)},${f(-s * .22)} L${f(s * .2)},${f(-s * .22)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".9"/></g>`;
}
// すりおろしたチーズ（大きめの短い帯。淡い黄に暗い縁）
function cheeseShreds(p, x, y, s, n, seed){
    const R = rng('nbch' + seed);
    return `<g ${p.sh(.4)}>${Array.from({ length: n }, () => { const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; return `<rect x="-4.5" y="-1.5" width="9" height="3" rx="1.4" fill="#fbeaa0" stroke="#a8862a" stroke-width=".8" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(R() * 180)})"/>`; }).join('')}</g>`;
}
// 粉（ナツメグ・こしょう）: 粒は少なめ・大きめ
function dust(p, x, y, s, n, c, seed, r = 1.1){
    const R = rng('nbds' + seed);
    return Array.from({ length: n }, () => { const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2; return `<circle cx="${f(x + Math.cos(a) * dd)}" cy="${f(y + Math.sin(a) * dd)}" r="${f(r * (.7 + R() * .6))}" fill="${c}"/>`; }).join('');
}
// ディル（羽のような葉: 短い太めの線を束ねた房）
function dill(p, x, y, s, r){
    const k = s / 20, br = [[-8, -6], [-4, -9], [1, -10], [6, -8], [9, -4], [-9, -1], [9, 1]];
    return `<g ${T(x, y, r, k)}><path d="M0,8 L0,-4" stroke="#2e7a22" stroke-width="2" stroke-linecap="round"/>${br.map(([a, b]) => `<path d="M0,0 L${a},${b}" stroke="#3a9a2c" stroke-width="2" stroke-linecap="round"/><path d="M${f(a * .55)},${f(b * .55)} L${f(a * .55 + (a > 0 ? 2.6 : -2.6))},${f(b * .55 - 2)}" stroke="#3a9a2c" stroke-width="1.6" stroke-linecap="round"/>`).join('')}</g>`;
}
// 小口切りの小ねぎ・チャイブ（緑の輪）
function chives(p, x, y, s, n, seed){
    const R = rng('nbcv' + seed);
    return Array.from({ length: n }, () => { const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2; return `<circle cx="${f(x + Math.cos(a) * dd)}" cy="${f(y + Math.sin(a) * dd)}" r="2.6" fill="#d8efb0" stroke="#2f8a24" stroke-width="1.5"/>`; }).join('');
}
// 油のたらし（太い線＋明るい芯）
function drizzle(d, c = '#a8a020', w = 3.4){
    return `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity=".7"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${lt(c, .55)}" stroke-width="${f(w * .35)}" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 汁物の面
function soup(p, R, c, { glow = .28 } = {}){
    return `<circle cx="100" cy="100" r="${R}" fill="${p.rg(c, glow, .22, .42, .4)}"/>
        <path d="M${f(100 - R * .62)},${f(100 - R * .3)} A${f(R * .72)},${f(R * .72)} 0 0 1 ${f(100 - R * .15)},${f(100 - R * .66)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// クリームの渦（白い太線）
function creamSwirl(x, y, s, { c = '#fffaf0', turns = 1.6 } = {}){
    const pts = Array.from({ length: 28 }, (_, i) => { const t = i / 27, a = t * turns * 2 * Math.PI, r = (.12 + t * .88) * s / 2; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35" transform="translate(1 1.5)"/><path d="${d}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}
// 輪切りのねぎ・ポロねぎ（淡い緑の同心円）
function leekRing(p, x, y, s){
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${f(s / 2)}" fill="#eef4cc" stroke="#6a9a32" stroke-width="1.6"/></g><circle r="${f(s * .32)}" fill="none" stroke="#9cc45a" stroke-width="1.2"/><circle r="${f(s * .14)}" fill="#cfe49a"/></g>`;
}
// 米粒（ふくらんだ粥の粒: 白に、明るさの差をつけた輪郭）
function grains(p, x, y, s, n, seed, { c = '#fdfcf6', edge = '#c8c0a8' } = {}){
    const R = rng('nbgr' + seed);
    return Array.from({ length: n }, () => { const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="4.4" ry="2.4" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${c}" stroke="${edge}" stroke-width=".9"/>`; }).join('');
}
// 葉（コリアンダー・カレーリーフ・ミントなど。形の違う葉を色と明るさで描く）
function corianderLeaf(p, x, y, s, r){
    const k = s / 16;
    return `<g ${T(x, y, r, k)}><path d="M0,6 C-7,5 -8,-2 -4,-4 C-4,-8 2,-8 2,-5 C6,-7 9,-2 6,1 C8,4 5,7 0,6Z" fill="${p.g('#3c9a2a', .3, .25)}" stroke="#16500c" stroke-width=".9"/><path d="M0,6 L0,-3 M0,1 L-4,-2 M0,1 L4,-2" stroke="#a8dc7a" stroke-width=".8" fill="none"/></g>`;
}
function curryLeaf(p, x, y, s, r){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M-10,0 Q-4,-6 4,-5 Q10,-3 11,0 Q8,4 0,5 Q-6,4 -10,0Z" fill="${p.g('#2f7a24', .25, .35)}" stroke="#0e3a08" stroke-width=".9"/></g><path d="M-9,0 Q0,-.5 10,0" stroke="#7ab858" stroke-width=".9" fill="none"/></g>`;
}
function redChili(p, x, y, s, r){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,1 Q-4,-5 6,-3 Q10,-2 11,1 Q6,4 -2,4 Q-8,4 -10,1Z" fill="${p.g('#b8200e', .3, .3)}" stroke="#5a0c04" stroke-width=".9"/></g><path d="M-10,1 L-13,-1" stroke="#5a7a20" stroke-width="2" stroke-linecap="round"/><path d="M-4,-2 Q2,-4 7,-2" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/></g>`;
}
function greenChiliSlit(p, x, y, s, r){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-15,0 Q-6,-5 10,-3 Q15,-2 16,0 Q12,3 -2,3 Q-10,3 -15,0Z" fill="${p.g('#3c9a24', .3, .3)}" stroke="#14460a" stroke-width="1"/></g><path d="M-10,0 L11,-.5" stroke="#d6f0a8" stroke-width="1.2"/><path d="M-15,0 L-19,-2" stroke="#4a7a1a" stroke-width="2.4" stroke-linecap="round"/></g>`;
}
function peanut(p, x, y, s, r){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><ellipse rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${p.g('#e8c48a', .3, .25)}" stroke="#8a5a24" stroke-width=".9"/></g><path d="M0,${f(-s * .36)} L0,${f(s * .36)}" stroke="#b8864a" stroke-width=".8"/></g>`;
}
function dice(p, x, y, s, r, c){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g><path d="M${f(-s * .28)},${f(-s * .26)} L${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`;
}
// ほぐした魚の身（白・身の筋）
function fishBit(p, x, y, s, r, seed){
    const R = rng('nbfb' + seed), pts = ring(s / 2, 7, .25, R, 1.3, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#fffaf0', .1, .15)}" stroke="#7a6a4c" stroke-width="1"/></g><path d="M${f(-s * .2)},${f(-s * .2)} L${f(-s * .05)},0 L${f(-s * .2)},${f(s * .2)} M${f(s * .12)},${f(-s * .2)} L${f(s * .27)},0 L${f(s * .12)},${f(s * .2)}" stroke="#d6c6a2" stroke-width="1.1" fill="none"/></g>`;
}

export default {
    // ---- マッシュポテト（9品）: 器の形 × 盛りの形 × 材料にある目印 で分ける ----

    // イタリア: 浅い丸皿、ライサーで押し出したふわふわの山、すりおろしたパルミジャーノ（目印）とナツメグ
    it_pure: p => [
        K.plate(p),
        mash(p, { rx: 60, ry: 54, c: '#f6e6b0', style: 'ricer', seed: 1 }),
        cheeseShreds(p, 100, 96, 70, 22, 1),
        dust(p, 100, 100, 80, 10, '#8a4a1c', 1),
    ].join(''),

    // ペルー: 楕円皿、黄色いじゃがいもで濃い黄色のなめらかな山（目印は色）、バターの池とパルメザン少し
    pe_pure_papa: p => [
        oval(p),
        mash(p, { rx: 66, ry: 46, c: '#f8cc4a', style: 'smooth', seed: 2 }),
        mash(p, { rx: 40, ry: 26, c: '#fad464', style: 'swirl', seed: 3, x: 98, y: 98 }),
        butter(p, 100, 98, 14, { melt: .7 }),
        cheeseShreds(p, 112, 112, 30, 5, 2),
    ].join(''),

    // ブラジル: 深鉢に、とてもやわらかい（鉢いっぱいに平らに広がる）ピューレ、中央にとけたバター
    br_pure_batata: p => [
        deepBowl(p),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#f4e2a8', .28, .16, .42, .4)}"/>`,
        `<path d="M48,92 Q70,74 100,78 T150,90" stroke="#fffbe8" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/><path d="M52,118 Q78,104 104,110 T146,112" stroke="#fffbe8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`,
        butter(p, 104, 98, 20, { melt: 1 }),
        dust(p, 100, 100, 90, 8, '#8a4a1c', 3),
    ].join(''),

    // ドイツ: 深鉢に、マッシャーでつぶしたふんわりした山盛り、上にナツメグ（バターは牛乳と一緒に混ぜこむので上にはのせない）
    de_kartoffelpueree: p => [
        deepBowl(p),
        mash(p, { rx: 66, ry: 62, c: '#f4e4b4', style: 'peaks', seed: 4 }),
        dust(p, 100, 100, 100, 18, '#7a3a14', 4, 1.3),
    ].join(''),

    // スペイン: 丸皿に平らに広げ、生のオリーブオイルを太い線で回しかける（目印）、ナツメグ少し
    es_pure: p => [
        K.plate(p),
        mash(p, { rx: 64, ry: 58, c: '#f3e0aa', style: 'smooth', seed: 5 }),
        drizzle(`M58,96 C66,70 98,64 118,76 C138,88 136,116 114,126 C94,136 70,128 70,108`, '#b4aa22', 3.6),
        dust(p, 100, 100, 90, 7, '#7a3a14', 5),
    ].join(''),

    // フランス: 楕円皿にフォークの櫛目をつけたなめらかなピューレ、バターのひとかけ
    fr_puree: p => [
        oval(p),
        mash(p, { rx: 70, ry: 48, c: '#f6e8bc', style: 'fork', seed: 6 }),
        butter(p, 126, 90, 16, { melt: .4 }),
        dust(p, 100, 100, 80, 6, '#7a3a14', 6),
    ].join(''),

    // ポーランド: 深鉢に渦の山、刻んだディルをたっぷり（目印）
    pl_puree: p => [
        deepBowl(p),
        mash(p, { rx: 62, ry: 58, c: '#f4e6b8', style: 'swirl', seed: 7 }),
        ...[[78, 80, 20], [118, 76, -40], [100, 104, 70], [72, 120, 140], [128, 118, 10], [104, 136, -80], [96, 70, 110]].map(([x, y, r]) => dill(p, x, y, 18, r)),
    ].join(''),

    // アメリカ: 丸皿に高い山、上のくぼみにバターのひとかけがとけ、黒こしょうとチャイブ（任意の材料）
    us_mashed: p => [
        K.plate(p),
        mash(p, { rx: 58, ry: 54, c: '#f8e0a0', style: 'peaks', seed: 8 }),
        butter(p, 100, 98, 22, { melt: 1 }),
        dust(p, 100, 100, 104, 16, '#2a2420', 8, 1.1),
        chives(p, 100, 104, 96, 9, 8),
    ].join(''),

    // エジプト: 小鉢に白っぽいなめらかな渦の山、白こしょう（明るい灰）とナツメグ（茶）
    eg_pure: p => [
        smallBowl(p),
        mash(p, { rx: 54, ry: 50, c: '#f6ecd0', style: 'swirl', seed: 9 }),
        dust(p, 100, 100, 90, 10, '#8a8478', 9, 1.2),
        dust(p, 100, 100, 60, 6, '#7a3a14', 19, 1.1),
    ].join(''),

    // ---- スープ・粥（7品） ----

    // ポロねぎとじゃがいものポタージュ: 淡い緑がかったクリーム色、輪切りのポロねぎ・パルミジャーノ・黒こしょう
    it_patateporri: p => [
        deepBowl(p),
        soup(p, 78, '#e4e2a4'),
        ...[[82, 84], [112, 78], [96, 108], [124, 110]].map(([x, y]) => leekRing(p, x, y, 18)),
        cheeseShreds(p, 104, 100, 50, 8, 10),
        dust(p, 100, 100, 110, 12, '#2a2420', 10, 1.1),
    ].join(''),

    // 野菜のピューレスープ: にんじん・ズッキーニ・いんげんでくすんだ橙色。仕上げの生のオリーブオイル（太い線）。クルトン・ハーブは材料にないので描かない
    es_purever: p => [
        deepBowl(p),
        soup(p, 78, '#d89a3c'),
        drizzle(`M60,100 C64,74 92,62 114,72 C136,82 138,112 120,124`, '#c8b42a', 3.4),
        `<circle cx="84" cy="118" r="5" fill="#d8c43a" stroke="#8a7a14" stroke-width=".8"/><circle cx="96" cy="126" r="3.4" fill="#d8c43a" stroke="#8a7a14" stroke-width=".8"/>`,
    ].join(''),

    // ピラン（ブラジル）: 魚のだしをキャッサバ粉でとろりとさせた粥。ほぐした魚・トマト・コリアンダーを大きめに
    br_pirao: p => [
        deepBowl(p),
        soup(p, 78, '#d8b46a', { glow: .3 }),
        `<path d="M50,96 Q72,82 98,88 T150,96" stroke="#ecd49a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        ...[[80, 82, 20], [124, 96, -30], [92, 124, 50]].map(([x, y, r], i) => fishBit(p, x, y, 22, r, i)),
        ...[[110, 72, 10], [68, 108, 30], [136, 124, -20], [108, 112, 45]].map(([x, y, r]) => dice(p, x, y, 10, r, '#e23a22')),
        ...[[100, 92, 20], [62, 80, -40], [126, 70, 80], [76, 140, 10], [140, 104, -60]].map(([x, y, r]) => corianderLeaf(p, x, y, 16, r)),
    ].join(''),

    // 白がゆ: 黒い土鍋で白い粥を引き立てる（目印は明暗）。ふくらんだ米粒を大きめに。塩は好みなので描かない
    okayu: p => [
        donabe(p),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#f6f2e2', .3, .14, .42, .4)}"/>`,
        grains(p, 100, 100, 130, 46, 11, { edge: '#d6ceb8' }),
        `<path d="M52,82 A52,52 0 0 1 86,50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`,
    ].join(''),

    // かぼちゃのポタージュ: 鮮やかな橙に生クリームの白い渦とこしょう。クルトン・パセリは材料にないので描かない
    kabochapotage: p => [
        deepBowl(p),
        soup(p, 78, '#f0a02a', { glow: .3 }),
        creamSwirl(100, 100, 92),
        dust(p, 100, 100, 100, 10, '#2a2420', 12, 1),
    ].join(''),

    // ヤイラ・チョルバス（トルコ）: 白いヨーグルトのスープに米粒、仕上げにバターでじゅっと温めた乾燥ミント（赤茶の油と濃い緑の粉）
    tr_yayla: p => [
        deepBowl(p),
        soup(p, 78, '#f6f0dc', { glow: .2 }),
        grains(p, 100, 100, 130, 26, 13, { c: '#fffdf4', edge: '#c8bc9a' }),
        drizzle(`M58,104 C68,80 96,70 118,80 C138,90 136,114 116,122`, '#d8742a', 3.4),
        `<circle cx="80" cy="122" r="6" fill="#e08a3a" opacity=".85"/><circle cx="134" cy="72" r="4.4" fill="#e08a3a" opacity=".85"/>`,
        dust(p, 104, 98, 70, 26, '#3a5a1c', 13, 1.3),
    ].join(''),

    // グジャラートのダル: 金属のカトリに、さらっとした明るい黄色のダル。テンパリング（カレーリーフ・赤唐辛子・マスタードシード）、ピーナッツ、トマト、青唐辛子、コリアンダー
    in_gujaratidal: p => [
        katori(p),
        soup(p, 78, '#f2c234', { glow: .3 }),
        `<path ${T(100, 100)} d="${smooth(ring(30, 9, .3, rng('nbgd'), 1, .9))}" fill="#e8a020" opacity=".45"/>`,
        ...[[86, 84, 20], [116, 80, -40], [104, 112, 60]].map(([x, y, r]) => curryLeaf(p, x, y, 22, r)),
        redChili(p, 70, 110, 22, 30),
        greenChiliSlit(p, 128, 118, 30, -20),
        ...[[120, 98, 10], [92, 132, 60], [62, 86, -20], [140, 84, 40]].map(([x, y, r]) => peanut(p, x, y, 10, r)),
        ...[[98, 70, 20], [78, 128, 0]].map(([x, y, r]) => dice(p, x, y, 10, r, '#e23a22')),
        ...[[132, 140, 20], [60, 130, -40], [112, 140, 70]].map(([x, y, r]) => corianderLeaf(p, x, y, 14, r)),
        dust(p, 100, 100, 100, 14, '#2a1a10', 14, 1.1),
    ].join(''),
};

// 主役と下地の明るさの比（render_r2.mjs が表にする）
export const PAIRS = {
    it_pure: [['マッシュ', '#f6e6b0', '皿', '#f6f4ee'], ['チーズ', '#fbeaa0', 'チーズの縁', '#a8862a']],
    pe_pure_papa: [['黄色いマッシュ', '#f8cc4a', '皿', '#f6f4ee']],
    br_pure_batata: [['バター', '#f8d54a', 'ピューレ', '#f4e2a8']],
    de_kartoffelpueree: [['ナツメグ', '#7a3a14', 'マッシュ', '#f4e4b4'], ['山の影', '#d2bc84', 'マッシュ', '#f4e4b4']],
    es_pure: [['オリーブ油', '#b4aa22', 'マッシュ', '#f3e0aa']],
    fr_puree: [['櫛目の影', '#d0bc8c', 'ピューレ', '#f6e8bc']],
    pl_puree: [['ディル', '#3a9a2c', 'マッシュ', '#f4e6b8']],
    us_mashed: [['バター', '#fbe27a', 'マッシュ', '#f8e0a0'], ['こしょう', '#2a2420', 'マッシュ', '#f8e0a0']],
    eg_pure: [['白こしょう', '#8a8478', 'マッシュ', '#f6ecd0']],
    it_patateporri: [['ポロねぎの縁', '#6a9a32', 'スープ', '#e4e2a4']],
    es_purever: [['オリーブ油', '#c8b42a', 'スープ', '#d89a3c']],
    br_pirao: [['魚', '#fffaf0', '粥', '#d8b46a'], ['コリアンダー', '#3c9a2a', '粥', '#d8b46a']],
    okayu: [['粥', '#f6f2e2', '土鍋', '#2a201a']],
    kabochapotage: [['生クリーム', '#fffaf0', 'スープ', '#f0a02a']],
    tr_yayla: [['ミントバター', '#d8742a', 'スープ', '#f6f0dc'], ['ミント', '#3a5a1c', 'スープ', '#f6f0dc']],
    in_gujaratidal: [['カレーリーフ', '#2f7a24', 'ダル', '#f2c234'], ['赤唐辛子', '#b8200e', 'ダル', '#f2c234']],
};
