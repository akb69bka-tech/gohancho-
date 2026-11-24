// 江口 ひなた 案（第2回・C 組: クリームスープ・ポタージュ 17品）
// 試し描き: dishes/ に置くと元のファイルと ID が重複して build.mjs が止まるため、採用が決まるまで r2/ に置く。
// 描き出しは r2/render_r2.mjs（この ID だけを SVG に書き出す。gohancho/img/dish は触らない）
// 原則: 主役は大きく少なく／汁と具は明暗で分ける／いちばん小さい絵で判定／具ごとに形の記号を1つ／
//       材料・作り方にないものは描かない／縁は藍、国らしさは器の形と盛り方で
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk } = K;
const INDIGO = '#2c4c7c';

// =========================================================
// 器（すべて縁は藍）
// =========================================================
// 深い丸鉢（イギリス・ブラジルなど）。スープの面の半径 76
function deepBowl(p, { inner = true } = {}){
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="92" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="89" fill="none" stroke="${INDIGO}" stroke-width="3"/>
        ${inner ? `<circle cx="100" cy="100" r="84" fill="none" stroke="${INDIGO}" stroke-width="1" opacity=".8"/>` : ''}
        <circle cx="100" cy="100" r="80" fill="${p.rg('#f6f3ec', .1, .24, .62, .64)}"/>
        <path d="M34,63 A79,79 0 0 1 82,21" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// トルコのチョルバ鉢（白い深鉢に藍の帯と点）
function corbaBowl(p){
    const dots = Array.from({ length: 32 }, (_, i) => { const a = i / 32 * 6.283; return `<circle cx="${f(100 + Math.cos(a) * 85.5)}" cy="${f(100 + Math.sin(a) * 85.5)}" r="1.6" fill="${INDIGO}"/>`; }).join('');
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="92" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="89.5" fill="none" stroke="${INDIGO}" stroke-width="2.4"/>${dots}
        <circle cx="100" cy="100" r="81" fill="${p.rg('#f6f3ec', .1, .24, .62, .64)}"/>
        <path d="M34,63 A79,79 0 0 1 82,21" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// フランス・イタリア・ポーランド・スペインの縁の広いスープ皿（assiette creuse / fondina / talerz głęboki / plato hondo）
// スープの面の半径は 62 前後。band を true にすると、縁に藍の帯をもう1本（ポーランドの家庭の皿らしく）
function soupPlate(p, { band = false } = {}){
    return `${K.plate(p, { well: .7 })}
        ${band ? `<circle cx="100" cy="100" r="80" fill="none" stroke="${INDIGO}" stroke-width="1.2" opacity=".85"/>` : ''}
        <circle cx="100" cy="100" r="64" fill="${p.rg('#f2eee4', .06, .3, .6, .62)}"/>`;
}
// ドイツのスープカップ（Suppentasse: 両側に持ち手のある白いカップ）。スープの面の半径 66
function suppentasse(p){
    const lug = x => `<path d="M${x},88 Q${x + (x < 100 ? -16 : 16)},88 ${x + (x < 100 ? -16 : 16)},100 Q${x + (x < 100 ? -16 : 16)},112 ${x},112" fill="none" stroke="${p.g('#f4f1ea', .2, .2)}" stroke-width="7" stroke-linecap="round"/>
        <path d="M${x},88 Q${x + (x < 100 ? -16 : 16)},88 ${x + (x < 100 ? -16 : 16)},100 Q${x + (x < 100 ? -16 : 16)},112 ${x},112" fill="none" stroke="${INDIGO}" stroke-width="1.2" opacity=".8"/>`;
    return `<g ${p.sh(1.5)}>${lug(24)}${lug(176)}<circle cx="100" cy="100" r="78" fill="${p.rg('#fbfaf6', .2, .14, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="75.5" fill="none" stroke="${INDIGO}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="70" fill="${p.rg('#f6f3ec', .1, .24, .62, .64)}"/>
        <path d="M42,70 A66,66 0 0 1 80,36" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// メキシコの素焼きの鉢（器の色は残し、縁に藍の線を1本）
function barro(p){
    return `${K.bowl(p, { R: 92, glaze: '#a65a2c', inside: '#e9caa0', lip: .87 })}
        <circle cx="100" cy="100" r="88.5" fill="none" stroke="${INDIGO}" stroke-width="2"/>`;
}

// =========================================================
// スープの面と仕上げ
// =========================================================
// なめらかなスープの面: 中心が明るく、縁に少し濃いふち（器との境）。左上に面のつや
function soup(p, R, c, { glow = .3, cx = 100, cy = 100 } = {}){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, glow, .22, .42, .4)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 1}" fill="none" stroke="${dk(c, .18)}" stroke-width="1.6" opacity=".45"/>
        <path d="M${f(cx - R * .7)},${f(cy - R * .22)} A${f(R * .74)},${f(R * .74)} 0 0 1 ${f(cx - R * .22)},${f(cy - R * .7)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// ポタージュのとろみ: 面にうっすらと残る、やわらかなうねり
function velvet(cx, cy, R, c, { op = .35 } = {}){
    return `<path d="M${f(cx - R * .55)},${f(cy + R * .25)} Q${f(cx - R * .1)},${f(cy + R * .05)} ${f(cx + R * .25)},${f(cy + R * .3)} T${f(cx + R * .6)},${f(cy + R * .2)}" stroke="${lt(c, .4)}" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>
        <path d="M${f(cx - R * .35)},${f(cy + R * .5)} Q${f(cx)},${f(cy + R * .36)} ${f(cx + R * .35)},${f(cy + R * .52)}" stroke="${dk(c, .12)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${f(op * .7)}"/>`;
}
// 生クリーム・牛乳のうず（白い線に、わずかな影）
function swirl(cx, cy, R, { c = '#fffdf6', w = 3.2, turns = 1.6, op = .95 } = {}){
    let d = '';
    const n = 40;
    for (let i = 0; i <= n; i++){
        const t = i / n, a = t * turns * 6.283 - 1.2, rr = R * (.15 + .85 * t);
        d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr * .92)}`;
    }
    return `<path d="${d}" stroke="#b8a888" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".25" transform="translate(.8 1.2)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// クレームフレッシュ・サワークリームのひとさじ（ぽってりした白い山）
function dollop(p, x, y, s, { c = '#fffcf2', seed = 1 } = {}){
    const R = rng(p.id + 'dl' + seed);
    const d = smooth(ring(s / 2, 9, .22, R, 1.1, .9));
    return `<g ${T(x, y)}><g ${p.sh(.8)}><path d="${d}" fill="${p.rg(c, .3, .1, .38, .34)}" stroke="#d8ccb0" stroke-width=".7"/></g>
        <path d="M${f(-s * .28)},${f(s * .12)} Q${f(-s * .05)},${f(-s * .02)} ${f(s * .08)},${f(s * .1)} Q${f(s * .2)},${f(s * .2)} ${f(s * .28)},${f(s * .04)}" fill="none" stroke="#e2d6bc" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M${f(s * .02)},${f(-s * .08)} q${f(s * .06)},${f(-s * .14)} ${f(s * .16)},${f(-s * .1)}" fill="none" stroke="#e2d6bc" stroke-width="1" stroke-linecap="round"/>
        <path d="M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .16)},${f(-s * .3)} ${f(s * .1)},${f(-s * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
}
// オリーブオイル・溶かしバターのひと筋（金色の細い線と粒）
function oilThread(p, pts, { c = '#e8b828', w = 2.4, seed = 1 } = {}){
    const d = smooth(pts, false);
    const R = rng(p.id + 'ot' + seed);
    const beads = pts.filter((_, i) => i % 2).map(([x, y]) => { const rr = 1.4 + R() * 1.6, bx = x + (R() - .5) * 8, by = y + (R() - .5) * 8; return `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(rr)}" fill="${c}" opacity=".85"/><circle cx="${f(bx - rr * .35)}" cy="${f(by - rr * .35)}" r="${f(rr * .35)}" fill="#fff" opacity=".8"/>`; }).join('');
    return `<path d="${d}" stroke="${dk(c, .2)}" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".35"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".92"/><path d="${d}" stroke="#fff6c8" stroke-width="${f(w * .35)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.5 -.6)"/>${beads}`;
}
// こしょう・ナツメグなどの粉（ごく小さな点）
function dust(p, cx, cy, s, c, n, r = .6, seed = 1){
    const R = rng(p.id + 'du' + seed + c);
    return Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * s / 2; return `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(r * (.6 + R() * .7))}" fill="${c}"/>`; }).join('');
}
// 散らす位置（重ならない）
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

