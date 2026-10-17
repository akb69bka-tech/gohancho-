// ご飯もの・麺類（と、白ご飯）
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// この料理群用の部品（er = e_rice の頭文字）
// =========================================================

// 1桁小数のなめらかな線（軽いSVGにするため）
function erSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const erSmooth = (pts, closed = true) => erSm(pts, closed);
// まとめて描いた粒や麺のまわりに、細い輪郭をつけるフィルター
function erOutline(p, c, r = .55){
    const id = p.def('erOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}

// ご飯の山: 米粒（丸い端の短い線）を2層に重ね、右下に落ちる小さな影で1粒ずつ立たせる。
// 同じ粒の形を <use> で影と本体に使い回して軽くする。ring0 を指定すると縁の帯（どんぶりで具から見える部分）だけ粒を描く
function erRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, ring0 = 0, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'erRice' + seed + x + y);
    const shape = erSmooth(ring(s / 2, 14, .07, R, 1, sy));
    const hi = lt(tint, hiK), mid = dk(tint, .02), sd = dk(tint, .3);
    const r0 = ring0 / (s / 2);
    const n = Math.round(s * s / 40 * density * (1 - r0 * r0));
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(r0 * r0 + R() * (1 - r0 * r0)) * s / 2 * .96;
        const gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.42 + R() * .14), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const lit = (gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2;
        const l = L[i % layers];
        if (lit){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('erRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs>${shadow ? `<g ${p.sh(.8 * shadow)}>${base}</g>` : base}${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}

// 小さな粒の集まり（そぼろ・炒り卵・具の刻み）。同じ色の粒は1本のpathにまとめる
function erGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'erGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        let gx, gy;
        if (w){ gx = x + (R() - .5) * w; gy = y + (R() - .5) * h; }
        else { const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; gx = x + Math.cos(a) * d; gy = y + Math.sin(a) * d * sy; }
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}

// うねった麺（うどん・焼きそば・中華麺）: 範囲の楕円の中で、ゆるく曲がる麺を数層に重ねる
function erWavy(p, x, y, s, { c = '#f3ead2', w = 5, n = 14, seed = 1, sy = .9, len = .55, wav = .5, outline = null, sheen = true, layers = 4 } = {}){
    const R = rng(p.id + 'erWv' + seed + x);
    const ol = erOutline(p, outline || dk(c, .25), .6), rad = s / 2;
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rad * .8;
        let px = Math.cos(a) * d, py = Math.sin(a) * d, dir = R() * 6.28;
        const step = s * len / 5, pts = [];
        for (let j = 0; j < 6; j++){
            const k = Math.hypot(px, py) / (rad - w);
            if (k > 1){ px /= k; py /= k; dir += Math.PI * .6; }
            pts.push([x + px, y + py * sy]);
            dir += (R() - .5) * wav * 2;
            px += Math.cos(dir) * step; py += Math.sin(dir) * step;
        }
        const dd = erSm(pts);
        const l = L[i % layers];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        if (sheen && R() < .5) l[2] += erSm(pts.slice(1, 4).map(([a, b]) => [a - w * .18, b - w * .2]));
    }
    return `<g ${p.sh(.8)}>${L.map(([a, b, h]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .14)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>${h ? `<path d="${h}" stroke="#fff" stroke-width="${f1(w * .24)}" fill="none" stroke-linecap="round" opacity=".5"/>` : ''}`).join('')}</g>`;
}

// パスタ（フォークで巻いたような渦の山）。細い麺を層に分けて重ね、明るい側の麺は色を明るく
function erPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'erPs' + seed);
    const ol = erOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const lit = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2) < -.4;
        const dark = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2) > .8;
        L[i % layers][lit ? 1 : dark ? 2 : 0] += erSm(pts);
    }
    const base = `<path ${T(x, y)} d="${erSmooth(ring(s / 2 * .9, 12, .12, R, 1, sy))}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g><path d="M${f(x - s * .3)},${f(y - s * .18)} Q${f(x - s * .12)},${f(y - s * .36)} ${f(x + s * .12)},${f(y - s * .34)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}

// 薄切り牛肉（牛丼・肉うどん・ハヤシ）: ひだの寄った薄い1枚、白い脂の筋と照り
function erBeef(p, x, y, s, r = 0, { c = '#7d4a2c', seed = 1, fat = .7 } = {}){
    const R = rng(p.id + 'erBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, (_, i) => { const fx = -8 + i * 8 + (R() - .5) * 4; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    const fats = Array.from({ length: 2 }, () => { const fx = -10 + R() * 14, fy = -4 + R() * 7; return `M${f1(fx)},${f1(fy)} q${f1(3 + R() * 3)},${f1((R() - .5) * 4)} ${f1(7 + R() * 5)},${f1((R() - .5) * 3)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${erSmooth(ring(14, 16, .36, R, 1.1, .6), true, .9)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="${fats}" stroke="#e6c4a0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${fat}"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 煮た鶏もも肉のひと口大（親子丼）: 淡い身に、片側だけ皮の色、繊維の筋
function erChicken(p, x, y, s, r = 0, { c = '#e2b77c', skin = '#c27f3c', seed = 1 } = {}){
    const R = rng(p.id + 'erCk' + seed + x + y);
    const pts = ring(10, 10, .38, R, 1.2, .82);
    return `<g ${T(x, y, r, s / 22)}><path d="${erSmooth(pts, true, .8)}" fill="${p.g(c, .35, .28)}" stroke="${dk(c, .3)}" stroke-width=".7"/>
        <path d="M4,-6 Q11,-3 10,4 Q6,7 3,4 Q6,0 4,-6Z" fill="${skin}" opacity=".55"/>
        <path d="M-8,1 q5,-2 10,0 M-6,4.5 q4,-1.5 8,0 M-7,-2.5 q4,-1.5 7,-.5" stroke="${dk(c, .25)}" stroke-width=".6" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M-7,-5 Q-2,-7.5 4,-6.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// キャベツ（炒めたざく切り）: 細長く不ぞろいな破片。白っぽい芯側から先の黄緑へ、太い葉脈
function erCabbage(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'erCb' + seed + x + y);
    const pts = ring(12, 9, .42, R, 1.3, .8);
    const gid = p.def('erCabG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#f6efd0"/><stop offset=".6" stop-color="#e9e8b8"/><stop offset="1" stop-color="#c9d68e"/></linearGradient>`);
    return `<g ${T(x, y, r, s / 26)}><path d="${erSmooth(pts, true, .7)}" fill="url(#${gid})" stroke="#b3b77a" stroke-width=".6"/>
        <path d="M-16,1 Q-4,-1.5 14,0" stroke="#fbfbee" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".95"/>
        <path d="M-6,0 L-9,-4 M2,-.5 L0,-5 M8,0 L11,3" stroke="#fbfbee" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}
// しめじ（1本ずつ）: クリーム色の軸と茶色のかさ
function erShimeji(p, x, y, s, r = 0, { cap = '#8b6542' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-1,9 Q-2.2,2 0,-4" stroke="#cdbb98" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M-1,9 Q-2.2,2 0,-4" stroke="#f1e8d4" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M-6,-3.5 Q-6,-10 0,-10.5 Q6,-10 6,-3.5 Q0,-1.5 -6,-3.5Z" fill="${p.rg(cap, .3, .3, .35, .3)}" stroke="${dk(cap, .3)}" stroke-width=".6"/></g>
        <ellipse cx="-2" cy="-8" rx="2" ry="1" fill="#fff" opacity=".5"/></g>`;
}
// 鮭の身（加熱してほぐれかけた角切り）
function erSalmonBit(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'erSb' + seed + x + y);
    const c = '#f2a07a';
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="${erSmooth(ring(10, 6, .22, R, 1.1, .9), true, .5)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-7,-5 Q-4,0 -6,6 M-1,-8 Q2,-1 0,8 M5,-7 Q8,0 6,6" stroke="#fbd9c6" stroke-width="1.3" fill="none" opacity=".85"/>
        <path d="M-6,-6 Q0,-9 5,-7" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ツナ（ほぐれた身のかたまり）
function erTuna(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'erTn' + seed + x + y);
    let out = '';
    for (let i = 0; i < 4; i++){
        const c = R() < .5 ? '#d8b58c' : '#c99e72';
        out += `<path ${T(x + (R() - .5) * s * .5, y + (R() - .5) * s * .4, R() * 180)} d="${erSmooth(ring(s * (.2 + R() * .12), 7, .45, R, 1.3, .8), true, .7)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`;
    }
    out += `<path d="M${f(x - s * .3)},${f(y - s * .05)} l${f(s * .25)},${f(-s * .08)} M${f(x - s * .05)},${f(y + s * .12)} l${f(s * .3)},${f(-s * .06)}" stroke="#a87c52" stroke-width=".7" opacity=".7"/>`;
    return `<g ${p.sh(.6)}><g ${p.rough(1.4, .3)}>${out}</g></g>`;
}

