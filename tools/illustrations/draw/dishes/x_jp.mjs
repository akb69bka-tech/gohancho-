// 日本の料理（主菜・副菜・汁物）を1品ずつ手で盛りつけたもの
// 部品は kit.mjs。ほかの盛りつけファイルの部品は、ここに写して xjp_ を頭につけて使う（他のファイルは読み込まない）
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 写してきた部品（e_rice_noodle / z_soup / f_side1 / c_main_yo / g_side2 / b_main_wa2 / d_main_chuka）
// =========================================================
// 1桁小数のなめらかな線（軽いSVGにするため）
function xjp_erSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xjp_erSmooth = (pts, closed = true) => xjp_erSm(pts, closed);
// まとめて描いた粒や麺のまわりに、細い輪郭をつけるフィルター
function xjp_erOutline(p, c, r = .55){
    const id = p.def('erOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山: 米粒（丸い端の短い線）を2層に重ね、右下に落ちる小さな影で1粒ずつ立たせる。
// 同じ粒の形を <use> で影と本体に使い回して軽くする。ring0 を指定すると縁の帯（どんぶりで具から見える部分）だけ粒を描く
function xjp_erRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, ring0 = 0, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xjp_erRice' + seed + x + y);
    const shape = xjp_erSmooth(ring(s / 2, 14, .07, R, 1, sy));
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
function xjp_erGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
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
function xjp_erWavy(p, x, y, s, { c = '#f3ead2', w = 5, n = 14, seed = 1, sy = .9, len = .55, wav = .5, outline = null, sheen = true, layers = 4 } = {}){
    const R = rng(p.id + 'erWv' + seed + x);
    const ol = xjp_erOutline(p, outline || dk(c, .25), .6), rad = s / 2;
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
        const dd = xjp_erSm(pts);
        const l = L[i % layers];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        if (sheen && R() < .5) l[2] += xjp_erSm(pts.slice(1, 4).map(([a, b]) => [a - w * .18, b - w * .2]));
    }
    return `<g ${p.sh(.8)}>${L.map(([a, b, h]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .14)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>${h ? `<path d="${h}" stroke="#fff" stroke-width="${f1(w * .24)}" fill="none" stroke-linecap="round" opacity=".5"/>` : ''}`).join('')}</g>`;
}
// パスタ（フォークで巻いたような渦の山）。細い麺を層に分けて重ね、明るい側の麺は色を明るく
function xjp_erPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'erPs' + seed);
    const ol = xjp_erOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const lit = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2) < -.4;
        const dark = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2) > .8;
        L[i % layers][lit ? 1 : dark ? 2 : 0] += xjp_erSm(pts);
    }
    const base = `<path ${T(x, y)} d="${xjp_erSmooth(ring(s / 2 * .9, 12, .12, R, 1, sy))}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g><path d="M${f(x - s * .3)},${f(y - s * .18)} Q${f(x - s * .12)},${f(y - s * .36)} ${f(x + s * .12)},${f(y - s * .34)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 薄切り牛肉（牛丼・肉うどん・ハヤシ）: ひだの寄った薄い1枚、白い脂の筋と照り
function xjp_erBeef(p, x, y, s, r = 0, { c = '#7d4a2c', seed = 1, fat = .7 } = {}){
    const R = rng(p.id + 'erBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, (_, i) => { const fx = -8 + i * 8 + (R() - .5) * 4; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    const fats = Array.from({ length: 2 }, () => { const fx = -10 + R() * 14, fy = -4 + R() * 7; return `M${f1(fx)},${f1(fy)} q${f1(3 + R() * 3)},${f1((R() - .5) * 4)} ${f1(7 + R() * 5)},${f1((R() - .5) * 3)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${xjp_erSmooth(ring(14, 16, .36, R, 1.1, .6), true, .9)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="${fats}" stroke="#e6c4a0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${fat}"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 煮た鶏もも肉のひと口大（親子丼）: 淡い身に、片側だけ皮の色、繊維の筋
function xjp_erChicken(p, x, y, s, r = 0, { c = '#e2b77c', skin = '#c27f3c', seed = 1 } = {}){
    const R = rng(p.id + 'erCk' + seed + x + y);
    const pts = ring(10, 10, .38, R, 1.2, .82);
    return `<g ${T(x, y, r, s / 22)}><path d="${xjp_erSmooth(pts, true, .8)}" fill="${p.g(c, .35, .28)}" stroke="${dk(c, .3)}" stroke-width=".7"/>
        <path d="M4,-6 Q11,-3 10,4 Q6,7 3,4 Q6,0 4,-6Z" fill="${skin}" opacity=".55"/>
        <path d="M-8,1 q5,-2 10,0 M-6,4.5 q4,-1.5 8,0 M-7,-2.5 q4,-1.5 7,-.5" stroke="${dk(c, .25)}" stroke-width=".6" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M-7,-5 Q-2,-7.5 4,-6.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 細切り（千切り）を色ごとに1本のpathにまとめたもの（レタス・にんじん・紅しょうが・大葉など）
function xjp_erShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'erSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? xjp_erOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// もやし（白い軸と黄色い頭）を1本のpathにまとめたもの
function xjp_erSprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'erSp' + seed + x);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const r2 = Math.sqrt(R()) * s / 2 * .85, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * .9, a = R() * Math.PI, L = 9 + R() * 8, bd = (R() - .5) * 5;
        const x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        st += `M${f1(cx - Math.cos(a) * L / 2)} ${f1(cy - Math.sin(a) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(x2)} ${f1(y2)}`;
        hd += `M${f1(x2)} ${f1(y2)}l${f1(Math.cos(a) * 1.2)} ${f1(Math.sin(a) * 1.2)}`;
    }
    return `<g ${p.sh(.5)}><g ${xjp_erOutline(p, '#cfc6a6', .45)} fill="none" stroke-linecap="round"><path d="${st}" stroke="#f8f5e8" stroke-width="2.2"/><path d="${hd}" stroke="#e6cf5e" stroke-width="2.8"/></g></g>`;
}
// 照りのある液だれ（あん・カレーの面に散らす小さな光）
function xjp_erGlints(p, x, y, s, { n = 6, seed = 1, op = .55 } = {}){
    const R = rng(p.id + 'erGl' + seed + x);
    return Array.from({ length: n }, () => { const gx = x + (R() - .5) * s, gy = y + (R() - .5) * s * .8, L = 3 + R() * 5; return `<path d="M${f(gx)},${f(gy)} q${f(L / 2)},${f(-L * .3)} ${f(L)},0" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="${op}"/>`; }).join('');
}
// 削り節（ゆらゆらした薄い花がつお）。同じ色の薄片は1本のpathにまとめる
function xjp_erBonito(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'erBn' + seed + x);
    const cols = ['#e8c4a6', '#d9a888', '#f2dcc6', '#c99474'], ds = cols.map(() => '');
    const shape = [[-7, -1], [-3, -4], [1, -2.2], [5, -4.8], [8, -1], [4, .8], [6.5, 3.5], [0, 2], [-5, 3.2]];
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .8, a = R() * 6.28, k = .9 + R() * .6, ca = Math.cos(a) * k, sa = Math.sin(a) * k;
        ds[Math.floor(R() * 4)] += xjp_erSm(shape.map(([u, v]) => [cx + u * ca - v * sa, cy + u * sa + v * ca]), true);
    }
    return `<g ${p.sh(.4)}>${cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".5" opacity=".88"/>`).join('')}</g>`;
}
// 葉（バジル・青じそ以外の小さな葉）
function xjp_erLeaf(p, x, y, s, r = 0, { c = '#2f7a2a' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-4,-7.5 6,-4.5 Q10,-2 10,0 Q10,2 6,4.5 Q-4,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-3,0 L1,-4 M2,0 L5,-3 M-3,0 L1,4 M2,0 L5,3" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// さやいんげんの斜め切りを帯状に敷く（1本のpath）
function xjp_erBeans(p, pts, { c = '#4f9a34' } = {}){
    const d = pts.map(([x, y, a]) => `M${f1(x - Math.cos(a) * 4)} ${f1(y - Math.sin(a) * 4)}l${f1(Math.cos(a) * 8)} ${f1(Math.sin(a) * 8)}`).join('');
    return `<g ${xjp_erOutline(p, dk(c, .35), .5)} fill="none" stroke-linecap="round"><path d="${d}" stroke="${c}" stroke-width="3.8"/></g><path d="${pts.map(([x, y, a]) => `M${f1(x - Math.cos(a) * 3 - .6)} ${f1(y - Math.sin(a) * 3 - .8)}l${f1(Math.cos(a) * 5)} ${f1(Math.sin(a) * 5)}`).join('')}" stroke="#a6d47c" stroke-width="1" stroke-linecap="round" fill="none"/>`;
}
// 斜め切りのウインナー
function xjp_erSausageCut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f(s / 2)}" ry="${f(s * .3)}" fill="#a9452a"/></g>
        <ellipse rx="${f(s / 2 - 1.4)}" ry="${f(s * .3 - 1.4)}" fill="${p.g('#e2a07e', .25, .2)}"/>
        <ellipse cx="${f(-s * .1)}" cy="${f(-s * .08)}" rx="${f(s * .18)}" ry="${f(s * .07)}" fill="#fff" opacity=".5"/></g>`;
}
// ケチャップ・ソースの線（なめらかなジグザグ）
function xjp_erZig(p, x, y, w, h, n, r = 0, { c = '#c8231b', width = 5 } = {}){
    const pts = Array.from({ length: n + 1 }, (_, i) => [-w / 2 + i * w / n, i % 2 ? h / 2 : -h / 2]);
    const d = xjp_erSmooth(pts, false, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${width + 1.2}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${width}" fill="none" stroke-linecap="round"/></g>
        <path d="${d}" stroke="#ff8a7a" stroke-width="${f(width * .25)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.8 -1)"/></g>`;
}
// キャベツ（炒めたざく切り）: 細長く不ぞろいな破片。白っぽい芯側から先の黄緑へ、太い葉脈
function xjp_erCabbage(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'erCb' + seed + x + y);
    const pts = ring(12, 9, .42, R, 1.3, .8);
    const gid = p.def('erCabG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#f6efd0"/><stop offset=".6" stop-color="#e9e8b8"/><stop offset="1" stop-color="#c9d68e"/></linearGradient>`);
    return `<g ${T(x, y, r, s / 26)}><path d="${xjp_erSmooth(pts, true, .7)}" fill="url(#${gid})" stroke="#b3b77a" stroke-width=".6"/>
        <path d="M-16,1 Q-4,-1.5 14,0" stroke="#fbfbee" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".95"/>
        <path d="M-6,0 L-9,-4 M2,-.5 L0,-5 M8,0 L11,3" stroke="#fbfbee" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}
// しめじ（1本ずつ）: クリーム色の軸と茶色のかさ
function xjp_erShimeji(p, x, y, s, r = 0, { cap = '#8b6542' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-1,9 Q-2.2,2 0,-4" stroke="#cdbb98" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M-1,9 Q-2.2,2 0,-4" stroke="#f1e8d4" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M-6,-3.5 Q-6,-10 0,-10.5 Q6,-10 6,-3.5 Q0,-1.5 -6,-3.5Z" fill="${p.rg(cap, .3, .3, .35, .3)}" stroke="${dk(cap, .3)}" stroke-width=".6"/></g>
        <ellipse cx="-2" cy="-8" rx="2" ry="1" fill="#fff" opacity=".5"/></g>`;
}
// ツナ（ほぐれた身のかたまり）
function xjp_erTuna(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'erTn' + seed + x + y);
    let out = '';
    for (let i = 0; i < 4; i++){
        const c = R() < .5 ? '#d8b58c' : '#c99e72';
        out += `<path ${T(x + (R() - .5) * s * .5, y + (R() - .5) * s * .4, R() * 180)} d="${xjp_erSmooth(ring(s * (.2 + R() * .12), 7, .45, R, 1.3, .8), true, .7)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`;
    }
    out += `<path d="M${f(x - s * .3)},${f(y - s * .05)} l${f(s * .25)},${f(-s * .08)} M${f(x - s * .05)},${f(y + s * .12)} l${f(s * .3)},${f(-s * .06)}" stroke="#a87c52" stroke-width=".7" opacity=".7"/>`;
    return `<g ${p.sh(.6)}><g ${p.rough(1.4, .3)}>${out}</g></g>`;
}
// ---------- この汁物ファイルだけの部品（zs〜） ----------
// いちょう切り（大根・にんじん）: 1/4 の円。c は色、core は中心寄りの明るい輪
function xjp_zsIcho(p, x, y, s, r = 0, { c = '#f1e6c8', edge = null, op = 1 } = {}){
    const h = s / 2, e = edge || dk(c, .22);
    return `<g ${T(x, y, r)} opacity="${op}"><path d="M${-h},${h} L${h},${h} A${s},${s} 0 0 0 ${-h},${-h} Z" fill="${p.g(c, .32, .22)}" stroke="${e}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f(-h + s * .72)},${h} A${f(s * .72)},${f(s * .72)} 0 0 0 ${-h},${f(h - s * .72)}" stroke="${lt(c, .4)}" stroke-width="1" fill="none" opacity=".8"/>
        <path d="M${f(-h + s * .12)},${f(-h + s * .3)} Q${f(-h + s * .45)},${f(-h + s * .35)} ${f(-h + s * .7)},${f(-h + s * .62)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ささがきごぼう: 先の細い薄いそぎ片
function xjp_zsSasagaki(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 Q${f(-s * .1)},${f(-s * .16)} ${s / 2},${f(-s * .03)} Q${f(s * .05)},${f(s * .14)} ${-s / 2},0Z" fill="${p.g('#a07a50', .25, .3)}" stroke="#6e4a2a" stroke-width=".5"/>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q0,${f(-s * .08)} ${f(s * .32)},${f(-s * .03)}" stroke="#d7bf98" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 汁に浮いた油の粒（ごま油・ラー油）
function xjp_zsOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// ふんわり固まった溶き卵（ふちが毛羽立った、半透明の雲）
function xjp_zsEgg(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'zse' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// 具をまんべんなく散らす位置（重なりすぎないように）
function xjp_zsSpots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('zsspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// さいの目の野菜・具（角を丸めた立方体を上から: 上面と少しの側面）
function xjp_zsDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// あさり: open=true は殻が開いて白い内側と身が見える姿、false は縞模様の殻の外側に身が少しのぞく姿
function xjp_zsClam(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c', open = true } = {}){
    const R = rng(p.id + 'zcl' + seed + x + y);
    const k = s / 30;
    const outerC = ['#a8957c', '#8f8170', '#b39c80', '#7f766c'][Math.floor(R() * 4)];
    // 殻1枚: 蝶番（umbo）を (0,0) にした丸い三角
    const shell = `M0,0 C-3,1 -11,4 -12,10 C-12.5,15 -7,18 0,18 C7,18 12.5,15 12,10 C11,4 3,1 0,0Z`;
    if (!open){
        let zz = '';
        for (let i = 0; i < 4; i++){ const yy = 5 + i * 3.2, w = 8 + i * 1.2; zz += `<path d="M${-w},${yy} l2.5,-1.6 l2.5,1.6 l2.5,-1.6 l2.5,1.6 l2.5,-1.6 l2.5,1.6 l2.5,-1.6" transform="translate(${f(-w * .0)} 0)" stroke="${dk(outerC, .45)}" stroke-width=".8" fill="none" opacity=".55"/>`; }
        return `<g ${T(x, y, r, k)}><g transform="translate(0 -9)"><g ${p.sh(.6)}><path d="${shell}" fill="${p.g(outerC, .3, .32)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/></g>
            ${zz}<path d="M-10,12 Q0,9 10,12 M-11.5,15 Q0,12 11.5,15" stroke="${lt(outerC, .35)}" stroke-width=".7" fill="none" opacity=".8"/>
            <path d="M-7,17.4 Q0,20.5 7,17.4 Q0,18.6 -7,17.4Z" fill="${meat}" stroke="${dk(meat, .3)}" stroke-width=".5"/>
            <path d="M-5,5 Q-2,2.6 1,3" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
    }
    const valve = a => `<g transform="rotate(${a})"><path d="${shell}" fill="${p.g(outerC, .2, .3)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/>
        <path d="M0,1.6 C-3,2.6 -9.6,5 -10.4,10 C-10.8,14 -6.4,16.4 0,16.4 C6.4,16.4 10.8,14 10.4,10 C9.6,5 3,2.6 0,1.6Z" fill="${p.g('#f1ebed', .3, .14)}"/>
        <path d="M-9,13.6 Q0,18 9,13.6" stroke="#9a86b0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${valve(-62)}${valve(62)}</g>
        <g transform="rotate(-62)"><path d="M-7,9 C-7,3.5 7,3.5 7.4,9 C7.6,14 3,15.6 0,15.4 C-4,15.2 -7,13 -7,9Z" fill="${p.g(meat, .32, .28)}" stroke="${dk(meat, .32)}" stroke-width=".6"/>
        <path d="M-5.6,11.4 C-3,14.4 3,14.6 5.8,11" stroke="${dk(meat, .3)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-4,7.4 Q0,5.4 3.6,7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`;
}
// くずした豆腐・すくった絹ごし豆腐（不定形）
function xjp_zsTofuChunk(p, x, y, s, r = 0, { seed = 1, c = '#f8f3e6', tint = null } = {}){
    const R = rng(p.id + 'ztf' + seed + x + y);
    const pts = ring(s / 2, 9, .32, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        ${tint ? `<path d="${smooth(pts.map(([a, b]) => [a * .9 + 1.2, b * .9 + 1.2]), true, .75)}" fill="${tint}" opacity=".35"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 薄切り玉ねぎ（煮て透き通った細い弧）
function xjp_zsOnionStrip(p, x, y, s, r = 0, { c = '#f6e2ae' } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity=".62" stroke="${lt(c, .4)}" stroke-width=".9" stroke-linejoin="round"/><path d="M${f(-s * .34)},${f(-s * .02)} Q0,${f(-s * .24)} ${f(s * .3)},${f(-s * .04)}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 煮たトマト（皮が少しはがれたくし形のかけら）
function xjp_zsTomato(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'ztm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#e2412c', .3, .25)}" stroke="#a6261a" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="#f37a5c" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 刻みパセリ（細かい緑の粒）
function xjp_zsParsley(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'zpa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1 + R() * 1, 5, .6, R))}" fill="${R() < .5 ? '#3f8a2c' : '#5aa63c'}"/>`; }
    return out;
}
// 長ねぎの斜め薄切り（白〜薄緑の細い楕円の輪）
function xjp_zsNegiSlant(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#9cc56a' : '#eef2dc';
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .22)}" fill="${p.g(c, .2, .15)}" stroke="${dk(c, .28)}" stroke-width=".6" opacity=".95"/><ellipse rx="${f(s * .36)}" ry="${f(s * .12)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".6"/></g>`;
}
// 汁のつや（ゆるい弧）
const xjp_zsShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// ---------- このファイル専用の部品（s1 で始まる） ----------
// 楕円の中にばらまく点
function xjp_s1Pts(R, n, cx, cy, rx, ry){
    return Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()); return [cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry]; });
}
// 盛りの下地（山のかたまり感）
function xjp_s1Mound(p, x, y, rx, ry, c, { seed = 1, op = 1, l = .25, d = .3 } = {}){
    const R = rng(p.id + 'mnd' + seed);
    return `<path ${T(x, y)} d="${smooth(ring(rx, 12, .14, R, 1, ry / rx))}" fill="${p.rg(c, l, d, .4, .38)}" opacity="${op}"/>`;
}
// 棒（細切り・拍子木）: 長さ L、太さ w
function xjp_s1Stick(p, x, y, L, w, r, c, { gloss = .5 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`
        + (gloss ? `<path d="M${f(-L / 2 + w * .7)},${f(-w * .2)} L${f(L / 2 - w)},${f(-w * .2)}" stroke="#fff" stroke-width="${f(w * .24)}" stroke-linecap="round" opacity="${gloss}"/>` : '') + `</g>`;
}
// 大きめのごま
function xjp_s1Sesame(p, x, y, rx, ry, n, { c = '#f4e8c8', seed = 1, size = 1 } = {}){
    const R = rng(p.id + 'ses' + seed + c);
    return xjp_s1Pts(R, n, x, y, rx, ry).map(([cx, cy]) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(1.7 * size)}" ry="${f(1 * size)}" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".35"/>`).join('');
}
// おろし（大根・生姜）
function xjp_s1Grated(p, x, y, s, { c = '#f6f4ee', fleck = '#e2ddcf', seed = 1 } = {}){
    const R = rng(p.id + 'grt' + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 9, .25, R, 1.1, .85))}" fill="${p.rg(c, .3, .14)}" stroke="${dk(c, .12)}" stroke-width=".5"/></g>`
        + Array.from({ length: 9 }, () => { const cx = x + (R() - .5) * s * .65, cy = y + (R() - .5) * s * .5; return `<path d="M${f(cx - 1.6)},${f(cy)} l3.2,${f((R() - .5) * 1.6)}" stroke="${fleck}" stroke-width="1" stroke-linecap="round"/>`; }).join('');
}
// 小口ねぎ（大きめの輪）
function xjp_s1Negi(p, x, y, rx, ry, n, { seed = 1, r = 2.8 } = {}){
    const R = rng(p.id + 'ngi' + seed);
    return xjp_s1Pts(R, n, x, y, rx, ry).map(([cx, cy]) => { const c = R() < .65 ? '#58a336' : '#a9d47a'; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * .85)}" fill="${lt(c, .55)}" stroke="${c}" stroke-width="1.5"/>`; }).join('');
}
// 青菜の葉
function xjp_s1Leaf(p, x, y, L, r, c){
    const k = L / 24;
    return `<g ${T(x, y, r, k)}><path d="M-12,0 Q-6,-7.5 3,-6.5 Q11,-3.5 12,0 Q9,5 1,6 Q-7,6 -12,0Z" fill="${p.g(c, .25, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M-11,0 Q0,-1 11,0 M-4,-.4 L-1,-4 M2,-.3 L5,-3.6 M-2,.3 L1,3.6" stroke="${lt(c, .35)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}
// かつお節（薄く削った、透けるような淡い桃茶のひらひら）
function xjp_s1Bonito(p, x, y, s, n, seed = 1){
    const R = rng(p.id + 'bon' + seed);
    const cols = ['#ecd2b8', '#ddb594', '#f5e4d2', '#cfa07c', '#e6c2a2'];
    let o = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.283, d = Math.pow(R(), .7) * s / 2, tr = T(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, R() * 360, 1.1 + R() * .7), col = cols[Math.floor(R() * cols.length)];
        o += `<path ${tr} d="M-6.5,-.5 Q-3,-4.2 2,-3 Q5.6,-2 6.5,1.4 Q3,-.2 .5,.8 Q-3,2.4 -6.5,-.5Z" fill="${col}" stroke="${dk(col, .22)}" stroke-width=".4" opacity=".95"/>`;
    }
    return o;
}
// ほうれん草を束ねて切ったもの（横に寝かせた1切れ）: 濃い葉のひだと、明るい茎、切り口
function xjp_s1Bundle(p, x, y, w, h, r, { c = '#2f6e2a', stem = '#8fc45a', seed = 1, stems = 3 } = {}){
    const R = rng(p.id + 'bun' + seed);
    let s = '';
    const id = p.uid();
    for (let i = 0; i < 9; i++){
        const lx = -w / 2 + 8 + R() * (w - 16), ly = -h / 2 + 6 + R() * (h - 12), col = R() < .5 ? dk(c, .18) : lt(c, .12);
        s += `<path ${T(lx, ly, (R() - .5) * 30, h / 22)} d="M-14,0 Q-7,-6.5 3,-5.5 Q12,-3 14,0 Q10,4.5 1,5.5 Q-8,5 -14,0Z" fill="${col}" stroke="${dk(c, .4)}" stroke-width=".6" opacity=".95"/><path ${T(lx, ly, 0, h / 22)} d="M-12,0 Q0,-1 12,0" stroke="${lt(c, .3)}" stroke-width=".8" fill="none" opacity=".7"/>`;
    }
    s = `<clipPath id="${id}"><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h * .3)}"/></clipPath><g clip-path="url(#${id})">${s}</g>`;
    for (let i = 0; i < stems; i++){
        const yy = -h / 2 + h * (i + .7) / (stems + .4), x0 = -w / 2 + 3 + R() * w * .1, x1 = w / 2 - 3 - R() * w * .25;
        s += `<path d="M${f(x0)},${f(yy)} Q0,${f(yy + (R() - .5) * 3)} ${f(x1)},${f(yy + (R() - .5) * 2)}" stroke="${dk(stem, .25)}" stroke-width="${f(h * .1 + 1)}" fill="none" stroke-linecap="round"/><path d="M${f(x0)},${f(yy)} Q0,${f(yy + (R() - .5) * 3)} ${f(x1)},${f(yy + (R() - .5) * 2)}" stroke="${stem}" stroke-width="${f(h * .1)}" fill="none" stroke-linecap="round"/>`;
    }
    let ends = '';
    for (let i = 0; i < 4; i++) ends += `<ellipse cx="${f(-w / 2 + 2.8)}" cy="${f(-h / 2 + h * (i + .7) / 4.4)}" rx="1.8" ry="${f(h * .075)}" fill="${lt(stem, .3)}" stroke="${dk(stem, .2)}" stroke-width=".4"/>`;
    return `<g ${T(x, y, r)}><g ${p.rough(2.4, .09)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h * .3)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .45)}" stroke-width="1"/></g>${s}${ends}
        <path d="M${f(-w / 2 + 7)},${f(-h / 2 + 3.4)} Q0,${f(-h / 2 + 1.6)} ${f(w / 2 - 9)},${f(-h / 2 + 3.6)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// ---------- この盛りつけファイル専用の部品（yo〜） ----------
// ぼかし（焼き色・ソースのにじみ）
const xjp_yoBlur = (p, s = 2) => `filter="url(#${p.def('yobl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
// 1枚の肉・カツを包丁で切りそろえたもの（L×W の長円を n 切れ、切れ目に断面）
// とんかつ・チキン南蛮・照り焼きに使う
function xjp_yoSliced(p, x, y, L, W, r, n, { c = '#d39a48', face = '#f4e6d2', fat = null, crumb = .75, seed = 1, gap = 2.2, jitter = .08, gloss = .5, char = 0, rough = 0, stagger = 1, faceW = .3, boxy = 0 } = {}){
    const R = rng(p.id + 'ysl' + seed);
    const pts = boxy ? Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, cx = Math.cos(a), cy = Math.sin(a), j = 1 + (R() - .5) * jitter; return [Math.sign(cx) * Math.abs(cx) ** boxy * L / 2 * j, Math.sign(cy) * Math.abs(cy) ** boxy * W / 2 * j]; }) : ring(1, 14, jitter, R, L / 2, W / 2);
    const shape = smooth(pts);
    const inner = smooth(pts.map(([a, b]) => [a * .97, b * .8]));
    const cs = p.def('ysls' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    const ci = p.def('ysli' + seed, id => `<clipPath id="${id}"><path d="${inner}"/></clipPath>`);
    const bw = L / n;
    let out = '';
    for (let i = 0; i < n; i++){
        const x0 = -L / 2 + i * bw;
        const cb = p.def(`yslb${seed}-${i}`, id => `<clipPath id="${id}"><rect x="${f(x0 + (i ? gap / 2 : -4))}" y="${f(-W)}" width="${f(bw - (i ? gap / 2 : -4) - (i < n - 1 ? gap / 2 : -4))}" height="${f(W * 2)}"/></clipPath>`);
        const dy = stagger * (i % 2 ? .9 : -.5) + (R() - .5) * stagger, dx = (i - (n - 1) / 2) * .5;
        const fw = Math.min(bw * faceW, 5);
        let marks = '';
        for (let j = 0; j < char; j++) marks += `<ellipse cx="${f(x0 + fw + R() * (bw - fw))}" cy="${f((R() - .5) * W * .7)}" rx="${f(2 + R() * 3)}" ry="${f(1.2 + R() * 1.6)}" fill="${dk(c, .55)}" opacity="${f(.25 + R() * .3)}"/>`;
        out += `<g transform="translate(${f(dx)} ${f(dy)})"><g clip-path="url(#${cb})"><g clip-path="url(#${cs})">
            <g ${crumb ? p.crumb(crumb) : rough ? p.rough(rough, .15) : ''}><path d="${shape}" fill="${p.g(c, .32, .32)}"/></g>
            ${marks}
            ${i ? `<g clip-path="url(#${ci})"><rect x="${f(x0 + gap / 2 - .5)}" y="${f(-W / 2)}" width="${f(fw)}" height="${W}" fill="${p.g(face, .2, .15)}"/>
                ${fat ? `<rect x="${f(x0 + gap / 2 - .5)}" y="${f(-W / 2)}" width="${f(fw)}" height="${f(W * .26)}" fill="${fat}"/>` : ''}
                <path d="M${f(x0 + gap / 2 + fw - .3)},${f(-W / 2)} L${f(x0 + gap / 2 + fw - .3)},${f(W / 2)}" stroke="${dk(c, .2)}" stroke-width=".9" opacity=".6"/></g>` : ''}
            <path d="M${f(x0 + fw + 1.5)},${f(-W * .3)} Q${f(x0 + bw * .62)},${f(-W * .42)} ${f(x0 + bw - 2)},${f(-W * .28)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${gloss}"/>
            <path d="${shape}" fill="none" stroke="${dk(c, .4)}" stroke-width="1.6"/>
            <rect x="${f(x0)}" y="${f(-W)}" width="${f(bw)}" height="${f(W * 2)}" fill="none" stroke="${dk(c, .35)}" stroke-width="1.4"/>
        </g></g></g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}>${out}</g></g>`;
}
// 千切りキャベツの山（軽量版: 線を減らし、1本1本を少し太く）
function xjp_yoCabbage(p, x, y, s, { seed = 1, sy = .8, k = .5 } = {}){
    const R = rng(p.id + 'ycb' + seed);
    let out = `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .25, R, 1, sy))}" fill="${p.rg('#e8f3d0', .3, .1)}"/>`;
    const n = Math.round(s * k);
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .46, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * Math.PI, L = 8 + R() * 11;
        const col = R() < .35 ? '#fbfdf2' : R() < .6 ? '#d4e9a8' : R() < .85 ? '#b5d67f' : '#8fbf5a';
        const x1 = cx - Math.cos(ang) * L / 2, y1 = cy - Math.sin(ang) * L / 2;
        out += `<path d="M${f(x1)},${f(y1)} q${f(Math.cos(ang + 1.3) * 2.4)},${f(Math.sin(ang + 1.3) * 2.4)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}" stroke="${col}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    }
    return `<g ${p.sh(.6)}><g ${p.sh(.25)}>${out}</g></g>`;
}
// レタス（ふちが波打つ葉）
function xjp_yoLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'ylt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="#eef8d8" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(i % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}
// ---------- この盛りつけファイル専用の部品（s2 で始まる） ----------
// 円の中にひまわりの種の並び（黄金角）で n 個の位置を作る。外側から先に描けば、中央が上に重なって山になる
function xjp_s2Spots(seed, n, R, { cx = 100, cy = 100, jit = .18, sy = 1, rot = 0 } = {}){
    const r = rng(seed);
    const out = [];
    for (let i = 0; i < n; i++){
        const d = R * Math.sqrt((i + .5) / n) * (1 + (r() - .5) * jit), a = i * 2.39996 + rot + (r() - .5) * jit;
        out.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * sy, r() * 360, r]);
    }
    return out.reverse();
}
// 和え物・サラダの山（ふちが不定形の面）
function xjp_s2Mound(p, x, y, s, c, { seed = 1, sy = .92, jit = .22, n = 12, l = .25, d = .28, rough = 0 } = {}){
    const R = rng(p.id + 'mnd' + seed);
    const path = `<path ${T(x, y)} d="${smooth(ring(s / 2, n, jit, R, 1, sy))}" fill="${p.rg(c, l, d, .38, .34)}"/>`;
    return `<g ${p.sh(1)}>${rough ? `<g ${p.rough(rough, .12)}>${path}</g>` : path}</g>`;
}
// 細い棒（千切り・拍子木・短冊）。edge を指定すると片側に皮の色の線
function xjp_s2Stick(p, x, y, L, w, r, c, { edge = null, bend = 0 } = {}){
    const h = w / 2;
    const d = `M${f(-L / 2)},${f(-h)} Q0,${f(-h + bend)} ${f(L / 2)},${f(-h)} L${f(L / 2)},${f(h)} Q0,${f(h + bend)} ${f(-L / 2)},${f(h)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .3)}" stroke-width=".5" stroke-linejoin="round"/>
        ${edge ? `<path d="M${f(-L / 2 + .6)},${f(-h + .7)} Q0,${f(-h + bend + .7)} ${f(L / 2 - .6)},${f(-h + .7)}" stroke="${edge}" stroke-width="${f(Math.max(1, w * .38))}" fill="none" stroke-linecap="round"/>` : ''}</g>`;
}
// 照り（白い曲線）
const xjp_wa2Shine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 魚の切り身（鮭・ぶり）。上の縁に皮、斜めの脂の筋、ぶりは血合い。
// s は横幅。browned で焼き色、glazeC でたれの照り
function xjp_wa2Kirimi(p, x, y, s, r = 0, { flesh = '#f0905c', skin = '#9aa0a6', fat = '#fbe3cf', chiai = null, browned = 0, glazeC = null, seed = 1, gloss = .7 } = {}){
    const R = rng(p.id + 'kiri' + seed + x + y), k = s / 44;
    const body = 'M-21,-3 C-19,-12 -6,-15 6,-14 C15,-13 21,-8 22,-1 C22,7 15,12 4,13 C-8,14 -19,11 -22,5 C-23,2 -22,-1 -21,-3Z';
    const skinTop = 'M-20.5,-3.5 C-19,-12 -6,-15 6,-14 C15,-13 21,-8 22,-1';
    let fl = '';
    for (let i = 0; i < 5; i++){ const sx = -15 + i * 7.5 + (R() - .5) * 2; fl += `<path d="M${f(sx - 2)},${f(-11 + Math.abs(sx) * .08)} Q${f(sx + 4)},${f(-1)} ${f(sx - 1)},${f(11 - Math.abs(sx) * .1)}" stroke="${fat}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>`; }
    let br = '';
    if (browned) for (let i = 0; i < 7; i++) br += `<ellipse cx="${f(-15 + R() * 30)}" cy="${f(-8 + R() * 16)}" rx="${f(3 + R() * 5)}" ry="${f(2 + R() * 3)}" fill="#a85a1c" opacity="${f(browned * (.3 + R() * .4))}"/>`;
    const cid = p.uid();
    return `<g ${T(x, y, r, k)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><path d="${body}" fill="${p.g(flesh, .25, .3)}" stroke="${dk(flesh, .35)}" stroke-width=".8"/>
        ${chiai ? `<path d="M-10,-12 C-4,-6 6,-6 14,-11 C10,-4 -2,-2 -10,-12Z" fill="${chiai}" opacity=".85"/>` : ''}
        ${fl}${br}
        ${browned ? `<path d="${body}" fill="#c27a30" opacity="${f(browned * .45)}"/>` : ''}
        ${glazeC ? `<path d="${body}" fill="${glazeC}" opacity=".55"/>` : ''}
        <path d="M-21,-3 C-19,-12 -6,-15 6,-14 C15,-13 21,-8 22,-1 C20.6,-7.6 14.6,-11.4 6,-12.2 C-5,-13 -17,-10.4 -21,-3Z" fill="${p.g(skin, .35, .3)}" stroke="${dk(skin, .3)}" stroke-width=".5"/><path d="M-18.5,-6 C-14,-11.6 -4,-13.6 6,-13.2 C12,-12.6 17.5,-9.5 19.8,-5" stroke="${lt(skin, .5)}" stroke-width=".6" fill="none" opacity=".8"/>
        ${xjp_wa2Shine('M-15,-6 Q-6,-11 5,-10', 1.8, gloss)}${xjp_wa2Shine('M2,6 Q9,5 14,1', 1.1, gloss * .6)}</g>`;
}
// ししとう
function xjp_wa2Shishito(p, x, y, s, r = 0, { c = '#4f9a2c', char = true } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-12,-3.4 C-4,-5 6,-4.6 13,-1.6 Q15,0 13,1.6 C6,4.4 -4,4.8 -12,3.4Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-12,-3.6 Q-15,-3 -15,0 Q-15,3 -12,3.6 Q-13,0 -12,-3.6Z" fill="#6f9a3a" stroke="#3f6a22" stroke-width=".5"/>
        <path d="M-15,0 Q-18,-1 -19,-3" stroke="#8aae55" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        ${char ? '<ellipse cx="-3" cy="1.5" rx="3" ry="1.4" fill="#3b2a12" opacity=".35"/><ellipse cx="6" cy="-1" rx="2.4" ry="1.2" fill="#3b2a12" opacity=".3"/>' : ''}
        ${xjp_wa2Shine('M-9,-2.2 Q0,-3.6 9,-1.8', 1, .75)}</g>`;
}
// 厚みのある大根（半月・輪切り）を煮たもの。飴色で角に面取りの線
function xjp_wa2Daikon(p, x, y, s, r = 0, { c = '#d9a45a', shape = 'half' } = {}){
    const hs = s / 2;
    let d;
    if (shape === 'half') d = `M${-hs},${f(hs * .3)} A${hs},${f(hs * .95)} 0 0 1 ${hs},${f(hs * .3)} Q0,${f(hs * .42)} ${-hs},${f(hs * .3)}Z`;
    else if (shape === 'quarter') d = `M${f(-hs * .5)},${f(hs * .5)} L${f(-hs * .5)},${f(-hs * .9)} A${f(hs * 1.4)},${f(hs * 1.4)} 0 0 1 ${f(hs * .9)},${f(hs * .5)} Z`;
    else d = `M${-hs},0 A${hs},${f(hs * .92)} 0 1 1 ${hs},0 A${hs},${f(hs * .92)} 0 1 1 ${-hs},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.rg(c, .28, .25, .4, .4)}" stroke="${dk(c, .3)}" stroke-width=".8" stroke-linejoin="round"/></g>
        <path d="${d}" fill="none" stroke="${lt(c, .3)}" stroke-width="1.6" opacity=".35" transform="scale(.84)"/>
        <path d="${d}" fill="#fff8e4" opacity=".14" transform="scale(.55)"/>
        ${shape === 'half' ? xjp_wa2Shine(`M${f(-hs * .6)},${f(-hs * .1)} Q${f(-hs * .2)},${f(-hs * .6)} ${f(hs * .3)},${f(-hs * .55)}`, 1.6, .6) : shape === 'quarter' ? xjp_wa2Shine(`M${f(-hs * .3)},${f(-hs * .4)} Q${f(0)},${f(-hs * .65)} ${f(hs * .3)},${f(-hs * .45)}`, 1.4, .6) : xjp_wa2Shine(`M${f(-hs * .55)},${f(-hs * .3)} Q${f(-hs * .2)},${f(-hs * .66)} ${f(hs * .25)},${f(-hs * .62)}`, 1.8, .6)}</g>`;
}
// ぶつ切りの長ねぎを焼いた/煮たもの（側面から：長さ s）
function xjp_wa2NegiLog(p, x, y, s, r = 0, { c = '#e9e2c2', tip = '#a9c46a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-s / 2}" y="${f(-s * .2)}" width="${s}" height="${f(s * .4)}" rx="${f(s * .18)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .4)},${f(-s * .06)} L${f(s * .4)},${f(-s * .06)} M${f(-s * .4)},${f(s * .08)} L${f(s * .4)},${f(s * .08)}" stroke="${dk(c, .15)}" stroke-width=".5" opacity=".6"/>
        <ellipse cx="${f(s * .42)}" cy="0" rx="${f(s * .08)}" ry="${f(s * .17)}" fill="${tip}" opacity=".6"/>
        ${xjp_wa2Shine(`M${f(-s * .35)},${f(-s * .12)} L${f(s * .3)},${f(-s * .12)}`, 1.2, .7)}</g>`;
}
// 斜め切りの長ねぎ（煮たもの・やや透明）
function xjp_wa2NegiSlant(p, x, y, s, r = 0, { c = '#e6dcb4', green = false } = {}){
    const col = green ? '#9cc25a' : c;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${-s / 2},${f(-s * .14)} L${f(s * .3)},${f(-s * .18)} Q${f(s * .55)},0 ${f(s * .3)},${f(s * .18)} L${-s / 2},${f(s * .14)} Q${f(-s * .6)},0 ${-s / 2},${f(-s * .14)}Z" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .4)},${f(-s * .04)} L${f(s * .3)},${f(-s * .05)} M${f(-s * .4)},${f(s * .06)} L${f(s * .3)},${f(s * .06)}" stroke="${dk(col, .15)}" stroke-width=".5" opacity=".7"/>
        ${xjp_wa2Shine(`M${f(-s * .38)},${f(-s * .1)} L${f(s * .25)},${f(-s * .12)}`, 1, .7)}</g>`;
}
// 短冊のにんじん
function xjp_wa2Tanzaku(p, x, y, w, h, r = 0, { c = '#ec7b2d' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M${-w / 2 + 1.5},${-h / 2 + 1} L${w / 2 - 1.5},${-h / 2 + 1}" stroke="#fff" stroke-width=".7" opacity=".6"/></g>`;
}
// 焼き豆腐風（煮汁がしみた木綿豆腐）
function xjp_wa2Tofu(p, x, y, w, h, r = 0, { c = '#e8c98e' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .12)}" fill="${p.rg(c, .35, .3, .35, .35)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <rect x="${-w / 2 + 3}" y="${-h / 2 + 3}" width="${w - 6}" height="${h - 6}" rx="3" fill="#fbf2dc" opacity=".35"/>
        ${xjp_wa2Shine(`M${f(-w / 2 + 3)},${f(-h / 2 + 3)} L${f(w / 2 - 5)},${f(-h / 2 + 3)}`, 1.4, .8)}</g>`;
}
// 小さな青み（さやいんげん斜め切り・ほうれん草の束）
function xjp_wa2GreenBundle(p, x, y, w, h, r = 0, { c = '#3f8a2c' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .35)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <rect x="${f(w * .12)}" y="${f(-h / 2 + 1)}" width="${f(w * .38 - 1)}" height="${h - 2}" rx="${f(h * .3)}" fill="#a8cc6a" opacity=".85"/>
        <path d="M${f(-w / 2 + 3)},${f(-h * .15)} L${f(w * .1)},${f(-h * .15)} M${f(-w / 2 + 3)},${f(h * .18)} L${f(w * .1)},${f(h * .18)}" stroke="${dk(c, .3)}" stroke-width=".6" opacity=".6"/>
        ${xjp_wa2Shine(`M${f(-w / 2 + 3)},${f(-h * .3)} L${f(w * .05)},${f(-h * .3)}`, 1, .6)}</g>`;
}
// 薄切りの牛肉を煮たもの（ひらひら・脂の筋）。s は長さ
function xjp_wa2Beef(p, x, y, s, r = 0, { c = '#7a4426', seed = 1 } = {}){
    const R = rng(p.id + 'wbeef' + seed + x + y), k = s / 40;
    const pts = ring(11, 15, .5, R, 1.45, .95);
    const body = smooth(pts, true, .8);
    let folds = '';
    for (let i = 0; i < 4; i++){ const fx = -14 + i * 9 + (R() - .5) * 4; folds += `<path d="M${f(fx)},${f(-5 + R() * 2)} Q${f(fx + 3)},0 ${f(fx - 1)},${f(5 - R() * 2)}" stroke="${dk(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`; }
    return `<g ${T(x, y, r, k)}><path d="${body}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="M-15,2 Q-6,-1 2,2.5 T16,1 M-10,-5 Q-3,-3 6,-6" stroke="${mix(c, '#e8c89a', .5)}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>
        ${folds}
        ${xjp_wa2Shine('M-13,-4 Q-4,-7 7,-5', 1.4, .6)}</g>`;
}
// からし
function xjp_wa2Karashi(p, x, y, s){
    return `<g ${p.sh(.4)}><path ${T(x, y)} d="${smooth(ring(s / 2, 7, .3, rng(p.id + 'kar' + x), 1.1, .9))}" fill="${p.rg('#e7b928', .3, .2)}" stroke="#b88a10" stroke-width=".5"/></g><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .15)}" rx="${f(s * .15)}" ry="${f(s * .08)}" fill="#fff" opacity=".6"/>`;
}
// 青梗菜（茎の白緑と濃い葉）
function xjp_wa2Chingensai(p, x, y, s, r = 0){
    const k = s / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>
        <path d="M2,-9 C10,-14 22,-12 22,0 C22,12 10,14 2,9 Z" fill="${p.g('#2f7a2a', .3, .3)}" stroke="#1f5a1c" stroke-width=".6"/>
        <path d="M-20,-3 C-10,-6 0,-8 6,-7 L6,7 C0,8 -10,6 -20,3 Q-21,0 -20,-3Z" fill="${p.g('#cfe3a4', .3, .2)}" stroke="#8aa85a" stroke-width=".6"/></g>
        <path d="M-18,0 L6,0 M-14,-2.4 L4,-4 M-14,2.4 L4,4" stroke="#a9c87a" stroke-width=".7" opacity=".8"/>
        <path d="M6,0 Q14,-1 20,0" stroke="#6aa84a" stroke-width=".8" fill="none"/>
        ${xjp_wa2Shine('M-16,-2.6 L2,-5', 1, .7)}</g>`;
}
const xjp_lemonRound = (p, x, y, s) => `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#efc22e"/></g><circle r="${f(s / 2 - 1.8)}" fill="#fbeb94"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 3))},${f(Math.sin(i * .785) * (s / 2 - 3))}" stroke="#fffbe0" stroke-width="1.2"/>`).join('')}<circle r="2" fill="#fffbe0"/></g>`;
// 刻んだ長ねぎ（白〜薄緑の細かいみじん切り）
function xjp_chNegiBits(p, x, y, s, { n = 18, seed = 1, sy = .8 } = {}){
    const R = rng(p.id + 'ngb' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, w = 2.4 + R() * 2;
        const c = R() < .55 ? '#f4f6e6' : R() < .6 ? '#d6e7a8' : '#9cc65e';
        out += `<rect ${T(cx, cy, R() * 180)} x="${f(-w / 2)}" y="-1.3" width="${f(w)}" height="2.6" rx=".9" fill="${c}" stroke="${dk(c, .22)}" stroke-width=".35"/>`;
    }
    return out;
}
// 細切りの肉（青椒肉絲）
function xjp_chMeatStrips(p, x, y, s, { n = 14, seed = 1, c = '#8a5230', dir = null } = {}){
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
function xjp_chNoodles(p, x, y, s, { c = '#a88464', w = 2, n = 30, seed = 1, sy = .9, outline = null } = {}){
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

// =========================================================
// このファイルの部品（xjp_）
// =========================================================
// 散らす位置（円の中、決まった乱数）
const xjp_scatter = (seed, n, cx, cy, rad, sy = 1) => { const R = rng('xjp' + seed); return Array.from({ length: n }, () => { const a = R() * 6.28, d = Math.sqrt(R()) * rad; return [cx + Math.cos(a) * d, cy + Math.sin(a) * d * sy, R() * 360, R()]; }); };
// 汁・たれの小さな照り
const xjp_hi = (x, y, L, op = .6, w = 1.4) => `<path d="M${f(x)},${f(y)} q${f(L / 2)},${f(-L * .3)} ${f(L)},0" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// すき焼き鍋（黒い鉄の浅鍋、左右に耳）
function xjp_sukiPan(p){
    return `<g ${p.sh(2)}><path d="M4,92 Q2,100 4,108 L22,110 L22,90Z" fill="#2b2523"/><path d="M196,92 Q198,100 196,108 L178,110 L178,90Z" fill="#2b2523"/><circle cx="100" cy="100" r="90" fill="${p.rg('#3e3734', .16, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="86" fill="none" stroke="#5c5450" stroke-width="1.4"/>
        <circle cx="100" cy="100" r="83" fill="${p.rg('#241e1c', .1, .2, .62, .64)}"/>
        <path d="M28,62 A80,80 0 0 1 62,28" stroke="#9a908a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 焼き豆腐（表面に焼き色のまだら、側面は白）
function xjp_yakidofu(p, x, y, w, h, r = 0, { c = '#e9d2a2', soak = '#b97a3a' } = {}){
    const R = rng(p.id + 'ydf' + x + y);
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .7)}" rx="${f(w * (.08 + R() * .1))}" ry="${f(h * (.06 + R() * .08))}" fill="${soak}" opacity="${f(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .12)}" fill="${p.rg(c, .3, .28, .35, .35)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>${sp}
        <rect x="${f(-w / 2 + 1)}" y="${f(-h / 2 + 1)}" width="${w - 2}" height="${h - 2}" rx="${f(Math.min(w, h) * .1)}" fill="none" stroke="#fbf3e0" stroke-width="1.2" opacity=".55"/>
        ${xjp_wa2Shine(`M${f(-w / 2 + 4)},${f(-h / 2 + 3.5)} L${f(w / 2 - 6)},${f(-h / 2 + 3.5)}`, 1.4, .75)}</g>`;
}
// 煮た白菜（白い軸と、ちぢれた淡い緑の葉先）
function xjp_napa(p, x, y, s, r = 0, { cooked = true, seed = 1 } = {}){
    const R = rng(p.id + 'npa' + seed + x + y), k = s / 30;
    const leaf = smooth([[2, -9], [8, -12], [13, -9], [16, -4], [15, 2], [16, 7], [10, 11], [3, 9]].map(([a, b]) => [a + (R() - .5) * 1.5, b + (R() - .5) * 1.5]));
    const stem = cooked ? '#efe6c4' : '#f6f4e6', lc = cooked ? '#c9cf86' : '#b9dc7c';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${leaf}" fill="${p.g(lc, .25, .25)}" stroke="${dk(lc, .3)}" stroke-width=".6"/>
        <path d="M-15,-6 Q-4,-8.5 5,-8 L5,8 Q-4,8.5 -15,6 Q-16.5,0 -15,-6Z" fill="${p.g(stem, .3, .18)}" stroke="${dk(stem, .25)}" stroke-width=".6"/></g>
        <path d="M-13,-3 L4,-3.6 M-13,0 L4,0 M-13,3 L4,3.6" stroke="${dk(stem, .12)}" stroke-width=".6" opacity=".7"/>
        <path d="M5,0 Q10,-1 14,-1 M8,-5 L11,-8 M8,4 L11,7" stroke="${lt(lc, .4)}" stroke-width=".8" fill="none"/>
        ${xjp_wa2Shine('M-12,-4.6 L2,-5.8', 1.1, .7)}</g>`;
}
// しらたきの束
function xjp_shirataki(p, x, y, w, h, r = 0, { c = '#ede7d8', n = 12 } = {}){
    const R = rng(p.id + 'srt' + x + y);
    let d = '';
    for (let i = 0; i < n; i++){ const yy = (i / (n - 1) - .5) * h; d += `M${f(-w / 2 + R() * 4)},${f(yy + (R() - .5) * 2)} C${f(-w / 6)},${f(yy + (R() - .5) * 6)} ${f(w / 6)},${f(yy + (R() - .5) * 6)} ${f(w / 2 - R() * 4)},${f(yy + (R() - .5) * 3)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${d}" stroke="${dk(c, .28)}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/></g><path d="${d}" stroke="#fff" stroke-width=".6" fill="none" opacity=".6" transform="translate(-.4 -.5)"/></g>`;
}
// 春菊（深いぎざぎざの葉）
function xjp_shungiku(p, x, y, s, r = 0, { c = '#2f6e28' } = {}){
    const k = s / 30;
    const lobe = (a, L) => `<path transform="rotate(${a})" d="M0,0 Q${f(L * .3)},${f(-L * .25)} ${f(L * .45)},${f(-L * .1)} L${f(L * .55)},${f(-L * .3)} Q${f(L * .75)},${f(-L * .2)} ${f(L * .7)},${f(-L * .05)} L${L},0 L${f(L * .7)},${f(L * .08)} Q${f(L * .72)},${f(L * .26)} ${f(L * .55)},${f(L * .28)} L${f(L * .45)},${f(L * .1)} Q${f(L * .3)},${f(L * .25)} 0,0Z" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${lobe(-40, 14)}${lobe(10, 16)}${lobe(55, 13)}${lobe(-100, 11)}<path d="M-14,4 L2,0" stroke="#7aa84a" stroke-width="2" stroke-linecap="round"/></g></g>`;
}
// 衣の揚げ物（コロッケ・メンチ）: 小判形、パン粉のざらざら
function xjp_korokke(p, x, y, w, h, r = 0, { c = '#c9822e', seed = 1 } = {}){
    const R = rng(p.id + 'krk' + seed + x);
    const shape = smooth(ring(1, 14, .07, R, w / 2, h / 2));
    let bits = '';
    for (let i = 0; i < 46; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .88; bits += `<circle cx="${f(Math.cos(a) * d * w / 2)}" cy="${f(Math.sin(a) * d * h / 2)}" r="${f(.7 + R() * 1.1)}" fill="${R() < .5 ? lt(c, .45) : dk(c, .25)}" opacity=".85"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(2.2, .3)}><path d="${shape}" fill="${p.rg(c, .32, .38, .38, .34)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g></g>
        <g ${p.crumb(.85)}><path d="${shape}" fill="${lt(c, .1)}" opacity=".7" transform="scale(.9)"/></g>${bits}
        <path d="M${f(-w * .3)},${f(-h * .22)} Q${f(-w * .08)},${f(-h * .42)} ${f(w * .2)},${f(-h * .36)}" stroke="#fff6dc" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// えびフライ（まっすぐ伸ばした衣の胴と赤い尾）。L は全長、尾は +x 側
function xjp_ebiFry(p, x, y, L, r = 0, { c = '#d4913a', seed = 1 } = {}){
    const R = rng(p.id + 'ebf' + seed + x + y), W = L * .25;
    const body = smooth([[-L / 2, 0], [-L * .44, -W * .42], [-L * .2, -W * .55], [L * .1, -W * .5], [L * .3, -W * .3], [L * .34, 0], [L * .3, W * .3], [L * .1, W * .5], [-L * .2, W * .55], [-L * .44, W * .42]]);
    let bits = '';
    for (let i = 0; i < 16; i++) bits += `<circle cx="${f(-L * .44 + R() * L * .74)}" cy="${f((R() - .5) * W * .8)}" r="${f(.6 + R() * .9)}" fill="${R() < .5 ? lt(c, .5) : dk(c, .3)}" opacity=".85"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="M${f(L * .28)},0 L${f(L * .5)},${f(-W * .5)} Q${f(L * .45)},0 ${f(L * .5)},${f(W * .5)}Z" fill="${p.g('#e4502c', .3, .35)}" stroke="#9a2a16" stroke-width=".7" stroke-linejoin="round"/>
        <g ${p.rough(2, .25)}><path d="${body}" fill="${p.rg(c, .3, .38, .35, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g></g>
        <g ${p.crumb(.9)}><path d="${body}" fill="${lt(c, .1)}" opacity=".6" transform="scale(.92 .8)"/></g>${bits}
        <path d="M${f(L * .4)},${f(-W * .3)} L${f(L * .47)},${f(-W * .4)} M${f(L * .4)},${f(W * .3)} L${f(L * .47)},${f(W * .4)}" stroke="#ffb08a" stroke-width=".8" opacity=".8"/>
        <path d="M${f(-L * .35)},${f(-W * .28)} Q${f(-L * .1)},${f(-W * .45)} ${f(L * .15)},${f(-W * .34)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// タルタルソース（白いかたまりに卵・ピクルス・玉ねぎの粒）
function xjp_tartar(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'ttr' + seed + x);
    let bits = '';
    for (let i = 0; i < 12; i++){ const c = ['#f4d35a', '#7da84a', '#fbfaf0', '#f4d35a'][i % 4]; bits += `<rect ${T(x + (R() - .5) * s * .6, y + (R() - .5) * s * .5, R() * 180)} x="-1.4" y="-1" width="2.8" height="2" rx=".6" fill="${c}" stroke="${dk(c, .2)}" stroke-width=".3"/>`; }
    return `<g ${p.sh(.7)}><path ${T(x, y)} d="${smooth(ring(s / 2, 9, .25, R, 1.1, .85))}" fill="${p.rg('#fbf6e2', .3, .14)}" stroke="#ddd2b0" stroke-width=".6"/></g>${bits}<ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .18)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".9"/>`;
}
// はじかみ（酢漬けの葉しょうがの茎、先が紅）
function xjp_hajikami(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2)},-1.4 L${f(L * .2)},-1.6 L${f(L * .2)},1.6 L${f(-L / 2)},1.4Z" fill="${p.g('#eae4b8', .3, .2)}" stroke="#b9b07a" stroke-width=".4"/>
        <path d="M${f(L * .18)},-2.6 Q${f(L * .4)},-3.4 ${f(L / 2)},0 Q${f(L * .4)},3.4 ${f(L * .18)},2.6Z" fill="${p.g('#f2a0b4', .3, .25)}" stroke="#c4607a" stroke-width=".5"/></g>
        <path d="M${f(L * .22)},-1.4 Q${f(L * .36)},-1.9 ${f(L * .44)},-.6" stroke="#e0446a" stroke-width="1" fill="none"/></g>`;
}
// かじきの切り身（焼いた白っぽい身に、渦の筋と皮）
function xjp_kajiki(p, x, y, w, h, r = 0, { c = '#e9c590', seed = 1 } = {}){
    const R = rng(p.id + 'kjk' + seed + x);
    const pts = ring(1, 12, .1, R, w / 2, h / 2), shape = smooth(pts);
    const arcs = [.15, .4, .65].map(t => `M${f(-w * .42 + t * w * .5)},${f(-h * .45)} Q${f(-w * .05 + t * w * .55)},${f(-h * .05)} ${f(-w * .42 + t * w * .5)},${f(h * .45)}`).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${shape}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <g ${xjp_yoBlur(p, 2)}><path d="${shape}" fill="none" stroke="#b9732a" stroke-width="5" opacity=".55" transform="scale(.94)"/><ellipse cx="${f(w * .1)}" cy="${f(h * .05)}" rx="${f(w * .2)}" ry="${f(h * .14)}" fill="#c58038" opacity=".35"/></g>
        <path d="${arcs}" stroke="${dk(c, .2)}" stroke-width="1" fill="none" opacity=".55"/>
        <path d="M${f(w * .36)},${f(-h * .34)} Q${f(w * .52)},0 ${f(w * .36)},${f(h * .34)}" stroke="#5a5048" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".75"/>
        ${xjp_wa2Shine(`M${f(-w * .3)},${f(-h * .26)} Q${f(-w * .05)},${f(-h * .44)} ${f(w * .2)},${f(-h * .34)}`, 2, .7)}</g>`;
}
// 揚げたあじ（片栗粉の薄い衣、ところどころ銀の皮）
function xjp_ajiPiece(p, x, y, w, h, r = 0, { c = '#dcaa5c', seed = 1 } = {}){
    const R = rng(p.id + 'aji' + seed + x + y);
    const shape = smooth(ring(1, 10, .16, R, w / 2, h / 2));
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(1.6, .25)}><path d="${shape}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g></g>
        <path d="M${f(-w * .4)},${f(-h * .1)} Q0,${f(-h * .42)} ${f(w * .42)},${f(-h * .14)} Q0,${f(-h * .2)} ${f(-w * .4)},${f(-h * .1)}Z" fill="${p.g('#8a98a2', .35, .3)}" opacity=".9"/>
        <g ${p.crumb(1.1)}><path d="${shape}" fill="${lt(c, .2)}" opacity=".5" transform="scale(.85)"/></g>
        ${xjp_wa2Shine(`M${f(-w * .3)},${f(-h * .25)} Q0,${f(-h * .44)} ${f(w * .25)},${f(-h * .3)}`, 1.3, .6)}</g>`;
}
// ふんわり焼いた丸い卵（かに玉・ニラ玉）: ふちが波打ち、焼き色のまだら
function xjp_eggCake(p, x, y, s, { c = '#f7cd4a', seed = 1, brown = .5, sy = .92 } = {}){
    const R = rng(p.id + 'egc' + seed + x);
    const pts = ring(s / 2, 18, .14, R, 1, sy), shape = smooth(pts);
    let br = '';
    for (let i = 0; i < 9; i++) br += `<ellipse cx="${f((R() - .5) * s * .7)}" cy="${f((R() - .5) * s * .6)}" rx="${f(s * (.06 + R() * .1))}" ry="${f(s * (.04 + R() * .06))}" fill="#d9952a" opacity="${f(brown * (.25 + R() * .35))}"/>`;
    let fl = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .35; fl += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d * sy)} d="${smooth(ring(s * (.06 + R() * .06), 8, .4, R))}" fill="${lt(c, .45)}" opacity=".7"/>`; }
    return `<g ${p.sh(1.2)}><g ${p.rough(3, .1)}><path ${T(x, y)} d="${shape}" fill="${p.rg(c, .35, .22, .38, .34)}" stroke="${dk(c, .25)}" stroke-width=".8"/></g></g>
        <g ${T(x, y)}><g ${xjp_yoBlur(p, 1.6)}>${br}</g></g>${fl}`;
}
// かに風味かまぼこ（ほぐした白い身、上が赤）
function xjp_crab(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s * .14)}" width="${s}" height="${f(s * .28)}" rx="${f(s * .1)}" fill="${p.g('#fbf3ea', .2, .15)}" stroke="#dccfc0" stroke-width=".4"/><rect x="${f(-s / 2)}" y="${f(-s * .14)}" width="${s}" height="${f(s * .13)}" rx="${f(s * .06)}" fill="${p.g('#e8462e', .25, .2)}"/></g>`;
}
// 焼いた豆腐ステーキ（上面がきつね色、ふちに白い側面）
function xjp_tofuSteak(p, x, y, w, h, r = 0, { c = '#e2ac5a', seed = 1 } = {}){
    const R = rng(p.id + 'tfs' + seed + x);
    let sp = '';
    for (let i = 0; i < 8; i++) sp += `<ellipse cx="${f((R() - .5) * w * .75)}" cy="${f((R() - .5) * h * .75)}" rx="${f(w * (.08 + R() * .12))}" ry="${f(h * (.05 + R() * .08))}" fill="${R() < .6 ? '#b8722a' : '#f0cf8c'}" opacity="${f(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><rect x="${f(-w / 2 + 2)}" y="${f(-h / 2 + 7)}" width="${w}" height="${h}" rx="6" fill="${p.g('#f6f0e0', .2, .2)}" stroke="#cfc1a0" stroke-width=".7"/></g>
        <rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="6" fill="${p.rg(c, .3, .3, .38, .36)}" stroke="${dk(c, .35)}" stroke-width=".8"/>
        <g ${xjp_yoBlur(p, 2.4)}>${sp}</g>
        ${xjp_wa2Shine(`M${f(-w / 2 + 6)},${f(-h / 2 + 5)} L${f(w / 2 - 10)},${f(-h / 2 + 5)}`, 1.8, .55)}</g>`;
}
// 西京焼き・照り焼きの切り身（四角に近い身、上の縁に銀の皮、焦げ目のまだら）
function xjp_grillFillet(p, x, y, w, h, r = 0, { flesh = '#efd4a0', skin = '#8c949c', char = '#6a3010', charK = 1, seed = 1, glazeC = null, lines = true, lineC = null, nChar = 9 } = {}){
    const R = rng(p.id + 'gfl' + seed + x);
    const pts = [[-w / 2, -h * .3], [-w * .3, -h / 2], [w * .2, -h / 2], [w / 2, -h * .38], [w / 2 + 2, h * .1], [w * .42, h / 2], [-w * .2, h / 2 + 1], [-w / 2 - 1, h * .25]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    const shape = smooth(pts, true, .8);
    const cid = p.uid();
    let ch = '';
    for (let i = 0; i < nChar; i++){ const a = R() * 6.28, d = .45 + Math.sqrt(R()) * .5; ch += `<path ${T(Math.cos(a) * d * w / 2, Math.sin(a) * d * h / 2, R() * 180)} d="${smooth(ring(Math.min(w, h) * (.06 + R() * .07), 7, .5, R, 1.4, .8))}" fill="${char}" opacity="${f(charK * (.3 + R() * .35))}"/>`; }
    const fl = [-.3, -.1, .1, .3].map(t => `M${f(t * w - 3)},${f(-h * .3)} Q${f(t * w + 5)},${f(h * .05)} ${f(t * w - 2)},${f(h * .45)}`).join('');
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${shape}"/></clipPath></defs> <g ${p.sh(1.2)}><path d="${shape}" fill="${p.rg(flesh, .35, .35, .4, .4)}" stroke="${dk(flesh, .45)}" stroke-width=".9"/></g>
        <g clip-path="url(#${cid})"><path d="${lines ? fl : ''}" stroke="${lineC || lt(flesh, .45)}" stroke-width="1.6" fill="none" opacity=".7"/>
        <g ${xjp_yoBlur(p, 3)}><path d="${shape}" fill="none" stroke="${char}" stroke-width="10" opacity="${f(.45 * charK)}"/></g><g ${p.rough(2, .3)}>${ch}</g>
        ${skin ? `<rect x="${f(-w / 2 - 4)}" y="${f(-h / 2 - 4)}" width="${w + 8}" height="${f(h * .14 + 4)}" fill="${p.g(skin, .35, .3)}"/><path d="M${f(-w / 2)},${f(-h * .36)} L${f(w / 2)},${f(-h * .36)}" stroke="${lt(skin, .5)}" stroke-width=".8" opacity=".8"/>` : ''}
        ${glazeC ? `<path d="${shape}" fill="${glazeC}" opacity=".45"/>` : ''}</g>
        ${xjp_wa2Shine(`M${f(-w * .34)},${f(-h * .12)} Q${f(-w * .05)},${f(-h * .24)} ${f(w * .26)},${f(-h * .14)}`, 2, .6)}</g>`;
}
// ソースのかかり（不定形の照りのある帯）
function xjp_sauceBlob(p, x, y, w, h, r = 0, { c = '#5a2810', seed = 1, op = .95 } = {}){
    const R = rng(p.id + 'sbl' + seed + x);
    const pts = ring(1, 12, .35, R, w / 2, h / 2);
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="${p.g(c, .25, .2)}" opacity="${op}"/><path d="M${f(-w * .3)},${f(-h * .15)} Q${f(-w * .05)},${f(-h * .35)} ${f(w * .2)},${f(-h * .2)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 煮込んだ牛肉のかたまり（ビーフシチュー）: 角の丸いでこぼこの塊、繊維の筋と照り
function xjp_beefChunk(p, x, y, s, r = 0, { c = '#5e2a16', seed = 1 } = {}){
    const R = rng(p.id + 'bch' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.15, .9), shape = smooth(pts, true, .7);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(1.6, .2)}><path d="${shape}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g></g>
        <path d="M${f(-s * .3)},${f(-s * .05)} q${f(s * .2)},${f(-s * .06)} ${f(s * .5)},${f(s * .02)} M${f(-s * .25)},${f(s * .14)} q${f(s * .2)},${f(-s * .05)} ${f(s * .42)},0" stroke="${dk(c, .45)}" stroke-width="1" fill="none" opacity=".6"/>
        ${xjp_wa2Shine(`M${f(-s * .28)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .36)} ${f(s * .2)},${f(-s * .26)}`, 1.6, .65)}</g>`;
}
// マッシュルームの縦切り
function xjp_mushroom(p, x, y, s, r = 0, { c = '#e6d4b4' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,0 Q-10,-9 0,-9 Q10,-9 10,0 Q10,2.5 6,2.5 L3.5,2.5 L4,9 Q0,10.5 -4,9 L-3.5,2.5 L-6,2.5 Q-10,2.5 -10,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M-8.5,-.5 Q-8,-7 0,-7.5 Q8,-7 8.5,-.5" stroke="${dk(c, .25)}" stroke-width="1" fill="none" opacity=".55"/>
        <path d="M-6,-5 Q-2,-7.4 3,-6.8" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 天ぷらの衣（具の形のまわりに、ふちがちりちりの淡い金色）。inner には具の SVG を渡す
function xjp_tempuraBatter(p, x, y, w, h, r = 0, inner = '', { seed = 1, c = '#efcf82', show = .6 } = {}){
    const R = rng(p.id + 'tpb' + seed + x + y);
    const shape = smooth(ring(1, 16, .18, R, w / 2, h / 2));
    let bits = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28; bits += `<path ${T(Math.cos(a) * w * .5, Math.sin(a) * h * .5)} d="${smooth(ring(2 + R() * 3, 6, .5, R))}" fill="${lt(c, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(3.2, .16)}><path d="${shape}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>${bits}</g>
        <g opacity="${show}">${inner}</g>
        <g ${p.crumb(1.2)}><path d="${shape}" fill="${lt(c, .3)}" opacity=".45" transform="scale(.9)"/></g>
        <path d="M${f(-w * .3)},${f(-h * .25)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .22)},${f(-h * .32)}" stroke="#fffbe8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// アスパラの豚肉巻き（照り焼き、片側から穂先がのぞく、反対側は切り口）
function xjp_asparaRoll(p, x, y, L, r = 0, { c = '#a8622c', seed = 1, tip = true } = {}){
    const W = L * .3, R = rng(p.id + 'asr' + seed + x);
    let wr = '';
    for (let i = 0; i < 4; i++){ const xx = -L * .38 + i * L * .2 + (R() - .5) * 3; wr += `<path d="M${f(xx)},${f(-W / 2)} Q${f(xx + W * .5)},0 ${f(xx + 2)},${f(W / 2)}" stroke="${dk(c, .35)}" stroke-width="1.2" fill="none" opacity=".7"/><path d="M${f(xx + 2.4)},${f(-W / 2 + 1)} Q${f(xx + W * .5 + 2.4)},0 ${f(xx + 4)},${f(W / 2 - 1)}" stroke="#e8c49a" stroke-width="1.4" fill="none" opacity=".6"/>`; }
    const tipD = `M${f(L * .42)},${f(-W * .3)} L${f(L * .56)},${f(-W * .26)} Q${f(L * .66)},0 ${f(L * .56)},${f(W * .26)} L${f(L * .42)},${f(W * .3)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${tip ? `<path d="${tipD}" fill="${p.g('#6aa83a', .3, .3)}" stroke="#3f7a22" stroke-width=".6"/>` : ''}
        <rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${f(L * .94)}" height="${f(W)}" rx="${f(W * .45)}" fill="${p.g(c, .32, .35)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        ${tip ? `<path d="M${f(L * .5)},${f(-W * .14)} l3,-1.6 M${f(L * .5)},${f(W * .14)} l3,1.6 M${f(L * .55)},0 l3,0" stroke="#3f7a22" stroke-width=".8"/>` : ''}
        ${wr}
        <ellipse cx="${f(-L / 2 + W * .3)}" cy="0" rx="${f(W * .3)}" ry="${f(W * .4)}" fill="${p.rg('#8cc45a', .3, .25)}" stroke="#4f8a2c" stroke-width=".8"/><ellipse cx="${f(-L / 2 + W * .3)}" cy="0" rx="${f(W * .14)}" ry="${f(W * .18)}" fill="#c8e49a"/>
        ${xjp_wa2Shine(`M${f(-L * .25)},${f(-W * .3)} L${f(L * .3)},${f(-W * .3)}`, 1.8, .7)}</g>`;
}
// つくね（照り焼きの小判形、刻みねぎがのぞく）
function xjp_tsukune(p, x, y, w, h, r = 0, { c = '#8a4a1c', seed = 1 } = {}){
    const R = rng(p.id + 'tsk' + seed + x);
    const shape = smooth(ring(1, 12, .1, R, w / 2, h / 2));
    let bits = '';
    for (let i = 0; i < 8; i++) bits += `<rect ${T((R() - .5) * w * .7, (R() - .5) * h * .6, R() * 180)} x="-1.6" y="-.9" width="3.2" height="1.8" rx=".6" fill="${R() < .5 ? '#e8e2bc' : '#a8c46a'}" opacity=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(1.4, .2)}><path d="${shape}" fill="${p.rg(c, .3, .35, .38, .34)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g></g>${bits}
        ${xjp_wa2Shine(`M${f(-w * .3)},${f(-h * .2)} Q${f(-w * .05)},${f(-h * .4)} ${f(w * .24)},${f(-h * .3)}`, 2.6, .75)}${xjp_wa2Shine(`M${f(w * .05)},${f(h * .22)} Q${f(w * .2)},${f(h * .18)} ${f(w * .3)},${f(h * .06)}`, 1.2, .45)}</g>`;
}
// レバー（薄切りを炒めたもの: 濃い赤茶、つや）
function xjp_liver(p, x, y, s, r = 0, { c = '#6e2c1e', seed = 1 } = {}){
    const R = rng(p.id + 'lvr' + seed + x + y);
    const shape = smooth(ring(s / 2, 9, .3, R, 1.25, .75), true, .8);
    return `<g ${T(x, y, r)}><path d="${shape}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${shape}" fill="#b8642a" opacity=".2" transform="scale(.7)"/>
        ${xjp_wa2Shine(`M${f(-s * .35)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .26)} ${f(s * .2)},${f(-s * .18)}`, 1.4, .7)}</g>`;
}
// ニラ（4cm に切った平たい葉の束）
function xjp_nira(p, x, y, s, { n = 14, seed = 1, c = '#3f8a2c' } = {}){
    const R = rng(p.id + 'nir' + seed + x + y);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * (.35 + R() * .2), cx = x + (R() - .5) * s * .8, cy = y + (R() - .5) * s * .7, b = (R() - .5) * 6;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
        const seg = `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx + b)} ${f1(cy - b)} ${f1(cx + dx)} ${f1(cy + dy)}`;
        if (R() < .4) dl += seg; else d += seg;
    }
    return `<g ${p.sh(.5)} fill="none" stroke-linecap="round"><path d="${d}${dl}" stroke="${dk(c, .35)}" stroke-width="4.4"/><path d="${d}" stroke="${c}" stroke-width="3.2"/><path d="${dl}" stroke="${lt(c, .2)}" stroke-width="3.2"/></g><path d="${d}" stroke="#bfe39a" stroke-width=".7" fill="none" opacity=".6" transform="translate(-.5 -.6)"/>`;
}
// きくらげ（黒く波打つ）
function xjp_kikurage(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'kkr' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 10, .4, R, 1.2, .85))}" fill="${p.g('#3a2c26', .25, .2)}" stroke="#1e1612" stroke-width=".6"/><path d="M${f(-s * .3)},0 Q0,${f(-s * .2)} ${f(s * .3)},${f(s * .05)}" stroke="#6a5a52" stroke-width=".9" fill="none" opacity=".8"/></g>`;
}
// 半熟のとじ卵（白身の白と黄身の黄色がまだらの、ふちがやわらかい面）
function xjp_tojiEgg(p, x, y, s, { seed = 1, n = 12 } = {}){
    const R = rng(p.id + 'tje' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .4, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = s * (.08 + R() * .1);
        const c = R() < .55 ? '#f7cf48' : R() < .6 ? '#fbf2d4' : '#f9e08a';
        out += `<path ${T(cx, cy)} d="${smooth(ring(rr, 9, .45, R, 1.25, .85))}" fill="${p.g(c, .35, .12)}" stroke="${dk(c, .12)}" stroke-width=".5" opacity=".93"/>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}
// 細切りの薄焼き卵（錦糸卵）
function xjp_kinshi(p, x, y, s, { n = 60, seed = 1, sy = 1 } = {}){
    return `<g ${p.sh(.5)}>${xjp_erShreds(p, x, y, s, { c: '#f6d04a', n, w: 2.2, len: .3, seed, curve: .5, sy })}</g>`;
}
// ゆでえび（殻をむいて開いた、赤と白のしま）
function xjp_boiledShrimp(p, x, y, s, r = 0){
    const k = s / 24;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-12,2 C-13,-6 -6,-11 2,-10.5 C9,-10 12.5,-5 11.5,1 C10.5,6 6,7 4,3.5 C2,0 -2,-2 -5,1 C-7,4 -10,6 -12,2Z" fill="#fbf1e8" stroke="#d9a090" stroke-width=".7"/></g>
        <path d="M-10.5,0 C-11,-6 -5,-9.6 2,-9.2 C8,-8.8 11,-5 10.4,0 Q6,-4 2,-4.6 Q-4,-5 -10.5,0Z" fill="${p.g('#ec5a3a', .25, .2)}"/>
        <path d="M-7,-6 Q-5,-3 -7.5,-1 M-2,-8.4 Q-1,-5 -3,-3 M3,-8.6 Q3.5,-5.4 1.5,-4 M7.5,-6.6 Q6.6,-3.6 4.8,-3" stroke="#fde6dc" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M-12,2 L-15.5,5.5 L-11,6.5Z" fill="#e2452a"/></g>`;
}
// 生の卵黄（白い小皿にのせない、つやのある黄身だけ）
function xjp_zsRawEggYolk(p, x, y, s){
    return `<g ${p.sh(.7)}><circle cx="${x}" cy="${y}" r="${f(s / 2)}" fill="${p.rg('#f7a51c', .35, .2, .35, .32)}" stroke="#d07d10" stroke-width=".8"/></g><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .17)}" rx="${f(s * .16)}" ry="${f(s * .09)}" fill="#fff" opacity=".85" transform="rotate(-30 ${f(x - s * .15)} ${f(y - s * .17)})"/>`;
}
// えびの天ぷら（細長くちりちりの衣、赤い尾）。L は全長、尾は +x 側
function xjp_ebiTen(p, x, y, L, r = 0, { seed = 1, c = '#ebc677' } = {}){
    const R = rng(p.id + 'ebt' + seed + x), W = L * .24;
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.28, cx = Math.cos(a), sy = Math.sin(a); const taper = cx > 0 ? 1 - cx * .35 : 1; return [cx * L * .4, sy * W / 2 * taper * (1 + (R() - .5) * .3)]; });
    const shape = smooth(pts);
    let bits = '';
    for (let i = 0; i < 9; i++){ const t = R() * 6.28; bits += `<path ${T(Math.cos(t) * L * .38, Math.sin(t) * W * .55)} d="${smooth(ring(1.6 + R() * 2.6, 6, .5, R))}" fill="${lt(c, .15)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="M${f(L * .34)},0 L${f(L * .54)},${f(-W * .45)} Q${f(L * .48)},0 ${f(L * .54)},${f(W * .45)}Z" fill="${p.g('#e04a2a', .3, .3)}" stroke="#902410" stroke-width=".7" stroke-linejoin="round"/>
        <g ${p.rough(3, .18)}><path d="${shape}" fill="${p.g(c, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>${bits}</g>
        <path d="M${f(-L * .3)},${f(W * .05)} Q0,${f(-W * .1)} ${f(L * .3)},${f(W * .05)}" stroke="#f2a888" stroke-width="${f(W * .3)}" fill="none" stroke-linecap="round" opacity=".35"/>
        <g ${p.crumb(1.2)}><path d="${shape}" fill="${lt(c, .3)}" opacity=".45" transform="scale(.9)"/></g>
        <path d="M${f(-L * .28)},${f(-W * .25)} Q0,${f(-W * .42)} ${f(L * .2)},${f(-W * .3)}" stroke="#fffbe8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// なすの縦半分（皮のふちが紫、切り口に田楽みそ）
function xjp_nasuHalf(p, x, y, L, W, r = 0, { miso = '#8a4a1c', seed = 1 } = {}){
    const R = rng(p.id + 'nsh' + seed + x);
    const shape = smooth([[-L / 2, 0], [-L * .42, -W * .38], [-L * .1, -W * .45], [L * .25, -W * .5], [L * .46, -W * .32], [L / 2, 0], [L * .46, W * .32], [L * .25, W * .5], [-L * .1, W * .45], [-L * .42, W * .38]]);
    let grid = '';
    for (let i = -3; i <= 3; i++) grid += `M${f(i * L * .11 - W * .3)},${f(-W * .4)} l${f(W * .6)},${f(W * .8)} M${f(i * L * .11 + W * .3)},${f(-W * .4)} l${f(-W * .6)},${f(W * .8)}`;
    const cid = p.uid();
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${shape}" transform="scale(.86 .78)"/></clipPath></defs>
        <g ${p.sh(1.2)}><path d="${shape}" fill="${p.g('#4a2458', .3, .25)}" stroke="#2b1433" stroke-width=".8"/></g>
        <path d="${shape}" transform="scale(.9 .84)" fill="${p.g('#d9b070', .2, .25)}"/>
        <g clip-path="url(#${cid})"><rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${W}" fill="${p.rg(miso, .3, .3)}"/><path d="${grid}" stroke="${dk(miso, .35)}" stroke-width="1" opacity=".45"/></g>
        ${xjp_wa2Shine(`M${f(-L * .32)},${f(-W * .18)} Q${f(-L * .05)},${f(-W * .34)} ${f(L * .26)},${f(-W * .22)}`, 2.2, .7)}
        ${xjp_wa2Shine(`M${f(-L * .4)},${f(-W * .3)} Q${f(-L * .1)},${f(-W * .5)} ${f(L * .3)},${f(-W * .46)}`, 1.2, .5)}</g>`;
}
// 高野豆腐（だしを含んだ淡い黄の角、細かい穴）
function xjp_koya(p, x, y, w, h, r = 0, { c = '#ecd49a', seed = 1 } = {}){
    const R = rng(p.id + 'kya' + seed + x);
    let d = '';
    for (let i = 0; i < 26; i++) d += `M${f1((R() - .5) * (w - 6))} ${f1((R() - .5) * (h - 6))}h${f1(.8 + R())}`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .14)}" fill="${p.rg(c, .3, .25, .38, .36)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${d}" stroke="${dk(c, .25)}" stroke-width="1" stroke-linecap="round" opacity=".55"/>
        ${xjp_wa2Shine(`M${f(-w / 2 + 4)},${f(-h / 2 + 3.5)} L${f(w / 2 - 6)},${f(-h / 2 + 3.5)}`, 1.4, .8)}</g>`;
}
// 鉄のスキレット（右に取っ手）
function xjp_skillet(p){
    return `<g ${p.sh(2)}><rect x="160" y="92" width="40" height="16" rx="7" fill="${p.g('#3a3432', .2, .3)}"/><circle cx="96" cy="100" r="86" fill="${p.rg('#3b3533', .18, .3, .35, .3)}"/></g>
        <circle cx="96" cy="100" r="80" fill="none" stroke="#5a5450" stroke-width="1.4"/>
        <circle cx="96" cy="100" r="77" fill="${p.rg('#2a2422', .1, .2, .62, .64)}"/>
        <path d="M28,64 A76,76 0 0 1 60,32" stroke="#8a827c" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 焼いたじゃがいも（くし形・角切り、角に焼き色）
function xjp_friedPotato(p, x, y, s, r = 0, { seed = 1, c = '#efc970' } = {}){
    const R = rng(p.id + 'fpt' + seed + x + y);
    const pts = ring(s / 2, 6, .25, R, 1.2, .9), shape = smooth(pts, true, .45);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${shape}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <g ${xjp_yoBlur(p, 1.6)}><path d="${shape}" fill="none" stroke="#b8701e" stroke-width="4" opacity=".55" transform="scale(.9)"/><ellipse cx="${f(s * .1)}" cy="${f(s * .08)}" rx="${f(s * .18)}" ry="${f(s * .1)}" fill="#c8802a" opacity=".4"/></g>
        ${xjp_wa2Shine(`M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .24)}`, 1.4, .65)}</g>`;
}
// ふんわり炒めた卵の大きなかたまり（ひだのある黄色、ところどころ白身と焼き色）
function xjp_scrambleBig(p, x, y, s, { seed = 1, n = 8 } = {}){
    const R = rng(p.id + 'scb' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .32, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = s * (.16 + R() * .1);
        const c = R() < .8 ? '#f8d050' : '#fbeeb8';
        out += `<g ${T(cx, cy, R() * 360)}><path d="${smooth(ring(rr, 10, .38, R, 1.25, .85))}" fill="${p.g(c, .38, .18)}" stroke="${dk(c, .2)}" stroke-width=".6"/><path d="M${f(-rr * .5)},${f(-rr * .1)} Q0,${f(-rr * .4)} ${f(rr * .5)},${f(-rr * .15)}" stroke="${dk(c, .15)}" stroke-width=".9" fill="none" opacity=".6"/><ellipse cx="${f(rr * .2)}" cy="${f(rr * .2)}" rx="${f(rr * .25)}" ry="${f(rr * .12)}" fill="#e2a23a" opacity=".3"/><path d="M${f(-rr * .55)},${f(-rr * .35)} Q${f(-rr * .2)},${f(-rr * .6)} ${f(rr * .2)},${f(-rr * .5)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
    }
    return `<g ${p.sh(.8)}>${out}</g>`;
}
// タンドリーチキン（不定形の鶏もも、赤橙のスパイスと黒い焦げ）
function xjp_tandoori(p, x, y, s, r = 0, { c = '#d4582a', seed = 1 } = {}){
    const R = rng(p.id + 'tdr' + seed + x);
    const shape = smooth(ring(s / 2, 11, .3, R, 1.2, .85), true, .85);
    let ch = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = .55 + R() * .4; ch += `<path ${T(Math.cos(a) * d * s * .55, Math.sin(a) * d * s * .4, R() * 180)} d="${smooth(ring(s * (.04 + R() * .05), 6, .5, R, 1.5, .7))}" fill="#2a0e04" opacity="${f(.45 + R() * .3)}"/>`; }
    let sp = '';
    for (let i = 0; i < 10; i++) sp += `<circle cx="${f((R() - .5) * s * .8)}" cy="${f((R() - .5) * s * .5)}" r="${f(.6 + R() * .8)}" fill="${R() < .5 ? '#f4c08a' : '#8a2a10'}" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(2.4, .14)}><path d="${shape}" fill="${p.rg(c, .3, .4, .4, .38)}" stroke="#5a1a08" stroke-width=".9"/></g></g>
        <g ${xjp_yoBlur(p, 2.6)}><path d="${shape}" fill="none" stroke="#3a1206" stroke-width="7" opacity=".55" transform="scale(.94)"/></g>
        <g ${p.rough(1.5, .3)}>${ch}</g>${sp}
        ${xjp_wa2Shine(`M${f(-s * .32)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .28)} ${f(s * .16)},${f(-s * .22)}`, 1.6, .5)}</g>`;
}
// カリッと焼いたベーコン（波打つ赤身と脂の帯）
function xjp_crispBacon(p, x, y, L, w, r = 0){
    const d = `M${f(-L / 2)},${f(-w / 2)} Q${f(-L / 4)},${f(-w / 2 - 3)} 0,${f(-w / 2)} T${f(L / 2)},${f(-w / 2)} L${f(L / 2)},${f(w / 2)} Q${f(L / 4)},${f(w / 2 + 3)} 0,${f(w / 2)} T${f(-L / 2)},${f(w / 2)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${d}" fill="${p.g('#a84a2c', .25, .3)}" stroke="#6a2414" stroke-width=".6"/></g>
        <path d="M${f(-L / 2 + 1)},${f(-w * .05)} Q${f(-L / 4)},${f(-w * .25)} 0,${f(-w * .05)} T${f(L / 2 - 1)},${f(-w * .05)}" stroke="#f2cfa6" stroke-width="${f(w * .22)}" fill="none" opacity=".9"/>
        <path d="M${f(-L / 2 + 1)},${f(w * .3)} Q${f(-L / 4)},${f(w * .15)} 0,${f(w * .3)} T${f(L / 2 - 1)},${f(w * .3)}" stroke="#e8b48a" stroke-width="${f(w * .12)}" fill="none" opacity=".7"/></g>`;
}
// ふんわりした溶き卵（xjp_zsEgg の軽い版: 点を減らし小数1桁）
function xjp_softEgg(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'sfe' + seed + x + y);
    const pts = ring(L / 2, 11, .45, R, 1, .5);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${xjp_erSmooth(pts)}" fill="${lt(c, .35)}" opacity=".6"/><path d="${xjp_erSmooth(pts.map(([a, b]) => [a * .78, b * .7]))}" fill="${p.g(c, .35, .12)}"/></g>
        <path d="${xjp_erSmooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]))}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// かいわれ大根（白い軸と小さな双葉）