// =========================================================
// 具・薬味（形の記号を1つずつ）
// =========================================================
// 小口切りのチャイブ（細い緑の筒）
function chives(p, cx, cy, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'cv' + seed);
    return `<g ${p.sh(.3)}>${Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * s / 2, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; return `<g ${T(x, y, R() * 180)}><rect x="-3.4" y="-1.5" width="6.8" height="3" rx="1.5" fill="${R() < .5 ? '#3f9a2c' : '#55ad3a'}" stroke="#256a18" stroke-width=".4"/><path d="M-2.4,-.6 L2,-.6" stroke="#c8ec9a" stroke-width=".6"/></g>`; }).join('')}</g>`;
}
// ディル（羽のような細い葉）
function dill(p, x, y, s, r){
    const k = s / 20;
    const br = [[-6, -4], [-2, -6], [2, -5], [6, -3], [-5, 3], [-1, 5], [3, 5]].map(([a, b]) => `M${f(a * .6)},${f(b * .2)} L${a},${b}`).join(' ');
    return `<g ${T(x, y, r, k)}><path d="M-9,0 Q0,-1 9,0 ${br}" stroke="#4e9a34" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M-9,0 Q0,-1 9,0" stroke="#2f6a1e" stroke-width=".5" fill="none" opacity=".6"/></g>`;
}
// パセリ・セルフイユの小さな葉
function herbLeaf(p, x, y, s, r, { c = '#3f9a2c' } = {}){
    return `<g ${T(x, y, r)}><path d="M0,0 Q${f(-s * .5)},${f(-s * .5)} ${f(-s * .1)},${f(-s)} Q${f(s * .3)},${f(-s * .6)} 0,0Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4"/><path d="M0,0 Q${f(s * .55)},${f(-s * .1)} ${f(s * .85)},${f(-s * .5)} Q${f(s * .5)},${f(-s * .9)} 0,0Z" fill="${lt(c, .12)}" stroke="${dk(c, .3)}" stroke-width=".4"/><path d="M0,0 Q${f(-s * .6)},${f(s * .1)} ${f(-s * .8)},${f(s * .45)} Q${f(-s * .3)},${f(s * .5)} 0,0Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4"/></g>`;
}
// ねぎ類の輪切り（白〜淡い緑の同心円。リーキ）
function leekRing(p, x, y, s, r = 0, { green = .5 } = {}){
    const c = green > .5 ? '#cfe2a0' : '#eef2d8';
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g(c, .3, .15)}" stroke="#94ac5a" stroke-width=".9"/></g>
        <ellipse rx="${f(s * .34)}" ry="${f(s * .31)}" fill="none" stroke="#b6c886" stroke-width=".9"/><ellipse rx="${f(s * .18)}" ry="${f(s * .16)}" fill="${lt(c, .3)}" stroke="#c4d49a" stroke-width=".8"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .14)},${f(-s * .36)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// さいの目（じゃがいも・にんじんなど）
function dice(p, x, y, s, r, c){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g(c, .32, .25)}" stroke="${dk(c, .32)}" stroke-width=".7"/></g><path d="M${f(-s * .32)},${f(-s * .3)} L${f(s * .12)},${f(-s * .32)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".75"/></g>`;
}
// すりおろしたチーズの山（細い黄色の線の重なり）
function gratedCheese(p, x, y, s, { c = '#f2d468', n = 26, seed = 1 } = {}){
    const R = rng(p.id + 'gc' + seed);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.283, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .85, L = 6 + R() * 5, rr = R() * 180;
        o += `<g ${T(cx, cy, rr)}><path d="M${f(-L / 2)},0 Q0,${f(-1.6 - R() * 1.4)} ${f(L / 2)},0" stroke="${dk(c, .3)}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${f(-L / 2)},0 Q0,${f(-1.6 - R() * 1.4)} ${f(L / 2)},0" stroke="${R() < .5 ? c : lt(c, .25)}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
    }
    return `<g ${p.sh(.4)}>${o}</g>`;
}
// マッシュルームの薄切り（かさと軸の断面: いちばん分かりやすい形）
function mushroomSlice(p, x, y, s, r){
    const k = s / 24;
    const d = 'M-11,1 C-11,-8 -5,-11 0,-11 C5,-11 11,-8 11,1 C11,3 8,3.6 4,3.6 L4,10 Q0,12 -4,10 L-4,3.6 C-8,3.6 -11,3 -11,1Z';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${d}" fill="${p.g('#efe0c4', .25, .2)}" stroke="#8a5e34" stroke-width="1.1" stroke-linejoin="round"/></g>
        <path d="M-10,0.6 C-10,-7.4 -4.6,-10 0,-10 C4.6,-10 10,-7.4 10,0.6" fill="none" stroke="#b07a44" stroke-width="2.2"/>
        <path d="M-8,1.6 L8,1.6" stroke="#d8c39c" stroke-width=".8"/>
        <path d="M-6,-5 Q-2,-8 3,-7.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 白アスパラガスのひと切れ（穂先つき or 切り口）
function asparagus(p, x, y, L, r, { tip = true } = {}){
    const w = 10;
    const tipD = tip ? `<path d="M${f(L / 2 - 8)},${-w / 2} Q${f(L / 2 + 2)},${-w / 2 - .4} ${f(L / 2 + 3)},0 Q${f(L / 2 + 2)},${w / 2 + .4} ${f(L / 2 - 8)},${w / 2}Z" fill="${p.g('#f2eac8', .3, .2)}" stroke="#b8a870" stroke-width=".8"/>
        <path d="M${f(L / 2 - 6)},-2.6 l3,1.4 l-3,1.2 M${f(L / 2 - 3)},-1.8 l3,1.6 M${f(L / 2 - 6)},2.4 l3,-1.2" stroke="#c8b480" stroke-width=".8" fill="none"/>` : `<ellipse cx="${L / 2}" cy="0" rx="2.4" ry="${w / 2}" fill="#fbf6e2" stroke="#c8b888" stroke-width=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${-L / 2}" y="${-w / 2}" width="${tip ? L - 6 : L}" height="${w}" rx="2" fill="${p.g('#f7f2dc', .25, .2)}" stroke="#b8a870" stroke-width=".8"/>${tipD}</g>
        <ellipse cx="${-L / 2}" cy="0" rx="2.2" ry="${w / 2 - .3}" fill="#fbf6e2" stroke="#c8b888" stroke-width=".7"/>
        <path d="M${f(-L / 2 + 3)},-1.8 L${f(L / 2 - 8)},-1.8" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".85"/></g>`;
}
// ほぐした鶏むね肉（繊維の束）
function chickenShred(p, x, y, L, r, seed){
    const R = rng(p.id + 'cs' + seed);
    const w = 6 + R() * 2;
    const d = `M${-L / 2},${f(-w / 2)} Q0,${f(-w / 2 - 1.4)} ${L / 2},${f(-w / 2 + R())} L${f(L / 2 + 1.5)},${f(w / 2)} Q0,${f(w / 2 + 1.2)} ${-L / 2},${f(w / 2)} L${f(-L / 2 - 1.5)},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${d}" fill="${p.g('#ecc898', .28, .25)}" stroke="#a07040" stroke-width=".8" stroke-linejoin="round"/></g><path d="M${f(-L * .4)},-.6 L${f(L * .38)},-.4 M${f(-L * .3)},1.4 L${f(L * .3)},1.6" stroke="#c8a476" stroke-width=".6"/><path d="M${f(-L * .36)},${f(-w * .3)} L${f(L * .2)},${f(-w * .34)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 崩したケソ・フレスコ（白い角ばったかけら）
function quesoCrumble(p, x, y, s, r, seed){
    const R = rng(p.id + 'qf' + seed);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(ring(s / 2, 6, .35, R, 1.1, .9), true, .35)}" fill="${p.g('#fdfcf6', .1, .16)}" stroke="#c8c0a8" stroke-width=".8"/></g><path d="M${f(-s * .26)},${f(-s * .16)} L${f(s * .1)},${f(-s * .24)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/></g>`;
}
// ベーコンの小さな角切り（燻製の赤みと脂）
function baconBit(p, x, y, s, r){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${-s / 2}" y="${f(-s * .36)}" width="${s}" height="${f(s * .72)}" rx="1.6" fill="${p.g('#c0583e', .3, .3)}" stroke="#7a2a18" stroke-width=".7"/></g><rect x="${f(-s / 2 + .8)}" y="${f(-s * .08)}" width="${f(s - 1.6)}" height="${f(s * .18)}" fill="#f2d4b8"/></g>`;
}
// 唐辛子バター（トルコのプル・ビベルを溶かしたバター）
function redButter(p, cx, cy, R, seed = 1){
    const Rg = rng(p.id + 'rb' + seed);
    const blobs = Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.283 + Rg(), d = R * (.25 + Rg() * .45), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; return `<path d="${smooth(ring(5 + Rg() * 6, 8, .4, Rg, 1.3, .8))}" transform="translate(${f(x)} ${f(y)}) rotate(${f(Rg() * 180)})" fill="#d8441a" opacity=".55"/>`; }).join('');
    return `${blobs}${swirl(cx, cy, R * .8, { c: '#e0501c', w: 2.6, turns: 1.3, op: .8 })}`;
}

