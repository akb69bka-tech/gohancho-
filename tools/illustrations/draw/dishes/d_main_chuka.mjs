// 主菜（中華・韓国・沖縄などの炒め物・揚げ物）
import * as K from '../kit.mjs';

const { smooth, ring, rng, lt, dk, mix, T, f } = K;

// ---------- この料理ファイルだけの部品（頭に ch をつける） ----------

// 焼き餃子（焼き目を上にした1個）: 長さ s。三日月の形、まん中はこんがり、弧の縁にひだ
function chGyoza(p, x, y, s, r = 0, { seed = 1, brown = '#c47a2a' } = {}){
    const R = rng(p.id + 'gyz' + seed + x + y);
    const k = s / 40;
    // 弧の縁はひだで小さく波打つ
    const top = Array.from({ length: 17 }, (_, i) => { const t = i / 16, a = Math.PI * (1 - t), rr = (i % 2 ? 1 : .9); return [Math.cos(a) * 20 * (i % 2 ? 1 : .97), -Math.sin(a) * 10.5 * rr + 3]; });
    const bot = [[15, 7.6], [0, 9], [-15, 7.6]];
    const body = smooth([...top, ...bot], true, .8);
    let pleats = '';
    for (let i = 2; i < 15; i += 2){
        const [ex, ey] = top[i];
        pleats += `<path d="M${f(ex)},${f(ey)} L${f(ex * .86)},${f(ey * .7 + 1.2)}" stroke="#c9ab74" stroke-width=".8" stroke-linecap="round" opacity=".8"/>`;
    }
    const crisp = smooth(ring(1, 12, .16, R, 15.5, 6.2).map(([a, b]) => [a + .5, b + 3.2]));
    const crisp2 = smooth(ring(1, 9, .3, R, 9, 3.2).map(([a, b]) => [a + 1.5, b + 3.8]));
    return `<g ${T(x, y, r, k)}><path d="${body}" fill="${p.g('#f4e7c6', .3, .16)}" stroke="#c4a46c" stroke-width=".7"/>
        ${pleats}
        <path d="${crisp}" fill="${p.rg(brown, .3, .25, .42, .4)}" opacity=".92"/>
        <path d="${crisp2}" fill="${dk(brown, .2)}" opacity=".55"/>
        <path d="M-11,1 Q-3,-1.6 7,-.4" stroke="#fff3d0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M-16,-1 Q-11,-6.5 -3,-7.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 乱切りのなす（炒めたもの）: 片側に紫の皮、切り口はつやのある飴色
function chNasu(p, x, y, s, r = 0, { flesh = '#d6a560', skin = '#4a2252', seed = 1 } = {}){
    const R = rng(p.id + 'nas' + seed + x + y);
    const k = s / 20;
    const pts = [[-10, -3], [-4, -9], [7, -8], [10, 2], [5, 8], [-6, 7]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    const inner = [pts[0], pts[1], pts[2], [pts[3][0] - 3.4, pts[3][1] - 1.6], [pts[4][0] - 2.6, pts[4][1] - 3.4], [pts[5][0] + .6, pts[5][1] - 3.6]];
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .6)}" fill="${p.g(skin, .3, .25)}" stroke="#26102c" stroke-width=".6"/>
        <path d="${smooth(inner, true, .6)}" fill="${p.g(flesh, .3, .25)}" stroke="${dk(flesh, .25)}" stroke-width=".5"/>
        <path d="${smooth(inner.map(([a, b]) => [a * .5 - 1, b * .5 - 1]), true, .6)}" fill="${lt(flesh, .25)}" opacity=".6"/>
        <path d="M-6,-4 Q-1,-7.4 5,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M8,1 Q6,5.5 2.5,7" stroke="#c8a0d8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ゴーヤ（半月切り）: 外はいぼのある濃い緑、内は薄緑、種を取ったくぼみ
function chGoya(p, x, y, s, r = 0){
    const k = s / 20;
    let bumps = '';
    for (let i = 0; i < 4; i++){ const a = Math.PI * (1 - (i + .5) / 4); bumps += `<circle cx="${f(Math.cos(a) * 9.4)}" cy="${f(-Math.sin(a) * 8.6 + 2)}" r="1.5" fill="#3f8a2a"/>`; }
    return `<g ${T(x, y, r, k)}><path d="M-10,2 A10,9.6 0 0 1 10,2 L5,2 A5,4.2 0 0 0 -5,2Z" fill="${p.g('#5aa03a', .2, .25)}" stroke="#2b5f1e" stroke-width=".7"/>
        ${bumps}
        <path d="M-7.6,2 A7.6,7 0 0 1 7.6,2 L5,2 A5,4.2 0 0 0 -5,2Z" fill="${p.g('#bfe08f', .3, .15)}"/>
        <path d="M-5,2 A5,4.2 0 0 1 5,2" stroke="#eef6d6" stroke-width="1" fill="none"/>
        <path d="M-6,-3 Q-2,-6.4 2,-6.6" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 白菜キムチ（下半分は芯の白っぽい部分、上半分は赤く縮れた葉、唐辛子の粉）
function chKimchi(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'kmc' + seed + x + y);
    const k = s / 20;
    const leaf = [...Array.from({ length: 9 }, (_, i) => { const t = i / 8, a = Math.PI * (1 - t); return [Math.cos(a) * 11, -Math.sin(a) * 8.5 * (.8 + R() * .35) + 1]; })];
    const stem = [[11, 1], [10, 6.5], [0, 7.6], [-10, 6.5], [-11, 1]];
    let fl = '';
    for (let i = 0; i < 5; i++) fl += `<circle cx="${f((R() - .5) * 18)}" cy="${f(-3.4 + R() * 9)}" r="${f(.35 + R() * .4)}" fill="#a81e0c" opacity=".85"/>`;
    return `<g ${T(x, y, r, k)}><path d="${smooth([...leaf, ...stem.slice(1, 4)], true, .8)}" fill="${p.g('#f2b08a', .35, .15)}" stroke="#c0603e" stroke-width=".55"/>
        <path d="${smooth([...leaf, [9, 1.6], [0, 0], [-9, 1.6]], true, .8)}" fill="${p.g('#d8432a', .25, .2)}"/>
        <path d="M-6,-3 Q-4,-1 -6,1 M0,-5 Q2,-2 0,1 M6,-3 Q4,-1 6,1" stroke="#a82a16" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-8,4.4 Q0,5.4 8,4.4" stroke="#fbe2cc" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/>
        ${fl}<path d="M-7,-2.6 Q-3,-6 3,-6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// コチュジャンをからめた鶏肉（タッカルビ）: 不定形で、たれの薄いところに肉の色がのぞく
function chSpicyChicken(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'spc' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 10, .45, R, 1.08, .9);
    let pt = '';
    for (let i = 0; i < 3; i++) pt += `<path ${T((R() - .5) * 10, (R() - .5) * 6)} d="${smooth(ring(2 + R() * 1.6, 6, .5, R, 1.4, .7))}" fill="#eda070" opacity=".75"/>`;
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#c0452a', .25, .3)}" stroke="#7e2412" stroke-width=".6"/>${pt}
        <path d="M-7,4 Q-2,6 5,4.6" stroke="#8a2412" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
        <circle cx="-4" cy="-4" r="1" fill="#fff" opacity=".6"/></g>`;
}
// 炒めたキャベツのざく切り（しんなりした薄い葉、白い芯の筋）
function chCabbage(p, x, y, s, r = 0, { c = '#b5d773', tint = null, seed = 1 } = {}){
    const R = rng(p.id + 'cbg' + seed + x + y);
    const k = s / 20, col = tint ? mix(c, tint, .12) : c;
    const pts = ring(9.5, 8, .42, R, 1.2, .8);
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .55)}" fill="${p.g(col, .45, .06)}" stroke="${dk(col, .22)}" stroke-width=".5"/>
        <path d="M-10,2.4 Q-1,-.6 10,1.6 L10,3.6 Q-1,1.6 -10,4.4Z" fill="${lt(col, .6)}" opacity=".9"/>
        <path d="M-4,2 Q-6,-2 -8,-4.6 M2,1.4 Q2,-3 4.6,-6 M6,2 Q7,-1 9,-2" stroke="${lt(col, .45)}" stroke-width=".8" fill="none" stroke-linecap="round"/>
        ${tint ? `<path d="M3,4.6 Q6,6 9,4" stroke="${tint}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>` : ''}</g>`;
}
// ひき肉の粒（麻婆の肉）: 小さな不定形のかたまり、照りの点
function chMince(p, x, y, s, { n = 50, c = '#7a3a1a', seed = 1 } = {}){
    const R = rng(p.id + 'mnc' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 2 + R() * 1.8, col = R() < .5 ? c : lt(c, .12);
        out += `<path ${T(cx, cy, R() * 360)} d="${smooth(ring(rr, 5, .55, R, 1.2, .9))}" fill="${col}" stroke="${dk(col, .35)}" stroke-width=".4"/>`;
    }
    return out;
}
// 餃子の羽根（薄いこんがりした膜）
function chHane(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'hane' + x);
    let holes = '';
    for (let i = 0; i < 26; i++) holes += `<ellipse cx="${f((R() - .5) * w * .95)}" cy="${f((R() - .5) * h * .9)}" rx="${f(1 + R() * 2.4)}" ry="${f(.8 + R() * 1.4)}" fill="#f4ecdc" opacity=".55"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(ring(1, 14, .18, R, w / 2, h / 2))}" fill="${p.rg('#d79a4c', .25, .3)}" opacity=".85"/>${holes}</g>`;
}
// 刻んだ長ねぎ（白〜薄緑の細かいみじん切り）
function chNegiBits(p, x, y, s, { n = 18, seed = 1, sy = .8 } = {}){
    const R = rng(p.id + 'ngb' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, w = 2.4 + R() * 2;
        const c = R() < .55 ? '#f4f6e6' : R() < .6 ? '#d6e7a8' : '#9cc65e';
        out += `<rect ${T(cx, cy, R() * 180)} x="${f(-w / 2)}" y="-1.3" width="${f(w)}" height="2.6" rx=".9" fill="${c}" stroke="${dk(c, .22)}" stroke-width=".35"/>`;
    }
    return out;
}
// 小口切りの青ねぎ（緑の小さな輪）
function chGreenOnion(p, x, y, s, { n = 12, seed = 1 } = {}){
    return K.scallions(p, x, y, s, { n, seed, c: '#4f9a2e' });
}
// 揚げてあんをからめたかたまり（酢豚の豚肉など）
function chGlazedChunk(p, x, y, s, r = 0, { c = '#9a3d1c', seed = 1 } = {}){
    const R = rng(p.id + 'gch' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 9, .3, R, 1.1, .92);
    return `<g ${T(x, y, r, k)}><g ${p.rough(1.4, .2)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 + 1.5, b * .55 + 1.5]), true, .8)}" fill="${dk(c, .18)}" opacity=".35"/>
        <path d="M-6.5,-3.5 Q-3,-7 2.5,-6.4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="4.5" cy="-2" r="1.1" fill="#fff" opacity=".8"/><path d="M2,5 Q5,4.4 6.5,2" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 揚げた白身魚（片栗粉の衣）。w×h
function chFriedFish(p, x, y, w, h, r = 0, { c = '#e2ab5a', seed = 1 } = {}){
    const R = rng(p.id + 'ffs' + seed + x);
    const pts = [[-w / 2, -h / 2 + 4], [-w / 6, -h / 2], [w / 6, -h / 2 - 1], [w / 2, -h / 2 + 3], [w / 2 + 1, h / 6], [w / 2 - 2, h / 2], [0, h / 2 + 1], [-w / 2 + 1, h / 2 - 2], [-w / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    let bits = '';
    for (let i = 0; i < 16; i++) bits += `<circle cx="${f((R() - .5) * w * .75)}" cy="${f((R() - .5) * h * .7)}" r="${f(1 + R() * 1.6)}" fill="${R() < .5 ? lt(c, .35) : dk(c, .15)}" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.rough(1.6, .12)}><path d="${smooth(pts, true, .6)}" fill="${p.g(c, .4, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>${bits}
        <path d="M${f(-w * .32)},${f(-h * .22)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .26)},${f(-h * .3)}" stroke="#fff4d8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 揚げた鶏の切り身（油淋鶏）。w×h、皮側がこんがり