function xjp_kaiware(p, x, y, s, { n = 10, seed = 1 } = {}){
    const R = rng(p.id + 'kwr' + seed + x);
    let st = '', lv = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, L = s * (.3 + R() * .2), cx = x + (R() - .5) * s * .5, cy = y + (R() - .5) * s * .5, ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L;
        st += `M${f1(cx)} ${f1(cy)}L${f1(ex)} ${f1(ey)}`;
        lv += `<g ${T(ex, ey, a * 57.3)}><ellipse cx="2" cy="-2.2" rx="3.2" ry="2" fill="#6ab03a" stroke="#3f7a22" stroke-width=".4"/><ellipse cx="2" cy="2.2" rx="3.2" ry="2" fill="#7cc046" stroke="#3f7a22" stroke-width=".4"/></g>`;
    }
    return `<g ${p.sh(.5)}><path d="${st}" stroke="#d8d4bc" stroke-width="2.2" stroke-linecap="round"/><path d="${st}" stroke="#f8f8ee" stroke-width="1.4" stroke-linecap="round"/>${lv}</g>`;
}
// ちりめんじゃこ（小さな白い魚、黒い目）
function xjp_jako(p, x, y, s, { n = 30, seed = 1 } = {}){
    const R = rng(p.id + 'jko' + seed + x);
    let b = '', e = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, ang = R() * 6.28, L = 5 + R() * 3, bd = (R() - .5) * 3;
        const hx = cx + Math.cos(ang) * L / 2, hy = cy + Math.sin(ang) * L / 2;
        b += `M${f1(cx - Math.cos(ang) * L / 2)} ${f1(cy - Math.sin(ang) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(hx)} ${f1(hy)}`;
        e += `M${f1(hx)} ${f1(hy)}h.1`;
    }
    return `<g fill="none" stroke-linecap="round"><path d="${b}" stroke="#c9bfa2" stroke-width="2.6"/><path d="${b}" stroke="#f6f0dc" stroke-width="1.7"/><path d="${e}" stroke="#2a2420" stroke-width="1.5"/></g>`;
}
// 粉ふきいも（角がほろりと白く粉をふいたじゃがいも）
function xjp_kofuki(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'kfk' + seed + x + y);
    const pts = ring(s / 2, 7, .3, R, 1.1, .95, R()), shape = smooth(pts, true, .5);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><g ${p.rough(1.6, .35)}><path d="${shape}" fill="${p.rg('#ecc874', .35, .25, .4, .38)}" stroke="#c09a50" stroke-width=".7"/></g></g>
        <g ${p.rough(2.4, .4)}><path d="${smooth(pts.map(([a, b]) => [a * .8 - 1.4, b * .8 - 1.4]), true, .5)}" fill="#fffaec" opacity=".75"/></g>
        <g ${p.crumb(1.4)}><path d="${shape}" fill="#f8ecc8" opacity=".5"/></g></g>`;
}
// にんじんのグラッセ（面取りした厚い輪切り、バターのつや）
function xjp_glace(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><ellipse rx="${f(s / 2)}" ry="${f(s * .46)}" fill="${p.rg('#ee7a22', .3, .3, .38, .36)}" stroke="#b8501a" stroke-width=".7"/></g>
        <ellipse rx="${f(s * .38)}" ry="${f(s * .34)}" fill="none" stroke="#f6a050" stroke-width="${f(s * .08)}" opacity=".7"/>
        <ellipse rx="${f(s * .16)}" ry="${f(s * .14)}" fill="#f8b068" opacity=".85"/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .12)},${f(-s * .34)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff" stroke-width="${f(s * .08)}" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// たけのこ（穂先のくし形: くしの歯のような節）
function xjp_takenokoTip(p, x, y, s, r = 0, { c = '#e2c27a' } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="M-6,14 C-12,6 -10,-8 0,-15 C10,-8 12,6 6,14Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M-3,12 C-6,4 -5,-6 0,-12 M3,12 C6,4 5,-6 0,-12 M-6,6 L6,6 M-7,0 L7,0 M-6,-6 L6,-6" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" opacity=".7"/>
        ${xjp_wa2Shine('M-5,-5 Q-4,-11 0,-13', 1.2, .7)}</g>`;
}
// 菜の花（ゆでた茎とつぼみ）
function xjp_nanohana(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'nnh' + seed + x + y);
    let buds = '';
    for (let i = 0; i < 8; i++){ const a = R() * 6.28, d = R() * 6; buds += `<circle cx="${f(L / 2 + Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(2.4 + R() * 1.3)}" fill="${R() < .3 ? '#e8d23a' : R() < .5 ? '#7aa83a' : '#5a8f2c'}" stroke="#3f6a22" stroke-width=".4"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f(-L / 2)}" y="-2.6" width="${L}" height="5.2" rx="2.6" fill="${p.g('#6aa83c', .3, .25)}" stroke="#3f7a22" stroke-width=".5"/>
        <path d="M${f(-L * .2)},-1 Q${f(-L * .05)},-12 ${f(L * .25)},-12 Q${f(L * .12)},-4 ${f(-L * .05)},-1Z" fill="${p.g('#3f8a2c', .3, .25)}" stroke="#2a5f1c" stroke-width=".4"/><path d="M${f(-L * .3)},1 Q${f(-L * .15)},11 ${f(L * .12)},10 Q${f(0)},3 ${f(-L * .15)},1Z" fill="${p.g('#4a9a34', .3, .25)}" stroke="#2a5f1c" stroke-width=".4"/>${buds}</g>
        <path d="M${f(-L / 2 + 2)},-1 L${f(L * .3)},-1" stroke="#c6e49a" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// ちぎりこんにゃく（灰色に黒い粒、醤油で照り）
function xjp_konnyakuBit(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'knb' + seed + x + y);
    const shape = smooth(ring(s / 2, 8, .4, R, 1.15, .85), true, .7);
    let d = '';
    for (let i = 0; i < 7; i++) d += `M${f1((R() - .5) * s * .6)} ${f1((R() - .5) * s * .5)}h.1`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><g ${p.rough(1.4, .25)}><path d="${shape}" fill="${p.g('#7a6250', .3, .3)}" stroke="#3e3026" stroke-width=".7"/></g></g>
        <path d="${d}" stroke="#2a2018" stroke-width="1.3" stroke-linecap="round"/>
        ${xjp_wa2Shine(`M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .24)}`, 1.3, .7)}</g>`;
}
// ちくわの磯辺揚げ（縦半分の舟形、青のり入りの衣）
function xjp_isobe(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'isb' + seed + x + y), W = L * .34;
    const shape = smooth(ring(1, 12, .1, R, L / 2, W / 2));
    let g = '';
    for (let i = 0; i < 16; i++) g += `M${f1((R() - .5) * L * .8)} ${f1((R() - .5) * W * .7)}h.1`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2, .25)}><path d="${shape}" fill="${p.g('#e2b45a', .32, .3)}" stroke="#a87428" stroke-width=".7"/></g></g>
        <path d="M${f(-L * .4)},${f(-W * .08)} L${f(L * .4)},${f(-W * .08)}" stroke="#b8702a" stroke-width="${f(W * .3)}" stroke-linecap="round" opacity=".4"/>
        <path d="${g}" stroke="#2f6a26" stroke-width="1.8" stroke-linecap="round"/>
        <g ${p.crumb(1.2)}><path d="${shape}" fill="#f2d48a" opacity=".45" transform="scale(.9)"/></g>
        ${xjp_wa2Shine(`M${f(-L * .32)},${f(-W * .3)} L${f(L * .25)},${f(-W * .32)}`, 1.5, .6)}</g>`;
}
// えのき（細い白い軸と小さなかさの束）
function xjp_enoki(p, x, y, L, r = 0, { n = 9, seed = 1 } = {}){
    const R = rng(p.id + 'enk' + seed + x + y);
    let st = '', cp = '';
    for (let i = 0; i < n; i++){ const a = (i / (n - 1) - .5) * .5 + (R() - .5) * .1, ex = Math.cos(a) * L, ey = Math.sin(a) * L; st += `M0 ${f1((i - n / 2) * .6)}Q${f1(L * .5)} ${f1(ey * .4 + (R() - .5) * 3)} ${f1(ex)} ${f1(ey)}`; cp += `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="2.2" ry="1.7" fill="#f2e6c2" stroke="#c9b688" stroke-width=".4"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${st}" stroke="#d9d2bc" stroke-width="2" fill="none" stroke-linecap="round"/><path d="${st}" stroke="#faf8ee" stroke-width="1.2" fill="none" stroke-linecap="round"/>${cp}</g></g>`;
}
// 鮭の身（汁の中のひと口大、皮つき）
function xjp_salmonChunk(p, x, y, s, r = 0, { seed = 1, c = '#f0946a' } = {}){
    const R = rng(p.id + 'slc' + seed + x + y);
    const shape = smooth(ring(s / 2, 7, .25, R, 1.2, .85), true, .6);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${shape}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .45)},${f(-s * .2)} Q0,${f(-s * .5)} ${f(s * .5)},${f(-s * .18)}" stroke="#8a8c90" stroke-width="${f(s * .12)}" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M${f(-s * .25)},${f(-s * .25)} Q${f(-s * .1)},0 ${f(-s * .25)},${f(s * .3)} M${f(s * .05)},${f(-s * .3)} Q${f(s * .2)},0 ${f(s * .05)},${f(s * .32)} M${f(s * .3)},${f(-s * .2)} Q${f(s * .42)},0 ${f(s * .3)},${f(s * .25)}" stroke="#fbe0cf" stroke-width="1.2" fill="none" opacity=".9"/>
        ${xjp_wa2Shine(`M${f(-s * .3)},${f(-s * .05)} Q${f(-s * .1)},${f(-s * .18)} ${f(s * .1)},${f(-s * .12)}`, 1.1, .6)}</g>`;
}
// さばのぶつ切り（汁の中: 青い皮と白い身）
function xjp_sabaChunk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'sbc' + seed + x + y);
    const pts = ring(s / 2, 8, .2, R, 1.2, .85), shape = smooth(pts, true, .6);
    const cid = p.uid();
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${shape}"/></clipPath></defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.g('#eadfcb', .3, .25)}" stroke="#a8987c" stroke-width=".7"/></g>
        <g clip-path="url(#${cid})"><rect x="${f(-s)}" y="${f(-s)}" width="${f(s * 2)}" height="${f(s * .72)}" fill="${p.g('#5e7488', .35, .3)}"/><path d="M${f(-s * .5)},${f(-s * .5)} q${f(s * .1)},${f(s * .1)} 0,${f(s * .2)} M${f(-s * .1)},${f(-s * .5)} q${f(s * .1)},${f(s * .1)} 0,${f(s * .2)} M${f(s * .3)},${f(-s * .5)} q${f(s * .1)},${f(s * .1)} 0,${f(s * .2)}" stroke="#26303a" stroke-width="1.2" fill="none"/><rect x="${f(-s)}" y="${f(-s * .28)}" width="${f(s * 2)}" height="${f(s * .06)}" fill="#c8ccd0" opacity=".8"/></g>
        ${xjp_wa2Shine(`M${f(-s * .3)},${f(-s * .34)} Q0,${f(-s * .46)} ${f(s * .25)},${f(-s * .36)}`, 1.1, .6)}</g>`;
}
// 汁の上にとけかけたバター
function xjp_butter(p, x, y, s){
    return `<path ${T(x, y)} d="${smooth(ring(s * .75, 9, .3, rng(p.id + 'btr' + x)))}" fill="#f4d66a" opacity=".45"/><g ${p.sh(.6)}><rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${f(s * .9)}" rx="${f(s * .2)}" fill="${p.g('#fbe592', .35, .15)}" stroke="#d8b84a" stroke-width=".6"/></g><path d="M${f(x - s * .3)},${f(y - s * .3)} L${f(x + s * .2)},${f(y - s * .3)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`;
}
// 小麦粉のだんご（ちぎって薄くのばした、半透明の白い平たい生地）
function xjp_dango(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'dgo' + seed + x + y);
    const shape = smooth(ring(s / 2, 9, .3, R, 1.25, .8), true, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg('#f2ead4', .3, .2, .4, .38)}" stroke="#c9b88e" stroke-width=".7" opacity=".97"/></g>
        <path d="${shape}" fill="#d9b878" opacity=".18" transform="scale(.7) translate(2 2)"/>
        <path d="M${f(-s * .1)},${f(-s * .05)} q${f(s * .05)},${f(s * .1)} ${f(s * .14)},${f(s * .04)}" stroke="#d8c8a0" stroke-width=".8" fill="none"/>
        ${xjp_wa2Shine(`M${f(-s * .35)},${f(-s * .12)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .18)},${f(-s * .24)}`, 1.4, .75)}</g>`;
}
// しじみ（小さな黒い貝、口が開いて身がのぞく）
function xjp_shijimi(p, x, y, s, r = 0, { seed = 1, open = true } = {}){
    const R = rng(p.id + 'sjm' + seed + x + y), k = s / 20, c = R() < .5 ? '#3a3230' : '#4a3e30';
    const shell = 'M0,0 C-3,1 -9,4 -9.5,9 C-10,13 -5,15 0,15 C5,15 10,13 9.5,9 C9,4 3,1 0,0Z';
    if (!open) return `<g ${T(x, y, r, k)}><g transform="translate(0 -8)"><g ${p.sh(.5)}><path d="${shell}" fill="${p.g(c, .3, .3)}" stroke="#1a1410" stroke-width=".7"/></g><path d="M-7,8 Q0,5 7,8 M-8,11 Q0,8 8,11" stroke="#8a7a60" stroke-width=".6" fill="none" opacity=".7"/><path d="M-4,4 Q-1,2 2,3" stroke="#fff" stroke-width="1" fill="none" opacity=".5"/></g></g>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><g transform="rotate(-55)"><path d="${shell}" fill="${p.g(c, .25, .3)}" stroke="#1a1410" stroke-width=".7"/><path d="M0,1.6 C-2.6,2.6 -8,4.8 -8.2,9 C-8.4,12 -4.6,13.6 0,13.6 C4.6,13.6 8.4,12 8.2,9 C8,4.8 2.6,2.6 0,1.6Z" fill="#9a8c9c"/></g><g transform="rotate(55)"><path d="${shell}" fill="${p.g(c, .25, .3)}" stroke="#1a1410" stroke-width=".7"/><path d="M0,1.6 C-2.6,2.6 -8,4.8 -8.2,9 C-8.4,12 -4.6,13.6 0,13.6 C4.6,13.6 8.4,12 8.2,9 C8,4.8 2.6,2.6 0,1.6Z" fill="#9a8c9c"/></g></g>
        <ellipse cx="0" cy="7" rx="4.6" ry="3.4" fill="${p.g('#e8b47a', .3, .25)}" stroke="#b07a40" stroke-width=".5"/></g>`;
}
// 焼いた角もち（ふくらんで、ところどころ焼き色）
function xjp_mochi(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'mch' + seed + x);
    let sp = '';
    for (let i = 0; i < 4; i++) sp += `<ellipse cx="${f((R() - .5) * w * .6)}" cy="${f((R() - .5) * h * .5)}" rx="${f(w * (.08 + R() * .1))}" ry="${f(h * (.06 + R() * .08))}" fill="#c8862e" opacity="${f(.35 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .3)}" fill="${p.rg('#fbf8ee', .3, .14, .38, .36)}" stroke="#d8ceb4" stroke-width=".7"/></g>
        <g ${xjp_yoBlur(p, 1.8)}>${sp}</g>
        <path d="M${f(-w / 2 + 4)},${f(-h / 2 + 4)} L${f(w / 2 - 7)},${f(-h / 2 + 4)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>`;
}
// かまぼこ（ふちが紅の板つき薄切り）
function xjp_kamaboko(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f(-s / 2)},${f(s * .2)} Q${f(-s / 2)},${f(-s * .3)} 0,${f(-s * .32)} Q${f(s / 2)},${f(-s * .3)} ${f(s / 2)},${f(s * .2)}Z" fill="#e9506a"/></g>
        <path d="M${f(-s / 2 + 2)},${f(s * .2)} Q${f(-s / 2 + 2)},${f(-s * .24)} 0,${f(-s * .26)} Q${f(s / 2 - 2)},${f(-s * .24)} ${f(s / 2 - 2)},${f(s * .2)}Z" fill="${p.g('#fbf7f0', .2, .1)}"/></g>`;
}
// ワンタン（ひらひらの皮に、桃色の具がすける）
function xjp_wonton(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wtn' + seed + x + y);
    const skirt = smooth(ring(s / 2, 12, .45, R, 1.2, .9), true, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${skirt}" fill="${p.rg('#f8f2e2', .3, .15)}" opacity=".9" stroke="#c4b48e" stroke-width=".8"/></g>
        <path d="M${f(-s * .4)},${f(s * .05)} Q${f(-s * .1)},${f(-s * .2)} ${f(s * .3)},${f(s * .1)} M${f(-s * .2)},${f(s * .25)} Q${f(s * .05)},${f(s * .05)} ${f(s * .4)},${f(-s * .15)}" stroke="#e2d6bc" stroke-width=".8" fill="none"/>
        <g ${p.sh(.5)}><ellipse rx="${f(s * .24)}" ry="${f(s * .2)}" fill="${p.rg('#e2a48a', .3, .2)}" stroke="#b8846c" stroke-width=".6"/></g>
        <ellipse rx="${f(s * .26)}" ry="${f(s * .22)}" fill="#f8f2e4" opacity=".35"/>
        <path d="M${f(-s * .14)},${f(-s * .1)} Q0,${f(-s * .18)} ${f(s * .1)},${f(-s * .12)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// ウインナー（1本まるごと、焼き色の切り込み）
function xjp_wiener(p, x, y, L, r = 0){
    const W = L * .32;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${f(W)}" rx="${f(W / 2)}" fill="${p.g('#c8603a', .3, .3)}" stroke="#8a3a1c" stroke-width=".7"/></g>
        <path d="M${f(-L * .2)},${f(-W * .3)} l3,${f(W * .6)} M0,${f(-W * .3)} l3,${f(W * .6)} M${f(L * .2)},${f(-W * .3)} l3,${f(W * .6)}" stroke="#7a2a12" stroke-width="1.2" opacity=".6"/>
        <path d="M${f(-L * .36)},${f(-W * .22)} L${f(L * .34)},${f(-W * .22)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></g>`;
}
// キャベツのくし形（芯つきの煮たかたまり）
function xjp_cabbageWedge(p, x, y, s, r = 0){
    const k = s / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="M-20,8 Q-22,-10 -4,-16 Q14,-20 22,-6 Q24,8 10,14 Q-8,18 -20,8Z" fill="${p.g('#d6e2a0', .3, .25)}" stroke="#9aaa62" stroke-width=".8"/></g>
        <path d="M-16,6 Q-4,-2 14,-12 M-14,10 Q2,4 18,-2 M-12,-4 Q-2,-10 6,-14" stroke="#f4f6dc" stroke-width="1.6" fill="none" opacity=".85"/>
        <path d="M-18,9 Q-12,4 -8,9 Q-12,14 -18,9Z" fill="#eef0c8" stroke="#b8c27a" stroke-width=".5"/>
        ${xjp_wa2Shine('M-14,-6 Q-4,-14 8,-14', 1.4, .6)}</g>`;
}
// こぶみかんの葉
function xjp_limeLeaf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.5)}><path d="M-12,0 Q-8,-5 -2,-4 Q0,0 -2,4 Q-8,5 -12,0Z M-1,0 Q4,-6 12,-1 Q13,0 12,1 Q4,6 -1,0Z" fill="${p.g('#3f7a2a', .3, .3)}" stroke="#244d18" stroke-width=".5"/></g><path d="M-11,0 L11,0" stroke="#7aa85a" stroke-width=".6"/></g>`;
}
// パクチー
function xjp_cilantro(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}>${[[-4, -3, -20], [3, -4, 30], [0, 3, 90], [-6, 3, 160]].map(([a, b, rr]) => `<path transform="translate(${a} ${b}) rotate(${rr})" d="M0,0 Q-2,-4 1,-6 Q2,-4.5 4,-5 Q4,-2 6,-1 Q3,1 0,0Z" fill="#4a9a34" stroke="#2f6a22" stroke-width=".4"/>`).join('')}</g></g>`;
}
// 土鍋（両側に小さな取っ手、飴色の釉）
function xjp_donabe(p, { glaze = '#6a4a32' } = {}){
    return `<g ${p.sh(2)}><ellipse cx="12" cy="100" rx="10" ry="14" fill="${dk(glaze, .2)}"/><ellipse cx="188" cy="100" rx="10" ry="14" fill="${dk(glaze, .2)}"/><circle cx="100" cy="100" r="88" fill="${p.rg(glaze, .25, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="85" fill="none" stroke="${lt(glaze, .3)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="80" fill="${p.rg('#3a2a20', .1, .2, .62, .64)}"/>
        <path d="M30,60 A80,80 0 0 1 60,30" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".4"/>`;
}

// =========================================================
const XJP = {
    // すき焼き: 黒い鉄鍋に割り下、牛肉をたっぷり、焼き豆腐・斜め切りのねぎ・白菜・しいたけ・しらたき・春菊を区切って並べる
    sukiyaki: p => [
        xjp_sukiPan(p),
        K.liquid(p, { R: 82, c: '#6a3818', op: 1, shine: false }),
        `<g ${p.sh(1)}>`,
        xjp_shirataki(p, 66, 136, 46, 26, -35),
        xjp_napa(p, 104, 154, 40, -6), xjp_napa(p, 134, 140, 38, -40, { seed: 2 }), xjp_napa(p, 84, 158, 30, 10, { seed: 3 }),
        xjp_yakidofu(p, 124, 54, 40, 30, 6), xjp_yakidofu(p, 154, 84, 32, 38, -4),
        ...[[156, 120, 70], [140, 106, 64], [52, 102, 100], [46, 76, 80]].map(([x, y, r]) => xjp_wa2NegiSlant(p, x, y, 30, r, { c: '#ece2bb' })),
        xjp_shungiku(p, 74, 46, 40, 20), xjp_shungiku(p, 52, 64, 34, -60),
        ...[[98, 88, 10, '#8c4a2a'], [76, 104, 60, '#965232'], [110, 116, -30, '#86452a'], [94, 128, 100, '#8f4c2c'], [118, 84, 140, '#9a5534'], [86, 70, -60, '#874828'], [126, 132, 30, '#90502e']].map(([x, y, r, c], i) => xjp_wa2Beef(p, x, y, 48, r, { c, seed: i + 1 })),
        K.shiitake(p, 64, 120, 22, 20), K.shiitake(p, 142, 70, 20, -10), K.shiitake(p, 108, 66, 18, 30),
        `</g>`,
        xjp_erGlints(p, 100, 104, 110, { n: 9, op: .45 }),
    ].join(''),

    // たらこスパゲッティ: 白い皿に、たらこバターであえた淡い桃色のスパゲッティ、粒々のたらこ、刻みのりと大葉のせん切り
    tarakopasta: p => [
        K.plate(p),
        xjp_erPasta(p, 100, 102, 140, { c: '#f3b896', w: 2.6, n: 46, seed: 2 }),
        xjp_erGrains(p, 100, 102, 116, { cols: ['#ee7a62', '#e05a44', '#f6a28a'], n: 130, size: 1, seed: 7 }),
        `<g ${p.sh(.6)}>`, xjp_erShreds(p, 100, 98, 40, { c: '#3f8f2f', n: 20, w: 2, len: .5, seed: 5 }), `</g>`,
        K.noriStrips(p, 100, 96, 34, { n: 34 }), K.noriStrips(p, 104, 92, 20, { n: 14 }),
        xjp_erGlints(p, 100, 104, 100, { n: 6, op: .5 }),
    ].join(''),

    // コロッケ: 白い皿に、こんがり揚げた小判形のコロッケ2個に中濃ソース、千切りキャベツ、くし切りトマト、パセリ
    korokke: p => [
        K.plate(p),
        xjp_yoCabbage(p, 132, 66, 76, { seed: 2 }),
        K.tomatoWedge(p, 158, 112, 26, -70), K.tomatoWedge(p, 148, 134, 24, -40),
        xjp_korokke(p, 82, 92, 82, 58, -40, { seed: 1, c: '#d99a40' }),
        xjp_korokke(p, 108, 136, 80, 56, -12, { seed: 2, c: '#d4923a' }),
        K.parsley(p, 160, 82, 16),
    ].join(''),

    // さわらの西京焼き: 長皿に、白味噌の焦げ目がまだらについたさわら、大根おろし、はじかみ
    saikyoyaki: p => [
        K.longPlate(p, { base: '#efe9dc', rim: '#b8ae9c' }),
        xjp_grillFillet(p, 84, 100, 116, 70, -4, { flesh: '#f0d6a0', skin: '#7c848c', char: '#7a3a10', charK: .75, nChar: 7, seed: 2 }),
        xjp_s1Grated(p, 160, 114, 30),
        `<circle cx="162" cy="112" r="4" fill="#9a5a24" opacity=".6"/>`,
        xjp_hajikami(p, 156, 78, 56, -25), xjp_hajikami(p, 160, 84, 50, -15),
    ].join(''),

    // かじきのバター醤油ソテー: 白い皿にバター醤油のたれ、焼き色のかじき2切れ、からめたしめじ、ゆでブロッコリー
    kajikisaute: p => [
        K.plate(p, { rim: '#4a6a5a' }),
        K.pool(p, 94, 108, 116, '#9a5a1e', { op: .85, seed: 2 }),
        xjp_grillFillet(p, 80, 92, 84, 56, -18, { flesh: '#f6ead2', skin: '#6a6460', char: '#a8641e', charK: .9, nChar: 5, seed: 1, lines: false }),
        xjp_grillFillet(p, 108, 132, 80, 54, 12, { flesh: '#f6ead2', skin: '#6a6460', char: '#a8641e', charK: .9, nChar: 5, seed: 3, lines: false }),
        K.shimeji(p, 120, 76, 40, -70, { n: 4 }), K.shimeji(p, 136, 104, 36, 10, { n: 4 }), K.shimeji(p, 62, 134, 36, 160, { n: 3 }),
        K.broccoli(p, 152, 126, 28, 10), K.broccoli(p, 146, 72, 26, -20), K.broccoli(p, 150, 98, 22, 30),
        xjp_erGlints(p, 96, 110, 80, { n: 6, op: .6 }),
    ].join(''),

    // あじの南蛮漬け: 角皿に南蛮酢、から揚げしたあじに、薄切り玉ねぎ・にんじんとピーマンのせん切り・輪切り唐辛子をたっぷり
    ajinanbanzuke: p => [
        K.squareDish(p, { s: 164, base: '#eef0ea', rim: '#3c6a8c' }),
        `<rect x="28" y="28" width="144" height="144" rx="12" fill="${p.rg('#d6ae66', .25, .2)}" opacity=".6"/>`,
        ...[[64, 70, -20], [118, 62, 15], [150, 98, 70], [66, 122, 30], [112, 108, -10], [128, 146, 20], [74, 158, -5]].map(([x, y, r], i) => xjp_ajiPiece(p, x, y, 58, 36, r, { seed: i, c: '#c98a36' })),
        `<g ${p.sh(.5)}>`,
        ...xjp_scatter('anb', 12, 100, 104, 62).map(([x, y, r]) => xjp_zsOnionStrip(p, x, y, 30, r, { c: '#f4ead0' })),
        xjp_erShreds(p, 100, 104, 120, { c: '#ee7a2a', n: 26, w: 2, len: .3, seed: 2 }),
        xjp_erShreds(p, 100, 104, 116, { c: '#3f8f2f', n: 18, w: 2, len: .28, seed: 3 }),
        `</g>`,
        ...xjp_scatter('anc', 9, 100, 104, 60).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="2.4" fill="none" stroke="#d6281a" stroke-width="1.6"/>`),
    ].join(''),

    // えびフライ: 白い皿に、まっすぐ揚げたえびフライ3本（赤い尾）、千切りキャベツ、タルタル、レモン
    ebifry: p => [
        K.plate(p),
        xjp_yoCabbage(p, 104, 60, 96, { seed: 3, sy: .55 }),
        K.lemon(p, 156, 76, 30, 50),
        xjp_ebiFry(p, 94, 96, 120, -14, { seed: 1 }),
        xjp_ebiFry(p, 98, 122, 124, -10, { seed: 2 }),
        xjp_ebiFry(p, 104, 148, 112, -6, { seed: 3, c: '#cf8a34' }),
        xjp_tartar(p, 52, 128, 30),
        K.parsley(p, 60, 70, 16),
    ].join(''),

    // かに玉: 赤い縁の皿に、ふんわり丸く焼いたかに玉、かにかま・ねぎ・しいたけ、甘酢あんとグリーンピース
    kanitama: p => [
        K.plate(p, { rim: '#b8402a' }),
        xjp_eggCake(p, 100, 100, 132, { seed: 1 }),
        ...xjp_scatter('knt', 10, 100, 100, 46).map(([x, y, r]) => xjp_crab(p, x, y, 22, r)),
        ...xjp_scatter('knn', 6, 100, 100, 44).map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 12, r)),
        `<path d="${smooth(ring(66, 14, .18, rng('ktg'), 1, .92).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#c4682a', .25, .2)}" opacity=".42"/>`,
        `<path d="${smooth(ring(40, 10, .3, rng('ktg2'), 1.2, .8).map(([a, b]) => [a + 96, b + 92]))}" fill="#d98a3a" opacity=".3"/>`,
        ...xjp_scatter('knp', 9, 100, 100, 50).map(([x, y]) => `<g ${p.sh(.4)}><circle cx="${f(x)}" cy="${f(y)}" r="3.3" fill="${p.rg('#6fae3a', .3, .25, .35, .32)}" stroke="#3f7a22" stroke-width=".5"/></g><circle cx="${f(x - 1)}" cy="${f(y - 1.1)}" r=".9" fill="#fff" opacity=".7"/>`),
        xjp_erGlints(p, 100, 100, 100, { n: 10, op: .7 }),
        `<path d="M54,82 Q66,52 100,44" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`,
    ].join(''),

    // 豆腐ステーキ: 黒い角皿に、こんがり焼いた木綿豆腐2枚、甘辛いひき肉のたれ、小口ねぎ
    tofusteak: p => [
        K.squareDish(p, { s: 164, base: '#3a3634', rim: '#5c5652' }),
        xjp_tofuSteak(p, 70, 70, 52, 48, -5, { seed: 1 }), xjp_tofuSteak(p, 130, 68, 52, 48, 4, { seed: 2, c: '#dea452' }),
        xjp_tofuSteak(p, 68, 128, 52, 48, 3, { seed: 3, c: '#dea452' }), xjp_tofuSteak(p, 130, 128, 52, 48, -4, { seed: 4 }),
        `<path d="${smooth(ring(38, 14, .3, rng('tfp'), 1, 1.05).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#9a5a22', .25, .25)}" opacity=".72"/>`,
        `<g ${p.sh(.5)}>`, xjp_erGrains(p, 100, 100, 58, { cols: ['#9a5c2a', '#7a4420', '#b07038'], n: 80, size: 1.9, seed: 2 }), `</g>`,
        xjp_s1Negi(p, 100, 100, 34, 34, 18, { r: 2.4 }),
        xjp_erGlints(p, 98, 104, 60, { n: 6, op: .7 }),
    ].join(''),

    // あんかけ焼きそば: 白い皿に、焼きつけてパリッとした麺、とろりとした醤油あんに白菜・にんじん・しいたけ・えび・豚肉・うずら卵・絹さや
    ankakeyakisoba: p => [
        K.plate(p),
        xjp_erWavy(p, 100, 100, 164, { c: '#e3b45e', w: 3, n: 46, len: .45, wav: .6, seed: 1 }),
        `<g ${xjp_yoBlur(p, 3)}>${xjp_scatter('aky', 8, 100, 100, 74).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="8" ry="5" fill="#a8641c" opacity=".35"/>`).join('')}</g>`,
        `<path d="${smooth(ring(58, 14, .2, rng('akg'), 1, .9).map(([a, b]) => [a + 100, b + 102]))}" fill="${p.rg('#c99a4e', .25, .2)}" opacity=".78"/>`,
        `<g ${p.sh(.8)}>`,
        xjp_napa(p, 76, 92, 34, -20, { seed: 1 }), xjp_napa(p, 120, 124, 34, 150, { seed: 2 }), xjp_napa(p, 96, 136, 30, 20, { seed: 3 }), xjp_napa(p, 128, 82, 30, 60, { seed: 4 }),
        K.porkSlice(p, 104, 100, 30, 30, { c: '#d9b08a', fat: '#f4e6cc', char: false, gloss: .3, seed: 1 }), K.porkSlice(p, 74, 120, 26, -50, { c: '#d9b08a', fat: '#f4e6cc', char: false, gloss: .3, seed: 2 }),
        ...[[86, 74, 50], [140, 110, -30], [78, 140, 90], [116, 62, 10]].map(([x, y, r]) => xjp_wa2Tanzaku(p, x, y, 16, 6, r)),
        K.shrimp(p, 110, 78, 22, 20), K.shrimp(p, 62, 102, 20, -60), K.shrimp(p, 140, 132, 20, 100),
        K.shiitake(p, 92, 116, 16, 0, { cross: false }), K.shiitake(p, 134, 96, 14, 0, { cross: false }),
        K.quailEgg(p, 116, 110, 16, 20), K.quailEgg(p, 84, 98, 15, -30),
        K.snowPea(p, 100, 84, 20, 30), K.snowPea(p, 110, 140, 20, -20),
        `</g>`,
        `<path d="${smooth(ring(56, 14, .2, rng('akg'), 1, .9).map(([a, b]) => [a + 100, b + 102]))}" fill="#d6a85a" opacity=".2"/>`,
        xjp_erGlints(p, 100, 102, 100, { n: 12, op: .7 }),
    ].join(''),

    // ビーフシチュー: 白い深皿に、つやのある濃いデミグラスの煮込み、大きな牛肉・にんじん・じゃがいも・マッシュルーム、生クリームとパセリ
    beefstew: p => [
        K.bowl(p, { glaze: '#f4efe6', inside: '#fbf8f2' }),
        `<circle cx="100" cy="100" r="84" fill="none" stroke="#b08a4a" stroke-width="1.4" opacity=".7"/>`,
        K.liquid(p, { R: 74, c: '#5a2414', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#7a3a1e" opacity=".35"/>`,
        `<g ${p.sh(.9)}>`,
        K.potato(p, 70, 124, 30, 20, { c: '#c99a5a', seed: 1 }), K.potato(p, 132, 70, 30, -40, { c: '#cfa262', seed: 2 }), K.potato(p, 138, 124, 26, 80, { c: '#c99a5a', seed: 3 }),
        K.carrotChunk(p, 96, 140, 24, 30, { c: '#e2702a' }), K.carrotChunk(p, 64, 86, 24, -50, { c: '#e2702a' }), K.carrotChunk(p, 148, 98, 22, 100, { c: '#e2702a' }), K.carrotChunk(p, 106, 60, 22, -10, { c: '#e2702a' }),
        xjp_beefChunk(p, 92, 92, 38, 10, { seed: 1 }), xjp_beefChunk(p, 118, 104, 34, -40, { seed: 2, c: '#5a2614' }), xjp_beefChunk(p, 82, 62, 30, 60, { seed: 3, c: '#642e18' }),
        xjp_beefChunk(p, 112, 136, 32, 30, { seed: 4 }), xjp_beefChunk(p, 66, 108, 26, -20, { seed: 5, c: '#642e18' }),
        xjp_mushroom(p, 126, 84, 20, 20), xjp_mushroom(p, 96, 118, 18, -30), xjp_mushroom(p, 140, 142, 16, 50),
        `</g>`,
        `<path d="M70,74 C86,66 104,72 112,82 C118,90 108,96 100,92" stroke="#fbf3e2" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".9"/>`,
        xjp_zsParsley(p, 104, 92, 36, { n: 14 }),
        xjp_erGlints(p, 100, 100, 110, { n: 10, op: .5 }),
        xjp_zsShine(100, 100, 74, .3),
    ].join(''),

    // 天ぷら: 黒い角皿に白い懐紙、えび天2本・なす・かぼちゃ・さつまいも・大葉・ししとうのさくっとした衣
    tempura: p => [
        K.squareDish(p, { s: 168, base: '#2f2b29', rim: '#5a524c' }),
        `<g ${p.sh(.8)}><path d="M30,40 L160,28 L172,160 L40,170Z" fill="${p.g('#fbfaf4', .1, .08)}" stroke="#e2ddd0" stroke-width=".8"/></g><path d="M30,40 L172,160" stroke="#e8e3d6" stroke-width=".8"/>`,
        xjp_tempuraBatter(p, 72, 70, 50, 40, 20, K.kabocha(p, 0, 0, 34, 0), { seed: 3, show: .85 }),
        xjp_tempuraBatter(p, 132, 62, 50, 38, -10, `<path d="M-14,-12 L14,-12 L16,10 L-16,10Z" fill="#3f8a33" opacity=".9"/><path d="M0,-12 L0,10" stroke="#7cb85c" stroke-width="1.2"/>`, { seed: 4, show: .85 }),
        xjp_tempuraBatter(p, 66, 128, 46, 42, 0, `<circle r="16" fill="#8a2e4a"/><circle r="13" fill="#f2c64c"/>`, { seed: 5, show: .8 }),
        xjp_tempuraBatter(p, 150, 128, 48, 36, 60, `<path d="M-18,-6 L18,-10 L18,10 L-18,6Z" fill="#4d2a5c"/><path d="M-14,-3 L16,-6 M-14,2 L16,3" stroke="#d6b97a" stroke-width="2"/>`, { seed: 6, show: .85 }),
        xjp_ebiTen(p, 96, 100, 116, -32, { seed: 1 }), xjp_ebiTen(p, 112, 124, 116, -32, { seed: 2 }),
        xjp_wa2Shishito(p, 104, 152, 40, -10),
        xjp_s1Grated(p, 152, 160, 22),
    ].join(''),

    // 豚肉のアスパラ巻き: 白い皿に、照り焼きの豚バラ巻きを半分に切って並べ（穂先と切り口）、ミニトマト
    asparamaki: p => [
        K.plate(p),
        K.pool(p, 98, 104, 104, '#8a4a1a', { op: .6, seed: 2 }),
        xjp_asparaRoll(p, 78, 70, 76, 30, { seed: 1 }), xjp_asparaRoll(p, 120, 78, 76, -150, { seed: 2 }),
        xjp_asparaRoll(p, 76, 106, 74, 18, { seed: 3, c: '#b06a30' }), xjp_asparaRoll(p, 124, 112, 74, -165, { seed: 4, c: '#b06a30' }),
        xjp_asparaRoll(p, 84, 140, 72, 8, { seed: 5 }), xjp_asparaRoll(p, 126, 144, 70, 175, { seed: 6 }),
        K.cherryTomato(p, 154, 92, 22), K.cherryTomato(p, 50, 92, 20), K.cherryTomato(p, 104, 44, 20),
        xjp_erGlints(p, 100, 104, 100, { n: 8, op: .55 }),
    ].join(''),

    // 鶏つくね: 長皿に大葉を敷き、照りのたれをからめた小判形のつくね4個、白ごま、卵黄
    tsukune: p => [
        K.longPlate(p, { base: '#f0ece2', rim: '#2c4c7c' }),
        K.shiso(p, 52, 92, 44, -30), K.shiso(p, 82, 112, 44, 20), K.shiso(p, 118, 88, 44, -10), K.shiso(p, 146, 110, 42, 30),
        K.pool(p, 96, 104, 110, '#6a3412', { op: .55, seed: 2, sy: .55 }),
        xjp_tsukune(p, 44, 102, 60, 42, -70, { seed: 1 }), xjp_tsukune(p, 80, 100, 62, 42, -80, { seed: 2, c: '#91501f' }),
        xjp_tsukune(p, 118, 102, 60, 42, -95, { seed: 3 }), xjp_tsukune(p, 154, 108, 56, 40, -85, { seed: 4, c: '#91501f' }),
        xjp_zsRawEggYolk(p, 160, 62, 22),
        K.sesame(p, 94, 100, 100, { n: 26 }),
    ].join(''),

    // レバニラ炒め: 白い皿に、つやのある濃い赤茶のレバー、たっぷりのニラ、もやし、にんじん
    rebanira: p => [
        K.plate(p),
        xjp_erSprouts(p, 100, 102, 140, { n: 40, seed: 1 }),
        xjp_nira(p, 100, 100, 130, { n: 30, seed: 1 }),
        `<g ${p.sh(.9)}>`,
        ...[[80, 80, 20], [120, 74, -30], [138, 110, 60], [96, 108, -10], [70, 120, 40], [110, 138, 10], [84, 150, -40], [146, 140, 80], [56, 96, -60], [124, 96, 100]].map(([x, y, r], i) => xjp_liver(p, x, y, 28, r, { seed: i })),
        `</g>`,
        xjp_erShreds(p, 100, 104, 120, { c: '#ee7a2a', n: 14, w: 2.4, len: .22, seed: 4 }),
        xjp_nira(p, 100, 104, 110, { n: 14, seed: 2 }),
        xjp_erGlints(p, 100, 104, 110, { n: 10, op: .55 }),
    ].join(''),

    // 野菜炒め: 白い皿に山盛りのキャベツ・もやし・にんじん・ピーマン・豚こま・きくらげ、つや
    yasaiitame: p => {
        const sp = xjp_scatter('ysi', 13, 100, 100, 58);
        return [
            K.plate(p),
            xjp_erSprouts(p, 100, 102, 150, { n: 30, seed: 1 }),
            `<g ${p.sh(.8)}>`,
            ...sp.map(([x, y, r], i) => xjp_erCabbage(p, x, y, 46, r, { seed: i })),
            ...[[84, 96, 20], [122, 116, -40], [108, 76, 70], [74, 128, 120], [136, 86, -10]].map(([x, y, r], i) => K.porkSlice(p, x, y, 44, r, { c: '#b9845a', fat: '#f2e2c4', char: true, gloss: .45, seed: i })),
            xjp_kikurage(p, 100, 120, 18, 20), xjp_kikurage(p, 136, 132, 16, -40, { seed: 2 }), xjp_kikurage(p, 70, 80, 16, 60, { seed: 3 }),
            `</g>`,
            xjp_erSprouts(p, 100, 100, 110, { n: 12, seed: 2 }),
            ...xjp_scatter('ysc', 9, 100, 100, 58).map(([x, y, r]) => xjp_wa2Tanzaku(p, x, y, 20, 6, r, { c: '#ef7020' })),
            ...xjp_scatter('ysp', 7, 100, 100, 56).map(([x, y, r]) => K.pepperPiece(p, x, y, 22, r, { strip: true })),
            xjp_erGlints(p, 100, 100, 110, { n: 10, op: .55 }),
        ].join('');
    },

    // かつ丼: どんぶりのご飯に、切ったとんかつを玉ねぎと半熟の卵でとじ、三つ葉
    katsudon: p => [
        K.donburi(p),
        xjp_erRice(p, 100, 100, 162, { ring0: 70, density: .45 }),
        `<path d="${smooth(ring(72, 14, .1, rng('kdn'), 1, 1).map(([a, b]) => [a + 100, b + 100]))}" fill="#b07a32" opacity=".35"/>`,
        `<g ${p.sh(.6)}>`, ...[[62, 78, 30], [140, 82, -30], [66, 128, 150], [138, 128, 200]].map(([x, y, r]) => K.onion(p, x, y, 28, r, { c: '#e2c07e', layers: 1 })), `</g>`,
        xjp_yoSliced(p, 100, 100, 146, 80, -8, 5, { c: '#bf7426', face: '#f3e2cc', fat: '#fbf3e4', faceW: .26, crumb: .75, seed: 1, gap: 2, jitter: .07, gloss: .35 }),
        `<g opacity=".9">`, ...[[70, 104, 46, 70], [104, 86, 52, -20], [128, 114, 54, 30]].map(([x, y, L, r], i) => xjp_softEgg(p, x, y, L, r, { seed: i + 1, c: '#f8f1d8' })), `</g>`,
        ...[[74, 94, 42, 20], [106, 102, 46, -30], [136, 98, 40, 60], [96, 122, 36, 10]].map(([x, y, L, r], i) => xjp_softEgg(p, x, y, L, r, { seed: i + 9, c: '#f7c62e' })),
        xjp_erGlints(p, 100, 104, 100, { n: 8, op: .55 }),
        `<path d="M100,96 L84,108 M100,96 L116,106 M100,96 L102,80" stroke="#8cbf5c" stroke-width="1.6" stroke-linecap="round"/>`,
        K.mitsuba(p, 102, 80, 22, 10), K.mitsuba(p, 116, 106, 20, 130), K.mitsuba(p, 84, 108, 20, -110),
    ].join(''),

    // ちらし寿司: 朱塗りの器に酢めし、たっぷりの錦糸卵、ゆでえび・甘辛く煮たしいたけ・にんじん・れんこん・いんげん、刻みのり
    chirashi: p => [
        K.bowl(p, { glaze: '#a83228', inside: '#2a1512', lip: .9 }),
        xjp_erRice(p, 100, 100, 160, { tint: '#f6efdc', density: .9 }),
        xjp_kinshi(p, 100, 100, 130, { n: 85, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...[[84, 70, 20], [130, 82, -60], [72, 118, 120], [122, 130, 200], [100, 100, 60]].map(([x, y, r]) => xjp_boiledShrimp(p, x, y, 30, r)),
        ...[[108, 66, 0], [58, 92, 0], [146, 112, 0], [94, 140, 0]].map(([x, y, r]) => K.lotus(p, x, y, 18, r, { c: '#f2ead8' })),
        `</g>`,
        xjp_erShreds(p, 100, 100, 120, { c: '#6a4026', n: 16, w: 2.4, len: .18, seed: 3 }),
        xjp_erShreds(p, 100, 100, 120, { c: '#ec7a2c', n: 14, w: 2, len: .18, seed: 4 }),
        xjp_erBeans(p, xjp_scatter('chb', 12, 100, 100, 58).map(([x, y, r]) => [x, y, r / 57])),
        K.noriStrips(p, 100, 104, 50, { n: 16 }),
    ].join(''),

    // タンドリーチキン: 白い皿に、ヨーグルトとスパイスで赤く焼いた鶏もも（焦げ目）、サニーレタス、くし切りレモン
    tandoori: p => [
        K.plate(p, { rim: '#c0482a' }),
        xjp_yoLettuce(p, 122, 62, 84, -20, { seed: 1, c: '#9ccc5a' }),
        xjp_tandoori(p, 82, 106, 70, -30, { seed: 1 }), xjp_tandoori(p, 124, 128, 70, 15, { seed: 2, c: '#d8602e' }), xjp_tandoori(p, 132, 90, 54, -70, { seed: 3, c: '#cc5226' }),
        K.lemon(p, 52, 138, 30, 30),
        `<g ${p.sh(.4)}>${['#3f8a2c', '#4f9a34', '#3a7a28'].map((c, i) => `<path ${T(64 + i * 6, 70 + i * 4, i * 50)} d="M0,0 Q-5,-6 0,-10 Q5,-6 0,0Z M0,0 Q6,-3 10,1 Q5,4 0,0Z" fill="${c}"/>`).join('')}</g>`,
    ].join(''),

    // ミートソーススパゲッティ: 白い皿に、ゆでたスパゲッティの上にひき肉たっぷりの赤いミートソース、粉チーズとパセリ
    meatsauce: p => [
        K.plate(p),
        xjp_erPasta(p, 100, 102, 150, { c: '#f1d58a', w: 2.6, n: 42, seed: 1 }),
        `<g ${p.sh(1)}><path d="${smooth(ring(46, 14, .22, rng('mts'), 1.05, .95).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#b23a1e', .25, .3)}"/></g>`,
        xjp_erGrains(p, 100, 100, 84, { cols: ['#7a3018', '#9a4222', '#64240f'], n: 120, size: 2, seed: 2 }),
        xjp_erGrains(p, 100, 100, 70, { cols: ['#e8742a', '#f2e6b8'], n: 18, size: 1.3, seed: 3 }),
        `<path d="M76,86 Q88,74 106,76" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        K.sprinkle(p, 100, 98, 60, { c: '#fbf3d6', n: 40, r: 1.1 }),
        xjp_zsParsley(p, 104, 96, 30, { n: 14 }),
    ].join(''),

    // かぶの甘酢漬け: 淡い青の小鉢に、薄いいちょう切りのかぶを重ね、刻んだかぶの葉・細切り昆布・輪切り唐辛子
    kabuamazu: p => [
        K.kobachi(p, { glaze: '#a9bccb', inside: '#f1f4f4' }),
        K.liquid(p, { R: 66, c: '#efe9cf', op: .6, shine: false }),
        `<g ${p.sh(.7)}>`,
        ...xjp_s2Spots('kab', 30, 60).map(([x, y, r]) => xjp_zsIcho(p, x, y, 30, r, { c: '#f7f5ec', edge: '#d8d4c2' })),
        `</g>`,
        ...xjp_scatter('kbk', 9, 100, 100, 50).map(([x, y, r]) => `<rect ${T(x, y, r)} x="-7" y="-1" width="14" height="2" rx="1" fill="#3a3a26"/>`),
        `<g ${p.sh(.4)}>`, ...xjp_scatter('kbl', 22, 100, 100, 52).map(([x, y, r]) => `<rect ${T(x, y, r)} x="-2.4" y="-1.6" width="4.8" height="3.2" rx="1" fill="${r % 3 < 1 ? '#3f8a2c' : '#5aa63c'}" stroke="#2f6a22" stroke-width=".4"/>`), `</g>`,
        ...xjp_scatter('kbc', 6, 100, 100, 44).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="none" stroke="#d6281a" stroke-width="1.7"/>`),
    ].join(''),

    // 五目豆: 茶の小鉢に、つやよく煮た大豆と、さいの目のにんじん・ごぼう・こんにゃく・昆布・しいたけ
    gomokumame: p => {
        const sp = xjp_zsSpots('gmm', 64, 60, 9.5);
        const items = sp.map(([x, y, r], i) => {
            const t = i % 8;
            return t === 1 ? xjp_zsDice(p, x, y, 10, r, '#e8722a')
                : t === 3 ? xjp_zsDice(p, x, y, 10, r, '#8a6a46')
                : t === 5 ? xjp_zsDice(p, x, y, 10, r, '#7d7672')
                : t === 7 ? xjp_zsDice(p, x, y, 10, r, '#33402a')
                : `<g ${T(x, y, r)}><ellipse rx="5.6" ry="4.8" fill="${p.g('#d7a75a', .3, .32)}" stroke="#9a6a2a" stroke-width=".6"/><path d="M-3.6,0 Q0,1.2 3.6,0" stroke="#a8742e" stroke-width=".7" fill="none"/><ellipse cx="-1.8" cy="-2" rx="1.6" ry=".8" fill="#fff" opacity=".75"/></g>`;
        }).join('');
        return [
            K.kobachi(p, { glaze: '#7a5638', inside: '#efe3cc' }),
            K.liquid(p, { R: 68, c: '#b07a32', op: .75, shine: false }),
            `<g ${p.sh(.6)}>`, items, `</g>`,
            ...xjp_scatter('gms', 5, 100, 100, 46).map(([x, y, r]) => K.shiitake(p, x, y, 11, r, { cross: false })),
            xjp_erGlints(p, 100, 100, 100, { n: 8, op: .5 }),
        ].join('');
    },

    // 白和え: 黒釉の小鉢に、なめらかな白い豆腐の衣で和えたほうれん草・にんじん・こんにゃく、すりごま
    shiraae: p => {
        const R = rng(p.id + 'sra');
        return [
            K.kobachi(p, { glaze: '#2e2a28', inside: '#e9e2d6' }),
            xjp_s2Mound(p, 100, 102, 128, '#eee6d2', { seed: 2, rough: 3 }),
            ...xjp_scatter('sre', 14, 100, 102, 50).map(([x, y, r]) => `<path ${T(x, y, r)} d="M-9,0 Q-3,-5 4,-4 Q9,-2 9,0 Q6,3 1,4 Q-5,4 -9,0Z" fill="${p.g('#2f6e26', .25, .25)}" opacity=".85"/>`),
            ...xjp_scatter('srs', 8, 100, 102, 50).map(([x, y, r]) => `<rect ${T(x, y, r)} x="-7" y="-1.4" width="14" height="2.8" rx="1.4" fill="#8cbf5a" opacity=".85"/>`),
            ...xjp_scatter('src', 12, 100, 102, 50).map(([x, y, r]) => xjp_s1Stick(p, x, y, 18, 3, r, '#ec7a2c', { gloss: .4 })),
            ...xjp_scatter('srk', 5, 100, 102, 44).map(([x, y, r]) => xjp_s1Stick(p, x, y, 16, 3.4, r, '#8a8480', { gloss: 0 })),
            `<g ${p.rough(2, .2)}>`, ...xjp_scatter('srw', 10, 100, 102, 46).map(([x, y]) => `<path ${T(x, y)} d="${smooth(ring(6 + R() * 5, 7, .4, R))}" fill="#f3ecdc" opacity=".9"/>`), `</g>`,
            K.sprinkle(p, 100, 100, 90, { c: '#c9b48a', n: 40, r: .8 }),
            K.sesame(p, 100, 96, 50, { n: 10 }),
        ].join('');
    },

    // キャベツの塩昆布和え: 白い小鉢に、ごま油でつやの出たざく切りキャベツ・薄切りきゅうり、細い塩昆布、白ごま
    shiokombu: p => [
        K.kobachi(p, { glaze: '#e8e4da', inside: '#f7f5ef' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3c6a8c" stroke-width="1.6" opacity=".7"/>`,
        `<g ${p.sh(.8)}>`,
        ...xjp_s2Spots('skb', 16, 54).map(([x, y, r], i) => K.leafPiece(p, x, y, 46, r, { c: ['#c2e08e', '#e2f0c4', '#d4e8a8', '#eef6dc'][i % 4], vein: '#fbfdf2', seed: i })),
        ...xjp_scatter('skc', 7, 100, 100, 48).map(([x, y, r]) => K.cucumberSlice(p, x, y, 13, r, { oval: 1.15 })),
        `</g>`,
        ...xjp_scatter('skk', 26, 100, 100, 54).map(([x, y, r]) => `<path ${T(x, y, r)} d="M-6,0 q3,-1.6 6,0 t6,0" stroke="#3a2a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>`),
        K.sesame(p, 100, 98, 90, { n: 24 }),
        xjp_erGlints(p, 100, 100, 90, { n: 7, op: .55 }),
    ].join(''),

    // なす田楽: 長皿に、縦半分に切って焼いたなす2切れ、切り口に照りのある田楽みそ、白ごま、木の芽
    nasudengaku: p => [
        K.longPlate(p, { base: '#efe8d8', rim: '#8a6a4a' }),
        xjp_nasuHalf(p, 98, 76, 150, 50, -4, { seed: 1 }),
        xjp_nasuHalf(p, 102, 126, 150, 50, 3, { seed: 2, miso: '#94521f' }),
        K.sesame(p, 98, 78, 100, { n: 18 }), K.sesame(p, 102, 126, 100, { n: 18, seed: 2 }),
        K.mitsuba(p, 60, 76, 16, -20), K.mitsuba(p, 140, 126, 16, 30),
    ].join(''),

    // ふろふき大根: 黒の鉢に、厚い輪切りの大根（面取り・半透明）、上に練りみそ、ゆずの皮のせん切り
    furofuki: p => [
        K.bowl(p, { glaze: '#3a2c24', inside: '#2e2420', lip: .88 }),
        K.liquid(p, { R: 76, c: '#c9a660', op: .55, shine: false }),
        xjp_wa2Daikon(p, 100, 102, 120, 0, { c: '#e4cf9a', shape: 'round' }),
        `<circle cx="100" cy="102" r="58" fill="none" stroke="#c8aa6a" stroke-width="3" opacity=".6"/>`,
        `<circle cx="100" cy="102" r="48" fill="none" stroke="#f6eccf" stroke-width="2" opacity=".5"/>`,
        `<g ${p.sh(.8)}><path d="${smooth(ring(34, 11, .25, rng('ffm'), 1.15, 1).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#b06a26', .3, .3)}" stroke="#7a4214" stroke-width=".7"/></g>`,
        `<path d="M84,90 Q96,80 110,84" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`,
        xjp_erShreds(p, 104, 96, 26, { c: '#f4c21e', n: 12, w: 2, len: .7, seed: 2 }),
    ].join(''),

    // 高野豆腐の含め煮: 青磁の鉢に、淡いだし、だしを含んだ高野豆腐、にんじん（ねじ梅）、しいたけ、さやいんげん
    koyadofu: p => [
        K.kobachi(p, { glaze: '#8fb0a0', inside: '#eef2ea' }),
        K.liquid(p, { R: 70, c: '#e2c682', op: .8 }),
        xjp_koya(p, 78, 82, 42, 42, -10, { seed: 1 }), xjp_koya(p, 124, 80, 42, 42, 12, { seed: 2 }),
        xjp_koya(p, 82, 126, 42, 42, 8, { seed: 3, c: '#e8cf92' }), xjp_koya(p, 126, 124, 40, 40, -6, { seed: 4 }),
        `<g ${p.sh(.7)}>`,
        ...[[102, 104], [56, 104], [146, 104]].map(([x, y]) => `<g ${T(x, y)}>${[0, 72, 144, 216, 288].map(a => `<circle cx="${f(Math.cos(a / 57.3) * 5)}" cy="${f(Math.sin(a / 57.3) * 5)}" r="5" fill="${p.g('#ec7a2c', .3, .25)}"/>`).join('')}<circle r="3" fill="#f6a466"/></g>`),
        K.shiitake(p, 104, 62, 20, 0, { cross: false }), K.shiitake(p, 102, 146, 18, 0, { cross: false }),
        xjp_wa2GreenBundle(p, 148, 140, 26, 7, -40), xjp_wa2GreenBundle(p, 52, 64, 26, 7, 30), xjp_wa2GreenBundle(p, 140, 58, 22, 7, 60),
        `</g>`,
    ].join(''),

    // ジャーマンポテト: 鉄のスキレットに、焼き色のついたじゃがいも、カリッとしたベーコン、玉ねぎ、パセリと黒こしょう
    germanpotato: p => [
        xjp_skillet(p),
        `<g ${p.sh(.7)}>`,
        ...xjp_s2Spots('gpo', 13, 56, { cx: 96 }).map(([x, y, r], i) => xjp_friedPotato(p, x, y, 38, r, { seed: i, c: '#eab95e' })),
        ...[[70, 80, 30], [118, 74, -40], [90, 112, 10], [126, 120, 60], [66, 128, -20], [106, 146, 80]].map(([x, y, r]) => xjp_crispBacon(p, x, y, 30, 12, r)),
        ...[[96, 70, 20], [134, 96, -60], [74, 104, 120], [106, 128, 200]].map(([x, y, r]) => K.onion(p, x, y, 20, r, { c: '#dcae62', layers: 1 })),
        `</g>`,
        xjp_zsParsley(p, 96, 100, 110, { n: 30 }),
        K.sprinkle(p, 96, 100, 110, { c: '#2a2420', n: 30, r: .7 }),
    ].join(''),

    // にんじんしりしり: 白い小鉢に、細いせん切りのにんじんを炒めて山盛り、卵とツナがからむ
    shirishiri: p => [
        K.kobachi(p, { glaze: '#f0ece2', inside: '#f8f6f0' }),
        `<circle cx="100" cy="100" r="82" fill="none" stroke="#2c4c7c" stroke-width="1.4" opacity=".8"/>`,
        xjp_s2Mound(p, 100, 102, 132, '#e0782e', { seed: 1 }),
        xjp_erShreds(p, 100, 102, 124, { c: '#ef7a28', n: 90, w: 2.4, len: .35, seed: 1, curve: .4 }),
        xjp_erGrains(p, 100, 102, 104, { cols: ['#f7d150', '#fbe48a'], n: 34, size: 3.4, seed: 2 }),
        xjp_erGrains(p, 100, 102, 96, { cols: ['#c9a27a'], n: 12, size: 2.6, seed: 3 }),
        xjp_erShreds(p, 100, 100, 110, { c: '#f28a36', n: 40, w: 2.2, len: .3, seed: 4, curve: .4 }),
        xjp_erGlints(p, 100, 100, 90, { n: 8, op: .5 }),
    ].join(''),

    // ニラ玉: 白い皿に、ふんわり焼いた卵の大きなかたまりと、たっぷりのニラ、もやし
    niratama: p => [
        K.plate(p),
        xjp_erSprouts(p, 100, 104, 120, { n: 16 }),
        xjp_scrambleBig(p, 100, 102, 140, { seed: 1 }),
        xjp_nira(p, 100, 100, 120, { n: 26, seed: 1 }),
        xjp_scrambleBig(p, 104, 98, 80, { seed: 2, n: 5 }),
        xjp_nira(p, 100, 100, 90, { n: 10, seed: 2 }),
        xjp_erGlints(p, 100, 100, 100, { n: 8, op: .55 }),
    ].join(''),

    // 大根サラダ: ガラスの鉢に、せん切りの大根の山、水菜とかいわれ、ツナ、かつお節、刻みのり
    daikonsalad: p => [
        K.bowl(p, { glaze: '#cfe0e4', inside: '#eef6f6', lip: .9 }),
        `<circle cx="100" cy="100" r="88" fill="none" stroke="#fff" stroke-width="1.6" opacity=".6"/>`,
        xjp_s2Mound(p, 100, 102, 138, '#e4e2d8', { seed: 1 }),
        xjp_erShreds(p, 100, 102, 130, { c: '#fbfaf2', n: 120, w: 2.6, len: .38, seed: 1, curve: .3 }),
        `<g ${p.sh(.5)}>`, xjp_erShreds(p, 100, 100, 116, { c: '#5aa63c', n: 12, w: 1.8, len: .4, seed: 2, curve: .5 }), `</g>`,
        xjp_kaiware(p, 116, 90, 64, { n: 14 }),
        xjp_erTuna(p, 92, 104, 36, { seed: 1 }),
        xjp_erBonito(p, 100, 100, 50, { n: 12 }),
        K.noriStrips(p, 100, 96, 36, { n: 14 }),
    ].join(''),

    // トマトのマリネ: ガラスの皿に、くし切りのトマトをたっぷり、玉ねぎのみじん切りのドレッシング、大葉のせん切り
    tomatomarine: p => [
        K.plate(p, { rim: '#9fc6c8', base: '#f4f8f6' }),
        K.pool(p, 100, 104, 130, '#e8d9a0', { op: .45, seed: 1 }),
        `<g ${p.sh(.9)}>`,
        ...xjp_s2Spots('tmm', 15, 56).map(([x, y, r]) => K.tomatoWedge(p, x, y, 46, r)),
        `</g>`,
        xjp_erGrains(p, 100, 100, 110, { cols: ['#f6f0d4', '#e8e0b8'], n: 40, size: 1.4, seed: 2 }),
        `<g ${p.sh(.5)}>`, xjp_erShreds(p, 100, 98, 40, { c: '#3f8f2f', n: 18, w: 1.8, len: .5, seed: 3 }), `</g>`,
        xjp_erGlints(p, 100, 100, 110, { n: 10, op: .6 }),
    ].join(''),

    // ピーマンとじゃこの炒め: 灰釉の小鉢に、ごま油で炒めた細切りピーマンとカリッとしたちりめんじゃこ、白ごま
    jakopiman: p => [
        K.kobachi(p, { glaze: '#b8ad98', inside: '#f2ede2' }),
        xjp_s2Mound(p, 100, 102, 118, '#3f7a26', { seed: 2 }),
        ...xjp_scatter('jkp', 46, 100, 102, 58).map(([x, y, r]) => K.pepperPiece(p, x, y, 40, r, { strip: true, c: r % 2 < 1 ? '#3a8a2a' : '#4f9a34' })),
        xjp_jako(p, 100, 100, 110, { n: 44 }),
        ...xjp_scatter('jkq', 10, 100, 100, 46).map(([x, y, r]) => K.pepperPiece(p, x, y, 38, r, { strip: true })),
        xjp_s1Sesame(p, 100, 98, 46, 40, 24),
        xjp_erGlints(p, 100, 100, 90, { n: 6, op: .55 }),
    ].join(''),

    // 粉ふきいも: 白い鉢に、表面がほろっと白く粉をふいたじゃがいも、刻みパセリ
    kofukiimo: p => [
        K.bowl(p, { glaze: '#e9e3d6', inside: '#f8f5ee' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="#2c4c7c" stroke-width="1.4" opacity=".7"/>`,
        ...xjp_s2Spots('kfi', 13, 54).map(([x, y, r], i) => xjp_kofuki(p, x, y, 38, r, { seed: i })),
        xjp_zsParsley(p, 100, 100, 100, { n: 30 }),
    ].join(''),

    // にんじんのグラッセ: 白い小皿に、面取りしたにんじんの輪切りをつやよく重ね、パセリ
    glace: p => [
        K.plate(p, { rim: '#c9a24a' }),
        ...xjp_s2Spots('glc', 12, 52).map(([x, y]) => xjp_glace(p, x, y, 36, 0)),
        K.parsley(p, 132, 70, 20),
        xjp_erGlints(p, 100, 100, 90, { n: 6, op: .5 }),
    ].join(''),

    // たけのこの土佐煮: 茶の小鉢に、醤油色に煮た穂先のくし形と根元の半月、かつお節をまぶし、木の芽
    tosani: p => [
        K.kobachi(p, { glaze: '#6e4b33', inside: '#efe3cc' }),
        K.liquid(p, { R: 64, c: '#b07a32', op: .6, shine: false }),
        `<g ${p.sh(.6)}>`,
        ...[[76, 120, 28, -20], [128, 126, 26, 30], [104, 140, 24, 10], [62, 92, 24, -60]].map(([x, y, s, r]) => xjp_wa2Daikon(p, x, y, s * 1.3, r, { c: '#d8b06a', shape: 'half' })),
        `</g>`,
        xjp_takenokoTip(p, 82, 86, 66, -30, { c: '#d9b468' }), xjp_takenokoTip(p, 124, 96, 66, 25, { c: '#dcb86c' }), xjp_takenokoTip(p, 104, 66, 56, 0, { c: '#d4ac60' }),
        xjp_erBonito(p, 100, 100, 90, { n: 22 }),
        ...[[104, 98, 0], [96, 106, 50], [112, 108, -40]].map(([x, y, r]) => `<path ${T(x, y, r)} d="M0,0 Q-4,-6 0,-11 Q4,-6 0,0Z" fill="${p.g('#5aa636', .3, .25)}" stroke="#2f6a22" stroke-width=".5"/>`),
    ].join(''),

    // ちくわの磯辺揚げ: 白い皿に、縦半分に切って青のり入りの衣で揚げたちくわを並べる
    isobeage: p => [
        K.plate(p),
        `<g ${p.sh(.6)}><path d="M44,60 L150,46 L160,150 L52,158Z" fill="#fbfaf4" stroke="#e2ddd0" stroke-width=".8"/></g>`,
        ...[[84, 70, -20], [126, 74, 30], [62, 108, 70], [100, 104, -10], [140, 110, 70], [80, 142, 10], [122, 144, -30]].map(([x, y, r], i) => xjp_isobe(p, x, y, 56, r, { seed: i })),
    ].join(''),

    // ニラチヂミ: 白い皿に、カリッと焼いた丸い生地を切り分け、ニラ・にんじん・えびがのぞく。たれの小皿
    chijimi: p => {
        const R = rng(p.id + 'chj');
        const wedge = (a0, a1) => `M100,100 L${f(100 + Math.cos(a0) * 78)},${f(100 + Math.sin(a0) * 78)} A78,78 0 0 1 ${f(100 + Math.cos(a1) * 78)},${f(100 + Math.sin(a1) * 78)}Z`;
        const pancake = smooth(ring(76, 16, .08, R).map(([a, b]) => [a + 100, b + 100]));
        const cid = p.uid();
        return [
            K.plate(p),
            `<g ${p.sh(1.3)}><path d="${pancake}" fill="${p.rg('#e8b65c', .3, .35, .4, .38)}" stroke="#a8702a" stroke-width=".9"/></g>`,
            `<defs><clipPath id="${cid}"><path d="${pancake}"/></clipPath></defs>`,
            `<g clip-path="url(#${cid})">`,
            `<g ${xjp_yoBlur(p, 3)}>${xjp_scatter('chb', 10, 100, 100, 66).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="6" fill="#b06a1c" opacity=".45"/>`).join('')}</g>`,
            xjp_nira(p, 100, 100, 140, { n: 30, seed: 3 }),
            xjp_erShreds(p, 100, 100, 130, { c: '#ef7a2a', n: 18, w: 2, len: .2, seed: 5 }),
            ...xjp_scatter('chs', 6, 100, 100, 54).map(([x, y, r]) => K.shrimp(p, x, y, 14, r)),
            `<path d="${pancake}" fill="#f2d48a" opacity=".2"/>`,
            ...[0, 1, 2].map(i => `<path d="M100,100 L${f(100 + Math.cos(i * 1.047 + .3) * 90)},${f(100 + Math.sin(i * 1.047 + .3) * 90)} M100,100 L${f(100 - Math.cos(i * 1.047 + .3) * 90)},${f(100 - Math.sin(i * 1.047 + .3) * 90)}" stroke="#7a4a18" stroke-width="2.6" opacity=".55"/><path d="M100,100 L${f(100 + Math.cos(i * 1.047 + .3) * 90)},${f(100 + Math.sin(i * 1.047 + .3) * 90)} M100,100 L${f(100 - Math.cos(i * 1.047 + .3) * 90)},${f(100 - Math.sin(i * 1.047 + .3) * 90)}" stroke="#fbf6ea" stroke-width="1" opacity=".7"/>`),
            `</g>`,
            `<path d="M44,76 Q56,44 92,34" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
            K.sesame(p, 100, 100, 110, { n: 18 }),
            `<g ${p.sh(1)}><circle cx="160" cy="160" r="20" fill="${p.rg('#f6f2ea', .2, .14)}"/></g><circle cx="160" cy="160" r="15" fill="${p.rg('#5a2a12', .2, .2)}"/>`,
            K.sesame(p, 160, 160, 16, { n: 6, seed: 3 }), K.scallions(p, 160, 160, 14, { n: 4, seed: 2 }),
        ].join('');
    },

    // 菜の花のからし和え: 黄瀬戸の小鉢に、ゆでた菜の花（茎・葉・黄色いつぼみ）を和えて盛る
    karashiae: p => [
        K.kobachi(p, { glaze: '#d8b860', inside: '#f6efd8' }),
        K.liquid(p, { R: 62, c: '#d9b866', op: .5, shine: false }),
        ...xjp_s2Spots('nnh', 18, 54).map(([x, y, r], i) => xjp_nanohana(p, x, y, 42, r, { seed: i })),
        `<g ${p.sh(.4)}><path ${T(124, 70)} d="${smooth(ring(5, 7, .3, rng('krs'), 1.2, .9))}" fill="${p.rg('#e7b928', .3, .2)}" stroke="#b88a10" stroke-width=".5"/></g>`,
    ].join(''),

    // こんにゃくのピリ辛炒め: 黒の小鉢に、醤油で照りよく炒めたちぎりこんにゃく、輪切り唐辛子、かつお節
    konnyakuitame: p => [
        K.kobachi(p, { glaze: '#2e2a28', inside: '#e2d8c6' }),
        ...xjp_s2Spots('kni', 18, 54).map(([x, y, r], i) => xjp_konnyakuBit(p, x, y, 30, r, { seed: i })),
        ...xjp_scatter('knc', 10, 100, 100, 52).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="none" stroke="#d6281a" stroke-width="1.8"/>`),
        xjp_erBonito(p, 100, 98, 70, { n: 14 }),
        xjp_erGlints(p, 100, 100, 90, { n: 8, op: .55 }),
    ].join(''),

    // 豆腐と三つ葉のすまし汁: 朱の椀、澄んだ黄金色のだしに、大きめの絹ごし豆腐・えのき・結び三つ葉、ゆずの皮
    sumashijiru: p => [
        K.wan(p, { outer: '#a8331f', inner: '#2a1512' }),
        K.liquid(p, { R: 76, c: '#c9a058', op: .82 }),
        `<circle cx="100" cy="100" r="60" fill="#e6c88a" opacity=".25"/>`,
        K.tofu(p, 80, 88, 32, 32, 10), K.tofu(p, 120, 118, 32, 32, -12), K.tofu(p, 118, 78, 28, 28, 25), K.tofu(p, 84, 128, 26, 26, -20), K.tofu(p, 144, 100, 24, 24, 5),
        xjp_enoki(p, 56, 112, 50, -30, { n: 12 }), xjp_enoki(p, 128, 140, 40, -120, { n: 9, seed: 2 }), xjp_enoki(p, 92, 60, 40, 10, { n: 9, seed: 3 }),
        `<g ${T(100, 104)}><path d="M-14,4 Q-4,-2 6,2 Q12,4 16,0" stroke="#7cb84c" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="-2" cy="2" r="3.4" fill="none" stroke="#6aa83e" stroke-width="2"/></g>`,
        K.mitsuba(p, 116, 104, 26, 60), K.mitsuba(p, 84, 104, 22, -60),
        `<path d="M98,96 l8,-2" stroke="#f2c21e" stroke-width="2.4" stroke-linecap="round"/><path d="M100,92 l7,1" stroke="#f2c21e" stroke-width="2" stroke-linecap="round"/>`,
        xjp_zsShine(100, 100, 76, .45),
    ].join(''),

    // 鮭の粕汁: 黒の椀、酒粕で白くにごった汁に、鮭・大根とにんじんのいちょう切り・油揚げ・こんにゃく・長ねぎ
    kasujiru: p => {
        const sp = xjp_zsSpots('kas', 18, 56, 17);
        return [
            K.wan(p, { outer: '#2a2321', inner: '#7a2416' }),
            K.liquid(p, { R: 76, c: '#e6dccb', op: 1 }),
            `<circle cx="100" cy="100" r="62" fill="#f6f0e4" opacity=".5"/>`,
            `<g ${p.sh(.8)}>`,
            ...sp.map(([x, y, r], i) => { const t = i % 5; return t === 0 || t === 3 ? xjp_zsIcho(p, x, y, 22, r, { c: '#f2ead2' }) : t === 1 ? xjp_zsIcho(p, x, y, 19, r, { c: '#ec7b2d' }) : t === 2 ? K.aburaage(p, x, y, 22, 7, r) : K.konnyaku(p, x, y, 15, r); }),
            xjp_salmonChunk(p, 82, 84, 32, 20, { seed: 1 }), xjp_salmonChunk(p, 124, 112, 32, -30, { seed: 2 }), xjp_salmonChunk(p, 92, 128, 28, 60, { seed: 3 }),
            `</g>`,
            `<circle cx="100" cy="100" r="76" fill="#efe6d6" opacity=".18"/>`,
            ...[[104, 96, 20], [128, 80, -30], [72, 110, 60], [114, 138, 10]].map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 16, r)),
            K.scallions(p, 100, 100, 76, { n: 10, c: '#5fa03a' }),
            xjp_zsShine(100, 100, 76, .4),
        ].join('');
    },

    // のっぺい汁: 朱の椀、とろみのある琥珀色の汁に、角切りの里芋・大根・にんじん・鶏肉・しいたけ・こんにゃく
    noppeijiru: p => {
        const sp = xjp_zsSpots('npp', 20, 58, 18);
        return [
            K.wan(p, { outer: '#9a2c1e', inner: '#2a1512' }),
            K.liquid(p, { R: 76, c: '#b88a4a', op: .95 }),
            `<g ${p.sh(.7)}>`,
            ...sp.map(([x, y, r], i) => { const t = i % 6; return t === 0 ? K.satoimo(p, x, y, 24, r, { c: '#ece2cc' }) : t === 1 ? xjp_zsDice(p, x, y, 17, r, '#f0e2c0') : t === 2 ? xjp_zsDice(p, x, y, 16, r, '#ec7b2d') : t === 3 ? K.chickenPiece(p, x, y, 22, r, { c: '#e2c69a', skin: '#c8a070' }) : t === 4 ? K.shiitake(p, x, y, 17, r, { cross: false }) : xjp_zsDice(p, x, y, 16, r, '#7d7672'); }),
            `</g>`,
            `<circle cx="100" cy="100" r="74" fill="#c99a58" opacity=".28"/>`,
            xjp_erGlints(p, 100, 100, 110, { n: 9, op: .6 }),
            xjp_zsShine(100, 100, 76, .45),
        ].join('');
    },

    // さつま汁: 黒の椀、味噌汁に鶏肉・大根とにんじんのいちょう切り・さつまいもの輪切り・ささがきごぼう・長ねぎ
    satsumajiru: p => {
        const sp = xjp_zsSpots('stm', 20, 56, 16);
        return [
            K.wan(p, { outer: '#1e1816', inner: '#2a1512' }),
            K.liquid(p, { R: 76, c: '#b5854a', op: 1 }),
            `<circle cx="100" cy="100" r="62" fill="#d8b07a" opacity=".3"/>`,
            `<g ${p.sh(.8)}>`,
            ...sp.map(([x, y, r], i) => { const t = i % 5; return t === 0 ? xjp_zsIcho(p, x, y, 21, r, { c: '#efe2c0' }) : t === 1 ? xjp_zsIcho(p, x, y, 18, r, { c: '#ec7b2d' }) : t === 2 ? `<g ${T(x, y, r)}><circle r="10" fill="#8a2e4a"/><circle r="8.4" fill="${p.g('#f2c64c', .3, .2)}"/></g>` : t === 3 ? xjp_zsSasagaki(p, x, y, 20, r) : K.chickenPiece(p, x, y, 20, r, { c: '#e0bf90', skin: '#c49866' }); }),
            `</g>`,
            ...[[98, 94, 20], [126, 116, -30], [76, 118, 60], [118, 76, 10]].map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 15, r)),
            K.scallions(p, 100, 100, 70, { n: 10, c: '#5fa03a' }),
            xjp_zsShine(100, 100, 76, .4),
        ].join('');
    },

    // かき玉汁: 朱の椀、うすくとろみのある澄んだだしに、ふわふわの溶き卵、三つ葉、小口ねぎ
    kakitamajiru: p => [
        K.wan(p, { outer: '#a8331f', inner: '#2a1512' }),
        K.liquid(p, { R: 76, c: '#d0a24e', op: .85 }),
        ...[[98, 90, 70, -15], [80, 122, 60, 25], [128, 112, 56, 70], [116, 66, 52, 10], [62, 92, 44, 80], [108, 140, 48, -5], [144, 90, 38, -60]].map(([x, y, L, r], i) => xjp_softEgg(p, x, y, L, r, { seed: i + 1 })),
        K.mitsuba(p, 104, 98, 26, 20), K.mitsuba(p, 84, 110, 22, -50),
        `<path d="M90,108 L120,94" stroke="#8cbf5c" stroke-width="1.8" stroke-linecap="round"/>`,
        K.scallions(p, 100, 100, 90, { n: 12, c: '#5fa03a' }),
        xjp_zsShine(100, 100, 76, .45),
    ].join(''),

    // 石狩汁: 土色の鉢、味噌汁に大きな鮭・じゃがいも・キャベツ・にんじん・玉ねぎ、とけかけたバター、長ねぎ
    ishikarijiru: p => [
        K.bowl(p, { glaze: '#7a5a3e', inside: '#5a3a24', lip: .9 }),
        K.liquid(p, { R: 78, c: '#b8884c', op: 1 }),
        `<circle cx="100" cy="100" r="64" fill="#d6ae74" opacity=".3"/>`,
        `<g ${p.sh(.8)}>`,
        ...[[70, 76, 20], [130, 128, -40], [64, 118, 70]].map(([x, y, r], i) => xjp_erCabbage(p, x, y, 34, r, { seed: i })),
        K.potato(p, 136, 80, 28, 20, { c: '#ecc77c', seed: 1 }), K.potato(p, 82, 138, 26, -30, { c: '#ecc77c', seed: 2 }),
        K.carrotRound(p, 112, 146, 16, { half: true, r: 20 }), K.carrotRound(p, 148, 108, 16, { half: true, r: -60 }), K.carrotRound(p, 58, 96, 15, { half: true, r: 120 }),
        ...[[104, 130, 30], [120, 60, -20]].map(([x, y, r]) => xjp_zsOnionStrip(p, x, y, 28, r)),
        xjp_salmonChunk(p, 96, 84, 40, 10, { seed: 1 }), xjp_salmonChunk(p, 118, 108, 38, -30, { seed: 2 }), xjp_salmonChunk(p, 78, 110, 32, 60, { seed: 3 }),
        `</g>`,
        xjp_butter(p, 104, 100, 14),
        ...[[86, 66, 20], [140, 94, -40], [66, 136, 30]].map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 16, r, { green: true })),
        xjp_zsShine(100, 100, 78, .4),
    ].join(''),

    // 沢煮椀: 黒の椀、澄んだだしに細いせん切りの豚肉・にんじん・ごぼう・しいたけ・長ねぎをたっぷり、三つ葉、こしょう
    sawaniwan: p => [
        K.wan(p, { outer: '#1e1816', inner: '#2a1512' }),
        `<circle cx="100" cy="100" r="88" fill="none" stroke="#b8902e" stroke-width="1.2" opacity=".7"/>`,
        K.liquid(p, { R: 76, c: '#c69a52', op: .82 }),
        `<g ${p.sh(.6)}>`,
        xjp_erShreds(p, 100, 100, 104, { c: '#efe8d0', n: 18, w: 2.2, len: .45, seed: 1, curve: .2 }),
        xjp_erShreds(p, 100, 100, 104, { c: '#d9a890', n: 16, w: 2.6, len: .45, seed: 2, curve: .2 }),
        xjp_erShreds(p, 100, 100, 104, { c: '#ec7a2c', n: 16, w: 2, len: .45, seed: 3, curve: .2 }),
        xjp_erShreds(p, 100, 100, 104, { c: '#8a6440', n: 14, w: 2, len: .45, seed: 4, curve: .2 }),
        xjp_erShreds(p, 100, 100, 100, { c: '#5a3a24', n: 10, w: 2.4, len: .4, seed: 5, curve: .2 }),
        `</g>`,
        K.mitsuba(p, 100, 96, 28, 10), K.mitsuba(p, 114, 108, 22, 120),
        `<path d="M86,110 L112,92" stroke="#8cbf5c" stroke-width="1.8" stroke-linecap="round"/>`,
        K.sprinkle(p, 100, 100, 70, { c: '#2a2420', n: 18, r: .7 }),
        xjp_zsOil(p, 100, 100, 130, { n: 10, c: '#f0c25a', op: .5, rmax: 1.6 }),
        xjp_zsShine(100, 100, 76, .45),
    ].join(''),

    // 船場汁: 朱の椀、うすくにごった塩味のだしに、さばのぶつ切り・短冊の大根・長ねぎ、針しょうが
    senbajiru: p => [
        K.wan(p, { outer: '#9a2c1e', inner: '#2a1512' }),
        K.liquid(p, { R: 76, c: '#d6c294', op: .95 }),
        `<circle cx="100" cy="100" r="64" fill="#efe2bc" opacity=".3"/>`,
        `<g ${p.sh(.8)}>`,
        ...[[72, 84, 30], [128, 70, -20], [138, 124, 60], [70, 128, -40], [104, 146, 10], [104, 104, 80], [148, 98, 100], [58, 106, 70]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-13" y="-4" width="26" height="8" rx="1.4" fill="${p.g('#f6f2e2', .3, .2)}" stroke="#cfc6a6" stroke-width=".6"/></g>`),
        xjp_sabaChunk(p, 94, 82, 38, -10, { seed: 1 }), xjp_sabaChunk(p, 118, 106, 38, 20, { seed: 2 }), xjp_sabaChunk(p, 84, 120, 34, -30, { seed: 3 }),
        `</g>`,
        ...[[110, 132, 20], [126, 86, -30], [70, 100, 60]].map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 15, r)),
        K.gingerShreds(p, 102, 100, 22),
        K.scallions(p, 100, 100, 70, { n: 8, c: '#5fa03a' }),
        xjp_zsShine(100, 100, 76, .4),
    ].join(''),

    // 呉汁: 黒の椀、すりつぶした大豆でふんわり白っぽくにごった味噌汁に、大根・にんじん・里芋・油揚げ、小口ねぎ
    gojiru: p => {
        const sp = xjp_zsSpots('goj', 14, 56, 18);
        return [
            K.wan(p, { outer: '#2a2321', inner: '#2a1512' }),
            K.liquid(p, { R: 76, c: '#d2b882', op: 1 }),
            `<g ${p.rough(3, .2)}>${xjp_scatter('gjf', 16, 100, 100, 62).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(6 + (x * 7 % 6))}" fill="#ece0bc" opacity=".55"/>`).join('')}</g>`,
            `<g ${p.sh(.6)}>`,
            ...sp.map(([x, y, r], i) => { const t = i % 4; return t === 0 ? xjp_zsIcho(p, x, y, 21, r, { c: '#efe4c6', op: .9 }) : t === 1 ? xjp_zsIcho(p, x, y, 18, r, { c: '#ec7b2d', op: .9 }) : t === 2 ? K.aburaage(p, x, y, 22, 7, r) : K.satoimo(p, x, y, 20, r, { c: '#ece2cc' }); }),
            `</g>`,
            `<g ${p.rough(3, .2)}>${xjp_scatter('gjg', 10, 100, 100, 60).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(5 + (y * 3 % 5))}" fill="#efe4c4" opacity=".5"/>`).join('')}</g>`,
            K.sprinkle(p, 100, 100, 120, { c: '#c9ac70', n: 40, r: .9 }),
            K.scallions(p, 100, 100, 84, { n: 16, c: '#5fa03a' }),
            xjp_zsShine(100, 100, 76, .35),
        ].join('');
    },

    // だんご汁: 茶の椀、味噌汁に手でのばした平たい小麦粉のだんご、豚肉・大根・にんじん・ささがきごぼう・しいたけ、小口ねぎ
    dangojiru: p => {
        const sp = xjp_zsSpots('dgj', 12, 58, 18);
        return [
            K.wan(p, { outer: '#5a3a26', inner: '#2a1512' }),
            K.liquid(p, { R: 76, c: '#b07c44', op: 1 }),
            `<circle cx="100" cy="100" r="62" fill="#d0a46c" opacity=".3"/>`,
            `<g ${p.sh(.8)}>`,
            ...sp.map(([x, y, r], i) => { const t = i % 4; return t === 0 ? xjp_zsIcho(p, x, y, 19, r, { c: '#efe2c0' }) : t === 1 ? xjp_zsIcho(p, x, y, 17, r, { c: '#ec7b2d' }) : t === 2 ? xjp_zsSasagaki(p, x, y, 20, r) : K.shiitake(p, x, y, 14, r, { cross: false }); }),
            K.porkSlice(p, 132, 86, 30, 40, { c: '#c99c78', fat: '#f4e4cc', char: false, gloss: .35, seed: 1 }), K.porkSlice(p, 70, 120, 28, -40, { c: '#c99c78', fat: '#f4e4cc', char: false, gloss: .35, seed: 2 }),
            xjp_dango(p, 86, 84, 42, 20, { seed: 1 }), xjp_dango(p, 122, 120, 44, -30, { seed: 2 }), xjp_dango(p, 106, 98, 38, 70, { seed: 3 }), xjp_dango(p, 84, 134, 34, 10, { seed: 4 }), xjp_dango(p, 136, 70, 30, -60, { seed: 5 }),
            `</g>`,
            K.scallions(p, 100, 100, 90, { n: 14, c: '#5fa03a' }),
            xjp_zsShine(100, 100, 76, .4),
        ].join('');
    },

    // しじみの味噌汁: 黒漆の椀、こっくりした味噌汁に小さな黒いしじみがたくさん（口が開いて身がのぞく）、小口ねぎ
    shijimimiso: p => [
        K.wan(p, { outer: '#1e1816', inner: '#2a1512' }),
        K.liquid(p, { R: 76, c: '#9a6a3a', op: 1 }),
        `<circle cx="100" cy="100" r="62" fill="#c09060" opacity=".28"/>`,
        ...xjp_zsSpots('sjm', 26, 60, 17).map(([x, y, r], i) => xjp_shijimi(p, x, y, 22, r, { seed: i, open: i % 4 !== 3 })),
        K.scallions(p, 100, 100, 100, { n: 16, c: '#5fa03a' }),
        xjp_zsShine(100, 100, 76, .4),
    ].join(''),

    // 芋煮: 土鍋に、醤油味の汁、つるりとした里芋・牛肉・ちぎりこんにゃく・斜め切りの長ねぎ・しめじ
    imoni: p => [
        xjp_donabe(p),
        K.liquid(p, { R: 79, c: '#8a5a30', op: 1, shine: false }),
        `<g ${p.sh(.9)}>`,
        ...[[70, 82, 30], [126, 68, -20], [140, 118, 60], [74, 130, 10], [104, 110, 40], [100, 150, 0]].map(([x, y, r], i) => K.satoimo(p, x, y, 34, r, { c: '#ecdfc4' })),
        ...[[96, 80, 20], [126, 96, -40], [60, 106, 60], [118, 138, 10], [88, 118, 100]].map(([x, y, r], i) => xjp_wa2Beef(p, x, y, 40, r, { c: '#7a4426', seed: i })),
        K.konnyaku(p, 150, 90, 18, 20), K.konnyaku(p, 52, 80, 16, -30),
        ...[[100, 56, 20], [146, 142, -40], [56, 146, 60], [158, 72, 100]].map(([x, y, r]) => xjp_wa2NegiSlant(p, x, y, 28, r, { c: '#e6dab0' })),
        K.shimeji(p, 84, 100, 24, -100, { n: 4 }), K.shimeji(p, 136, 112, 22, 40, { n: 3 }),
        `</g>`,
        xjp_erGlints(p, 100, 100, 120, { n: 10, op: .45 }),
    ].join(''),

    // 大根と油揚げの味噌汁: 朱の椀、味噌汁にせん切りの大根と短冊の油揚げ、小口ねぎ
    daikonmiso: p => [
        K.wan(p, { outer: '#9a2c1e', inner: '#2a1512' }),
        K.liquid(p, { R: 76, c: '#bf9258', op: 1 }),
        `<circle cx="100" cy="100" r="62" fill="#dcba86" opacity=".32"/>`,
        `<g ${p.sh(.5)}>`,
        xjp_erShreds(p, 100, 100, 112, { c: '#f4eedc', n: 40, w: 2.6, len: .32, seed: 1, curve: .2 }),
        ...xjp_scatter('dkm', 12, 100, 100, 50).map(([x, y, r]) => K.aburaage(p, x, y, 26, 8, r)),
        `</g>`,
        xjp_erShreds(p, 100, 100, 100, { c: '#f8f4e6', n: 16, w: 2.6, len: .3, seed: 2, curve: .2 }),
        K.scallions(p, 100, 100, 90, { n: 16, c: '#5fa03a' }),
        xjp_zsShine(100, 100, 76, .4),
    ].join(''),

    // お雑煮（関東風）: 朱と黒の椀、澄んだすまし汁に焼いた角もち・鶏肉・小松菜・にんじん・紅白のかまぼこ、三つ葉とゆず
    zoni: p => [
        K.wan(p, { outer: '#a8331f', inner: '#2a1512' }),
        `<circle cx="100" cy="100" r="88" fill="none" stroke="#d8b04a" stroke-width="1.4" opacity=".8"/>`,
        K.liquid(p, { R: 76, c: '#c9a058', op: .85 }),
        `<g ${p.sh(.8)}>`,
        xjp_s1Bundle(p, 124, 132, 54, 20, -30, { seed: 1, stems: 2 }),
        K.chickenPiece(p, 64, 112, 22, 20, { c: '#e6c9a0', skin: '#caa070' }), K.chickenPiece(p, 140, 82, 22, -40, { c: '#e6c9a0', skin: '#caa070' }), K.chickenPiece(p, 102, 148, 20, 60, { c: '#e6c9a0', skin: '#caa070' }),
        xjp_mochi(p, 92, 90, 46, 38, -8, { seed: 1 }), xjp_mochi(p, 120, 108, 42, 36, 14, { seed: 2 }),
        xjp_kamaboko(p, 70, 74, 26, -30), xjp_kamaboko(p, 80, 132, 24, 20),
        ...[[140, 112], [118, 66]].map(([x, y]) => `<g ${T(x, y)}>${[0, 72, 144, 216, 288].map(a => `<circle cx="${f(Math.cos(a / 57.3) * 4.4)}" cy="${f(Math.sin(a / 57.3) * 4.4)}" r="4.4" fill="${p.g('#ec7a2c', .3, .25)}"/>`).join('')}<circle r="2.6" fill="#f6a466"/></g>`),
        `</g>`,
        K.mitsuba(p, 104, 84, 24, 20),
        `<path d="M112,96 l9,-2" stroke="#f2c21e" stroke-width="2.6" stroke-linecap="round"/>`,
        xjp_zsShine(100, 100, 76, .45),
    ].join(''),

    // ポトフ: 白い深皿に、澄んだコンソメ、まるごとのウインナー・大きなじゃがいも・にんじん・キャベツのくし形・玉ねぎ・ブロッコリー、粒マスタード
    potofu: p => [
        K.bowl(p, { glaze: '#f3eee4', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="84" fill="none" stroke="#2c4c7c" stroke-width="1.6" opacity=".8"/>`,
        K.liquid(p, { R: 76, c: '#d8b064', op: .9 }),
        `<g ${p.sh(1)}>`,
        xjp_cabbageWedge(p, 124, 70, 54, 20),
        `<g ${T(66, 82, -20)}>${K.onion(p, 0, 0, 40, 0, { c: '#ecd49a', layers: 3 })}</g>`,
        K.potato(p, 70, 128, 40, 20, { c: '#efcf88', seed: 1 }), K.potato(p, 140, 120, 36, -40, { c: '#efcf88', seed: 2 }),
        K.carrotChunk(p, 104, 138, 34, 20), K.carrotChunk(p, 96, 64, 28, -60),
        K.broccoli(p, 150, 90, 28, 10),
        xjp_wiener(p, 100, 100, 58, -20), xjp_wiener(p, 116, 118, 54, 30), xjp_wiener(p, 84, 106, 50, 80),
        `</g>`,
        `<g ${p.sh(.5)}><circle cx="150" cy="150" r="7" fill="${p.rg('#d8a83a', .2, .2)}"/></g>${K.sprinkle(p, 150, 150, 10, { c: '#7a5a1a', n: 8, r: .8 })}`,
        xjp_zsOil(p, 100, 100, 140, { n: 10, c: '#f2c45a', op: .5, rmax: 1.8 }),
        xjp_zsParsley(p, 100, 100, 70, { n: 14 }),
    ].join(''),

    // ワンタンスープ: 白い中華碗（赤い線）、澄んだ金色のスープに、ひらひらのワンタン・チンゲン菜・長ねぎ、ごま油
    wantansoup: p => [
        K.bowl(p, { glaze: '#f6f2ea', inside: '#fbf9f3' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="#c0392b" stroke-width="2.4" opacity=".9"/><circle cx="100" cy="100" r="82.4" fill="none" stroke="#c0392b" stroke-width=".8" opacity=".7"/>`,
        K.liquid(p, { R: 76, c: '#c8963e', op: .92 }),
        xjp_wa2Chingensai(p, 134, 128, 54, -40), xjp_wa2Chingensai(p, 62, 76, 48, 150),
        ...[[86, 96, 44, 20], [124, 82, 42, -30], [104, 126, 44, 60], [70, 124, 36, 0], [138, 104, 34, 80], [102, 66, 34, 10]].map(([x, y, s, r], i) => xjp_wonton(p, x, y, s, r, { seed: i })),
        ...[[96, 106, 20], [122, 104, -30], [80, 112, 60], [112, 86, 10]].map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 14, r, { green: r > 0 })),
        K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
        xjp_zsOil(p, 100, 100, 136, { n: 14, c: '#f0c050', op: .6, rmax: 2 }),
        xjp_zsShine(100, 100, 76, .4),
    ].join(''),

    // 春雨スープ: 白い中華碗（藍の線）、澄んだスープにたっぷりの春雨、溶き卵・しいたけ・にんじんのせん切り・ねぎ、白ごま
    harusamesoup: p => [
        K.bowl(p, { glaze: '#f6f2ea', inside: '#fbf9f3' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="#2c4c7c" stroke-width="2.4" opacity=".9"/><circle cx="100" cy="100" r="82.4" fill="none" stroke="#2c4c7c" stroke-width=".8" opacity=".7"/>`,
        K.liquid(p, { R: 76, c: '#d2a656', op: .88 }),
        xjp_chNoodles(p, 100, 100, 130, { c: '#f4efe0', w: 1.8, n: 36, seed: 1, outline: '#cdbf9a' }),
        ...[[86, 90, 50, -15], [124, 118, 46, 60], [110, 70, 40, 10], [72, 124, 38, 30]].map(([x, y, L, r], i) => xjp_softEgg(p, x, y, L, r, { seed: i + 1 })),
        ...[[120, 90, 0], [90, 128, 40], [140, 128, -20], [64, 98, 70]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-10" y="-2.4" width="20" height="4.8" rx="2" fill="${p.g('#7a4b2b', .25, .3)}"/><rect x="-10" y=".6" width="20" height="1.8" rx=".9" fill="#ead9bd"/></g>`),
        xjp_erShreds(p, 100, 100, 110, { c: '#ec7a2c', n: 16, w: 1.8, len: .3, seed: 3 }),
        K.scallions(p, 100, 100, 96, { n: 16, c: '#4f9a34' }),
        K.sesame(p, 100, 100, 90, { n: 16 }),
        xjp_zsShine(100, 100, 76, .4),
    ].join(''),

    // キムチチゲ: 黒い石鍋に赤いスープ、白菜キムチ・豚バラ・木綿豆腐・玉ねぎ・えのき・長ねぎ、ラー油の粒
    kimchichige: p => [
        K.stonePot(p),
        K.liquid(p, { R: 78, c: '#c63a20', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="78" fill="none" stroke="#8e1a0c" stroke-width="5" opacity=".5"/>`,
        xjp_zsOil(p, 100, 100, 144, { n: 16, c: '#ef6a2a', op: .7, rmax: 2.4, seed: 3 }),
        `<g ${p.sh(.8)}>`,
        ...[[136, 82, 40], [62, 104, -30], [116, 140, 10], [96, 62, 70], [146, 120, -60]].map(([x, y, r], i) => K.kimchi(p, x, y, 30, r, { seed: i })),
        K.porkSlice(p, 82, 136, 40, -30, { c: '#c48c6a', fat: '#f2dcc4', char: false, gloss: .3, seed: 1 }), K.porkSlice(p, 120, 108, 40, 50, { c: '#c48c6a', fat: '#f2dcc4', char: false, gloss: .3, seed: 2 }), K.porkSlice(p, 70, 76, 34, 20, { c: '#c48c6a', fat: '#f2dcc4', char: false, gloss: .3, seed: 3 }),
        K.tofu(p, 100, 94, 30, 30, 10, { tint: '#f6e8dc' }), K.tofu(p, 132, 62, 26, 26, -15, { tint: '#f6e8dc' }), K.tofu(p, 54, 132, 24, 24, 20, { tint: '#f6e8dc' }),
        xjp_enoki(p, 92, 120, 36, 40, { n: 8 }),
        `</g>`,
        ...[[110, 76, 20], [76, 100, -40], [140, 140, 60], [104, 154, 0]].map(([x, y, r]) => xjp_zsNegiSlant(p, x, y, 16, r, { green: r > 0 })),
        K.scallions(p, 100, 100, 110, { n: 12, c: '#4f9a34' }),
    ].join(''),

    // トムヤムクン: 白い鉢に、赤橙のスープ、尾のついたえび・しめじ・トマト・こぶみかんの葉・唐辛子、パクチー、ラー油
    tomyumkung: p => [
        K.bowl(p, { glaze: '#f3eee4', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="84" fill="none" stroke="#2f6a4a" stroke-width="1.8" opacity=".8"/>`,
        K.liquid(p, { R: 76, c: '#d8602a', op: 1 }),
        `<circle cx="100" cy="100" r="62" fill="#ec8a4a" opacity=".3"/>`,
        xjp_zsOil(p, 100, 100, 140, { n: 18, c: '#e8461c', op: .65, rmax: 2.6, seed: 2 }),
        `<g ${p.sh(.8)}>`,
        xjp_zsTomato(p, 70, 116, 24, 20), xjp_zsTomato(p, 136, 84, 22, -40), xjp_zsTomato(p, 112, 146, 20, 60),
        K.shimeji(p, 64, 84, 28, -60, { n: 4 }), K.shimeji(p, 140, 128, 26, 30, { n: 3 }),
        K.shrimp(p, 92, 82, 34, 10), K.shrimp(p, 124, 108, 34, -60), K.shrimp(p, 88, 128, 32, 120), K.shrimp(p, 114, 70, 30, 60),
        xjp_limeLeaf(p, 106, 104, 26, 30), xjp_limeLeaf(p, 62, 102, 22, -40),
        `</g>`,
        ...[[96, 106], [146, 104], [78, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="none" stroke="#c81e10" stroke-width="2"/>`),
        xjp_cilantro(p, 104, 92, 26, 0), xjp_cilantro(p, 128, 132, 22, 60),
        xjp_zsShine(100, 100, 76, .4),
    ].join(''),
};

// 小数を1桁にそろえて軽くする（形は変わらない）
const xjp_slim = s => s.replace(/(\d+\.\d)\d+/g, '$1');
export default Object.fromEntries(Object.entries(XJP).map(([id, fn]) => [id, p => xjp_slim(fn(p))]));