// 皿の上のソース（形を点で指定）
function erSauce(p, pts, c, { op = 1, l = .2, d = .28 } = {}){
    return `<path d="${erSmooth(pts)}" fill="${p.rg(c, l, d, .42, .4)}" opacity="${op}"/>`;
}

// オムレツ（ラグビーボール形の薄焼き卵でくるんだもの）
function erOmelette(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'erOm');
    const pts = [[-w / 2, 1], [-w * .42, -h * .26], [-w * .24, -h * .45], [0, -h * .5], [w * .24, -h * .46], [w * .42, -h * .27], [w / 2, -1], [w * .42, h * .28], [w * .24, h * .46], [0, h * .5], [-w * .25, h * .45], [-w * .42, h * .27]];
    const c = '#f7c63a';
    let brown = '';
    for (let i = 0; i < 8; i++) brown += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .4) * h * .6)}" rx="${f(4 + R() * 8)}" ry="${f(2 + R() * 3)}" fill="#e3992a" opacity="${f(.1 + R() * .14)}"/>`;
    const body = erSmooth(pts);
    return `<g ${T(x, y, r)}><g ${p.sh(1.4)}><path d="${body}" fill="${p.rg(c, .42, .28, .38, .3)}" stroke="${dk(c, .3)}" stroke-width=".9"/></g>
        ${brown}
        <path d="${body}" fill="none" stroke="#e8a32a" stroke-width="3" opacity=".3"/>
        <path d="M${f(-w * .44)},${f(-h * .12)} Q${f(-w * .37)},${f(h * .06)} ${f(-w * .43)},${f(h * .22)} M${f(w * .43)},${f(-h * .2)} Q${f(w * .37)},0 ${f(w * .44)},${f(h * .16)}" stroke="${dk(c, .25)}" stroke-width="1" fill="none" opacity=".5" stroke-linecap="round"/>
        <path d="M${f(-w * .33)},${f(-h * .25)} Q${f(-w * .05)},${f(-h * .46)} ${f(w * .28)},${f(-h * .32)}" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".65"/>
        <path d="M${f(-w * .2)},${f(-h * .14)} Q${f(-w * .08)},${f(-h * .22)} ${f(w * .04)},${f(-h * .2)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// ケチャップ・ソースの線（なめらかなジグザグ）
function erZig(p, x, y, w, h, n, r = 0, { c = '#c8231b', width = 5 } = {}){
    const pts = Array.from({ length: n + 1 }, (_, i) => [-w / 2 + i * w / n, i % 2 ? h / 2 : -h / 2]);
    const d = erSmooth(pts, false, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${width + 1.2}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${width}" fill="none" stroke-linecap="round"/></g>
        <path d="${d}" stroke="#ff8a7a" stroke-width="${f(width * .25)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.8 -1)"/></g>`;
}

// カリッと焼いた目玉焼き（縁が茶色いレース状）
function erEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'erEgg' + x);
    const pts = ring(19, 14, .26, R);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><path d="${erSmooth(pts.map(([a, b]) => [a * 1.06, b * 1.06]))}" fill="#c9843a" ${p.rough(2.5, .25)}/></g>
        <path d="${erSmooth(pts)}" fill="${p.rg('#fffdf8', .1, .08)}" stroke="#e7c79a" stroke-width="1.2"/>
        <path d="${erSmooth(pts.map(([a, b]) => [a * .55 + 1.5, b * .55 + 1.2]))}" fill="#f4efe4" opacity=".7"/>
        <circle cx="2" cy="1" r="8.2" fill="${p.rg('#f39a17', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/>
        <ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/>
        <path d="M-14,-6 Q-9,-13 -1,-14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}