function chCrispSlice(p, x, y, w, h, r = 0, { c = '#cf8a36', seed = 1 } = {}){
    const R = rng(p.id + 'csl' + seed + x + y);
    const pts = [[-w / 2, -h / 2], [0, -h / 2 - 1], [w / 2, -h / 2], [w / 2 + 1, 0], [w / 2, h / 2], [0, h / 2 + 1], [-w / 2, h / 2], [-w / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2]);
    return `<g ${T(x, y, r)}><g ${p.crumb(.7)}><g ${p.rough(1.8, .16)}><path d="${smooth(pts, true, .55)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g></g>
        <path d="M${f(w / 2 - 2)},${f(-h / 2 + 3)} Q${f(w / 2)},0 ${f(w / 2 - 2)},${f(h / 2 - 3)}" stroke="#f4e4c8" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M${f(w / 2 - .4)},${f(-h / 2 + 4)} Q${f(w / 2 + 1.4)},0 ${f(w / 2 - .4)},${f(h / 2 - 4)}" stroke="#e2c49a" stroke-width=".8" fill="none" opacity=".8"/>
        <path d="M${f(-w / 2 + 3)},${f(-h / 2 + 2.5)} Q0,${f(-h / 2 + .5)} ${f(w / 2 - 6)},${f(-h / 2 + 2.6)}" stroke="#fff3d6" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// ほぐした鶏むね肉（棒棒鶏）: 白い繊維状の細い束を山にする
function chChickenShreds(p, x, y, s, { n = 34, seed = 1, sy = .75 } = {}){
    const R = rng(p.id + 'cks' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .42, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy;
        const ang = -.5 + (R() - .5) * 1.6, L = 12 + R() * 12, w = 3.2 + R() * 2.2;
        const dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2, b = (R() - .5) * 4;
        const dpath = `M${f(cx - dx)},${f(cy - dy)} Q${f(cx + b)},${f(cy - b)} ${f(cx + dx)},${f(cy + dy)}`;
        const col = R() < .4 ? '#fbf6ea' : R() < .6 ? '#f1e4cc' : '#e9d8b8';
        out += `<path d="${dpath}" stroke="#cdb48c" stroke-width="${f(w + .9)}" fill="none" stroke-linecap="round"/><path d="${dpath}" stroke="${col}" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/>`;
    }
    return `<g ${p.sh(.7)}>${out}</g>`;
}
// レタスの葉（大きく波打つ）
function chLettuce(p, x, y, s, r = 0, { c = '#a8d36a', seed = 1 } = {}){
    const R = rng(p.id + 'let' + seed + x + y);
    const pts = ring(s / 2, 16, .28, R, 1.1, .85);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .9)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .22)}" stroke-width=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .72, b * .72]), true, .9)}" fill="${lt(c, .3)}" opacity=".55"/>
        <path d="M${f(-s * .45)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .42)},${f(-s * .02)}" stroke="#eef7d8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M${f(-s * .15)},0 L${f(-s * .3)},${f(-s * .25)} M${f(s * .1)},0 L${f(-s * .02)},${f(-s * .3)} M${f(s * .05)},0 L${f(s * .2)},${f(s * .25)} M${f(-s * .2)},${f(s * .02)} L${f(-s * .28)},${f(s * .26)}" stroke="#e4f2c4" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
}
// トマトの輪切りを半分にしたもの
function chTomatoHalfSlice(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 A10,10 0 0 1 10,0Z" fill="${p.g('#e3392b', .3, .22)}" stroke="#a8221a" stroke-width=".6"/></g>
        <path d="M-8.4,0 A8.4,8.4 0 0 1 8.4,0Z" fill="#f2604a"/>
        ${[-50, -90, -130].map(a => { const rad = a * Math.PI / 180; return `<ellipse cx="${f(Math.cos(rad) * 5)}" cy="${f(Math.sin(rad) * 5)}" rx="2.3" ry="1.5" transform="rotate(${a + 90} ${f(Math.cos(rad) * 5)} ${f(Math.sin(rad) * 5)})" fill="#f7c95e" opacity=".9"/>`; }).join('')}
        <path d="M-8.4,0 L8.4,0" stroke="#f79a80" stroke-width="1"/>
        <path d="M-6,-5 Q-2,-8 3,-7.6" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// きゅうりの細切りの山
function chCucumberShreds(p, x, y, s, { n = 26, seed = 1, sy = .75 } = {}){
    const R = rng(p.id + 'ccs' + seed + x);
    let out = `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .2, R, 1, sy))}" fill="#cfe5a6" opacity=".7"/>`;
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = (R() - .5) * 2.4, L = 10 + R() * 9;
        const dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
        out += `<path d="M${f(cx - dx)},${f(cy - dy)} L${f(cx + dx)},${f(cy + dy)}" stroke="#2f6f24" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(cx - dx)},${f(cy - dy + .6)} L${f(cx + dx)},${f(cy + dy + .6)}" stroke="#cfe8a2" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}
// ニラ（4cm 長さの細い葉）
function chNira(p, x, y, s, { n = 8, seed = 1 } = {}){
    return K.shreds(p, x, y, s, { c: '#3f8c2c', n, w: 2.4, len: .55, seed, curve: .25 });
}
// 細切りの肉（青椒肉絲）
function chMeatStrips(p, x, y, s, { n = 14, seed = 1, c = '#8a5230', dir = null } = {}){
    const R = rng(p.id + 'mst' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = dir === null ? R() * Math.PI : dir + (R() - .5) * .9, L = s * (.2 + R() * .14), cx = x + (R() - .5) * s * .75, cy = y + (R() - .5) * s * .7;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, b = (R() - .5) * 3;
        const d = `M${f(cx - dx)},${f(cy - dy)} Q${f(cx + b)},${f(cy - b)} ${f(cx + dx)},${f(cy + dy)}`;
        const col = R() < .5 ? c : lt(c, .1);
        out += `<path d="${d}" stroke="${dk(col, .35)}" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${col}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".45" transform="translate(-.6 -.8)"/>`;
    }
    return out;
}
// 麺をまとめて描く（春雨など）: すべての筋を1本のパスにまとめ、縁取り・地・明るい筋の3層で軽くする
function chNoodles(p, x, y, s, { c = '#a88464', w = 2, n = 30, seed = 1, sy = .9, outline = null } = {}){
    const R = rng(p.id + 'cnd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.2 + R() * .78), a0 = R() * 6.28, sweep = 1.2 + R() * 2.2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = smooth(pts, false);
        d += one; if (R() < .35) dl += one;
    }
    return `<g ${p.sh(.8)}><path d="${d}" stroke="${outline || dk(c, .25)}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g><path d="${dl}" stroke="${lt(c, .3)}" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 鉄板のフライパン（タッカルビ）: 黒い丸い鉄板に両手の取っ手
