// 日本の家庭料理の「あって当たり前」30品（おにぎり・天丼・お茶漬け・卵かけご飯・赤飯・炊き込みご飯・いなり寿司・雑炊、麺5品、焼き鮭・干物・ハムエッグ・焼肉・鍋4品、茶碗蒸しほか副菜6品、味噌汁3品）
// j_okayu.mjs と同じ手描きの画風（器 + 具の部品）。部品は kit.mjs
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk } = K;

// ---------- このファイル専用の部品（jg〜） ----------
const jgSteam = (x = 100, y = 34) => `<path d="M${x - 12},${y} c-5,-7 5,-12 0,-19 M${x + 4},${y - 2} c-5,-7 5,-12 0,-19 M${x + 20},${y} c-5,-7 5,-12 0,-19" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
// 塗りつぶしの不定形（r で回す）
function jgBlob(p, x, y, w, h, r, c, { seed = 1, jit = .2, stroke = null, sw = .7, gl = true } = {}){
    const R = rng(p.id + 'blob' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(1, 10, jit, R, w / 2, h / 2))}" fill="${gl ? p.g(c, .3, .22) : c}" stroke="${stroke || dk(c, .3)}" stroke-width="${sw}"/></g>`;
}
// 米粒（面の上に散らす）
function jgGrains(p, cx, cy, R0, { n = 60, seed = 1, c = '#ffffff', sc = '#ddd5c0', k = 1 } = {}){
    const rd = rng(p.id + 'gr' + seed + cx);
    let g = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R0, gx = cx + Math.cos(a) * d, gy = cy + Math.sin(a) * d;
        g += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="${f((2.8 + rd()) * k)}" ry="${f((1.5 + rd() * .3) * k)}" transform="rotate(${f(rd() * 180)} ${f(gx)} ${f(gy)})" fill="${c}" stroke="${sc}" stroke-width=".45" opacity=".96"/>`;
    }
    return g;
}
// 小さな粒・角切りをばらまく
function jgDots(p, cx, cy, R0, { n = 20, c = '#9a2f2a', rx = 3.2, ry = 2.6, seed = 1, cols = null, sy = 1 } = {}){
    const rd = rng(p.id + 'dot' + seed + cx + cy);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R0, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy, col = cols ? cols[Math.floor(rd() * cols.length)] : c;
        o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * (.8 + rd() * .4))}" ry="${f(ry * (.8 + rd() * .4))}" transform="rotate(${f(rd() * 180)} ${f(x)} ${f(y)})" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .3)}" stroke-width=".5"/>`;
    }
    return `<g ${p.sh(.5)}>${o}</g>`;
}
// 具の位置を重なりすぎないようにばらす
function jgSpots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('jgspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(o => Math.hypot(o[0] - x, o[1] - y) >= minD)) out.push([x, y, R() * 360]);
    }
    return out;
}
// 天ぷらの衣（金色のでこぼこ）。w,h は大きさ、tint は衣の色
function jgBatter(p, x, y, w, h, r, { seed = 1, c = '#e1ac52', core = null } = {}){
    const R = rng(p.id + 'bat' + seed + x + y);
    const pts = ring(1, 14, .3, R, w / 2, h / 2);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><g ${p.rough(2.2, .13)}><path d="${smooth(pts, true, .9)}" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g></g>
        ${core ? `<path d="${smooth(pts.map(([a, b]) => [a * .55, b * .5]), true, .9)}" fill="${core}" opacity=".85"/>` : ''}
        <path d="M${f(-w * .32)},${f(-h * .1)} Q${f(-w * .12)},${f(-h * .34)} ${f(w * .16)},${f(-h * .3)}" stroke="#fff3c9" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// えび天: 曲がった細長い衣と、尾（赤）
function jgEbiTen(p, x, y, L, r, seed = 1){
    const R = rng(p.id + 'eb' + seed + x);
    const c = '#e1ac52', k = L / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}><g ${p.rough(2, .14)}>
        <path d="M-20,3 Q-18,-11 -2,-11 Q14,-11 20,-2 Q16,4 6,4 Q-4,3 -8,10 Q-16,14 -20,3Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .35)}" stroke-width=".9"/></g></g>
        <path d="M19,-3 L26,-8 L24,0 L27,3 L20,2Z" fill="${p.g('#d9482c', .25, .25)}" stroke="#8a2a18" stroke-width=".6"/>
        <path d="M-12,-5 Q-2,-9 10,-4" stroke="#fff3c9" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-6,0 Q2,-4 10,1" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".6"/></g>`;
}
// たれ・汁のつや（茶色の濃い滴）
const jgSauce = (p, x, y, s, c = '#8a4a1c', op = .6) => `<path d="M${f(x - s * .5)},${f(y)} Q${f(x - s * .2)},${f(y - s * .32)} ${f(x + s * .1)},${f(y - s * .2)} Q${f(x + s * .5)},${f(y - s * .08)} ${f(x + s * .36)},${f(y + s * .16)} Q${f(x)},${f(y + s * .3)} ${f(x - s * .5)},${f(y)}Z" fill="${c}" opacity="${op}"/>`;
// おにぎり（三角）。具は上にのぞく印、nori は下の帯
function jgOnigiri(p, x, y, s, r, { fill = null, seed = 1 } = {}){
    const h = s / 2;
    const tri = `M0,${-h * .95} Q${h * .22},${-h * .9} ${h * .6},${-h * .15} Q${h * 1.05},${h * .55} ${h * .85},${h * .78} Q${h * .7},${h * .92} ${h * .4},${h * .92} L${-h * .4},${h * .92} Q${-h * .7},${h * .92} ${-h * .85},${h * .78} Q${-h * 1.05},${h * .55} ${-h * .6},${-h * .15} Q${-h * .22},${-h * .9} 0,${-h * .95}Z`;
    const R = rng(p.id + 'oni' + seed);
    let grains = '';
    for (let i = 0; i < 30; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * h * .62, gx = Math.cos(a) * d * .9, gy = h * .06 + Math.sin(a) * d * .85; grains += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="2.4" ry="1.3" transform="rotate(${f(R() * 180)} ${f(gx)} ${f(gy)})" fill="#fff" stroke="#e4ddc9" stroke-width=".4" opacity=".9"/>`; }
    const nori = `<path d="M${-h * .86},${h * .5} L${h * .86},${h * .5} L${h * .86},${h * .78} Q${h * .7},${h * .92} ${h * .4},${h * .92} L${-h * .4},${h * .92} Q${-h * .7},${h * .92} ${-h * .86},${h * .78}Z" fill="${p.g('#1f2a24', .25, .1)}" stroke="#0f1612" stroke-width=".6"/><path d="M${-h * .6},${h * .66} L${h * .5},${h * .64}" stroke="#4a5a50" stroke-width=".8" opacity=".6"/>`;
    let top = '';
    if (fill === 'sake') top = jgBlob(p, 0, -h * .22, h * .62, h * .3, 10, '#f08d5c', { seed: 3 }) + jgBlob(p, h * .12, -h * .1, h * .3, h * .16, -20, '#f5b08a', { seed: 4 });
    else if (fill === 'ume') top = K.umeboshi(p, 0, -h * .22, h * .5);
    else if (fill === 'okaka') top = jgDots(p, 0, -h * .2, h * .3, { n: 14, cols: ['#b98a5a', '#9a6a3a', '#cfa070'], rx: 2.4, ry: 1.3, seed: 5 });
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${tri}" fill="${p.rg('#f8f5ec', .25, .2, .38, .32)}" stroke="#e6e0d0" stroke-width=".8"/></g>${grains}${top}${nori}</g>`;
}
// 麺（うどん・ラーメンなど）: 器の中にゆるく曲がる麺を重ねる
function jgNoodle(p, cx, cy, R0, { c = '#f4ead0', w = 4.6, n = 12, seed = 1, wav = .5 } = {}){
    const R = rng(p.id + 'nd' + seed);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){
        let px = cx + (R() - .5) * R0 * .9, py = cy + (R() - .5) * R0 * .9, dir = R() * 6.28;
        const pts = [];
        for (let j = 0; j < 6; j++){
            const dd = Math.hypot(px - cx, py - cy); if (dd > R0){ dir += 2.5; px = cx + (px - cx) * R0 / dd; py = cy + (py - cy) * R0 / dd; }
            pts.push([px, py]); dir += (R() - .5) * wav * 2; px += Math.cos(dir) * R0 * .32; py += Math.sin(dir) * R0 * .32;
        }
        let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
        for (let j = 1; j < pts.length - 1; j++) d += ` Q${f(pts[j][0])},${f(pts[j][1])} ${f((pts[j][0] + pts[j + 1][0]) / 2)},${f((pts[j][1] + pts[j + 1][1]) / 2)}`;
        if (i % 3) d1 += d; else d2 += d;
    }
    return `<g ${p.sh(.8)}><path d="${d1}" stroke="${dk(c, .28)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round"/><path d="${d1}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
        <path d="${d2}" stroke="${dk(c, .28)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="${lt(c, .15)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`;
}
// 汁の中の面（円）
const jgSoup = (p, c, R0 = 80) => `<circle cx="100" cy="100" r="${R0}" fill="${p.rg(c, .2, .22, .45, .42)}"/>`;
// かまぼこ（白に赤い縁の半月）
function jgKamaboko(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${-s / 2},${s * .28} A${s / 2},${s * .6} 0 0 1 ${s / 2},${s * .28}Z" fill="${p.g('#fbf3ee', .15, .1)}" stroke="#e8c8c0" stroke-width=".6"/></g><path d="M${-s / 2 + 1},${s * .28} A${s / 2 - 1},${s * .58} 0 0 1 ${s / 2 - 1},${s * .28}" fill="none" stroke="#e66e82" stroke-width="2.2" opacity=".85"/></g>`;
}
// 半熟のゆで卵（半割り）
const jgEggHalf = (p, x, y, s, r = 0, stain = null) => K.eggHalf(p, x, y, s, r, { yolk: '#f4a21f', stain });
// 竹ざる（そば）: 四角い竹の盆に簾
function jgBambooTray(p, { w = 150, h = 118 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    let slats = '';
    for (let i = 1; i < 18; i++) slats += `<path d="M${x + 5},${f(y + i * h / 18)} L${x + w - 5},${f(y + i * h / 18)}" stroke="#a88548" stroke-width=".9" opacity=".7"/>`;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${p.rg('#d9bd82', .22, .22, .4, .3)}"/></g>${slats}
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="7" fill="none" stroke="#6b4a1c" stroke-width="3"/><rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="5" fill="none" stroke="#b48d4e" stroke-width="1" opacity=".8"/>`;
}
// 小さなつゆ猪口
const jgCup = (p, x, y, R0 = 15, c = '#7a4a22') => `<g ${p.sh(.9)}><circle cx="${x}" cy="${y}" r="${R0}" fill="${p.rg('#f6f3ec', .2, .16, .38, .32)}"/></g><circle cx="${x}" cy="${y}" r="${R0 - 1.5}" fill="none" stroke="#2c4c7c" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${R0 - 4}" fill="${p.rg(c, .2, .25, .45, .4)}"/><path d="M${x - R0 * .5},${y - R0 * .25} A${R0 * .5},${R0 * .5} 0 0 1 ${x - R0 * .1},${y - R0 * .5}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".5"/>`;
// 大根おろし（白い山）
const jgGrated = (p, x, y, s) => `<g ${p.sh(.6)}>${K.grated(p, x, y, s)}</g>`;
// 煮汁を含んだ茶色の味付け卵・ゆで卵（丸ごと）
function jgWholeEgg(p, x, y, s, { stain = false } = {}){
    return `<g ${T(x, y)}><g ${p.sh(.7)}><ellipse cx="0" cy="0" rx="${s * .5}" ry="${s * .6}" fill="${p.rg(stain ? '#e1bf86' : '#fbf6e8', .25, .18, .38, .32)}" stroke="${stain ? '#b58a4a' : '#e8dfc6'}" stroke-width=".7"/></g>
        <path d="M${-s * .28},${-s * .22} Q${-s * .2},${-s * .46} ${s * .02},${-s * .46}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// えのき（細い白い束）
function jgEnoki(p, x, y, s, r = 0){
    let o = '';
    for (let i = -4; i <= 4; i++) o += `<path d="M${i * 1.6},${s * .45} L${i * 2.2},${-s * .3}" stroke="#f3ead4" stroke-width="1.5" stroke-linecap="round"/><circle cx="${f(i * 2.2)}" cy="${f(-s * .34)}" r="2" fill="#e9dfc4"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}>${o}</g><path d="M-8,${s * .3} L8,${s * .3}" stroke="#c9b27a" stroke-width="2" opacity=".6"/></g>`;
}

export default {
    // おにぎり: 丸皿に、鮭・梅干し・おかかの三角のおにぎり3つ（のりを巻く）
    onigiri: p => [
        K.plate(p),
        jgOnigiri(p, 64, 116, 64, -8, { fill: 'sake', seed: 1 }),
        jgOnigiri(p, 130, 112, 64, 10, { fill: 'ume', seed: 2 }),
        jgOnigiri(p, 98, 64, 60, 3, { fill: 'okaka', seed: 3 }),
    ].join(''),

    // 天丼: どんぶりのご飯に、えび天2尾・かぼちゃ・なす・ししとうの天ぷら、甘辛いたれ
    tendon: p => [
        K.donburi(p),
        `<circle cx="100" cy="100" r="80" fill="${p.rg('#f8f5ec', .2, .22, .4, .34)}"/>`,
        jgGrains(p, 100, 100, 74, { n: 50, seed: 1 }),
        jgSauce(p, 100, 106, 130, '#7a3d14', .5),
        jgBatter(p, 58, 120, 44, 34, 20, { seed: 3, core: '#f2a23a' }),
        jgBatter(p, 140, 138, 58, 24, -24, { seed: 4, core: '#d8c6e6' }),
        jgBatter(p, 148, 70, 38, 14, 50, { seed: 5, c: '#c9a64a', core: '#8fb860' }),
        jgEbiTen(p, 80, 72, 68, -10, 1), jgEbiTen(p, 112, 104, 68, 12, 2),
        jgSauce(p, 98, 100, 80, '#6a3410', .28),
    ].join(''),

    // 鮭茶漬け: 茶碗に、ご飯と薄緑のお茶、ほぐした焼き鮭・のり・三つ葉・ごま・わさび
    ochazuke: p => [
        K.chawan(p),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#d8d68a', .3, .22, .45, .42)}"/>`,
        `<g ${p.sh(.6)}><circle cx="100" cy="104" r="52" fill="${p.rg('#f7f4ea', .3, .16, .38, .34)}"/></g>`,
        jgGrains(p, 100, 104, 48, { n: 60, seed: 2 }),
        jgGrains(p, 100, 100, 74, { n: 8, seed: 3, c: '#f4f1e4' }),
        K.noriStrips(p, 100, 92, 70, { n: 6 }),
        jgBlob(p, 88, 100, 22, 10, 20, '#f08d5c', { seed: 6 }), jgBlob(p, 108, 94, 20, 9, -25, '#f5a272', { seed: 7 }), jgBlob(p, 104, 112, 20, 9, 70, '#f08d5c', { seed: 8 }), jgBlob(p, 80, 114, 16, 8, -10, '#f5b08a', { seed: 9 }),
        K.mitsuba(p, 122, 100, 24, 40), K.mitsuba(p, 78, 90, 22, -30),
        K.sesame(p, 100, 100, 76, { n: 14, seed: 3 }),
        `<ellipse cx="124" cy="124" rx="7" ry="5" fill="${p.g('#9cc060', .3, .2)}" stroke="#6a8a3a" stroke-width=".5"/>`,
        jgSteam(100, 30),
    ].join(''),

    // 卵かけご飯: 茶碗のご飯に、生卵の黄身と白身、のり、ねぎ
    tkg: p => [
        K.chawan(p),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="76" fill="${p.rg('#f7f4ea', .3, .16, .38, .34)}"/></g>`,
        jgGrains(p, 100, 100, 70, { n: 70, seed: 4 }),
        `<path d="${smooth(ring(1, 12, .25, rng(p.id + 'wh'), 50, 44))}" transform="translate(102 100)" fill="#fffbe9" opacity=".62"/>`,
        `<circle cx="100" cy="98" r="22" fill="${p.rg('#f7a51c', .3, .18, .36, .32)}" stroke="#d98a12" stroke-width=".8"/>`,
        `<ellipse cx="92" cy="89" rx="7" ry="3.4" fill="#fff" opacity=".78"/><circle cx="108" cy="108" r="2.2" fill="#fff" opacity=".35"/>`,
        `<path d="M70,128 Q100,140 134,124" stroke="#7a4a22" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        K.noriStrips(p, 76, 84, 40, { n: 6 }),
        K.scallions(p, 128, 128, 44, { n: 10, c: '#5fa03a' }),
    ].join(''),

    // 赤飯: 茶碗に、薄紅色のもち米と小豆（ささげ）、黒ごま
    sekihan: p => [
        K.chawan(p),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="76" fill="${p.rg('#c98a8a', .3, .2, .38, .34)}"/></g>`,
        jgGrains(p, 100, 100, 72, { n: 130, seed: 5, c: '#f4d6cf', sc: '#c98a86', k: 1.35 }),
        jgGrains(p, 100, 100, 70, { n: 50, seed: 6, c: '#e3a8a0', sc: '#a86a6a', k: 1.3 }),
        jgDots(p, 100, 100, 62, { n: 18, cols: ['#7a2d2a', '#6a2422', '#8c3a34'], rx: 4.4, ry: 3, seed: 7 }),
        K.sesame(p, 100, 100, 96, { n: 14, c: '#2a2420', seed: 4 }),
        `<path d="M54,84 Q62,60 88,50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
        jgSteam(100, 30),
    ].join(''),

    // 五目炊き込みご飯: 茶碗に、醤油色のご飯と鶏肉・にんじん・ごぼう・しいたけ・油揚げ
    gomokutakikomi: p => [
        K.chawan(p),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="76" fill="${p.rg('#e1c08c', .3, .2, .38, .34)}"/></g>`,
        jgGrains(p, 100, 100, 70, { n: 70, seed: 8, c: '#f1dcb2', sc: '#c4a374' }),
        jgDots(p, 100, 100, 64, { n: 12, c: '#f4efe2', rx: 5, ry: 4, seed: 9 }),
        jgDots(p, 100, 100, 64, { n: 16, c: '#ec7b2d', rx: 3.6, ry: 2, seed: 10 }),
        jgDots(p, 100, 100, 64, { n: 12, c: '#a07a50', rx: 3.4, ry: 1.8, seed: 11 }),
        jgDots(p, 100, 100, 64, { n: 10, cols: ['#c98b3a', '#b87a30'], rx: 5, ry: 2.2, seed: 12 }),
        K.shiitake(p, 76, 80, 22, 10, {}), K.shiitake(p, 128, 120, 20, 40, {}),
        `<path d="M54,84 Q62,60 88,50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
        jgSteam(100, 30),
    ].join(''),

    // いなり寿司: 長皿に、甘く煮た油揚げの袋に酢飯を詰めたものを3つ（ごまをのせる）、紅しょうが
    inarizushi: p => {
        const pouch = (x, y, r, s) => `<g ${T(x, y, r, s)}><g ${p.sh(1)}><path d="M-22,-12 Q-22,-20 -12,-20 L12,-20 Q22,-20 22,-12 L24,10 Q24,20 12,20 L-12,20 Q-24,20 -24,10Z" fill="${p.g('#c98b3a', .3, .3)}" stroke="#8a5622" stroke-width=".9"/></g>
            <path d="M-17,-15 Q-17,-17 -11,-17 L11,-17 Q17,-17 17,-15 L18,-9 Q0,-5 -18,-9Z" fill="#fff" opacity=".0"/>
            <ellipse cx="0" cy="-11" rx="18" ry="7" fill="${p.rg('#f8f5ec', .25, .18, .4, .35)}" stroke="#d9d0b8" stroke-width=".6"/>
            ${jgGrains(p, 0, -11, 14, { n: 14, seed: Math.round(x + y) }).replace(/ry="[\d.]+"/g, m => 'ry="1.1"')}
            <path d="M-14,2 Q-4,-1 8,3" stroke="#a8692a" stroke-width="1" fill="none" opacity=".5"/>
            <path d="M-18,-4 Q-20,6 -14,14" stroke="#e8b46a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>
            ${K.sesame(p, 0, -11, 24, { n: 5, seed: Math.round(y) })}</g>`;
        return [
            K.longPlate(p),
            pouch(52, 90, -6, 1.1), pouch(104, 80, 5, 1.1), pouch(146, 98, -3, 1.1),
            K.beniShoga(p, 140, 138, 18),
        ].join('');
    },

    // 卵雑炊: 鉢に、だしの中でほぐれたご飯、ふわっと固まった卵、ねぎ・三つ葉
    zosui: p => [
        K.bowl(p, { glaze: '#7a5a3a', inside: '#efe5d3' }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e4cf94', .25, .22, .45, .42)}"/>`,
        jgGrains(p, 100, 100, 68, { n: 90, seed: 9, c: '#fbf8ee', sc: '#dcd2b6' }),
        ...jgSpots('zs', 11, 54, 17).map(([x, y, r], i) => `<g ${T(x, y, r)}><g ${p.rough(3, .16)}><path d="${smooth(ring(1, 9, .45, rng(p.id + 'cd' + i), 12 + (i % 3) * 2, 8 + (i % 2) * 2))}" fill="${p.g('#f7de86', .35, .14)}" stroke="#e3c25a" stroke-width=".4"/></g></g>`),
        jgGrains(p, 100, 106, 60, { n: 36, seed: 12, c: '#fffdf2', sc: '#e0d6b8' }),
        K.scallions(p, 100, 100, 100, { n: 20, c: '#5fa03a' }),
        K.mitsuba(p, 108, 78, 28, 20),
        `<path d="M54,84 Q62,60 88,50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
        jgSteam(100, 30),
    ].join(''),

    // そうめん: 青いガラス鉢に、氷の上の白い麺、錦糸卵・きゅうり・大葉・みょうが
    somen: p => [
        K.bowl(p, { glaze: '#8fbfd8', inside: '#eaf4f8' }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#dff0f6', .3, .12, .45, .42)}" opacity=".9"/>`,
        ...[[56, 70], [136, 134], [70, 138], [144, 66]].map(([x, y], i) => `<g ${T(x, y, i * 23)}><rect x="-9" y="-9" width="18" height="18" rx="3" fill="#fff" opacity=".6" stroke="#b7d6e6" stroke-width=".8"/><path d="M-6,-6 L-1,-7" stroke="#fff" stroke-width="1.4" opacity=".9"/></g>`),
        K.noodles(p, 100, 100, 104, { c: '#f8f3e4', w: 1.9, n: 40, seed: 2, outline: '#d9d1b8' }),
        K.eggRibbons(p, 100, 92, 40, { n: 8, seed: 2 }),
        K.shreds(p, 100, 106, 44, { c: '#6fae48', n: 12, w: 1.5, len: .5, seed: 3, curve: .3 }),
        K.shiso(p, 78, 84, 18, -30),
        `<g ${p.sh(.5)}><ellipse cx="124" cy="112" rx="6" ry="4" fill="#e98fa0" stroke="#b25266" stroke-width=".5"/><ellipse cx="114" cy="122" rx="5" ry="3.4" fill="#f1a9b6" stroke="#b25266" stroke-width=".5"/></g>`,
        K.scallions(p, 104, 98, 40, { n: 8, c: '#5fa03a' }),
    ].join(''),

    // ざるそば: 竹ざるに盛った細いそば、刻みのり、つゆ猪口・ねぎ・わさび
    zarusoba: p => [
        `<g transform="translate(-10 -4)">`,
        jgBambooTray(p, { w: 150, h: 120 }),
        K.noodles(p, 100, 100, 100, { c: '#bfb29a', w: 2.6, n: 30, seed: 4, outline: '#8a7c62' }),
        K.noriStrips(p, 100, 96, 70, { n: 12 }),
        `</g>`,
        jgCup(p, 156, 140, 19, '#6a3a18'),
        K.scallions(p, 156, 140, 22, { n: 6, c: '#5fa03a' }),
        `<g ${T(150, 64)}><g ${p.sh(.5)}><path d="${smooth(ring(1, 8, .25, rng(p.id + 'wsb'), 9, 6))}" fill="${p.g('#9cc060', .3, .2)}" stroke="#6a8a3a" stroke-width=".5"/></g></g>`,
    ].join(''),

    // きつねうどん: どんぶりに、金色のつゆとうどん、甘く煮た油揚げ・かまぼこ・ねぎ
    kitsuneudon: p => [
        K.donburi(p),
        jgSoup(p, '#d9a860', 80),
        jgNoodle(p, 100, 100, 56, { c: '#f6edd2', w: 5.4, n: 13, seed: 1 }),
        ...[[84, 84, -10], [122, 112, 160]].map(([x, y, r], i) => `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="M-26,18 L26,18 L2,-26Z" fill="${p.g('#b97a2c', .3, .3)}" stroke="#7a4a14" stroke-width=".9" stroke-linejoin="round"/></g><path d="M-15,12 Q0,6 14,12" stroke="#d9a35a" stroke-width="1.2" fill="none" opacity=".7"/><path d="M-12,2 Q-4,-8 0,-16" stroke="#e8c27a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`),
        jgKamaboko(p, 128, 76, 20, 15), jgKamaboko(p, 76, 126, 20, -20),
        K.scallions(p, 100, 100, 80, { n: 18, c: '#5fa03a' }),
        jgSteam(100, 30),
    ].join(''),

    // カレーうどん: どんぶりに、とろみのある黄土色のつゆにうどん、豚肉・玉ねぎ・長ねぎ
    curryudon: p => [
        K.donburi(p),
        jgSoup(p, '#c9902c', 80),
        jgNoodle(p, 100, 100, 54, { c: '#f2e2b4', w: 5.2, n: 12, seed: 2 }),
        K.porkSlice(p, 80, 92, 30, 20, { c: '#b88450', seed: 1 }), K.porkSlice(p, 122, 114, 28, -40, { c: '#b88450', seed: 2 }), K.porkSlice(p, 108, 76, 26, 70, { c: '#b88450', seed: 3 }),
        K.onion(p, 124, 88, 22, 30, { c: '#e3b867', layers: 1 }), K.onion(p, 76, 118, 20, -50, { c: '#e3b867', layers: 1 }),
        K.scallions(p, 100, 100, 80, { n: 14, c: '#5fa03a' }),
        `<path d="M70,104 q8,-4 14,2 M118,100 q6,-5 12,0" stroke="#e8c060" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        jgSteam(100, 30),
    ].join(''),

    // 醤油ラーメン: どんぶりに、醤油色のスープと縮れ麺、半熟の卵・豚肉ともやしのいため、ねぎ
    ramen: p => [
        K.donburi(p),
        jgSoup(p, '#b9803a', 80),
        jgNoodle(p, 98, 100, 62, { c: '#f3d77f', w: 4, n: 22, seed: 3, wav: .9 }),
        K.sprouts(p, 118, 90, 60, { n: 22, seed: 4 }),
        K.porkSlice(p, 100, 112, 34, 10, { c: '#c58a5a', seed: 1 }), K.porkSlice(p, 128, 120, 30, -30, { c: '#c58a5a', seed: 2 }),
        jgEggHalf(p, 74, 78, 40, 20, '#e9c48c'), jgEggHalf(p, 72, 116, 38, 100, '#e9c48c'),
        K.scallions(p, 108, 92, 70, { n: 16, c: '#5fa03a' }),
        `<g ${T(156, 100, -10)}><g ${p.sh(.6)}><rect x="-6" y="-24" width="12" height="48" rx="1.5" fill="${p.g('#1f2a24', .25, .1)}" stroke="#0f1612" stroke-width=".6"/></g></g>`,
        jgSteam(100, 30),
    ].join(''),

    // 鮭の塩焼き: 長皿に、焼き目のついた鮭の切り身、大根おろし、レモン
    shakeshio: p => [
        K.longPlate(p),
        K.salmon(p, 78, 100, 98, -4, { cooked: true }),
        `<path d="M40,88 Q70,76 108,86" stroke="#b9532a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".28"/>`,
        jgGrated(p, 150, 108, 34), K.lemon(p, 148, 70, 26, 20),
        `<path d="M146,106 q4,-3 8,0" stroke="#7a4a22" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`,
    ].join(''),

    // あじの開き: 長皿に、開いて干した金色のあじ、大根おろし、すだち
    ajihimono: p => [
        K.longPlate(p),
        `<g ${T(86, 98, -4)}><g ${p.sh(1.2)}><path d="M-60,2 C-56,-24 -10,-34 30,-28 C54,-24 62,-8 62,2 C62,14 52,28 28,32 C-12,36 -56,28 -60,2Z" fill="${p.g('#c99443', .3, .3)}" stroke="#7a4c1a" stroke-width="1"/></g>
            <path d="M-56,2 C-50,-18 -10,-26 28,-22 C48,-18 56,-8 56,2 L-56,2Z" fill="${p.g('#d9ac62', .35, .2)}" opacity=".9"/>
            <path d="M-52,2 L60,2" stroke="#8a5a22" stroke-width="2"/>
            ${Array.from({ length: 9 }, (_, i) => `<path d="M${-44 + i * 11},2 Q${-42 + i * 11},-9 ${-34 + i * 11},-15 M${-44 + i * 11},2 Q${-42 + i * 11},11 ${-34 + i * 11},17" stroke="#b07a38" stroke-width=".9" fill="none" opacity=".55"/>`).join('')}
            <path d="M-60,2 L-78,-12 L-72,2 L-78,16Z" fill="${p.g('#b98438', .3, .3)}" stroke="#7a4c1a" stroke-width=".8"/>
            <ellipse cx="-10" cy="-8" rx="26" ry="3" fill="#7a3a10" opacity=".22"/><ellipse cx="22" cy="12" rx="22" ry="3" fill="#7a3a10" opacity=".22"/>
            <path d="M-36,-18 Q0,-28 36,-20" stroke="#fff3c9" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`,
        jgGrated(p, 154, 112, 32), K.sudachi(p, 152, 72, 22),
    ].join(''),

    // ハムエッグ: 丸皿に、焼いたハム2枚の上の目玉焼き2つ、ミニトマトとレタス
    hamuegg: p => [
        K.plate(p),
        K.ham(p, 78, 104, 84, 58, -12), K.ham(p, 122, 98, 84, 58, 12),
        K.friedEgg(p, 70, 94, 62, -4), K.friedEgg(p, 128, 90, 62, 14),
        K.leafPiece(p, 100, 148, 32, 80, { c: '#a9d06a' }),
        K.cherryTomato(p, 58, 140, 20), K.cherryTomato(p, 148, 142, 18),
    ].join(''),

    // 焼肉: 長皿に、焼き目のついた牛カルビと玉ねぎ・ピーマン・しいたけ、サンチュ、たれの小皿
    yakiniku: p => [
        K.longPlate(p),
        K.leafPiece(p, 150, 118, 50, 20, { c: '#8cc05a' }), K.leafPiece(p, 134, 80, 44, -30, { c: '#a2cf6a' }),
        K.onion(p, 48, 80, 36, 20, { c: '#e3b867', layers: 1 }), K.onion(p, 62, 126, 34, -40, { c: '#d9ab5a', layers: 1 }),
        K.pepperPiece(p, 102, 60, 30, 30), K.pepperPiece(p, 112, 136, 28, -60),
        K.shiitake(p, 40, 106, 32, 10, {}), K.shiitake(p, 126, 58, 28, 40, {}),
        K.beefSlice(p, 86, 98, 56, -10, { c: '#8a4a2a', seed: 1 }), K.beefSlice(p, 104, 106, 50, 30, { c: '#7e4426', seed: 2 }), K.beefSlice(p, 78, 76, 46, 160, { c: '#8a4a2a', seed: 3 }), K.beefSlice(p, 120, 88, 44, 100, { c: '#7e4426', seed: 4 }),
        jgCup(p, 160, 52, 17, '#4a2410'),
    ].join(''),

    // おでん: 鉢に、澄んだ薄い茶色のだしと、大根・卵・こんにゃく・厚揚げ・ちくわ・結び昆布、練りからし
    oden: p => [
        K.bowl(p, { glaze: '#f1ece0', inside: '#efe5d3' }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e6cd92', .3, .2, .45, .42)}"/>`,
        K.daikon(p, 70, 80, 40, 0, { simmered: true }), K.daikon(p, 134, 126, 38, 20, { simmered: true }),
        jgWholeEgg(p, 112, 76, 30, { stain: true }), jgWholeEgg(p, 72, 128, 28, { stain: true }),
        K.konnyaku(p, 104, 106, 30, 20), K.konnyaku(p, 136, 84, 26, -40),
        K.atsuage(p, 92, 134, 28, 15),
        ...[[148, 112, 30], [60, 104, -50]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="-17" y="-8" width="34" height="16" rx="8" fill="${p.g('#f2e4cc', .25, .2)}" stroke="#c9a874" stroke-width=".7"/></g><rect x="-17" y="-8" width="34" height="9" rx="4.5" fill="#d6a15a" opacity=".55"/><circle cx="17" cy="0" r="3" fill="#7a4a22" opacity=".5"/></g>`),
        `<path d="M104,58 q10,-8 20,0 q-4,10 -14,8 q-8,-2 -6,-8z" fill="#2d3a2a" stroke="#1a241a" stroke-width=".6"/>`,
        `<circle cx="150" cy="144" r="4" fill="#e3c24a" stroke="#b89a2a" stroke-width=".5"/>`,
        jgSteam(100, 30),
    ].join(''),

    // 湯豆腐: 土鍋に、昆布を敷いたお湯と豆腐、ねぎ・かつお節、ポン酢の小皿
    yudofu: p => [
        K.bowl(p, { glaze: '#7a5c3c', inside: '#efe5d3' }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#dfe3d4', .3, .16, .45, .42)}"/>`,
        `<g ${p.sh(.5)}><path d="M64,84 L132,70 L140,118 L70,130Z" fill="${p.g('#2f3d2a', .3, .2)}" opacity=".9"/></g>`,
        K.tofu(p, 84, 90, 32, 26, 6), K.tofu(p, 118, 84, 32, 26, -8), K.tofu(p, 76, 120, 32, 26, -4), K.tofu(p, 112, 116, 34, 28, 10), K.tofu(p, 140, 108, 28, 24, 20),
        K.scallions(p, 100, 100, 100, { n: 18, c: '#5fa03a' }), K.bonito(p, 98, 100, 60, { n: 12 }),
        jgSteam(100, 30),
    ].join(''),

    // 豚しゃぶ鍋: 鍋に、湯にくぐらせた豚肉、白菜・春菊・長ねぎ・えのき・豆腐
    shabushabu: p => [
        K.bowl(p, { glaze: '#7a5c3c', inside: '#efe5d3' }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e6e1c6', .3, .16, .45, .42)}"/>`,
        K.napaStem(p, 66, 86, 34, 20), K.napaStem(p, 132, 70, 32, -30), K.leafPiece(p, 140, 128, 34, 40, { c: '#bcd98b', cooked: true }),
        K.greens(p, 66, 130, 52, { n: 7, seed: 2, c: '#3d7d2a' }),
        K.tofu(p, 98, 134, 26, 22, 8), K.tofu(p, 84, 62, 24, 20, -12),
        jgEnoki(p, 120, 104, 30, 30),
        K.negiPiece(p, 100, 72, 24, 20), K.negiPiece(p, 76, 108, 22, 70),
        K.porkSlice(p, 106, 96, 44, 20, { c: '#e6b9a0', fat: '#f6e6d0', seed: 1, char: false, gloss: .2 }), K.porkSlice(p, 128, 108, 40, -50, { c: '#e6b9a0', fat: '#f6e6d0', seed: 2, char: false, gloss: .2 }), K.porkSlice(p, 94, 112, 40, 100, { c: '#e6b9a0', fat: '#f6e6d0', seed: 3, char: false, gloss: .2 }),
        jgSteam(100, 30),
    ].join(''),

    // 寄せ鍋: 鍋に、鶏肉・たら・えび・白菜・長ねぎ・しいたけ・豆腐・春菊
    yosenabe: p => [
        K.bowl(p, { glaze: '#7a5c3c', inside: '#efe5d3' }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e4d3a2', .3, .16, .45, .42)}"/>`,
        K.napaStem(p, 62, 84, 34, 20), K.napaStem(p, 140, 64, 30, -20),
        K.greens(p, 138, 132, 48, { n: 7, seed: 3, c: '#3d7d2a' }),
        K.tofu(p, 66, 124, 28, 24, 8), K.tofu(p, 112, 140, 26, 22, -10),
        K.negiPiece(p, 98, 66, 24, 20), K.negiPiece(p, 70, 104, 22, 70),
        K.shiitake(p, 128, 98, 28, 10, {}), K.shiitake(p, 84, 90, 24, 30, {}),
        K.chickenPiece(p, 104, 108, 30, 30, { c: '#e8c9a0', skin: '#d9b27a', seed: 1 }), K.chickenPiece(p, 92, 126, 26, -40, { c: '#e8c9a0', skin: '#d9b27a', seed: 2 }),
        K.salmon(p, 116, 82, 38, 20, { c: '#f4efe4', cooked: false }), K.salmon(p, 80, 66, 32, -30, { c: '#f4efe4', cooked: false }),
        K.shrimp(p, 142, 100, 26, 80), K.shrimp(p, 124, 122, 24, -30),
        jgSteam(100, 30),
    ].join(''),

    // 茶碗蒸し: 白い器に、つるんとした黄色い卵の面、えび・しいたけ・三つ葉
    chawanmushi: p => [
        K.kobachi(p, { glaze: '#e9e5d8', inside: '#f6f1e2' }),
        `<circle cx="100" cy="100" r="66" fill="${p.rg('#f9e59a', .3, .16, .4, .36)}"/>`,
        `<path d="M62,86 Q70,66 94,58" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
        K.shrimp(p, 98, 100, 34, 20), K.shiitake(p, 122, 84, 24, 10, {}),
        `<circle cx="80" cy="118" r="6" fill="${p.g('#b9d66a', .3, .2)}" stroke="#7a9a3a" stroke-width=".6"/>`,
        K.mitsuba(p, 104, 70, 28, 10), K.mitsuba(p, 118, 118, 22, 120),
        jgSteam(100, 30),
    ].join(''),

    // 揚げ出し豆腐: 青い小鉢に、金色に揚げた豆腐とだし、大根おろし・ねぎ・かつお節
    agedashidofu: p => [
        K.kobachi(p, { glaze: '#6f86a6', inside: '#efe9dc' }),
        `<circle cx="100" cy="100" r="68" fill="${p.rg('#d6b074', .3, .2, .45, .42)}"/>`,
        K.tofu(p, 78, 90, 34, 34, 8, { tint: '#d9a14c' }), K.tofu(p, 116, 84, 34, 34, -10, { tint: '#dba550' }), K.tofu(p, 96, 122, 36, 34, 4, { tint: '#d49a46' }), K.tofu(p, 130, 118, 28, 30, 20, { tint: '#dba550' }),
        jgGrated(p, 100, 100, 30), K.scallions(p, 100, 100, 70, { n: 12, c: '#5fa03a' }), K.bonito(p, 98, 96, 36, { n: 10 }),
    ].join(''),

    // ねぎ納豆: 小鉢に、ねばりのある納豆、小口ねぎ、からし
    natto: p => [
        K.kobachi(p, { glaze: '#c9b08a', inside: '#f1e9d8' }),
        `<g ${p.sh(.6)}>${jgDots(p, 100, 100, 54, { n: 70, cols: ['#8a6a3a', '#7a5a2c', '#9a7a48'], rx: 5, ry: 3.6, seed: 3 })}</g>`,
        K.threads(p, 100, 100, 70, { c: '#fff8e4', n: 20, seed: 2, w: 1.1 }),
        K.scallions(p, 100, 100, 70, { n: 14, c: '#5fa03a' }),
        `<ellipse cx="136" cy="126" rx="9" ry="5" fill="${p.g('#e8c83a', .3, .2)}" stroke="#b8982a" stroke-width=".5"/>`,
    ].join(''),

    // 焼きなす: 角皿に、皮をむいて裂いた焼きなす、かつお節・おろし生姜、醤油
    yakinasu: p => [
        K.squareDish(p, { s: 158 }),
        ...[[78, 70, -8], [104, 100, 6], [76, 128, -4]].map(([x, y, r], i) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="M-48,-8 Q-50,-16 -36,-16 L38,-14 Q50,-12 50,0 Q50,12 38,14 L-36,16 Q-50,16 -48,-8Z" fill="${p.g('#cfc98e', .3, .25)}" stroke="#8a8a4a" stroke-width=".8"/></g>
            ${Array.from({ length: 3 }, (_, k) => `<path d="M${-40 + k * 3},${-10 + k * 4} Q0,${-12 + k * 4 + (k % 2) * 3} ${44 - k * 2},${-8 + k * 3.4}" stroke="#a8a866" stroke-width=".8" fill="none" opacity=".35"/>`).join('')}
            <path d="M-46,-6 L-58,-6 L-58,6 L-46,6Z" fill="${p.g('#3d5a2a', .3, .2)}" stroke="#25381a" stroke-width=".6"/><path d="M-40,-12 Q0,-18 36,-12" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`),
        K.bonito(p, 104, 96, 80, { n: 18 }), K.gingerShreds(p, 140, 128, 26),
        `<circle cx="144" cy="64" r="4" fill="#4a2a10" opacity=".7"/>`,
    ].join(''),

    // きゅうりの浅漬け: 小鉢に、斜め切りのきゅうりと細く切った昆布・赤唐辛子
    kyuriasazuke: p => [
        K.kobachi(p, { glaze: '#a9c7b3', inside: '#eef3ec' }),
        ...jgSpots('ky', 14, 54, 20).map(([x, y, r], i) => K.cucumberSlice(p, x, y, 26, r, { oval: 1.35 })),
        K.shreds(p, 100, 100, 100, { c: '#2f4a2f', n: 8, w: 2.2, len: .45, seed: 5, curve: .5 }),
        ...[[84, 98], [118, 112], [100, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="none" stroke="#d42a1c" stroke-width="1.8"/>`),
    ].join(''),

    // グリーンサラダ: 鉢に、レタス・トマト・きゅうり・玉ねぎのサラダ、和風ドレッシングとごま
    greensalad: p => [
        K.kobachi(p, { glaze: '#9fbfae', inside: '#eef2ea', R: 94 }),
        K.leafPiece(p, 70, 80, 40, 30, { c: '#a9d06a' }), K.leafPiece(p, 128, 72, 38, -40, { c: '#b9dc7a' }), K.leafPiece(p, 100, 128, 42, 100, { c: '#a2cf6a' }), K.leafPiece(p, 136, 118, 34, 20, { c: '#b9dc7a' }), K.leafPiece(p, 66, 124, 34, -60, { c: '#a9d06a' }), K.leafPiece(p, 94, 64, 30, 10, { c: '#b9dc7a' }), K.leafPiece(p, 150, 100, 28, 70, { c: '#a9d06a' }), K.leafPiece(p, 100, 100, 34, -20, { c: '#c2e48a' }),
        K.tomatoWedge(p, 98, 84, 28, 30), K.tomatoWedge(p, 116, 106, 26, -50), K.tomatoWedge(p, 82, 108, 24, 120),
        K.cucumberSlice(p, 104, 66, 20, 0), K.cucumberSlice(p, 70, 100, 20, 10), K.cucumberSlice(p, 132, 96, 18, 0),
        `<path d="M92,96 q10,-6 20,2 M78,70 q8,-4 16,1" stroke="#f4eadb" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`,
        K.sesame(p, 100, 100, 70, { n: 12, seed: 6 }),
    ].join(''),

    // じゃがいもと玉ねぎの味噌汁: 朱の椀に、にごった味噌汁、いちょう切りのじゃがいもと玉ねぎ、ねぎ
    jagaimomiso: p => [
        K.wan(p),
        K.liquid(p, { R: 76, c: '#c79a55', op: 1 }),
        `<circle cx="100" cy="100" r="66" fill="#e2c38c" opacity=".35"/>`,
        ...jgSpots('jm', 9, 54, 22).map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M-9,9 L9,9 A18,18 0 0 0 -9,-9Z" fill="${p.g('#f0d98a', .3, .2)}" stroke="#c8a850" stroke-width=".6"/></g></g>`),
        ...jgSpots('jo', 7, 56, 24, 100, 100).map(([x, y, r]) => K.onion(p, x, y, 18, r, { c: '#efd9a2', layers: 1 })),
        K.scallions(p, 100, 100, 74, { n: 12 }),
    ].join(''),

    // なすと油揚げの味噌汁: 朱の椀に、にごった味噌汁、斜め切りのなす（紫の皮）と油揚げの短冊、ねぎ
    nasuagemiso: p => [
        K.wan(p),
        K.liquid(p, { R: 76, c: '#c79a55', op: 1 }),
        `<circle cx="100" cy="100" r="66" fill="#e2c38c" opacity=".35"/>`,
        ...jgSpots('nm', 9, 52, 22).map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="13" ry="8" fill="${p.g('#5a3a6a', .3, .2)}" stroke="#2f1a3a" stroke-width=".6"/></g><ellipse rx="10" ry="5.4" fill="#e8dcb0"/><path d="M-8,-1 Q0,-4 8,-1" stroke="#c9b87a" stroke-width=".6" fill="none"/></g>`),
        ...jgSpots('na', 8, 54, 22, 100, 100).map(([x, y, r]) => K.aburaage(p, x, y, 26, 8, r)),
        K.scallions(p, 100, 100, 74, { n: 12 }),
    ].join(''),

    // キャベツと油揚げの味噌汁: 朱の椀に、にごった味噌汁、やわらかく煮えたキャベツと油揚げの短冊、ねぎ
    cabbagemiso: p => [
        K.wan(p),
        K.liquid(p, { R: 76, c: '#c79a55', op: 1 }),
        `<circle cx="100" cy="100" r="66" fill="#e2c38c" opacity=".35"/>`,
        ...jgSpots('cm', 9, 54, 22).map(([x, y, r]) => K.leafPiece(p, x, y, 24, r, { c: '#c8d98a', cooked: true })),
        ...jgSpots('ca', 8, 54, 22, 100, 100).map(([x, y, r]) => K.aburaage(p, x, y, 26, 8, r)),
        K.scallions(p, 100, 100, 74, { n: 12 }),
    ].join(''),
};
