// 主食の選択肢（国ごとに選べる主食）の絵。各国の既存の主食の絵（xx_staple）で足りないものだけをここで描く
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk } = K;

// ---------- このファイル専用の部品（st〜） ----------
// 粒の山（米・ブルグル・そばの実など）。cols の色を混ぜて、楕円の粒をたくさん置く
function stGrains(p, cx, cy, s, { cols = ['#f7f4ea'], base = '#f4efe2', rx = 2.6, ry = 1.4, k = 1.3, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'gr' + seed);
    const shape = smooth(ring(s / 2, 12, .1, R, 1, sy));
    let g = '';
    const n = Math.round(s * s / 40 * k * .5);   // 粒は半分に（ファイルを軽く）
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .9, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const c = cols[Math.floor(R() * cols.length)];
        const light = (gx + gy) < 0;
        g += `<ellipse cx="${Math.round(gx)}" cy="${Math.round(gy)}" rx="${rx}" ry="${ry}" transform="rotate(${Math.round(R() * 180)} ${Math.round(gx)} ${Math.round(gy)})" fill="${light ? lt(c, .25) : c}"/>`;
    }
    return `<g ${T(cx, cy)}>${base === 'transparent' ? '' : `<g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(base, .25, .18, .38, .34)}"/></g>`}${g}</g>`;
}
// 白い湯気のような光
const stShine = (cx, cy, R, op = .55) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 丸いパン（ロールパン・パンデサル・ボリーリョ）。w,h は大きさ、slit は切れ目
function stBun(p, x, y, w, h, r = 0, { c = '#d99a4e', top = '#c07a36', slit = 0, crumbs = false, seed = 1 } = {}){
    const R = rng(p.id + 'bun' + seed);
    const pts = ring(10, 10, .06, R, w / 20, h / 20);
    let s = `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts, true, .9)}" fill="${p.rg(c, .3, .3, .36, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>`;
    s += `<ellipse cx="${f(-w * .1)}" cy="${f(-h * .14)}" rx="${f(w * .3)}" ry="${f(h * .22)}" fill="${lt(top, .35)}" opacity=".45"/>`;
    if (slit) s += `<path d="M${f(-w * .32)},${f(h * .02)} Q0,${f(-h * .12)} ${f(w * .32)},${f(h * .02)}" stroke="${lt(c, .55)}" stroke-width="${slit}" fill="none" stroke-linecap="round"/><path d="M${f(-w * .3)},${f(h * .06)} Q0,${f(-h * .06)} ${f(w * .3)},${f(h * .06)}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".6"/>`;
    if (crumbs){ for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .8; s += `<circle cx="${f(Math.cos(a) * d * w / 2)}" cy="${f(Math.sin(a) * d * h / 2)}" r="${f(.6 + R() * .7)}" fill="${R() < .5 ? '#f3dcae' : '#b8793a'}" opacity=".9"/>`; } }
    return s + `</g>`;
}
// かご（籐）
function stBasket(p, { R = 92, c = '#b98a4e', liner = '#f1ead8' } = {}){
    let weave = '';
    for (let i = 0; i < 48; i++){ const a = i / 48 * Math.PI * 2; weave += `<path d="M${f(100 + Math.cos(a) * (R - 12))},${f(100 + Math.sin(a) * (R - 12))} L${f(100 + Math.cos(a) * (R - 1))},${f(100 + Math.sin(a) * (R - 1))}" stroke="${dk(c, .3)}" stroke-width="1.1" opacity=".55"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .3, .25, .35, .3)}"/></g>${weave}
        <circle cx="100" cy="100" r="${R - 12}" fill="none" stroke="${dk(c, .35)}" stroke-width="1.6" opacity=".7"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .5)} Q100,${f(100 - R * .95)} ${f(100 + R * .74)},${f(100 - R * .5)} L${f(100 + R * .62)},${f(100 + R * .62)} Q100,${f(100 + R * .86)} ${f(100 - R * .62)},${f(100 + R * .62)} Z" fill="${p.rg(liner, .15, .15, .4, .3)}" opacity=".95"/>
        <path d="M${f(100 - R * .7)},${f(100 - R * .46)} Q100,${f(100 - R * .88)} ${f(100 + R * .7)},${f(100 - R * .46)}" stroke="#c6513a" stroke-width="2" fill="none" opacity=".55" stroke-dasharray="6 5"/>`;
}
// せいろ（竹）
function stSteamer(p, { R = 92 } = {}){
    const c = '#d9b878';
    let slats = '';
    for (let i = -6; i <= 6; i++){ const y = 100 + i * 11; const hw = Math.sqrt(Math.max(0, (R - 14) ** 2 - (y - 100) ** 2)); slats += `<path d="M${f(100 - hw)},${f(y)} L${f(100 + hw)},${f(y)}" stroke="${dk(c, .25)}" stroke-width="1" opacity=".5"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .3, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${dk(c, .35)}" stroke-width="1.6"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg('#e9d6a6', .15, .2, .6, .6)}"/>${slats}
        <circle cx="100" cy="100" r="${R - 12}" fill="none" stroke="${dk(c, .3)}" stroke-width="1.4"/>`;
}
// 木の板
function stBoard(p, { w = 176, h = 132, c = '#c89458' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    let grain = '';
    for (let i = 1; i < 7; i++) grain += `<path d="M${x + 8},${f(y + i * h / 7)} Q${f(100)},${f(y + i * h / 7 + (i % 2 ? 5 : -5))} ${x + w - 8},${f(y + i * h / 7)}" stroke="${dk(c, .25)}" stroke-width=".8" fill="none" opacity=".45"/>`;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${p.rg(c, .25, .2, .35, .3)}"/></g>${grain}
        <rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="12" fill="none" stroke="${lt(c, .3)}" stroke-width="1.2" opacity=".7"/>`;
}
// 平たいパン（ロティ・トルティーヤ）を重ねる
function stFlat(p, x, y, r, { c = '#e7c88f', spot = '#a8692c', n = 14, seed = 1, edge = null } = {}){
    const R = rng(p.id + 'fl' + seed);
    const pts = ring(r, 16, .03, R);
    let s = `<g ${T(x, y)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.rg(c, .2, .18, .4, .36)}" stroke="${edge || dk(c, .25)}" stroke-width=".9"/></g>`;
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * r * .85, sr = 1.5 + R() * 3.4; s += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(sr)}" ry="${f(sr * .7)}" transform="rotate(${f(R() * 180)})" fill="${spot}" opacity="${f(.35 + R() * .4)}"/>`; }
    return s + `</g>`;
}
// 食パン1枚（トースト）
function stToast(p, x, y, s, r = 0, { c = '#e7b766', crust = '#a8652b', butter = false } = {}){
    const d = `M${-s * .5},${-s * .18} Q${-s * .52},${-s * .56} ${-s * .2},${-s * .56} Q0,${-s * .62} ${s * .2},${-s * .56} Q${s * .52},${-s * .56} ${s * .5},${-s * .18} L${s * .48},${s * .5} L${-s * .48},${s * .5} Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${d}" fill="${crust}"/></g><path d="${d}" transform="scale(.86) translate(0 ${s * .03})" fill="${p.rg(c, .3, .2, .4, .35)}"/>
        ${butter ? `<rect x="${-s * .14}" y="${-s * .12}" width="${s * .3}" height="${s * .22}" rx="2" fill="#f7e08a" stroke="#e5c55a" stroke-width=".7" transform="rotate(12)"/>` : ''}</g>`;
}
// 白い湯気
const stSteam = (x, y) => `<path d="M${x},${y} c-4,-6 4,-10 0,-16 M${x + 10},${y + 2} c-4,-6 4,-10 0,-16 M${x - 10},${y + 2} c-4,-6 4,-10 0,-16" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>`;

export default {
    // 玄米ご飯: 茶碗に、薄茶色の粒の玄米
    st_genmai: p => [
        K.chawan(p),
        stGrains(p, 100, 101, 148, { cols: ['#d9b97e', '#cfa86a', '#e4c993'], base: '#e2c891', k: 1.35 }),
        stShine(100, 100, 70),
    ].join(''),
    // 雑穀ご飯: 茶碗に、白米と紫の黒米・黄色のもちきび・豆
    st_zakkoku: p => [
        K.chawan(p),
        stGrains(p, 100, 101, 148, { cols: ['#ece0e4', '#c9a6b4', '#8a4a66', '#f1e6c0', '#f7f2ea'], base: '#e6d3d8', k: 1.35 }),
        stGrains(p, 100, 101, 120, { cols: ['#f2cf4a'], base: 'transparent', rx: 1.4, ry: 1.3, k: .12, seed: 2 }),
        stShine(100, 100, 70),
    ].join(''),
    // パン（トースト）: 白い皿に、こんがりの食パン2枚、片方にバター
    st_toast: p => [
        K.plate(p, { rim: '#1f3a66' }),
        stToast(p, 82, 92, 84, -12, {}),
        stToast(p, 116, 112, 84, 8, { c: '#e9bd70', butter: true }),
    ].join(''),
    // ゆでじゃがいも: 白い皿に、皮をむいたゆでじゃがいもとパセリ、バター
    st_potatoes: p => [
        K.plate(p, { rim: '#2f5f3a' }),
        `<g ${p.sh(.9)}>`,
        K.potato(p, 76, 80, 52, 10, { c: '#f0d48c', seed: 1 }), K.potato(p, 122, 78, 50, -30, { c: '#ecd086', seed: 2 }),
        K.potato(p, 70, 122, 50, 60, { c: '#f2d792', seed: 3 }), K.potato(p, 114, 124, 54, 20, { c: '#eecf84', seed: 4 }), K.potato(p, 140, 104, 40, -10, { c: '#f0d48c', seed: 5 }),
        `</g>`,
        `<rect x="92" y="96" width="18" height="12" rx="2" fill="#f7e08a" stroke="#e5c55a" stroke-width=".7" transform="rotate(15 101 102)"/>`,
        K.sprinkle(p, 100, 100, 110, { c: '#3f8a2c', n: 40, r: 1 }),
    ].join(''),
    // ロティ（チャパティ）: 布を敷いたかごに、焼き目のある丸い薄焼きパンを重ねる
    st_roti: p => [
        stBasket(p, { c: '#a87a44', liner: '#f3e9d2' }),
        stFlat(p, 92, 98, 56, { seed: 1 }), stFlat(p, 104, 104, 56, { seed: 2 }), stFlat(p, 98, 112, 56, { seed: 3, c: '#ecd09a' }),
        `<path d="M66,112 q32,10 64,0" stroke="#f7e6b8" stroke-width="2" fill="none" opacity=".7"/>`,
    ].join(''),
    // 饅頭（マントウ）: せいろに、白くふっくらした蒸しパン4つ
    st_mantou: p => [
        stSteamer(p),
        stBun(p, 76, 78, 50, 46, 0, { c: '#fbf8f0', top: '#ffffff', seed: 1 }), stBun(p, 124, 80, 50, 46, 0, { c: '#f8f4ea', top: '#ffffff', seed: 2 }),
        stBun(p, 78, 124, 50, 46, 0, { c: '#f9f5ec', top: '#ffffff', seed: 3 }), stBun(p, 124, 124, 50, 46, 0, { c: '#fbf8f0', top: '#ffffff', seed: 4 }),
        stSteam(100, 60),
    ].join(''),
    // もち米（カオニャオ）: 竹かご（グラティップ）に、つやのあるもち米のかたまり
    st_sticky: p => [
        stSteamer(p, { R: 90 }),
        stGrains(p, 100, 102, 128, { cols: ['#f6f1e2', '#efe6cf', '#ffffff'], base: '#f1e8d2', rx: 2.8, ry: 1.6, k: 1.5, sy: .85 }),
        `<path d="M58,84 Q80,64 112,62" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
    ].join(''),
    // 雑穀ごはん（チャプコッパ）: ステンレスの器に、紫がかったご飯と黒豆・あずき
    st_japgok: p => [
        K.bowl(p, { glaze: '#b9bdc1', inside: '#dfe2e5' }),
        stGrains(p, 100, 101, 140, { cols: ['#c99aaa', '#a86a82', '#e9d6dc', '#7a3c58'], base: '#c793a6', k: 1.35 }),
        stGrains(p, 100, 101, 116, { cols: ['#2b2420', '#7d2f2a'], base: 'transparent', rx: 3.2, ry: 2.4, k: .07, seed: 3 }),
        stShine(100, 100, 66),
    ].join(''),
    // 小麦粉のトルティーヤ: 布をかけたかごに、白っぽい薄焼きを重ねる
    st_flourtort: p => [
        stBasket(p, { c: '#c4423a', liner: '#f5ede0' }),
        stFlat(p, 92, 98, 58, { c: '#f3e3c4', spot: '#c08a4c', n: 18, seed: 4 }), stFlat(p, 106, 108, 58, { c: '#f6e9cf', spot: '#c08a4c', n: 16, seed: 5 }),
    ].join(''),
    // ボリーリョ: 木の板に、切れ目の入った細長い小型パン3つ
    st_bolillo: p => [
        stBoard(p, {}),
        stBun(p, 70, 96, 76, 40, -60, { c: '#d9934a', slit: 3, seed: 1 }),
        stBun(p, 104, 96, 76, 40, -60, { c: '#cf8a40', slit: 3, seed: 2 }),
        stBun(p, 138, 96, 76, 40, -60, { c: '#dc9a52', slit: 3, seed: 3 }),
    ].join(''),
    // ディナーロール: 布を敷いたかごに、丸いロールパン
    st_rolls: p => [
        stBasket(p, {}),
        stBun(p, 80, 82, 44, 40, 0, { seed: 1 }), stBun(p, 120, 80, 44, 40, 0, { seed: 2 }), stBun(p, 100, 104, 44, 40, 0, { seed: 3, c: '#dca15a' }),
        stBun(p, 76, 124, 44, 40, 0, { seed: 4, c: '#d4954c' }), stBun(p, 122, 124, 44, 40, 0, { seed: 5 }),
    ].join(''),
    // ご飯と豆（アホース・イ・フェイジャン）: 白い皿に、左にご飯、右に黒っぽい豆の煮もの
    st_ricebeans: p => {
        const R = rng(p.id + 'bn');
        let beans = '';
        for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 30; beans += `<ellipse cx="${f(126 + Math.cos(a) * d)}" cy="${f(104 + Math.sin(a) * d)}" rx="5.2" ry="3.4" transform="rotate(${f(R() * 180)} ${f(126 + Math.cos(a) * d)} ${f(104 + Math.sin(a) * d)})" fill="${R() < .5 ? '#5a3324' : '#6e4230'}" stroke="#3b2016" stroke-width=".5"/>`; }
        return [
            K.plate(p, { rim: '#2f7a52' }),
            stGrains(p, 76, 98, 82, { cols: ['#f7f4ea', '#efe9da'], base: '#f4efe2', k: 1.4 }),
            K.pool(p, 126, 104, 76, '#6a3e2a', { op: .95, seed: 2 }),
            beans,
            stShine(126, 104, 30, .4),
        ].join('');
    },
    // ブルグル・ピラフ: 銅の器に、トマトで色づいたブルグル（ひき割り小麦）
    st_bulgur: p => [
        K.bowl(p, { glaze: '#b8683a', inside: '#efe2cc' }),
        stGrains(p, 100, 101, 140, { cols: ['#d39a52', '#c4843e', '#e2b06a', '#b9692f'], base: '#cf8f4a', rx: 2, ry: 1.5, k: 1.7 }),
        K.sprinkle(p, 100, 100, 90, { c: '#3f8a2c', n: 16, r: 1 }),
        stShine(100, 100, 66),
    ].join(''),
    // ピラウ（ピラフ）: 白い器に、ご飯と炒めた細いパスタ（シェリエ）
    st_pilav: p => {
        const R = rng(p.id + 'sh');
        let sh = '';
        for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 58, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; sh += `<rect x="${f(x - 4)}" y="${f(y - 1.2)}" width="8" height="2.4" rx="1.2" fill="#c98a42" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})"/>`; }
        return [K.bowl(p, { glaze: '#f1ece2', inside: '#faf7f0' }), stGrains(p, 100, 101, 140, { cols: ['#fbf8ef', '#f1eadb'], base: '#f3ecdc', k: 1.4 }), sh, stShine(100, 100, 66)].join('');
    },
    // そばの実のカーシャ: 白い器に、茶色いそばの実と溶かしバター、ディル
    st_kasza: p => [
        K.bowl(p, { glaze: '#e7e2d8', inside: '#f6f2ea' }),
        stGrains(p, 100, 101, 140, { cols: ['#8a5a34', '#a36d40', '#6e4426', '#b98251'], base: '#8f5f38', rx: 2.4, ry: 2, k: 1.5 }),
        `<ellipse cx="96" cy="94" rx="20" ry="12" fill="#f3d66a" opacity=".55"/>`,
        K.sprinkle(p, 100, 100, 96, { c: '#4f8f2f', n: 20, r: 1 }),
        stShine(100, 100, 66),
    ].join(''),
    // ポレンタ: 木の板に、黄色く丸く広げたやわらかいポレンタとバター
    st_polenta: p => [
        stBoard(p, { w: 170, h: 150, c: '#bf8a50' }),
        `<g ${p.sh(1)}><path d="${smooth(ring(56, 14, .06, rng(p.id + 'po')))}" transform="translate(100 100)" fill="${p.rg('#f2c440', .3, .2, .38, .34)}"/></g>`,
        `<path d="M70,92 q30,-14 60,0 M76,110 q24,-10 48,0" stroke="#f8dc7a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`,
        `<rect x="92" y="86" width="18" height="12" rx="2" fill="#faea9c" stroke="#e5c55a" stroke-width=".7" transform="rotate(-10 101 92)"/>`,
        K.sprinkle(p, 100, 100, 70, { c: '#6b5a3a', n: 18, r: .7 }),
    ].join(''),
    // ガーリックライス（シナンガグ）: 白い皿に、ご飯ときつね色のにんにくチップ
    st_garlicrice: p => [
        K.plate(p, { rim: '#1f5aa6' }),
        stGrains(p, 100, 101, 132, { cols: ['#f6efda', '#efe2bf', '#fbf6e8'], base: '#f1e6c9', k: 1.4 }),
        stGrains(p, 100, 101, 116, { cols: ['#d99a3c', '#c07a2a', '#e8b25a'], base: 'transparent', rx: 2.4, ry: 2, k: .14, seed: 4 }),
        K.sprinkle(p, 100, 100, 90, { c: '#3f8a2c', n: 12, r: 1 }),
    ].join(''),
    // パンデサル: 紙袋の口を開いたように、パン粉をまぶした小さな丸パン
    st_pandesal: p => [
        stBasket(p, { c: '#c9a46a', liner: '#efe2c4' }),
        stBun(p, 80, 84, 40, 36, 0, { c: '#d9944c', crumbs: true, seed: 1 }), stBun(p, 118, 82, 40, 36, 0, { c: '#d18c44', crumbs: true, seed: 2 }),
        stBun(p, 98, 106, 40, 36, 0, { c: '#dc9a52', crumbs: true, seed: 3 }), stBun(p, 78, 126, 40, 36, 0, { c: '#d18c44', crumbs: true, seed: 4 }),
        stBun(p, 120, 126, 40, 36, 0, { c: '#d9944c', crumbs: true, seed: 5 }),
    ].join(''),
    // バインミー（パン）: 木の板に、軽い皮のベトナムのバゲット2本
    st_banhmi: p => [
        stBoard(p, {}),
        stBun(p, 92, 82, 128, 38, -12, { c: '#e0a252', slit: 3.4, seed: 1 }),
        stBun(p, 108, 122, 128, 38, -12, { c: '#d8984a', slit: 3.4, seed: 2 }),
    ].join(''),
};