function chIronPan(p){
    return `<g ${p.sh(2)}><rect x="2" y="90" width="196" height="20" rx="8" fill="${p.g('#3a3432', .2, .3)}"/><circle cx="100" cy="100" r="90" fill="${p.rg('#3b3533', .18, .3, .35, .3)}"/></g>
        <rect x="8" y="95" width="10" height="10" rx="3" fill="#1d1918"/><rect x="182" y="95" width="10" height="10" rx="3" fill="#1d1918"/>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#56504c" stroke-width="1.4"/>
        <circle cx="100" cy="100" r="81" fill="${p.rg('#26201e', .1, .2, .62, .64)}"/>
        <path d="M30,62 A80,80 0 0 1 62,30" stroke="#8a827c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 油のつや（ラー油の赤い点々）
function chOilDots(p, x, y, s, { n = 10, c = '#e0461c', seed = 1 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, rr = 1.2 + R() * 2.6, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity=".55"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .3)}" r="${f(rr * .35)}" fill="#ffd9a8" opacity=".7"/>`; }
    return out;
}

// ---------- 料理 ----------
// 円の中にばらまく（決まった乱数）
const chScatter = (seed, n, cx, cy, rad, sy = .9) => { const R = rng('sc' + seed); return Array.from({ length: n }, () => { const a = R() * 6.28, d = Math.sqrt(R()) * rad; return [cx + Math.cos(a) * d, cy + Math.sin(a) * d * sy, R() * 360, R()]; }); };