// =========================================================
// 17品
// =========================================================
export default {
    // イギリス: リーキとじゃがいものスープ。深い鉢に、ざっくり残したリーキの輪切りとじゃがいも、クリームのうず、チャイブ
    gb_leekpotato: p => [
        deepBowl(p), soup(p, 76, '#e8e4bc'), velvet(100, 100, 76, '#e8e4bc'),
        swirl(100, 102, 34, { turns: 1.5 }),
        `<g>${[[68, 76], [130, 74], [64, 124], [132, 128], [100, 60]].map(([x, y], i) => leekRing(p, x, y, 22, i * 30, { green: i % 2 ? .6 : .3 })).join('')}</g>`,
        ...[[84, 136, 20], [118, 64, -15], [146, 104, 30], [56, 100, 10]].map(([x, y, r]) => dice(p, x, y, 13, r, '#f4e2a8')),
        chives(p, 100, 100, 70, { n: 14 }),
        dust(p, 100, 100, 110, '#3a3028', 14, .6),
    ].join(''),

    // スペイン: ズッキーニのクレマ。白い深鉢に明るい緑のクリーム、オリーブオイルのひと筋、ズッキーニの薄い輪切り
    es_crema: p => [
        deepBowl(p, { inner: false }), soup(p, 77, '#b9d27a', { glow: .35 }), velvet(100, 100, 77, '#b9d27a'),
        oilThread(p, [[52, 96], [62, 74], [84, 60], [110, 58], [134, 70], [148, 92]], { seed: 1 }),
        ...[[94, 108, 0], [116, 98, 40], [106, 124, -20], [84, 128, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="14" fill="#2f6a20"/><circle r="12.4" fill="${p.rg('#e4f0b8', .2, .12)}"/></g><circle r="6.4" fill="none" stroke="#cfe2a0" stroke-width="1"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${f(Math.cos(i * 1.26) * 4.2)}" cy="${f(Math.sin(i * 1.26) * 4.2)}" rx="1" ry=".6" fill="#f6f8e6"/>`).join('')}<path d="M-6,-4 Q-2,-7 3,-6.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`),
        dust(p, 100, 100, 110, '#3a3028', 12, .6),
    ].join(''),

    // フランス: ポワロー＝ポム・ド・テール。縁の広いスープ皿に、淡い緑のポタージュとクレームフレッシュのひとさじ、リーキの輪切り
    fr_poireaux: p => [
        soupPlate(p), soup(p, 62, '#e2e2b4'), velvet(100, 100, 62, '#e2e2b4'),
        dollop(p, 90, 92, 46),
        ...[[126, 104, 10], [112, 132, 70], [76, 128, 40]].map(([x, y, r], i) => leekRing(p, x, y, 26, r, { green: i % 2 ? .6 : .3 })),
        dust(p, 100, 100, 100, '#3a3028', 12, .6),
    ].join(''),

    // トルコ: ウン・チョルバス（炒った小麦粉のスープ）。チョルバ鉢に、淡いれんが色のスープ、ミントとプル・ビベルを溶かしたバター
    tr_un: p => [
        corbaBowl(p), soup(p, 77, '#e2a878'), velvet(100, 100, 77, '#e2a878'),
        redButter(p, 100, 100, 46),
        dust(p, 100, 100, 100, '#b8240e', 26, 1.1, 2),
        ...spots('tun', 12, 44, 12).map(([x, y, r]) => `<path ${T(x, y, r)} d="${smooth(ring(2.6, 6, .5, rng('m' + x), 1.3, .8))}" fill="#4a6a2a"/>`),
    ].join(''),

    // フランス: カリフラワーのヴルーテ。縁の広いスープ皿に、雪のように白いヴルーテ、すりおろしたコンテの山、ナツメグと白こしょう
    fr_choufleur: p => [
        soupPlate(p), soup(p, 62, '#f2ecd6', { glow: .45 }), velvet(100, 100, 62, '#e8e0c8', { op: .5 }),
        gratedCheese(p, 100, 98, 60, { c: '#f0cc58', n: 60 }),
        dust(p, 100, 100, 100, '#8a5a2a', 18, .7, 3),
        dust(p, 100, 100, 100, '#c8bca0', 10, .6, 4),
    ].join(''),

    // ブラジル: マンジョキーニャのクリームスープ。白い深鉢に、黄色いクリーム、ほぐした鶏肉、クリームのうず、シェイロ・ヴェルデ（パセリと青ねぎ）
    br_creme_mandioquinha: p => [
        deepBowl(p), soup(p, 76, '#f0cc6a', { glow: .35 }), velvet(100, 100, 76, '#f0cc6a'),
        swirl(100, 100, 40, { turns: 1.3, w: 2.8 }),
        `<g>${[[88, 92, 20, 34], [112, 96, -30, 32], [98, 112, 70, 30], [118, 114, 10, 28], [84, 110, -60, 28], [104, 82, 50, 30], [96, 100, 110, 30], [124, 96, 80, 24]].map(([x, y, r, L], i) => chickenShred(p, x, y, L, r, i)).join('')}</g>`,
        ...spots('brcv', 14, 64, 12).map(([x, y, r], i) => i % 3 ? herbLeaf(p, x, y, 6, r) : `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="#e4f2c4" stroke="#4a9a30" stroke-width="1.5"/>`),
    ].join(''),

    // トルコ: パタテス・チョルバス。チョルバ鉢に、淡い黄色のじゃがいものスープ、すりおろしたカシャールチーズ、黒こしょう
    tr_patatescorba: p => [
        corbaBowl(p), soup(p, 77, '#f2dc94', { glow: .35 }), velvet(100, 100, 77, '#f2dc94'),
        gratedCheese(p, 100, 100, 64, { c: '#f6d050', n: 70, seed: 2 }),
        dust(p, 100, 100, 130, '#2a2420', 26, .7, 5),
    ].join(''),

    // フランス: ポタージュ・クレシー（にんじん）。縁の広いスープ皿に、あざやかなにんじん色のポタージュ、セルフイユ（またはパセリ）の葉
    fr_crecy: p => [
        soupPlate(p), soup(p, 62, '#f08a2c', { glow: .35 }), velvet(100, 100, 62, '#f08a2c', { op: .45 }),
        ...[[94, 90, 10, 14], [112, 106, 130, 13], [88, 112, 240, 12], [116, 86, 300, 12], [102, 100, 60, 12]].map(([x, y, r, s]) => `<g ${p.sh(.4)}>${herbLeaf(p, x, y, s, r, { c: '#4aa236' })}</g>`),
        dust(p, 100, 100, 100, '#7a3a14', 10, .6),
    ].join(''),

    // イギリス: カレー風味のパースニップスープ。深い鉢に、カレー粉の金色がかったなめらかなスープ、牛乳のうず、カレー粉のひとふり
    gb_parsnip: p => [
        deepBowl(p), soup(p, 76, '#e4bc5c', { glow: .35 }), velvet(100, 100, 76, '#e4bc5c'),
        swirl(100, 100, 46, { turns: 1.8, w: 3 }),
        dust(p, 100, 100, 92, '#b86a14', 30, 1, 6),
        dust(p, 100, 100, 120, '#3a2a18', 10, .6, 7),
    ].join(''),

    // ドイツ: マッシュルームのクリームスープ（半分だけ攪拌）。持ち手つきのスープカップに、マッシュルームの薄切り、クリーム、パセリ
    de_champignonsuppe: p => [
        suppentasse(p), soup(p, 66, '#cdb08a', { glow: .3 }), velvet(100, 100, 66, '#cdb08a'),
        swirl(100, 100, 26, { turns: 1.2, w: 2.6 }),
        ...[[78, 80, -10], [122, 78, 20], [74, 122, 15], [126, 122, -15]].map(([x, y, r]) => mushroomSlice(p, x, y, 36, r)),
        ...spots('dcp', 9, 50, 12).map(([x, y, r]) => herbLeaf(p, x, y, 4, r)),
        dust(p, 100, 100, 100, '#3a2a18', 10, .6),
    ].join(''),

    // ドイツ: 白アスパラガスのクリームスープ。持ち手つきのスープカップに、象牙色のクリーム、3cm に切った白アスパラ（穂先つき）、チャイブ
    de_spargelcreme: p => [
        suppentasse(p), soup(p, 66, '#f2ead0', { glow: .35 }), velvet(100, 100, 66, '#e2d8b4', { op: .5 }),
        asparagus(p, 84, 78, 46, -30, { tip: true }), asparagus(p, 124, 86, 44, 40, { tip: true }), asparagus(p, 98, 124, 46, 170, { tip: true }),
        asparagus(p, 70, 112, 28, 80, { tip: false }),
        chives(p, 100, 100, 70, { n: 12, seed: 2 }),
        dust(p, 100, 100, 90, '#a8743a', 8, .6),
    ].join(''),

    // トルコ: カバク・チョルバス（ズッキーニ）。チョルバ鉢に、淡い緑のスープ、刻んだディル
    tr_kabak: p => [
        corbaBowl(p), soup(p, 77, '#cddc9a', { glow: .35 }), velvet(100, 100, 77, '#cddc9a'),
        swirl(100, 100, 30, { turns: 1.1, w: 2.4, op: .7 }),
        `<g ${p.sh(.3)}>${[[90, 88, 20], [114, 96, -40], [98, 114, 70], [76, 106, 120], [120, 120, 10], [108, 76, 80], [80, 74, -20], [128, 100, 50]].map(([x, y, r]) => dill(p, x, y, 26, r)).join('')}</g>`,
        dust(p, 100, 100, 120, '#2a2420', 14, .6),
    ].join(''),

    // メキシコ: クレマ・デ・カラバシータ。素焼きの鉢に、明るい緑のスープ、クレマのうず、崩したケソ・フレスコ
    mx_crema_calabacita: p => [
        barro(p), soup(p, 77, '#a8c86a', { glow: .35 }), velvet(100, 100, 77, '#a8c86a'),
        swirl(100, 100, 36, { turns: 1.2, w: 2.8 }),
        ...[[86, 86, 18, 20], [114, 88, 17, -20], [98, 112, 18, 40], [124, 114, 15, 10], [76, 112, 15, 60], [104, 66, 14, 0]].map(([x, y, s, r], i) => quesoCrumble(p, x, y, s, r, i)),
        dust(p, 100, 100, 110, '#3a3028', 10, .6),
    ].join(''),

    // スペイン: リーキのクレマ。縁の広いスープ皿に、象牙色のなめらかなクリーム、白いリーキの輪切り、白こしょう
    es_cremapuerros: p => [
        soupPlate(p), soup(p, 62, '#eeeacc', { glow: .4 }), velvet(100, 100, 62, '#ddd8b0', { op: .5 }),
        swirl(100, 100, 30, { turns: 1.4, w: 2.6 }),
        ...[[94, 94, 0], [120, 110, 40], [86, 122, 80]].map(([x, y, r]) => leekRing(p, x, y, 28, r, { green: .2 })),
        dust(p, 100, 100, 96, '#b8ac8c', 18, .7),
    ].join(''),

    // イタリア: パッサート・ディ・ヴェルドゥーレ。縁の広いフォンディーナに、にんじんとズッキーニの黄土色のスープ、オリーブオイル、パルミジャーノ
    it_passatoverdure: p => [
        soupPlate(p), soup(p, 62, '#d8a248', { glow: .3 }), velvet(100, 100, 62, '#d8a248'),
        oilThread(p, [[60, 112], [80, 98], [100, 108], [122, 94], [140, 102]], { c: '#d8b81c', seed: 2 }),
        gratedCheese(p, 102, 90, 46, { c: '#f8eebc', n: 46, seed: 3 }),
        dust(p, 100, 100, 100, '#6a8a2a', 12, .9, 8),
    ].join(''),

    // ポーランド: ご飯入りのトマトスープ（ズーパ・ポミドロヴァ）。藍の帯の深皿に、サワークリームでやわらいだトマト色、ご飯の山、パセリ
    pl_pomidorowa: p => [
        soupPlate(p, { band: true }), soup(p, 62, '#e8603a', { glow: .3 }), velvet(100, 100, 62, '#e8603a', { op: .45 }),
        `<circle cx="100" cy="100" r="58" fill="#f2a088" opacity=".22"/>`,
        K.rice(p, 104, 102, 60, { sy: .88, grains: 1.6, tint: '#f4efe0' }),
        ...spots('plr', 22, 44, 5, { cx: 104, cy: 102 }).filter(([x, y]) => Math.hypot(x - 104, y - 102) > 30).map(([x, y, r]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.8" ry="1.4" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="#fbf8ee" stroke="#d8ccb4" stroke-width=".5"/>`),
        ...spots('plp', 10, 56, 12).map(([x, y, r]) => herbLeaf(p, x, y, 4.4, r, { c: '#3f9a2c' })),
    ].join(''),

    // スコットランド: レンズ豆のスープ。深い鉢に、くずれた赤レンズ豆のとろりとした橙、にんじんの角切り、燻製ベーコン
    gb_lentil: p => {
        const R = rng(p.id + 'lent');
        let lentils = '';
        for (let i = 0; i < 70; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * 70, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; lentils += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2" ry="1.5" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="${R() < .5 ? '#e89a4a' : '#f2b468'}" opacity=".85"/>`; }
        return [
            deepBowl(p), soup(p, 76, '#e08a3a', { glow: .28 }), lentils,
            ...[[80, 80, 20], [122, 78, -10], [70, 118, 30], [130, 120, 15], [100, 104, 40], [104, 140, 0], [146, 98, 25]].map(([x, y, r]) => dice(p, x, y, 12, r, '#f06a1a')),
            ...[[96, 74, 10], [118, 104, -30], [84, 128, 50], [62, 96, 20]].map(([x, y, r]) => baconBit(p, x, y, 12, r)),
            dust(p, 100, 100, 130, '#2a2420', 22, .7),
        ].join('');
    },
};