// 葉（バジル・青じそ以外の小さな葉）
function erLeaf(p, x, y, s, r = 0, { c = '#2f7a2a' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-4,-7.5 6,-4.5 Q10,-2 10,0 Q10,2 6,4.5 Q-4,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-3,0 L1,-4 M2,0 L5,-3 M-3,0 L1,4 M2,0 L5,3" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// 斜め切りのウインナー
function erSausageCut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f(s / 2)}" ry="${f(s * .3)}" fill="#a9452a"/></g>
        <ellipse rx="${f(s / 2 - 1.4)}" ry="${f(s * .3 - 1.4)}" fill="${p.g('#e2a07e', .25, .2)}"/>
        <ellipse cx="${f(-s * .1)}" cy="${f(-s * .08)}" rx="${f(s * .18)}" ry="${f(s * .07)}" fill="#fff" opacity=".5"/></g>`;
}
// ピーマンの輪切り
function erPepRing(p, x, y, s, r = 0, { c = '#3f8f2f' } = {}){
    return `<g ${T(x, y, r)}><path d="${erSmooth(ring(s / 2, 8, .15, rng(p.id + 'pr' + x + y), 1, .8))}" fill="none" stroke="${dk(c, .25)}" stroke-width="${f(s * .16 + 1)}"/><path d="${erSmooth(ring(s / 2, 8, .15, rng(p.id + 'pr' + x + y), 1, .8))}" fill="none" stroke="${c}" stroke-width="${f(s * .16)}"/>
        <path d="M${f(-s * .38)},${f(-s * .18)} Q${f(-s * .2)},${f(-s * .4)} ${f(s * .05)},${f(-s * .4)}" stroke="#bfe39a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 細い帯の束（冷やし中華の錦糸卵・ハム・きゅうり）
function erStrips(p, x, y, L, n, w, r, { c = '#f6d148', edge = null, seed = 1 } = {}){
    const R = rng(p.id + 'erSt' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const oy = (i - (n - 1) / 2) * w * 1.05, len = L * (.8 + R() * .25), ox = (R() - .5) * 4, ang = (R() - .5) * 5;
        out += `<g ${T(ox, oy, ang)}><rect x="${f(-len / 2)}" y="${f(-w / 2)}" width="${f(len)}" height="${f(w)}" rx="${f(w * .4)}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".45"/>${edge ? `<rect x="${f(-len / 2 + .5)}" y="${f(-w / 2)}" width="${f(len - 1)}" height="${f(w * .32)}" rx="${f(w * .16)}" fill="${edge}"/>` : ''}</g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}>${out}</g><path d="M${f(-L * .35)},${f(-n * w * .45)} L${f(L * .3)},${f(-n * w * .45)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></g>`;
}
// 削り節（ゆらゆらした薄い花がつお）。同じ色の薄片は1本のpathにまとめる
function erBonito(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'erBn' + seed + x);
    const cols = ['#e8c4a6', '#d9a888', '#f2dcc6', '#c99474'], ds = cols.map(() => '');
    const shape = [[-7, -1], [-3, -4], [1, -2.2], [5, -4.8], [8, -1], [4, .8], [6.5, 3.5], [0, 2], [-5, 3.2]];
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .8, a = R() * 6.28, k = .9 + R() * .6, ca = Math.cos(a) * k, sa = Math.sin(a) * k;
        ds[Math.floor(R() * 4)] += erSm(shape.map(([u, v]) => [cx + u * ca - v * sa, cy + u * sa + v * ca]), true);
    }
    return `<g ${p.sh(.4)}>${cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".5" opacity=".88"/>`).join('')}</g>`;
}
// 細切り（千切り）を色ごとに1本のpathにまとめたもの（レタス・にんじん・紅しょうが・大葉など）
function erShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'erSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? erOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// もやし（白い軸と黄色い頭）を1本のpathにまとめたもの
function erSprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'erSp' + seed + x);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const r2 = Math.sqrt(R()) * s / 2 * .85, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * .9, a = R() * Math.PI, L = 9 + R() * 8, bd = (R() - .5) * 5;
        const x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        st += `M${f1(cx - Math.cos(a) * L / 2)} ${f1(cy - Math.sin(a) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(x2)} ${f1(y2)}`;
        hd += `M${f1(x2)} ${f1(y2)}l${f1(Math.cos(a) * 1.2)} ${f1(Math.sin(a) * 1.2)}`;
    }
    return `<g ${p.sh(.5)}><g ${erOutline(p, '#cfc6a6', .45)} fill="none" stroke-linecap="round"><path d="${st}" stroke="#f8f5e8" stroke-width="2.2"/><path d="${hd}" stroke="#e6cf5e" stroke-width="2.8"/></g></g>`;
}
// さやいんげんの斜め切りを帯状に敷く（1本のpath）
function erBeans(p, pts, { c = '#4f9a34' } = {}){
    const d = pts.map(([x, y, a]) => `M${f1(x - Math.cos(a) * 4)} ${f1(y - Math.sin(a) * 4)}l${f1(Math.cos(a) * 8)} ${f1(Math.sin(a) * 8)}`).join('');
    return `<g ${erOutline(p, dk(c, .35), .5)} fill="none" stroke-linecap="round"><path d="${d}" stroke="${c}" stroke-width="3.8"/></g><path d="${pts.map(([x, y, a]) => `M${f1(x - Math.cos(a) * 3 - .6)} ${f1(y - Math.sin(a) * 3 - .8)}l${f1(Math.cos(a) * 5)} ${f1(Math.sin(a) * 5)}`).join('')}" stroke="#a6d47c" stroke-width="1" stroke-linecap="round" fill="none"/>`;
}
// 小さな角切り（ハム・トマト・サーモンなど）
function erCube(p, x, y, s, r = 0, { c = '#e5382a', hi = null } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .9)}" rx="${f(s * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>${hi ? `<rect x="${f(-s / 2 + 1)}" y="${f(-s / 2 + 1)}" width="${f(s * .5)}" height="${f(s * .4)}" rx="1" fill="${hi}"/>` : ''}<path d="M${f(-s * .3)},${f(-s * .28)} L${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/></g>`;
}
// 福神漬け
function erFukujin(p, x, y, s, { n = 9, seed = 1 } = {}){
    const R = rng(p.id + 'erFk' + seed);
    let out = '';
    for (let i = 0; i < n; i++){ const c = R() < .5 ? '#b5262a' : '#9c3a24'; out += `<path ${T(x + (R() - .5) * s, y + (R() - .5) * s * .7, R() * 360)} d="${erSmooth(ring(2.2 + R() * 1.6, 5, .5, R, 1.3, .8), true, .6)}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".4"/>`; }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// 照りのある液だれ（あん・カレーの面に散らす小さな光）
function erGlints(p, x, y, s, { n = 6, seed = 1, op = .55 } = {}){
    const R = rng(p.id + 'erGl' + seed + x);
    return Array.from({ length: n }, () => { const gx = x + (R() - .5) * s, gy = y + (R() - .5) * s * .8, L = 3 + R() * 5; return `<path d="M${f(gx)},${f(gy)} q${f(L / 2)},${f(-L * .3)} ${f(L)},0" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="${op}"/>`; }).join('');
}
// ほうれん草（ゆでたもの・ざく切りの茎と葉）
function erSpinach(p, x, y, s, { seed = 1, n = 9 } = {}){
    return K.greens(p, x, y, s, { c: '#2f6d22', stems: '#7fae4c', seed, n });
}

// =========================================================
export default {
    // 白ご飯: 藍の線の茶碗に、つやつやの白いご飯をふっくらと
    rice: p => [
        K.chawan(p),
        erRice(p, 100, 101, 148, { density: 1.35, grain: 4 }),
        `<path d="M50,82 Q58,58 84,48" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<path d="M62,92 Q66,78 78,70" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // カレーライス: 楕円の皿に、左にご飯、右に濃い黄金茶のルウ。じゃがいも・にんじん・豚肉・玉ねぎ、福神漬け
    curry: p => [
        K.ovalDish(p),
        erRice(p, 66, 99, 80, { sy: 1.18 }),
        erSauce(p, [[90, 46], [128, 44], [160, 56], [176, 86], [172, 120], [154, 146], [122, 156], [92, 152], [82, 132], [88, 106], [84, 78]], '#a5611d', { d: .35 }),
        `<path d="M88,52 C80,70 86,96 82,124 C80,138 86,148 92,152" stroke="#8a4c14" stroke-width="2" fill="none" opacity=".45"/>`,
        `<g ${p.sh(.9)}>`,
        erBeef(p, 116, 70, 28, -20, { c: '#8c5224', seed: 1, fat: .5 }),
        erBeef(p, 154, 118, 26, 60, { c: '#8c5224', seed: 2, fat: .5 }),
        K.potato(p, 140, 76, 30, 20, { c: '#e2ab4c', seed: 1 }),
        K.potato(p, 112, 128, 30, -40, { c: '#e2ab4c', seed: 2 }),
        K.potato(p, 152, 98, 24, 80, { c: '#dda246', seed: 3 }),
        K.carrotChunk(p, 124, 100, 20, 30, { c: '#e2702a' }), K.carrotChunk(p, 134, 140, 18, -50, { c: '#e2702a' }), K.carrotChunk(p, 104, 92, 16, 120, { c: '#e2702a' }),
        K.onion(p, 98, 68, 16, 30, { c: '#c99045', layers: 1 }), K.onion(p, 160, 132, 14, -60, { c: '#c99045', layers: 1 }),
        `</g>`,
        `<path d="M104,110 q8,-4 14,2 M138,116 q6,-5 12,0 M108,146 q8,3 16,-2 M150,62 q6,4 10,10 M128,86 q5,-3 9,1" stroke="#9c5818" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".85"/>`,
        erGlints(p, 130, 104, 66, { n: 9 }),
        erFukujin(p, 62, 60, 24, { n: 12 }),
    ].join(''),

    // 親子丼: どんぶりに、半熟の卵でとじた鶏肉と玉ねぎ、三つ葉
    oyakodon: p => {
        const R = rng(p.id + 'oy');
        const blob = (n, rMin, rMax, spread, fn) => { let o = ''; for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * spread; o += fn(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, rMin + R() * (rMax - rMin)); } return o; };
        return [
            K.donburi(p),
            erRice(p, 100, 100, 162, { ring0: 64, density: .8 }),
            `<path d="${erSmooth(ring(74, 16, .1, R).map(([a, b]) => [a + 100, b + 100]))}" fill="#d9a650" opacity=".55"/>`,
            `<g ${p.sh(1)}><path d="${erSmooth(ring(69, 16, .14, R, 1, .97).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#f5d36a', .3, .2)}" stroke="#ddb04a" stroke-width=".8"/></g>`,
            blob(7, 8, 14, 54, (x, y, r) => `<path ${T(x, y)} d="${erSmooth(ring(r, 10, .3, R, 1.3, .8))}" fill="#fcf1cf" opacity=".85"/>`),
            `<g ${p.sh(.8)}>`,
            ...[[74, 84, 20], [132, 118, 160], [122, 66, -40], [80, 132, 110], [142, 88, 70], [100, 112, 200]].map(([x, y, r]) => K.onion(p, x, y, 20, r, { c: '#e6c27e', layers: 1 })),
            ...[[96, 74, 28, 10], [134, 98, 27, 60], [68, 106, 27, -30], [114, 132, 26, 100], [108, 100, 24, 40], [84, 124, 22, 150], [148, 120, 20, -70]].map(([x, y, s, r], i) => erChicken(p, x, y, s, r, { seed: i + 1, c: '#d29a5c', skin: '#a8642c' })),
            `</g>`,
            `<g ${p.sh(.5)}>`, blob(10, 7, 12, 60, (x, y, r) => `<path ${T(x, y)} d="${erSmooth(ring(r, 10, .32, R, 1.3, .8))}" fill="${p.g(R() < .55 ? '#f9db6c' : '#fcefc8', .35, .12)}" stroke="#e3b84a" stroke-width=".5"/>`), `</g>`,
            blob(5, 7, 11, 50, (x, y, r) => `<path ${T(x, y)} d="${erSmooth(ring(r, 9, .3, R, 1.2, .85))}" fill="${p.rg('#f4b72e', .35, .1)}" opacity=".85"/><ellipse cx="${f(x - 2)}" cy="${f(y - 2.5)}" rx="3" ry="1.3" fill="#fff" opacity=".8"/>`),
            `<path d="M100,98 L82,106 M100,98 L116,110 M100,98 L104,80" stroke="#8cbf5c" stroke-width="1.6" stroke-linecap="round"/>`,
            K.mitsuba(p, 104, 80, 22, 10), K.mitsuba(p, 116, 110, 20, 130), K.mitsuba(p, 82, 106, 20, -110),
        ].join('');
    },

    // 牛丼: どんぶりのご飯に、甘辛く煮た薄切り牛肉と玉ねぎ、つゆ。紅しょうが
    gyudon: p => {
        const R = rng(p.id + 'gy');
        const spots = [[80, 78], [118, 70], [138, 100], [70, 110], [100, 100], [124, 128], [88, 132], [60, 86], [142, 70], [96, 66], [112, 112], [80, 100]];
        const beef = spots.map(([x, y], i) => erBeef(p, x, y, 46 + R() * 10, R() * 360, { c: ['#8d5a3a', '#9a6844', '#7e4c30'][i % 3], seed: i, fat: .45 }));
        return [
            K.donburi(p),
            erRice(p, 100, 100, 162, { ring0: 64, density: .8 }),
            `<path d="${erSmooth(ring(66, 14, .12, R).map(([a, b]) => [a + 100, b + 100]))}" fill="#a06a36" opacity=".32"/>`,
            `<g ${p.sh(1)}>`,
            K.onion(p, 72, 88, 26, 30, { c: '#c99252' }), K.onion(p, 124, 80, 26, -20, { c: '#c99252' }),
            beef.slice(0, 6).join(''),
            K.onion(p, 106, 120, 28, 160, { c: '#d6a668' }), K.onion(p, 80, 116, 24, 80, { c: '#c99252' }), K.onion(p, 136, 110, 22, 200, { c: '#c99252' }),
            beef.slice(6).join(''),
            K.onion(p, 96, 84, 22, -60, { c: '#d6a668' }), K.onion(p, 118, 102, 20, 40, { c: '#d6a668', layers: 1 }),
            `</g>`,
            erGlints(p, 100, 104, 90, { n: 10, op: .5 }),
            `<g ${p.sh(.8)}>`, erShreds(p, 134, 136, 21, { c: '#d9304b', n: 24, w: 1.7, len: .7, seed: 3 }), `</g>`,
        ].join('');
    },

    // オムライス: 楕円の皿に、黄色い卵でくるんだオムライス、ケチャップ、パセリ
    omurice: p => [
        K.ovalDish(p),
        erOmelette(p, 98, 100, 140, 84, -8),
        erZig(p, 98, 98, 88, 20, 6, -8, { width: 5.4 }),
        K.parsley(p, 160, 128, 16),
    ].join(''),

    // ガパオライス: 皿にご飯、鶏ひき肉とパプリカ・バジルの炒め、カリッとした目玉焼き
    gapao: p => [
        K.plate(p),
        erRice(p, 76, 98, 84, { sy: 1.05 }),
        `<g ${p.sh(.9)}><path d="${erSmooth([[104, 60], [138, 52], [162, 70], [166, 104], [156, 136], [126, 150], [104, 140], [98, 110], [100, 84]])}" fill="${p.rg('#8a5a32', .2, .25)}" ${p.rough(4, .08)}/></g>`,
        erGrains(p, 132, 102, 64, { cols: ['#a06a3c', '#7a4a26', '#b98050', '#6a3e20'], n: 130, size: 2.1, sy: 1.25 }),
        `<g ${p.sh(.7)}>`,
        K.pepperPiece(p, 118, 76, 14, 20, { c: '#d9342a' }), K.pepperPiece(p, 148, 92, 13, -30, { c: '#d9342a' }), K.pepperPiece(p, 128, 128, 14, 60, { c: '#e0a020' }),
        K.pepperPiece(p, 150, 122, 12, 10, { c: '#d9342a' }), K.pepperPiece(p, 112, 108, 12, -60, { c: '#e0a020' }),
        K.onion(p, 136, 70, 14, 20, { c: '#e2c28a', layers: 1 }), K.onion(p, 120, 140, 13, -30, { c: '#e2c28a', layers: 1 }),
        `</g>`,
        erLeaf(p, 140, 108, 22, -30), erLeaf(p, 124, 90, 20, 40, { c: '#367f2c' }), erLeaf(p, 150, 74, 18, 110), erLeaf(p, 136, 136, 18, 160, { c: '#367f2c' }),
        K.chiliThreads(p, 128, 112, 30),
        erEgg(p, 76, 90, 64, 10),
    ].join(''),

    // タコライス: 皿のご飯に、スパイスのきいたひき肉、千切りレタス、角切りトマト、チーズ
    tacorice: p => [
        K.plate(p),
        erRice(p, 100, 100, 138, { sy: .96, density: .6 }),
        `<g ${p.sh(.7)}>`,
        erShreds(p, 70, 80, 42, { c: '#b5dc72', n: 26, w: 3.2, len: .5, seed: 1, curve: .5 }),
        erShreds(p, 70, 80, 35, { c: '#e3f1bd', n: 12, w: 2.6, len: .45, seed: 3, curve: .5 }),
        erShreds(p, 134, 132, 35, { c: '#b5dc72', n: 22, w: 3.2, len: .5, seed: 2, curve: .5 }),
        erShreds(p, 134, 132, 29, { c: '#e3f1bd', n: 10, w: 2.6, len: .45, seed: 5, curve: .5 }),
        `</g>`,
        `<g ${p.sh(.7)}>`,
        erGrains(p, 104, 104, 70, { cols: ['#7a4224', '#6e3a1e'], n: 90, size: 3.4, sy: .85, seed: 7 }),
        erGrains(p, 104, 104, 82, { cols: ['#8f4f2a', '#6e3a1e', '#a8603a', '#7d4424'], n: 170, size: 2.3, sy: .82 }),
        `</g>`,
        erShreds(p, 104, 100, 35, { c: '#f6c844', n: 26, w: 2, len: .45, seed: 4, curve: .5 }),
        `<g ${p.sh(.6)}>`,
        erCube(p, 140, 84, 11, 15, { c: '#e33a2a' }), erCube(p, 150, 100, 10, -20, { c: '#e33a2a' }), erCube(p, 132, 70, 10, 40, { c: '#e33a2a' }),
        erCube(p, 64, 124, 11, 30, { c: '#e33a2a' }), erCube(p, 78, 140, 10, -10, { c: '#e33a2a' }), erCube(p, 58, 104, 10, 60, { c: '#e33a2a' }), erCube(p, 96, 146, 10, 20, { c: '#e33a2a' }),
        `</g>`,
    ].join(''),

    // チャーハン: 皿にお椀型に盛った黄金色の炒めご飯、卵・ねぎ・ハム
    chahan: p => [
        K.plate(p),
        erRice(p, 100, 100, 132, { tint: '#e3b45c', grain: 3.4, hiK: .45 }),
        `<g ${p.sh(.5)}>`,
        erGrains(p, 100, 100, 114, { cols: ['#f8d548', '#fbe48a', '#f0bb2a'], n: 30, size: 4.6 }),
        ...[[84, 80, 20], [118, 92, -30], [96, 118, 60], [130, 120, 10], [72, 108, 45], [108, 70, -15], [140, 96, 30], [86, 140, -40], [64, 88, 70], [118, 136, 20]].map(([x, y, r]) => erCube(p, x, y, 6.5, r, { c: '#ef9a9c' })),
        `</g>`,
        K.scallions(p, 100, 100, 110, { n: 22, c: '#4f9a34' }),
        erGrains(p, 100, 100, 108, { cols: ['#f3f6e0', '#d9ecb0'], n: 22, size: 2.2, seed: 5 }),
        `<circle cx="100" cy="100" r="64" fill="url(#${p.def('erDome', id => `<radialGradient id="${id}" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7a4a10" stop-opacity=".22"/></radialGradient>`)})"/>`,
        `<path d="M56,86 Q66,60 92,52" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // きのこの炊き込みご飯: 茶碗に醤油色のご飯、しめじ・まいたけ・油揚げ・にんじん、三つ葉
    takikomi: p => [
        K.chawan(p),
        erRice(p, 100, 101, 148, { tint: '#d3a464', grain: 3.5, density: .8, hiK: .4 }),
        erShreds(p, 100, 100, 93, { c: '#ec7a2e', n: 18, w: 2.4, len: .15, seed: 2 }),
        `<g ${p.sh(.5)}>`,
        ...[[72, 84, 30], [128, 122, -20], [112, 64, 70], [80, 132, -50], [142, 88, 10], [98, 112, 80], [58, 106, -10], [120, 144, 40], [90, 66, -60]].map(([x, y, r]) => K.aburaage(p, x, y, 18, 6.5, r)),
        `</g>`,
        ...[[84, 96, -20], [124, 102, 30], [102, 134, 160], [62, 122, 200], [140, 132, -60], [108, 82, 70], [70, 70, -50], [146, 110, 100], [96, 150, 20], [132, 62, 10], [56, 94, 120]].map(([x, y, r]) => erShimeji(p, x, y, 22, r, { cap: '#8b6542' })),
        K.maitake(p, 118, 76, 30, -40), K.maitake(p, 82, 116, 26, 160),
        K.mitsuba(p, 104, 94, 24, 20), K.mitsuba(p, 116, 102, 20, 120),
    ].join(''),

    // 鶏そぼろ丼: 茶色の鶏そぼろ・黄色の炒り卵・緑のいんげんの三色
    soborodon: p => {
        const clip = p.def('erSbClip', id => `<clipPath id="${id}"><circle cx="100" cy="100" r="74"/></clipPath>`);
        const BR = rng(p.id + 'beans'), bp = [[], []];
        for (let i = 0; i < 64; i++) bp[i % 2].push([(BR() - .5) * 16, -80 + i * 2.6, .7 + BR() * .7]);
        return [
            K.donburi(p),
            erRice(p, 100, 100, 162, { ring0: 66, density: .8 }),
            `<g clip-path="url(#${clip})"><g ${T(100, 100, -28)}>`,
            `<rect x="-80" y="-80" width="70" height="160" fill="${p.g('#f6cf3c', .3, .15)}"/>`,
            erGrains(p, -46, 0, 0, { cols: ['#fbe27a', '#f2bf2a', '#f8d54a'], n: 150, size: 3, w: 72, h: 160 }),
            `<rect x="-12" y="-80" width="24" height="160" fill="#3f7f2a"/>`,
            erBeans(p, bp[0], { c: '#4a9530' }), erBeans(p, bp[1], { c: '#5aa63c' }),
            `<rect x="11" y="-80" width="70" height="160" fill="${p.g('#8a5630', .25, .2)}"/>`,
            erGrains(p, 47, 0, 0, { cols: ['#9c6438', '#7a4524', '#a06c42', '#6a3a1c'], n: 170, size: 2.6, w: 74, h: 160, seed: 2 }),
            `</g></g>`,
            erShreds(p, 134, 126, 14, { c: '#d9304b', n: 12, w: 1.5, len: .7, seed: 9 }),
            erGlints(p, 124, 92, 44, { n: 5, op: .4 }),
        ].join('');
    },

    // 中華丼: どんぶりのご飯に、つやのある八宝菜のあん。白菜・にんじん・しいたけ・豚肉・絹さや・うずらの卵
    chukadon: p => {
        const carrot = (x, y, r) => `<g ${T(x, y, r)}><rect x="-11" y="-3.4" width="22" height="6.8" rx="1.4" fill="${p.g('#ef7f30', .3, .2)}" stroke="#c0601c" stroke-width=".5"/><path d="M-9,-2 L8,-2" stroke="#ffd0a8" stroke-width=".9" stroke-linecap="round"/></g>`;
        return [
            K.donburi(p),
            erRice(p, 100, 100, 162, { ring0: 66, density: .8 }),
            K.glaze(p, 100, 100, 154, '#b8802e', { op: .55, seed: 1 }),
            `<g ${p.sh(.9)}>`,
            K.leafPiece(p, 62, 80, 44, 20, { c: '#9fc466', cooked: true, seed: 1 }), K.leafPiece(p, 140, 126, 42, -30, { c: '#9fc466', cooked: true, seed: 2 }), K.leafPiece(p, 136, 66, 38, 70, { c: '#a9cc72', cooked: true, seed: 3 }), K.leafPiece(p, 64, 132, 36, -60, { c: '#a9cc72', cooked: true, seed: 4 }),
            K.napaStem(p, 100, 62, 44, 15), K.napaStem(p, 78, 108, 44, -35), K.napaStem(p, 148, 96, 38, 80), K.napaStem(p, 104, 146, 42, 10), K.napaStem(p, 122, 112, 36, -50),
            erBeef(p, 102, 92, 36, -20, { c: '#c4926a', seed: 1, fat: .8 }), erBeef(p, 92, 128, 30, 50, { c: '#c4926a', seed: 2, fat: .8 }), erBeef(p, 140, 104, 28, 70, { c: '#c4926a', seed: 3, fat: .8 }),
            carrot(58, 104, 70), carrot(124, 86, -20), carrot(78, 60, 10), carrot(126, 140, 40), carrot(152, 120, 80), carrot(108, 112, 120),
            K.shiitake(p, 82, 86, 22, 0, { cross: false }), K.shiitake(p, 150, 80, 18, 0, { cross: false }), K.shiitake(p, 116, 128, 20, 0, { cross: false }), K.shiitake(p, 68, 148, 16, 0, { cross: false }),
            K.snowPea(p, 64, 66, 22, 40), K.snowPea(p, 138, 146, 20, -60), K.snowPea(p, 118, 54, 18, 10), K.snowPea(p, 88, 108, 18, -80),
            `</g>`,
            K.glaze(p, 100, 100, 138, '#c88c3a', { op: .25, seed: 2 }),
            erGlints(p, 100, 100, 112, { n: 16, op: .75 }),
            K.quailEgg(p, 100, 108, 20, 20), K.quailEgg(p, 124, 70, 19, -30), K.quailEgg(p, 66, 92, 18, 60), K.quailEgg(p, 134, 122, 18, -10),
        ].join('');
    },

    // ビビンバ: 黒い鉢のご飯に、ほうれん草・もやし・にんじん・牛肉のナムルを放射状に、卵黄とコチュジャン
    bibimbap: p => {
        const beef = [[60, 118, 20], [80, 140, -40], [56, 140, 80], [86, 118, 120], [70, 130, 170], [66, 106, -70]].map(([x, y, r], i) => erBeef(p, x, y, 26, r, { c: '#6e3c20', seed: i, fat: .4 })).join('');
        const mound = (x, y, c, k) => `<path ${T(x, y)} d="${erSmooth(ring(29, 9, .2, rng(p.id + k)))}" fill="${c}" opacity=".9"/>`;
        return [
            K.bowl(p, { glaze: '#33302e', inside: '#efe7d6' }),
            erRice(p, 100, 100, 156, { ring0: 60 }),
            `<g ${p.sh(.9)}>`,
            mound(70, 70, '#2c5f1e', 'a'), erSpinach(p, 70, 70, 58, { n: 24 }),
            mound(130, 70, '#ebe6cf', 'b'), erSprouts(p, 130, 70, 56, { n: 34 }),
            mound(130, 130, '#e66b22', 'c'), erShreds(p, 130, 130, 43, { c: '#f07a2a', n: 50, w: 2, len: .6, seed: 4 }),
            mound(70, 130, '#5a2f18', 'd'), beef,
            `</g>`,
            K.sesame(p, 72, 126, 30, { n: 10 }),
            `<g ${p.sh(1)}><circle cx="100" cy="100" r="13" fill="${p.rg('#f49a12', .35, .18, .35, .32)}" stroke="#cf7a0c" stroke-width=".8"/></g>`,
            `<ellipse cx="95" cy="95" rx="4.5" ry="2.6" fill="#fff" opacity=".8" transform="rotate(-30 95 95)"/>`,
            `<g ${p.sh(.7)}><path ${T(150, 100)} d="${erSmooth(ring(8, 7, .3, rng('e')))}" fill="${p.rg('#b8241c', .25, .2)}"/></g><ellipse cx="148" cy="97" rx="2.6" ry="1.3" fill="#fff" opacity=".6"/>`,
            K.sesame(p, 104, 86, 40, { n: 10, seed: 2 }),
        ].join('');
    },

    // ハヤシライス: 楕円の皿に、ご飯と、赤みのある濃い茶色のハヤシソース（牛肉・玉ねぎ・しめじ）、生クリーム
    hayashi: p => [
        K.ovalDish(p, { rim: '#7a3424' }),
        erRice(p, 66, 99, 80, { sy: 1.18 }),
        erSauce(p, [[90, 46], [128, 44], [160, 56], [176, 86], [172, 120], [154, 146], [122, 156], [92, 152], [82, 132], [88, 106], [84, 78]], '#5e2414', { l: .2, d: .3 }),
        `<path d="M88,52 C80,70 86,96 82,124 C80,138 86,148 92,152" stroke="#47180c" stroke-width="2" fill="none" opacity=".5"/>`,
        `<g ${p.sh(.8)}>`,
        erBeef(p, 118, 70, 32, 20, { c: '#6e3220', seed: 1, fat: .35 }), erBeef(p, 150, 104, 30, -30, { c: '#6e3220', seed: 2, fat: .35 }), erBeef(p, 114, 130, 30, 70, { c: '#6e3220', seed: 3, fat: .35 }),
        K.onion(p, 142, 74, 20, 40, { c: '#a8663a' }), K.onion(p, 128, 108, 20, -20, { c: '#a8663a' }), K.onion(p, 142, 136, 18, 160, { c: '#a8663a' }), K.onion(p, 100, 102, 16, 90, { c: '#a8663a' }),
        ...[[104, 84, 30], [156, 124, 200], [112, 104, -40], [160, 80, 120]].map(([x, y, r]) => erShimeji(p, x, y, 22, r, { cap: '#7a5a3c' })),
        `</g>`,
        `<path d="M108,98 C118,90 132,94 140,92 C146,91 150,94 152,90" stroke="#fbf6ea" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<path d="M112,116 C120,112 128,118 136,114" stroke="#fbf6ea" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>`,
        erGlints(p, 132, 104, 66, { n: 8, op: .55 }),
        K.sprinkle(p, 64, 92, 30, { c: '#3f8f2c', n: 14, r: .9 }),
    ].join(''),

    // ドライカレー: 皿のご飯に、カレー色のひき肉と刻み野菜を山盛りに、パセリ
    drycurry: p => [
        K.plate(p, { rim: '#9a6b2a' }),
        erRice(p, 100, 104, 134, { sy: .92, density: .6 }),
        `<g ${p.sh(.8)}>`,
        `<path d="${erSmooth(ring(36, 12, .25, rng(p.id + 'dc'), 1.1, .9).map(([a, b]) => [a + 104, b + 94]))}" fill="#8a5020" ${p.rough(8, .06)}/>`,
        erGrains(p, 104, 94, 76, { cols: ['#9a5e26', '#86501e'], n: 90, size: 3.4, sy: .86, seed: 7 }),
        erGrains(p, 104, 94, 96, { cols: ['#a8682c', '#8a5020', '#bd7c3a', '#74401a'], n: 230, size: 2.1, sy: .86 }),
        `</g>`,
        erGrains(p, 104, 94, 80, { cols: ['#ef7f30', '#3f8f2f', '#6bb23e'], n: 40, size: 1.8, sy: .86, seed: 2 }),
        `<path d="M74,82 Q86,66 106,64" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`,
        K.parsley(p, 112, 88, 14),
    ].join(''),

    // ナポリタン: 楕円の皿に、ケチャップ色のスパゲッティ、斜め切りウインナー・ピーマン・玉ねぎ、粉チーズ
    napolitan: p => [
        K.ovalDish(p),
        erPasta(p, 100, 100, 142, { c: '#e9762f', w: 2.4, n: 50, sy: .8 }),
        erSausageCut(p, 76, 86, 20, 30), erSausageCut(p, 122, 78, 20, -20), erSausageCut(p, 132, 116, 20, 60), erSausageCut(p, 90, 122, 19, -40), erSausageCut(p, 104, 96, 18, 10),
        K.onion(p, 112, 120, 18, 20, { c: '#efc28a', layers: 1 }), K.onion(p, 70, 110, 16, -60, { c: '#efc28a', layers: 1 }), K.onion(p, 140, 92, 16, 140, { c: '#efc28a', layers: 1 }),
        erPepRing(p, 96, 74, 16, 20), erPepRing(p, 146, 104, 14, -30), erPepRing(p, 72, 98, 13, 70), erPepRing(p, 116, 136, 14, 10), erPepRing(p, 120, 100, 12, 50),
        K.sprinkle(p, 104, 98, 70, { c: '#fbf3dc', n: 40, r: .9 }),
    ].join(''),

    // ソース焼きそば: 皿に、ソース色の麺とキャベツ・豚肉・にんじん、青のりと紅しょうが
    yakisoba: p => [
        K.plate(p),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${erSmooth(ring(62, 12, .14, rng(p.id + 'ys')))}" fill="#8a5426"/></g>`,
        erWavy(p, 100, 100, 130, { c: '#b9773c', w: 3, n: 32, len: .5, wav: .7, seed: 1, outline: '#76431c' }),
        `<g ${p.sh(.8)}>`,
        erCabbage(p, 72, 82, 30, 20, { seed: 1 }), erCabbage(p, 132, 124, 28, -40, { seed: 2 }), erCabbage(p, 128, 72, 26, 70, { seed: 3 }), erCabbage(p, 80, 128, 26, -10, { seed: 4 }), erCabbage(p, 108, 112, 22, 130, { seed: 5 }),
        K.porkSlice(p, 104, 94, 32, 30, { c: '#9c6232', fat: '#e6c595', seed: 1 }), K.porkSlice(p, 142, 98, 26, -60, { c: '#9c6232', fat: '#e6c595', seed: 2 }), K.porkSlice(p, 66, 108, 24, 80, { c: '#9c6232', fat: '#e6c595', seed: 3 }),
        `</g>`,
        erWavy(p, 100, 100, 120, { c: '#b9773c', w: 3, n: 14, len: .45, wav: .7, seed: 2, outline: '#76431c' }),
        erShreds(p, 100, 104, 72, { c: '#ef7f30', n: 7, w: 2.4, len: .18, seed: 3 }),
        K.sprinkle(p, 100, 100, 104, { c: '#2f6e22', n: 70, r: .95 }),
        `<g ${p.sh(.8)}>`, erShreds(p, 118, 86, 19, { c: '#d9304b', n: 18, w: 1.6, len: .7, seed: 9 }), `</g>`,
    ].join(''),

    // カルボナーラ: 皿に、クリーム色のソースがからんだスパゲッティ、カリッとしたベーコン、黒こしょう
    carbonara: p => [
        K.plate(p, { rim: '#c9b48a' }),
        K.pool(p, 100, 104, 134, '#f0d68e', { op: .9, seed: 1 }),
        erPasta(p, 100, 100, 124, { c: '#f3d98e', w: 2.4, n: 50 }),
        K.glaze(p, 98, 100, 96, '#f8e4a6', { op: .35, seed: 2 }),
        `<g ${p.sh(.6)}>`,
        K.bacon(p, 78, 86, 22, 11, 30), K.bacon(p, 120, 78, 21, 11, -20), K.bacon(p, 128, 118, 22, 11, 60), K.bacon(p, 86, 124, 20, 11, -50), K.bacon(p, 108, 102, 19, 10, 10), K.bacon(p, 66, 106, 18, 10, 80), K.bacon(p, 104, 140, 18, 10, -10), K.bacon(p, 140, 96, 17, 10, 100),
        `</g>`,
        K.sprinkle(p, 100, 100, 90, { c: '#fbf6e4', n: 30, r: 1 }),
        K.sprinkle(p, 100, 100, 108, { c: '#2a2420', n: 80, r: .8 }),
    ].join(''),

    // きのこの和風パスタ: 皿に、醤油バターのスパゲッティとしめじ・まいたけ・ベーコン、刻んだ大葉
    kinokopasta: p => [
        K.plate(p),
        erPasta(p, 100, 100, 130, { c: '#dcae64', w: 2.3, n: 50 }),
        K.maitake(p, 92, 114, 38, 60), K.maitake(p, 142, 92, 34, -20), K.maitake(p, 72, 74, 30, 200), K.maitake(p, 120, 136, 30, 100),
        ...[[78, 94, -30], [126, 112, 40], [118, 70, -60], [84, 130, 150], [102, 84, 20], [140, 120, 80], [62, 112, 200], [100, 136, -10], [134, 76, 110]].map(([x, y, r]) => erShimeji(p, x, y, 26, r, { cap: '#7e5a3a' })),
        `<g ${p.sh(.5)}>`, K.bacon(p, 104, 92, 14, 8, 20), K.bacon(p, 64, 110, 13, 7, -40), K.bacon(p, 136, 134, 13, 7, 70), `</g>`,
        `<g ${p.sh(.4)}>`, erShreds(p, 104, 98, 29, { c: '#3d8a30', n: 26, w: 1.5, len: .55, seed: 5 }), `</g>`,
        erGlints(p, 100, 104, 90, { n: 8, op: .5 }),
    ].join(''),

    // 肉うどん: どんぶりに澄んだ黄金のつゆ、太いうどん、甘辛い牛肉と斜め切りのねぎ
    nikuudon: p => [
        K.donburi(p),
        K.liquid(p, { R: 81, c: '#cf9a4c', op: 1, shine: false }),
        erWavy(p, 100, 100, 156, { c: '#f6efda', w: 8, n: 16, len: .85, wav: .25, seed: 3, outline: '#d9c79a', sheen: true, layers: 3 }),
        `<circle cx="100" cy="100" r="81" fill="#cf9a4c" opacity=".2"/>`,
        `<path d="M40,72 A66,66 0 0 1 80,38" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`,
        `<g ${p.sh(1)}>`,
        ...[[112, 80, 20], [138, 102, -40], [104, 110, 80], [128, 130, 10], [92, 88, -60], [144, 74, 60], [120, 104, 140]].map(([x, y, r], i) => erBeef(p, x, y, 52, r, { c: i % 2 ? '#94603c' : '#865230', seed: i + 1, fat: .5 })),
        K.onion(p, 116, 116, 18, 40, { c: '#b7823e', layers: 1 }),
        `</g>`,
        erGlints(p, 118, 100, 54, { n: 7, op: .55 }),
        `<g ${p.sh(.6)}>`,
        [[66, 112, 30], [76, 134, -20], [58, 90, 60], [94, 142, 10], [74, 68, -40], [86, 120, 70]].map(([x, y, r], i) => i % 2 ? `<g ${T(x, y, r)}><ellipse rx="9.5" ry="4.4" fill="${p.g('#7cb84a', .3, .2)}" stroke="#4f8a2b" stroke-width=".6"/><ellipse rx="6" ry="2.4" fill="none" stroke="#a9d27a" stroke-width=".8"/></g>` : K.negiPiece(p, x, y, 19, r)).join(''),
        `</g>`,
    ].join(''),

    // 冷やし中華: 皿の中華麺に、錦糸卵・ハム・きゅうりの細切りとトマトを放射状に、からし
    hiyashichuka: p => [
        K.plate(p, { rim: '#4f8fb5' }),
        `<circle cx="100" cy="100" r="68" fill="#b8843a" opacity=".3"/>`,
        erWavy(p, 100, 100, 134, { c: '#f3d47c', w: 2.8, n: 52, len: .6, wav: .4, seed: 1, outline: '#c99e40' }),
        erStrips(p, 70, 80, 50, 9, 3.6, -40, { c: '#f8d64e', seed: 1 }),
        erStrips(p, 130, 80, 50, 9, 3.6, 40, { c: '#f2a5a8', edge: '#f7c4c4', seed: 2 }),
        erStrips(p, 100, 136, 52, 9, 3.6, 0, { c: '#a6d270', edge: '#2f6e26', seed: 3 }),
        `<g ${p.sh(.6)}>`,
        `<g ${T(100, 66, 180)}>${K.tomatoWedge(p, 0, 0, 30, 0)}</g>`,
        `<g ${T(62, 118, 60)}>${K.tomatoWedge(p, 0, 0, 28, 0)}</g>`,
        `<g ${T(138, 118, -60)}>${K.tomatoWedge(p, 0, 0, 28, 0)}</g>`,
        `</g>`,
        `<g ${p.sh(.6)}><path ${T(100, 102)} d="${erSmooth(ring(6, 6, .3, rng('k')))}" fill="${p.rg('#e8b820', .3, .2)}"/></g>`,
        K.sesame(p, 100, 100, 74, { n: 16 }),
    ].join(''),

    // 焼きうどん: 皿に、醤油色の太いうどんとキャベツ・豚肉・にんじん・玉ねぎ、たっぷりのかつお節
    yakiudon: p => [
        K.plate(p),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${erSmooth(ring(62, 12, .14, rng(p.id + 'yu')))}" fill="#c4904a"/></g>`,
        erWavy(p, 100, 100, 132, { c: '#e8c27c', w: 6.5, n: 24, len: .55, wav: .45, seed: 1, outline: '#b4853e' }),
        `<g ${p.sh(.8)}>`,
        erCabbage(p, 76, 82, 28, 20, { seed: 1 }), erCabbage(p, 128, 122, 28, -40, { seed: 2 }), erCabbage(p, 132, 76, 24, 70, { seed: 3 }), erCabbage(p, 80, 126, 24, 160, { seed: 4 }),
        K.porkSlice(p, 100, 106, 30, 30, { c: '#9c6232', fat: '#e6c595', seed: 1 }), K.porkSlice(p, 70, 104, 26, -60, { c: '#9c6232', fat: '#e6c595', seed: 2 }),
        K.onion(p, 116, 92, 16, 20, { c: '#dcb06a', layers: 1 }), K.onion(p, 86, 74, 14, -30, { c: '#dcb06a', layers: 1 }),
        `</g>`,
        erWavy(p, 100, 100, 120, { c: '#e8c27c', w: 6.5, n: 9, len: .45, wav: .45, seed: 2, outline: '#b4853e' }),
        erShreds(p, 100, 104, 72, { c: '#ef7f30', n: 6, w: 2.6, len: .16, seed: 3 }),
        erBonito(p, 100, 100, 104, { n: 36 }),
        K.sprinkle(p, 100, 100, 90, { c: '#2f6e22', n: 24, r: .9 }),
    ].join(''),

    // 鮭とほうれん草のクリームパスタ: 皿に、白いクリームソースのスパゲッティ、鮭、ほうれん草、黒こしょう
    salmoncreampasta: p => [
        K.plate(p),
        K.pool(p, 100, 104, 138, '#f3ead2', { op: 1, seed: 1 }),
        erPasta(p, 100, 100, 122, { c: '#f2e2b2', w: 2.4, n: 48 }),
        K.glaze(p, 98, 100, 100, '#fbf6e6', { op: .5, seed: 2 }),
        erSpinach(p, 80, 112, 42, { n: 8, seed: 1 }), erSpinach(p, 128, 84, 38, { n: 7, seed: 2 }),
        erSalmonBit(p, 98, 92, 20, 20, { seed: 1 }), erSalmonBit(p, 124, 114, 19, -30, { seed: 2 }), erSalmonBit(p, 76, 84, 17, 60, { seed: 3 }),
        erSalmonBit(p, 104, 130, 18, 10, { seed: 4 }), erSalmonBit(p, 140, 136, 15, -60, { seed: 5 }), erSalmonBit(p, 110, 68, 16, 40, { seed: 6 }),
        K.sprinkle(p, 100, 100, 104, { c: '#2a2420', n: 44, r: .7 }),
    ].join(''),

    // ツナとトマトのパスタ: 皿に、赤いトマトソースのスパゲッティ、ツナ、玉ねぎ、パセリ
    tunatomatopasta: p => [
        K.plate(p),
        K.pool(p, 100, 104, 130, '#c8381f', { op: .95, seed: 1 }),
        erPasta(p, 100, 100, 122, { c: '#de5a2c', w: 2.4, n: 48 }),
        K.glaze(p, 100, 100, 92, '#c8381f', { op: .35, seed: 2 }),
        erTuna(p, 98, 94, 40, { seed: 1 }), erTuna(p, 126, 112, 32, { seed: 2 }), erTuna(p, 78, 116, 30, { seed: 3 }), erTuna(p, 118, 74, 28, { seed: 4 }), erTuna(p, 104, 128, 24, { seed: 5 }),
        `<g ${p.sh(.6)}>`, K.onion(p, 72, 90, 16, 20, { c: '#efb07a', layers: 1 }), K.onion(p, 134, 132, 16, -40, { c: '#efb07a', layers: 1 }), K.onion(p, 100, 136, 14, 80, { c: '#efb07a', layers: 1 }), `</g>`,
        erGlints(p, 100, 104, 90, { n: 8, op: .5 }),
        K.sprinkle(p, 100, 98, 64, { c: '#3f8f2c', n: 26, r: 1 }),
    ].join(''),
};