const DISHES = {
    // 麻婆豆腐: 白い深皿に、赤茶のとろみソース、さいの目の豆腐、ひき肉、ねぎ
    mapo: p => {
        const tofus = [[70, 72, 8], [100, 64, -6], [130, 74, 14], [56, 102, -10], [86, 96, 4], [116, 98, -12], [146, 104, 6], [70, 130, 10], [100, 124, -4], [130, 130, 8], [106, 152, -8], [78, 154, 12], [48, 130, 20], [152, 132, -16], [44, 78, -4], [156, 78, 10]];
        return [
            K.bowl(p, { glaze: '#f1ede4', inside: '#fbf9f4', lip: .9 }),
            K.liquid(p, { R: 76, c: '#a3361a', op: 1, shine: false }),
            chOilDots(p, 100, 100, 146, { n: 12, c: '#e5501c' }),
            `<g ${p.sh(.8)}>`,
            ...tofus.map(([x, y, r]) => K.tofu(p, x, y, 23, 22, r, { c: '#f3dfbf' })),
            `</g>`,
            // とろみのソースが豆腐にからむ
            `<circle cx="100" cy="100" r="76" fill="#c4481e" opacity=".2"/>`,
            ...tofus.filter((_, i) => i % 3 === 0).map(([x, y], i) => `<path ${T(x + 4, y + 5, i * 50)} d="${smooth(ring(5, 7, .5, rng('mpd' + i), 1.4, .8))}" fill="#b5401b" opacity=".8"/>`),
            chMince(p, 100, 100, 146, { n: 44, c: '#8a4624', seed: 1 }),
            chMince(p, 100, 106, 90, { n: 14, c: '#9a5230', seed: 2 }),
            chNegiBits(p, 100, 100, 120, { n: 20 }),
            chGreenOnion(p, 104, 96, 100, { n: 16 }),
            `<path d="M42,74 A64,64 0 0 1 74,42" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        ].join('');
    },

    // 回鍋肉: 甜麺醤で照った豚バラ、ざく切りキャベツ、ピーマン
    hoikoro: p => [
        K.plate(p),
        K.pool(p, 100, 102, 132, '#86441c', { op: .5, seed: 1 }),
        `<g ${p.sh(1.1)}>`,
        ...[[62, 78, 44, 20], [134, 72, 46, -30], [56, 128, 44, 60], [140, 130, 44, -70], [100, 152, 40, 10], [100, 52, 40, 80], [150, 100, 34, 100], [48, 104, 32, -20]].map(([x, y, s, r], i) => chCabbage(p, x, y, s, r, { c: i % 2 ? '#a8de62' : '#8fd04c', tint: '#9a5a26', seed: i })),
        K.porkSlice(p, 88, 88, 54, -20, { c: '#a35a2a', fat: '#ecc897', seed: 1, gloss: .75 }),
        K.porkSlice(p, 120, 108, 52, 30, { c: '#a8602e', fat: '#efcd9c', seed: 2, gloss: .75 }),
        K.porkSlice(p, 76, 118, 48, 70, { c: '#a35a2a', fat: '#ecc897', seed: 3, gloss: .75 }),
        K.porkSlice(p, 124, 78, 46, -60, { c: '#a8602e', fat: '#efcd9c', seed: 4, gloss: .75 }),
        chCabbage(p, 104, 120, 34, -40, { c: '#c2e68e', tint: '#9a5a26', seed: 9 }), chCabbage(p, 92, 70, 30, 140, { c: '#a8da6c', tint: '#9a5a26', seed: 10 }),
        K.pepperPiece(p, 62, 100, 24, 20), K.pepperPiece(p, 142, 104, 24, -30), K.pepperPiece(p, 110, 140, 22, 70),
        K.pepperPiece(p, 108, 92, 20, -10), K.pepperPiece(p, 80, 142, 20, 40), K.pepperPiece(p, 112, 58, 20, 120),
        K.porkSlice(p, 100, 132, 44, 10, { c: '#a35a2a', fat: '#ecc897', seed: 5, gloss: .75 }),
        `</g>`,
    ].join(''),

    // 青椒肉絲: 細切りのピーマン・豚肉・たけのこを照りよく山に盛る
    chinjao: p => [
        K.plate(p),
        K.pool(p, 100, 102, 132, '#a8742e', { op: .3, seed: 2 }),
        `<g ${p.sh(1)}>`,
        K.shreds(p, 100, 102, 120, { c: '#efdca0', n: 26, w: 3.6, len: .34, seed: 3, curve: .1 }),
        chMeatStrips(p, 100, 102, 124, { n: 22, c: '#9a5e38' }),
        ...chScatter('chj', 32, 100, 102, 58).map(([x, y, r, q]) => K.pepperPiece(p, x, y, 36 + q * 10, r, { strip: true, c: q < .5 ? '#3c8f2c' : '#2f7a24' })),
        chMeatStrips(p, 100, 100, 100, { n: 10, c: '#a4683f', seed: 4 }),
        K.shreds(p, 100, 100, 96, { c: '#f1e0a8', n: 12, w: 3.4, len: .32, seed: 5, curve: .1 }),
        ...chScatter('chj2', 10, 100, 100, 46).map(([x, y, r]) => K.pepperPiece(p, x, y, 38, r, { strip: true, c: '#43982f' })),
        `</g>`,
    ].join(''),

    // 焼き餃子: 羽根つきで焼き目を上に6個並べ、たれの小皿
    gyoza: p => {
        const row = [0, 1, 2, 3, 4, 5].map(i => [44 + i * 22, 96 + (i - 2.5) * -2]);
        return [
            K.plate(p),
            chHane(p, 100, 97, 150, 86, -3),
            `<g ${p.sh(1)}>`,
            ...row.map(([x, y], i) => chGyoza(p, x, y, 70, 78 + (i % 2) * 6, { seed: i })),
            `</g>`,
            `<g ${p.sh(.8)}><circle cx="152" cy="152" r="20" fill="${p.rg('#f6f3ec', .2, .14)}" stroke="#2c4c7c" stroke-width="1.6"/></g>`,
            `<circle cx="152" cy="152" r="14.5" fill="${p.rg('#5a2a12', .2, .3)}"/><circle cx="149" cy="148" r="3" fill="#d84a1c" opacity=".7"/><circle cx="156" cy="154" r="2" fill="#d84a1c" opacity=".6"/>`,
            `<path d="M143,146 Q147,141 153,141" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        ].join('');
    },

    // 豚キムチ炒め: 赤いキムチと豚バラ、玉ねぎ、ニラ、ごま
    butakimu: p => [
        K.plate(p),
        K.pool(p, 100, 102, 136, '#c8442a', { op: .5, seed: 3 }),
        `<g ${p.sh(1.1)}>`,
        K.onion(p, 64, 82, 30, 20, { c: '#eeb08a' }), K.onion(p, 138, 126, 28, 160, { c: '#eeb08a' }), K.onion(p, 134, 64, 26, -50, { c: '#eeb08a' }),
        ...[[64, 112, 44, 20], [104, 118, 46, -30], [146, 94, 40, 70], [112, 148, 40, 10], [82, 64, 38, -60], [56, 142, 34, -20], [122, 54, 34, 40], [100, 88, 40, 150]].map(([x, y, s, r], i) => chKimchi(p, x, y, s, r, { seed: i })),
        K.porkSlice(p, 84, 96, 54, -16, { c: '#b65a34', fat: '#f4cfae', seed: 1, gloss: .65 }),
        K.porkSlice(p, 124, 104, 52, 40, { c: '#b05634', fat: '#f4cfae', seed: 2, gloss: .65 }),
        K.porkSlice(p, 82, 136, 48, 20, { c: '#b65a34', fat: '#f4cfae', seed: 3, gloss: .65 }),
        K.porkSlice(p, 108, 66, 46, -10, { c: '#b05634', fat: '#f4cfae', seed: 4, gloss: .65 }),
        chKimchi(p, 110, 96, 30, 60, { seed: 11 }), chKimchi(p, 140, 140, 30, -30, { seed: 12 }),
        K.shreds(p, 100, 102, 112, { c: '#3f8c2c', n: 16, w: 2.6, len: .3, seed: 3, curve: .25 }),
        `</g>`,
        K.sesame(p, 100, 100, 96, { n: 14 }),
    ].join(''),

    // チャプチェ: 醤油色でつやのある春雨に牛肉・ピーマン・にんじん・しいたけ、ごま
    japchae: p => [
        K.plate(p),
        chNoodles(p, 100, 102, 140, { c: '#a88464', w: 2.2, n: 32, seed: 1, outline: '#7a5a3e' }),
        chNoodles(p, 100, 100, 80, { c: '#b29070', w: 2.1, n: 12, seed: 2, outline: '#7a5a3e' }),
        `<g ${p.sh(.9)}>`,
        chMeatStrips(p, 100, 100, 120, { n: 16, c: '#74401f', seed: 7 }),
        K.shreds(p, 100, 100, 120, { c: '#ec7a2c', n: 22, w: 2.4, len: .3, seed: 2, curve: .1 }),
        ...chScatter('jpc', 18, 100, 102, 56).map(([x, y, r]) => K.pepperPiece(p, x, y, 26, r, { strip: true })),
        K.shreds(p, 100, 100, 110, { c: '#6e4428', n: 12, w: 3.2, len: .24, seed: 3, curve: .4 }),
        `</g>`,
        `<path d="M58,90 Q66,74 80,68 M120,140 Q134,134 142,120" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
        K.sesame(p, 100, 100, 100, { n: 16 }),
    ].join(''),

    // エビチリ: 橙赤のとろみソースにぷりっとしたえび、刻みねぎ
    ebichili: p => {
        const ebi = [[72, 76, 36, 10], [106, 66, 36, 60], [138, 82, 36, 120], [58, 108, 34, -30], [96, 98, 38, 30], [132, 114, 36, 170], [76, 138, 36, 80], [112, 142, 36, -60], [150, 140, 30, 200], [46, 140, 28, 40]];
        return [
            K.plate(p),
            K.pool(p, 100, 104, 140, '#dc4f22', { op: .95, seed: 2, sy: .9 }),
            chOilDots(p, 100, 104, 120, { n: 12, c: '#f07a3a' }),
            `<g ${p.sh(1)}>`,
            ...ebi.map(([x, y, s, r]) => K.shrimp(p, x, y, s, r, { c: '#f06438' })),
            `</g>`,
            ...ebi.map(([x, y, s, r]) => `<g ${T(x, y, r, s / 20)}><path d="M-8,4 C-10,-4 -4,-10 3,-9 C9,-8 11,-2 9,3 C7,7 2,7 1,3 C0,-1 -3,0 -3,4 C-3,7 -6,8 -8,4Z" fill="#d8401c" opacity=".28"/><path d="M-5,-6 Q0,-10 6,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/></g>`),
            chNegiBits(p, 100, 104, 110, { n: 26 }),
        ].join('');
    },

    // 八宝菜: 透明なあんに、白菜・にんじん・しいたけ・うずら卵・豚肉・絹さや
    happosai: p => [
        K.plate(p, { well: .8 }),
        K.glaze(p, 100, 102, 146, '#d9b06a', { op: .45, seed: 1 }),
        `<g ${p.sh(1)}>`,
        K.leafPiece(p, 64, 78, 40, 20, { c: '#b9d77e', seed: 1, cooked: true }), K.leafPiece(p, 136, 78, 40, -40, { c: '#c6df8c', seed: 2, cooked: true }),
        K.leafPiece(p, 134, 136, 38, 60, { c: '#b9d77e', seed: 3, cooked: true }), K.leafPiece(p, 58, 132, 34, -30, { c: '#c6df8c', seed: 4, cooked: true }),
        K.napaStem(p, 94, 112, 42, -20), K.napaStem(p, 70, 104, 38, 70), K.napaStem(p, 110, 74, 38, 30), K.napaStem(p, 146, 108, 34, -70), K.napaStem(p, 100, 150, 34, 10), K.napaStem(p, 84, 56, 30, -10),
        K.porkSlice(p, 82, 92, 36, 30, { c: '#d4a27a', fat: '#f2e2c6', char: false, seed: 1, gloss: .5 }),
        K.porkSlice(p, 120, 124, 34, -40, { c: '#d4a27a', fat: '#f2e2c6', char: false, seed: 2, gloss: .5 }),
        K.porkSlice(p, 72, 146, 30, 10, { c: '#d4a27a', fat: '#f2e2c6', char: false, seed: 3, gloss: .5 }),
        ...[[56, 96, 0], [104, 94, 90], [126, 60, 40], [86, 132, -30], [146, 132, 60], [112, 138, 0], [150, 82, -60]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-10" y="-3.4" width="20" height="6.8" rx="1" fill="${p.g('#ef7f30', .28, .25)}" stroke="#b9561c" stroke-width=".6"/></g>`),
        K.shiitake(p, 86, 74, 24, 10), K.shiitake(p, 138, 102, 22, 0), K.shiitake(p, 66, 124, 20, 0),
        K.quailEgg(p, 102, 118, 20, 20), K.quailEgg(p, 122, 92, 19, -30), K.quailEgg(p, 78, 90, 18, 40), K.quailEgg(p, 98, 64, 18, 0),
        K.snowPea(p, 52, 108, 24, 70), K.snowPea(p, 128, 150, 22, -10), K.snowPea(p, 150, 120, 22, 40), K.snowPea(p, 116, 50, 20, 20),
        `</g>`,
        K.glaze(p, 100, 100, 126, '#f2deb0', { op: .2, seed: 2 }),
    ].join(''),

    // ゴーヤチャンプルー: ゴーヤの半月、焼き目の豆腐、豚バラ、炒り卵、かつお節
    champuru: p => [
        K.plate(p),
        `<g ${p.sh(1)}>`,
        K.tofu(p, 68, 80, 28, 22, 10, { c: '#efd6a4' }), K.tofu(p, 128, 122, 28, 22, -14, { c: '#efd6a4' }), K.tofu(p, 84, 136, 26, 20, 30, { c: '#efd6a4' }), K.tofu(p, 134, 72, 26, 20, -6, { c: '#efd6a4' }), K.tofu(p, 54, 112, 22, 18, 50, { c: '#efd6a4' }),
        K.porkSlice(p, 100, 96, 48, -20, { c: '#b9784a', fat: '#efd6aa', seed: 1 }),
        K.porkSlice(p, 76, 112, 40, 60, { c: '#b9784a', fat: '#efd6aa', seed: 2 }),
        K.porkSlice(p, 144, 100, 38, 100, { c: '#b9784a', fat: '#efd6aa', seed: 3 }),
        K.scrambled(p, 110, 120, 44, { c: '#f8db6a', seed: 1, n: 3 }), K.scrambled(p, 90, 68, 38, { c: '#f8db6a', seed: 2, n: 3 }),
        K.scrambled(p, 60, 140, 30, { c: '#f8db6a', seed: 3, n: 2 }), K.scrambled(p, 148, 138, 30, { c: '#f8db6a', seed: 4, n: 2 }), K.scrambled(p, 150, 70, 26, { c: '#f8db6a', seed: 5, n: 2 }),
        ...[[74, 98, 20], [118, 80, -40], [104, 140, 160], [96, 114, -120], [140, 122, 60], [58, 84, 200], [122, 102, 90], [86, 156, 10], [154, 92, -80], [110, 56, 30], [64, 126, -60], [132, 148, 130], [80, 60, 110], [46, 104, -20]].map(([x, y, r]) => chGoya(p, x, y, 28, r)),
        `</g>`,
        K.bonito(p, 100, 100, 76, { n: 22 }),
    ].join(''),

    // 冷しゃぶサラダ: レタス・トマト・きゅうりの上にゆでた豚しゃぶ、ごまだれ
    reishabu: p => [
        K.plate(p),
        `<g ${p.sh(.9)}>`,
        chLettuce(p, 70, 82, 74, 20, { seed: 1 }), chLettuce(p, 132, 80, 70, -30, { seed: 2 }), chLettuce(p, 100, 132, 80, 10, { seed: 3, c: '#b4da78' }),
        chCucumberShreds(p, 100, 100, 84, { n: 14 }), K.cucumberSlice(p, 70, 64, 16, 20), K.cucumberSlice(p, 132, 62, 16, -20), K.cucumberSlice(p, 152, 86, 15, 60), K.cucumberSlice(p, 50, 86, 15, -50),
        chTomatoHalfSlice(p, 48, 108, 34, -80), chTomatoHalfSlice(p, 152, 112, 34, 80), chTomatoHalfSlice(p, 96, 158, 32, 180), chTomatoHalfSlice(p, 134, 150, 30, 140), chTomatoHalfSlice(p, 62, 146, 30, -140),
        K.porkSlice(p, 86, 92, 60, -20, { c: '#eebfae', fat: '#fbf1e8', char: false, seed: 1, gloss: .3, bend: .02 }),
        K.porkSlice(p, 116, 106, 58, 30, { c: '#e8b6a4', fat: '#fbf1e8', char: false, seed: 2, gloss: .3, bend: -.02 }),
        K.porkSlice(p, 94, 122, 56, 165, { c: '#eebfae', fat: '#fbf1e8', char: false, seed: 3, gloss: .3 }),
        K.porkSlice(p, 114, 78, 50, 110, { c: '#e8b6a4', fat: '#fbf1e8', char: false, seed: 4, gloss: .3 }),
        `</g>`,
        `<path d="M70,104 Q84,90 100,100 T132,98" stroke="#a87a48" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>`,
        `<path d="M70,104 Q84,90 100,100 T132,98" stroke="#ecd3a2" stroke-width="4.6" fill="none" stroke-linecap="round"/>`,
        `<path d="M74,99 Q84,92 94,96" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.sesame(p, 100, 106, 64, { n: 14 }),
    ].join(''),

    // 酢豚: 赤茶の甘酢あんをからめた豚肉、玉ねぎ、ピーマン、にんじん
    subuta: p => [
        K.plate(p),
        K.pool(p, 100, 104, 140, '#b8441e', { op: .75, seed: 4, sy: .88 }),
        `<g ${p.sh(1.1)}>`,
        K.onion(p, 70, 124, 30, 30, { c: '#f0c49a' }), K.onion(p, 134, 72, 28, -60, { c: '#f0c49a' }), K.onion(p, 114, 146, 26, 160, { c: '#f0c49a' }),
        ...[[76, 82, 38, 10], [116, 98, 40, 70], [86, 126, 36, -20], [142, 122, 36, 40], [106, 60, 34, 120], [54, 104, 32, -60], [124, 142, 30, 0], [148, 92, 28, 30]].map(([x, y, s, r], i) => chGlazedChunk(p, x, y, s, r, { seed: i })),
        K.carrotChunk(p, 100, 116, 22, 30), K.carrotChunk(p, 144, 102, 20, -50), K.carrotChunk(p, 66, 62, 20, 100), K.carrotChunk(p, 92, 152, 20, 10), K.carrotChunk(p, 58, 140, 18, 60),
        K.pepperPiece(p, 98, 86, 24, 20), K.pepperPiece(p, 56, 128, 24, -40), K.pepperPiece(p, 152, 142, 22, 60), K.pepperPiece(p, 136, 54, 22, -10), K.pepperPiece(p, 74, 104, 20, 80),
        `</g>`,
        K.glaze(p, 100, 102, 120, '#d0562a', { op: .16, seed: 3 }),
    ].join(''),

    // 麻婆なす: 赤茶のとろみソースに、皮つきのなすの乱切りとひき肉、ねぎ
    mabonasu: p => {
        const nasu = [[70, 76, 40, 20], [108, 68, 38, -30], [140, 90, 36, 60], [58, 112, 36, -60], [98, 102, 40, 10], [134, 124, 38, -20], [82, 138, 38, 50], [116, 152, 32, 100], [52, 142, 30, 30], [150, 152, 26, 140]];
        return [
            K.plate(p, { well: .78 }),
            K.pool(p, 100, 106, 144, '#a6381a', { op: .95, seed: 5, sy: .9 }),
            chOilDots(p, 100, 104, 126, { n: 14 }),
            `<g ${p.sh(1)}>`,
            ...nasu.map(([x, y, s, r], i) => chNasu(p, x, y, s, r, { flesh: '#d29458', seed: i })),
            `</g>`,
            ...nasu.filter((_, i) => i % 2).map(([x, y], i) => `<path ${T(x + 3, y + 3, i * 70)} d="M-6,-2 Q-1,-5 5,-3 Q7,1 2,3 Q-4,3 -6,-2Z" fill="#b0401c" opacity=".75"/>`),
            chMince(p, 100, 104, 140, { n: 32, seed: 1 }),
            chGreenOnion(p, 100, 100, 100, { n: 16 }),
            chNegiBits(p, 100, 104, 100, { n: 10, seed: 2 }),
        ].join('');
    },

    // 白身魚の甘酢あんかけ: からりと揚げたたらに、野菜の細切り入りの甘酢あん
    amazu_sakana: p => [
        K.plate(p),
        `<g ${p.sh(1.2)}>`,
        chFriedFish(p, 76, 84, 84, 50, -30, { c: '#e0a24c', seed: 1 }),
        chFriedFish(p, 126, 122, 82, 50, 12, { c: '#d99a46', seed: 2 }),
        `</g>`,
        K.glaze(p, 102, 104, 84, '#e07a2a', { op: .5, seed: 1 }),
        `<g ${p.sh(.5)}>`,
        K.shreds(p, 102, 104, 86, { c: '#f2dca6', n: 14, w: 2.6, len: .5, seed: 1, curve: .35 }),
        K.shreds(p, 102, 106, 80, { c: '#ec7a2c', n: 11, w: 2.2, len: .46, seed: 2, curve: .2 }),
        K.shreds(p, 102, 104, 80, { c: '#3d8f2c', n: 10, w: 2.6, len: .46, seed: 3, curve: .2 }),
        `</g>`,
        K.glaze(p, 102, 106, 92, '#f3a24a', { op: .2, seed: 2 }),
        `<path d="M60,76 Q74,64 92,66 M126,98 Q140,94 152,104" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`,
    ].join(''),

    // 油淋鶏: 切り分けた揚げ鶏をキャベツの千切りにのせ、刻みねぎの甘酢醤油だれ
    yurinchi: p => [
        K.plate(p),
        chLettuce(p, 64, 102, 80, -20, { seed: 4 }), chLettuce(p, 136, 104, 80, 160, { seed: 5 }),
        `<g ${p.sh(1.3)}>`,
        ...[0, 1, 2, 3, 4, 5].map(i => chCrispSlice(p, 46 + i * 21.5, 100 + Math.sin(i * 1.3) * 5, 19, 64 - Math.abs(i - 2.5) * 6, -10 + i * 4, { seed: i, c: i % 2 ? '#c27a2c' : '#d38e3a' })),
        `</g>`,
        K.pool(p, 100, 100, 100, '#7a3c14', { op: .38, seed: 6, sy: .5 }),
        chNegiBits(p, 100, 98, 100, { n: 56, sy: .5 }),
        chGreenOnion(p, 100, 100, 76, { n: 9, seed: 2 }),
        K.chiliThreads(p, 104, 96, 44),
    ].join(''),

    // 肉団子の甘酢あん: つやのある肉団子に、赤茶の甘酢あん
    nikudango: p => [
        K.bowl(p, { glaze: '#e7e2d6', inside: '#f8f5ee', lip: .9 }),
        K.liquid(p, { R: 72, c: '#b04a20', op: .85, shine: false }),
        `<g ${p.sh(1.1)}>`,
        ...[[72, 74], [106, 66], [138, 88], [60, 108], [96, 100], [130, 122], [76, 138], [110, 142], [150, 116], [50, 80]].map(([x, y], i) => K.meatball(p, x, y, 34 - (i > 7 ? 7 : 0), { c: '#8c3a1a' })),
        `</g>`,
        K.glaze(p, 100, 104, 132, '#c0502a', { op: .25, seed: 1 }),
        ...[[72, 74], [106, 66], [138, 88], [60, 108], [96, 100], [130, 122], [76, 138], [110, 142]].map(([x, y]) => `<path d="M${x - 10},${y - 3} Q${x - 7},${y - 11} ${x + 2},${y - 12}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>`),
        K.sesame(p, 100, 100, 84, { n: 16 }),
        chGreenOnion(p, 100, 100, 64, { n: 7 }),
    ].join(''),

    // なすと豚肉の味噌炒め: 味噌で照ったなすの乱切り、豚バラ、ピーマン
    nasumiso: p => [
        K.plate(p),
        K.pool(p, 100, 104, 132, '#8a5424', { op: .55, seed: 7 }),
        `<g ${p.sh(1.1)}>`,
        K.porkSlice(p, 92, 92, 52, -10, { c: '#a9672e', fat: '#e8c48e', seed: 1, gloss: .6 }),
        K.porkSlice(p, 118, 120, 50, 50, { c: '#a9672e', fat: '#e8c48e', seed: 2, gloss: .6 }),
        K.porkSlice(p, 70, 126, 44, -60, { c: '#a9672e', fat: '#e8c48e', seed: 3, gloss: .6 }),
        ...[[66, 80, 38, 30], [108, 64, 36, -20], [142, 88, 36, 60], [96, 112, 38, 100], [134, 142, 34, 20], [88, 150, 34, -40], [52, 106, 32, 70], [124, 100, 32, -60], [62, 140, 28, 10]].map(([x, y, s, r], i) => chNasu(p, x, y, s, r, { flesh: '#b97a3c', seed: i })),
        K.pepperPiece(p, 84, 70, 22, 10), K.pepperPiece(p, 152, 116, 22, -40), K.pepperPiece(p, 106, 138, 20, 60), K.pepperPiece(p, 72, 106, 20, -20), K.pepperPiece(p, 130, 66, 20, 30),
        `</g>`,
        K.glaze(p, 100, 104, 120, '#9a5a20', { op: .16, seed: 4 }),
    ].join(''),

    // プルコギ: 甘辛く炒めた牛肉に玉ねぎ・にんじん・ピーマン・ニラ、ごま
    bulgogi: p => [
        K.plate(p),
        K.pool(p, 100, 104, 136, '#84391a', { op: .6, seed: 8 }),
        `<g ${p.sh(1)}>`,
        K.onion(p, 64, 80, 28, 30, { c: '#d7a160' }), K.onion(p, 136, 124, 28, -150, { c: '#d7a160' }), K.onion(p, 118, 64, 24, 80, { c: '#d7a160' }),
        ...[[84, 94, 42, 10], [122, 94, 40, -30], [98, 126, 42, 50], [66, 120, 36, -20], [140, 74, 32, 60], [90, 62, 32, 120], [130, 144, 30, -60], [52, 96, 28, 30], [110, 108, 34, 160], [148, 108, 28, 90]].map(([x, y, s, r], i) => K.beefSlice(p, x, y, s * 1.15, r, { c: '#6e3a1e', seed: i })),
        K.shreds(p, 100, 100, 116, { c: '#ec7a2c', n: 18, w: 2.6, len: .32, seed: 4, curve: .1 }),
        ...chScatter('blg', 10, 100, 102, 54).map(([x, y, r]) => K.pepperPiece(p, x, y, 28, r, { strip: true })),
        chNira(p, 100, 100, 110, { n: 10, seed: 3 }),
        `</g>`,
        K.sesame(p, 100, 100, 100, { n: 28 }),
    ].join(''),

    // タッカルビ: 鉄板に、コチュジャンで赤い鶏肉・キャベツ・さつまいも・玉ねぎ、まん中にとろけたチーズ
    dakgalbi: p => [
        chIronPan(p),
        K.liquid(p, { R: 78, c: '#b0301a', op: .92, shine: false }),
        `<g ${p.sh(1)}>`,
        ...[[46, 96, 38, 20], [66, 56, 36, -30], [134, 52, 36, 40], [156, 98, 36, -60], [140, 148, 36, 30], [62, 146, 36, -20], [100, 160, 30, 0]].map(([x, y, s, r], i) => chCabbage(p, x, y, s, r, { c: '#c9d870', tint: '#d0602a', seed: i })),
        ...[[60, 118, 32, 30], [98, 50, 32, -20], [148, 122, 32, 60], [102, 150, 28, 10], [150, 72, 28, -50], [50, 74, 26, 110], [124, 158, 24, 80]].map(([x, y, s, r], i) => chSpicyChicken(p, x, y, s * 1.1, r, { seed: i })),
        K.sweetPotato(p, 80, 72, 24, 20), K.sweetPotato(p, 124, 70, 24, -40), K.sweetPotato(p, 80, 142, 24, 60), K.sweetPotato(p, 132, 134, 22, -10), K.sweetPotato(p, 44, 118, 20, 90),
        K.onion(p, 66, 98, 22, 40, { c: '#eaa07a' }), K.onion(p, 138, 102, 22, -120, { c: '#eaa07a' }),
        `</g>`,
        `<g ${p.sh(.8)}>`,
        `<path d="${smooth(ring(1, 14, .3, rng('dkcheese'), 36, 30).map(([a, b]) => [a + 101, b + 103]))}" fill="${p.rg('#f8e08a', .35, .15)}"/>`,
        `</g>`,
        K.cheese(p, 101, 103, 60, { seed: 2, browned: .35 }),
        `<path d="M70,108 Q62,116 56,114 M130,100 Q140,96 146,98" stroke="#f7d872" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<path d="M78,94 Q88,80 108,80" stroke="#fffbe4" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`,
        chGreenOnion(p, 100, 100, 140, { n: 10 }),
        K.sesame(p, 100, 100, 130, { n: 14 }),
    ].join(''),

    // 棒棒鶏: きゅうりの細切りとトマトの上に、裂いた鶏むね肉、ごまだれ
    banbanji: p => [
        K.plate(p),
        `<g ${p.sh(.9)}>`,
        ...[-90, -45, 0, 45, 90, 135, 180, 225].map(a => { const rad = a * Math.PI / 180; return chTomatoHalfSlice(p, 100 + Math.cos(rad) * 56, 102 + Math.sin(rad) * 56, 32, a - 90); }),
        chCucumberShreds(p, 100, 102, 104, { n: 22 }),
        chChickenShreds(p, 100, 100, 92, { n: 30 }),
        `</g>`,
        `<path d="M72,92 Q88,82 100,94 Q112,106 128,96 M78,112 Q94,104 108,114 Q118,120 128,112" stroke="#9a6a38" stroke-width="6.8" fill="none" stroke-linecap="round" opacity=".45"/>`,
        `<path d="M72,92 Q88,82 100,94 Q112,106 128,96 M78,112 Q94,104 108,114 Q118,120 128,112" stroke="#d9b07a" stroke-width="5.4" fill="none" stroke-linecap="round"/>`,
        `<path d="M76,90 Q88,85 96,90" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>`,
        chGreenOnion(p, 100, 100, 56, { n: 8 }),
        K.sesame(p, 100, 100, 60, { n: 12 }),
    ].join(''),
};

// 小数を1桁に丸めてファイルを軽くする（200×200 の画面では見た目は変わらない）
const chSlim = str => str.replace(/(\d+\.\d)\d+/g, '$1').replace(/(\d)\.0(?!\d)/g, '$1');
export default Object.fromEntries(Object.entries(DISHES).map(([id, fn]) => [id, p => chSlim(fn(p))]));
