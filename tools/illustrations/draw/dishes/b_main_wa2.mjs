// 主菜（魚・煮物）その2
import * as K from '../kit.mjs';

const { T, f, rng, smooth, ring, lt, dk, mix } = K;

// ---------------------------------------------------------
// このファイルだけの部品（wa2 で始まる）
// ---------------------------------------------------------

// 照り（白い曲線）
const wa2Shine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// 魚の切り身（鮭・ぶり）。上の縁に皮、斜めの脂の筋、ぶりは血合い。
// s は横幅。browned で焼き色、glazeC でたれの照り
function wa2Kirimi(p, x, y, s, r = 0, { flesh = '#f0905c', skin = '#9aa0a6', fat = '#fbe3cf', chiai = null, browned = 0, glazeC = null, seed = 1, gloss = .7 } = {}){
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
        ${wa2Shine('M-15,-6 Q-6,-11 5,-10', 1.8, gloss)}${wa2Shine('M2,6 Q9,5 14,1', 1.1, gloss * .6)}</g>`;
}

// さばの半身（皮を上に）。w×h、mode: 'grill'（塩焼き）/'miso'（味噌煮）
function wa2Saba(p, x, y, w, h, r = 0, { mode = 'grill', seed = 1 } = {}){
    const R = rng(p.id + 'saba' + seed + x);
    const hw = w / 2, hh = h / 2;
    const outline = smooth([[-hw, -hh * .55], [-hw * .6, -hh], [0, -hh * 1.04], [hw * .6, -hh * .98], [hw, -hh * .5], [hw * 1.02, hh * .45], [hw * .6, hh], [0, hh * 1.02], [-hw * .6, hh * .96], [-hw * 1.01, hh * .5]], true, .8);
    const skinC = mode === 'miso' ? '#6b6a5c' : '#5d6f80';
    const bellyC = mode === 'miso' ? '#c9b48e' : '#e6ddca';
    // 背の青い部分（上6割）
    const back = smooth([[-hw + 1, -hh * .5], [-hw * .6, -hh + 1], [0, -hh * 1.02 + 1], [hw * .6, -hh * .96 + 1], [hw - 1, -hh * .45], [hw * .6, hh * .12], [0, hh * .2], [-hw * .6, hh * .14]], true, .8);
    let st = '';
    const n = Math.round(w / 7);
    for (let i = 0; i < n; i++){
        const sx = -hw + 5 + i * (w - 10) / (n - 1);
        const pts = [[sx, -hh * .9], [sx + 2.5 + R() * 1.5, -hh * .55], [sx - 1, -hh * .25], [sx + 2, hh * .02]];
        st += `<path d="${smooth(pts, false)}" stroke="#202a36" stroke-width="${f(1.3 + R() * .8)}" fill="none" stroke-linecap="round" opacity=".75"/>`;
    }
    // 皮の切り目（×）
    const cuts = [-.22, .22].map(t => { const cx = t * w; return `<path d="M${f(cx - 6)},${f(-hh * .65)} L${f(cx + 6)},${f(hh * .35)} M${f(cx + 6)},${f(-hh * .65)} L${f(cx - 6)},${f(hh * .35)}" stroke="${mode === 'miso' ? '#e8cf9e' : '#f2e6d2'}" stroke-width="2.2" stroke-linecap="round"/><path d="M${f(cx - 6)},${f(-hh * .65)} L${f(cx + 6)},${f(hh * .35)} M${f(cx + 6)},${f(-hh * .65)} L${f(cx - 6)},${f(hh * .35)}" stroke="${dk(skinC, .4)}" stroke-width=".6" stroke-linecap="round" transform="translate(.8 .8)"/>`; }).join('');
    let ch = '';
    if (mode === 'grill'){
        for (let i = 0; i < 10; i++) ch += `<ellipse cx="${f(-hw + 6 + R() * (w - 12))}" cy="${f(-hh * .8 + R() * h * .85)}" rx="${f(2.5 + R() * 4.5)}" ry="${f(1.5 + R() * 2.4)}" fill="#3b2412" opacity="${f(.25 + R() * .4)}"/>`;
        for (let i = 0; i < 14; i++) ch += `<circle cx="${f(-hw + 6 + R() * (w - 12))}" cy="${f(-hh * .7 + R() * h * .8)}" r="${f(.5 + R() * .7)}" fill="#fff" opacity=".85"/>`;
    }
    const miso = mode === 'miso' ? `<path d="${outline}" fill="${p.g('#b07a34', .25, .25)}" opacity=".42"/><path d="${outline}" fill="none" stroke="#8a5420" stroke-width="3" opacity=".5"/>` : '';
    const goldTint = mode === 'grill' ? `<path d="${outline}" fill="${p.rg('#d08a3a', .1, .3)}" opacity=".38"/>` : '';
    return `<g ${T(x, y, r)}>
        <path d="${outline}" fill="${p.g(bellyC, .2, .25)}" stroke="${dk(skinC, .35)}" stroke-width=".9"/>
        <path d="${back}" fill="${p.g(skinC, .3, .25)}"/>
        ${st}
        <path d="M${-hw + 4},${f(hh * .2)} Q0,${f(hh * .3)} ${hw - 4},${f(hh * .05)}" stroke="#c9d2d6" stroke-width="1" fill="none" opacity=".6"/>
        ${goldTint}${ch}${cuts}${miso}
        ${wa2Shine(`M${f(-hw * .7)},${f(-hh * .72)} Q0,${f(-hh * 1.05)} ${f(hw * .6)},${f(-hh * .75)}`, 2, .8)}
        ${wa2Shine(`M${f(-hw * .5)},${f(hh * .6)} Q0,${f(hh * .72)} ${f(hw * .3)},${f(hh * .6)}`, 1.2, .45)}</g>`;
}

// さんま一尾（頭を左、腹を下）。長さ L
function wa2Sanma(p, x, y, L, r = 0){
    const R = rng(p.id + 'sanma' + x);
    const h = L * .085;
    const body = `M${-L / 2},${f(-h * .05)} L${f(-L * .44)},${f(-h * .55)} C${f(-L * .3)},${f(-h * 1.05)} ${f(L * .2)},${f(-h * 1.0)} ${f(L * .42)},${f(-h * .32)} L${f(L / 2)},${f(-h * 1.05)} L${f(L * .47)},0 L${f(L / 2)},${f(h * 1.05)} L${f(L * .42)},${f(h * .32)} C${f(L * .2)},${f(h * .95)} ${f(-L * .3)},${f(h * 1.0)} ${f(-L * .44)},${f(h * .5)} Z`;
    const back = `M${f(-L * .44)},${f(-h * .5)} C${f(-L * .3)},${f(-h * 1.0)} ${f(L * .2)},${f(-h * .95)} ${f(L * .42)},${f(-h * .3)} C${f(L * .2)},${f(-h * .05)} ${f(-L * .25)},${f(-h * .05)} ${f(-L * .44)},${f(-h * .1)} Z`;
    let ch = '';
    for (let i = 0; i < 16; i++) ch += `<ellipse cx="${f(-L * .36 + R() * L * .74)}" cy="${f(-h * .7 + R() * h * 1.3)}" rx="${f(2 + R() * 5)}" ry="${f(1.2 + R() * 2)}" fill="#2e1a0c" opacity="${f(.25 + R() * .45)}"/>`;
    for (let i = 0; i < 18; i++) ch += `<circle cx="${f(-L * .36 + R() * L * .74)}" cy="${f(-h * .6 + R() * h * 1.2)}" r="${f(.4 + R() * .6)}" fill="#fff" opacity=".9"/>`;
    return `<g ${T(x, y, r)}>
        <path d="${body}" fill="${p.g('#dcd8cc', .3, .25)}" stroke="#4a4d52" stroke-width=".9" stroke-linejoin="round"/>
        <path d="${back}" fill="${p.g('#4b5d72', .3, .3)}"/>
        <path d="M${f(-L * .42)},${f(-h * .12)} C${f(-L * .2)},${f(-h * .08)} ${f(L * .2)},${f(-h * .05)} ${f(L * .41)},${f(-h * .28)}" stroke="#9fb3c4" stroke-width="1.6" fill="none" opacity=".7"/>
        <path d="M${f(-L * .44)},${f(h * .5)} C${f(-L * .2)},${f(h * .85)} ${f(L * .2)},${f(h * .8)} ${f(L * .42)},${f(h * .3)}" stroke="#e7c27a" stroke-width="1.6" fill="none" opacity=".55"/>
        <path d="M${-L / 2},${f(-h * .05)} L${f(-L * .465)},${f(-h * .18)} L${f(-L * .465)},${f(h * .12)}Z" fill="#e8b72c"/>
        <path d="M${f(-L * .36)},${f(-h * .8)} Q${f(-L * .33)},0 ${f(-L * .36)},${f(h * .8)}" stroke="#3d4650" stroke-width="1.1" fill="none" opacity=".75"/>
        <circle cx="${f(-L * .405)}" cy="${f(-h * .2)}" r="${f(h * .32)}" fill="#efe9da" stroke="#3a3a3a" stroke-width=".7"/><circle cx="${f(-L * .405)}" cy="${f(-h * .2)}" r="${f(h * .16)}" fill="#1d1d1d"/>
        ${ch}
        <path d="M${f(L * .28)},${f(-h * .7)} L${f(L * .33)},${f(-h * .95)} L${f(L * .35)},${f(-h * .6)}Z" fill="#5a6470"/>
        ${wa2Shine(`M${f(-L * .28)},${f(-h * .75)} Q0,${f(-h * 1.0)} ${f(L * .26)},${f(-h * .62)}`, 1.6, .8)}</g>`;
}

// あじフライ（開いた形の扇形・尾びれつき）。長さ s、尾は右
function wa2AjiFry(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'aji' + seed + x);
    const k = s / 60;
    const body = 'M-28,-3 C-31,-20 -18,-27 -4,-24 C8,-21 18,-11 23,-4 L23,4 C18,11 8,21 -4,24 C-18,27 -31,20 -28,3 Q-25,0 -28,-3Z';
    let dots = '';
    for (let i = 0; i < 14; i++) dots += `<circle cx="${f(-24 + R() * 42)}" cy="${f(-18 + R() * 36)}" r="${f(.6 + R() * .9)}" fill="${R() < .5 ? '#f6d48c' : '#a8621c'}" opacity=".9"/>`;
    return `<g ${T(x, y, r, k)}>
        <g ${p.sh(.8)}><path d="M20,-2 L33,-14 Q30,-2 32,0 Q30,2 33,14 L20,2Z" fill="${p.g('#c07a32', .25, .3)}" stroke="#7c4312" stroke-width=".7" stroke-linejoin="round"/></g>
        <path d="M23,-1 L31,-10 M23,1 L31,10 M23,0 L31,0" stroke="#e6b06a" stroke-width=".6" opacity=".7"/>
        <g ${p.sh(1)}><g ${p.rough(2.2, .3)}><g ${p.crumb(.9)}><path d="${body}" fill="${p.g('#d8973e', .32, .32)}" stroke="#94561a" stroke-width=".8"/></g></g></g>
        ${dots}
        <path d="M-26,0 Q-6,1 18,0" stroke="#b06a22" stroke-width="1.6" fill="none" opacity=".35"/>
        ${wa2Shine('M-24,-12 Q-16,-22 -2,-20', 1.6, .55)}</g>`;
}

// ししとう
function wa2Shishito(p, x, y, s, r = 0, { c = '#4f9a2c', char = true } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-12,-3.4 C-4,-5 6,-4.6 13,-1.6 Q15,0 13,1.6 C6,4.4 -4,4.8 -12,3.4Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-12,-3.6 Q-15,-3 -15,0 Q-15,3 -12,3.6 Q-13,0 -12,-3.6Z" fill="#6f9a3a" stroke="#3f6a22" stroke-width=".5"/>
        <path d="M-15,0 Q-18,-1 -19,-3" stroke="#8aae55" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        ${char ? '<ellipse cx="-3" cy="1.5" rx="3" ry="1.4" fill="#3b2a12" opacity=".35"/><ellipse cx="6" cy="-1" rx="2.4" ry="1.2" fill="#3b2a12" opacity=".3"/>' : ''}
        ${wa2Shine('M-9,-2.2 Q0,-3.6 9,-1.8', 1, .75)}</g>`;
}

// いわし（頭を落として煮たもの）。長さ s、尾は右
function wa2Iwashi(p, x, y, s, r = 0, { c = '#74461f' } = {}){
    const k = s / 50;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}>
        <path d="M16,0 L25,-7 Q23,0 25,7Z" fill="${p.g(dk(c, .1), .3, .25)}" stroke="${dk(c, .45)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M-22,-6 C-14,-8.5 4,-8 17,-2 Q19,0 17,2 C4,8 -14,8.5 -22,6 Q-23,0 -22,-6Z" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g>
        <path d="M-21,-5 C-12,-7.5 4,-7 15,-2 C4,-3 -12,-3 -21,-1Z" fill="#3a3e48" opacity=".45"/>
        <ellipse cx="-22" cy="0" rx="2" ry="5.6" fill="#c69a64" stroke="${dk(c, .3)}" stroke-width=".5"/>
        ${[-14, -9, -4, 1, 6].map((cx, i) => `<circle cx="${cx}" cy="${f(1.2 + i * .1)}" r=".9" fill="#1e140c" opacity=".6"/>`).join('')}
        ${wa2Shine('M-17,-4.5 Q-4,-7 9,-3.8', 1.4, .8)}</g>`;
}

// かれい一尾（ひれのふち・目は上側）。w×h
function wa2Karei(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'karei' + x);
    const hw = w / 2, hh = h / 2;
    const body = smooth([[-hw, 0], [-hw * .8, -hh * .72], [-hw * .3, -hh], [hw * .25, -hh * .92], [hw * .62, -hh * .5], [hw * .72, 0], [hw * .62, hh * .5], [hw * .25, hh * .92], [-hw * .3, hh], [-hw * .8, hh * .72]], true);
    const fin = smooth([[-hw * .92, -hh * .2], [-hw * .82, -hh * .92], [-hw * .3, -hh * 1.2], [hw * .3, -hh * 1.08], [hw * .72, -hh * .58], [hw * .82, 0], [hw * .72, hh * .58], [hw * .3, hh * 1.08], [-hw * .3, hh * 1.2], [-hw * .82, hh * .92], [-hw * .92, hh * .2]], true);
    let rays = '';
    for (let i = 0; i < 64; i++){ const a = i / 64 * 6.283; if (Math.abs(Math.sin(a)) < .25) continue; const L = hw * 1.3; rays += `<path d="M0,0 L${f(Math.cos(a) * L)},${f(Math.sin(a) * L * .9)}" stroke="#5a3214" stroke-width=".7" opacity=".55"/>`; }
    const cid = p.uid();
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${fin}"/></clipPath></defs>
        <path d="M${f(hw * .7)},0 L${f(hw * 1.02)},${f(-hh * .5)} Q${f(hw * .96)},0 ${f(hw * 1.02)},${f(hh * .5)}Z" fill="${p.g('#6a3e1c', .25, .3)}" stroke="#3e2210" stroke-width=".7" stroke-linejoin="round"/>
        <path d="${fin}" fill="${p.g('#b07438', .25, .3)}" stroke="#5e3416" stroke-width=".7"/>
        <g clip-path="url(#${cid})">${rays}</g>
        <path d="${body}" fill="${p.g('#7a4a24', .3, .32)}" stroke="#3a2010" stroke-width=".8"/>
        <path d="M${f(-hw * .55)},0 Q0,${f(-hh * .06)} ${f(hw * .66)},0" stroke="#3a2010" stroke-width="1" fill="none" opacity=".5"/>
        <path d="M${f(-hw * .1)},${f(-hh * .5)} L${f(hw * .3)},${f(hh * .5)} M${f(hw * .3)},${f(-hh * .5)} L${f(-hw * .1)},${f(hh * .5)}" stroke="#f1e2c4" stroke-width="3" stroke-linecap="round"/>
        <path d="M${f(-hw * .1)},${f(-hh * .5)} L${f(hw * .3)},${f(hh * .5)} M${f(hw * .3)},${f(-hh * .5)} L${f(-hw * .1)},${f(hh * .5)}" stroke="#8a5a2a" stroke-width=".6" stroke-linecap="round" transform="translate(1 1)"/>
        <circle cx="${f(-hw * .72)}" cy="${f(-hh * .32)}" r="3" fill="#efe6d0" stroke="#2a1608" stroke-width=".6"/><circle cx="${f(-hw * .72)}" cy="${f(-hh * .32)}" r="1.5" fill="#1a1008"/>
        <circle cx="${f(-hw * .6)}" cy="${f(-hh * .48)}" r="2.6" fill="#efe6d0" stroke="#2a1608" stroke-width=".6"/><circle cx="${f(-hw * .6)}" cy="${f(-hh * .48)}" r="1.3" fill="#1a1008"/>
        ${[0, 1, 2, 3].map(i => `<circle cx="${f(-hw * .3 + i * hw * .28 + (R() - .5) * 6)}" cy="${f((R() - .5) * hh * 1.1)}" r="${f(2 + R())}" fill="#2a1608" opacity=".25"/>`).join('')}
        ${wa2Shine(`M${f(-hw * .55)},${f(-hh * .7)} Q${f(-hw * .1)},${f(-hh * .95)} ${f(hw * .35)},${f(-hh * .72)}`, 2.4, .7)}
        ${wa2Shine(`M${f(-hw * .2)},${f(hh * .55)} Q${f(hw * .1)},${f(hh * .65)} ${f(hw * .4)},${f(hh * .45)}`, 1.4, .4)}</g>`;
}

// アルミホイル（開いた包み）。R は大きさ
function wa2Foil(p, R0 = 80){
    const R = rng(p.id + 'foil');
    const outer = ring(R0, 22, .14, R, 1.08, .9, .2).map(([a, b]) => [100 + a, 100 + b]);
    const inner = outer.map(([a, b]) => [100 + (a - 100) * .8, 100 + (b - 100) * .8]);
    let creases = '';
    for (let i = 0; i < 22; i += 1){ const [ax, ay] = outer[i], [bx, by] = inner[i]; creases += `<path d="M${f(ax)},${f(ay)} L${f(bx)},${f(by)}" stroke="${i % 2 ? '#ffffff' : '#9aa1a8'}" stroke-width="${i % 2 ? 1.2 : .8}" opacity=".7"/>`; }
    return `<g ${p.sh(1.4)}><path d="${smooth(outer, true, .5)}" fill="${p.g('#d7dbe0', .5, .3)}" stroke="#9097a0" stroke-width=".8"/></g>
        ${creases}
        <path d="${smooth(inner, true, .6)}" fill="none" stroke="#f7f9fb" stroke-width="4" opacity=".9"/>
        <path d="${smooth(inner, true, .6)}" fill="${p.rg('#c9ced4', .3, .25, .6, .6)}" stroke="#8d949c" stroke-width="1"/>`;
}

// バター（溶けかけ）
function wa2Butter(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s * .75, 9, .3, rng(p.id + 'btr' + x)))}" fill="#f8e7a0" opacity=".7"/>
        <g ${p.sh(.4)}><rect x="${-s / 2}" y="${-s * .4}" width="${s}" height="${f(s * .8)}" rx="${f(s * .18)}" fill="${p.g('#fbe68c', .45, .15)}" stroke="#e1c25a" stroke-width=".5"/></g>
        ${wa2Shine(`M${f(-s * .32)},${f(-s * .22)} L${f(s * .2)},${f(-s * .22)}`, 1.2, .9)}</g>`;
}

// 手羽元（照り煮）。長さ s、骨は右
function wa2Drumstick(p, x, y, s, r = 0, { c = '#8a4a1e' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae8c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M-10,-4 L2,6 M-4,-8 L6,1" stroke="${lt(c, .3)}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .3)}" stroke-width="1.4" fill="none" opacity=".4"/>
        ${wa2Shine('M-16,-5 Q-10,-11 -2,-9.5', 2, .75)}${wa2Shine('M2,-6 Q7,-4.5 11,-3', 1.2, .5)}</g>`;
}

// 角煮（断面を上に：皮・脂身・赤身の層）。s は一辺
function wa2Kakuni(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'kaku' + seed + x);
    const h = s / 2, j = () => (R() - .5) * s * .06;
    const pts = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
    const shape = smooth(pts, true, .35);
    const id = p.uid();
    // 層（上から: 皮・脂・赤身・脂・赤身）
    const bands = [['#5a2a10', .12], ['#e9c48a', .2], ['#9a5326', .24], ['#e4bc80', .14], ['#8a4720', .3]];
    let yy = -h - 2, lay = '';
    for (const [c, t] of bands){ const bh = s * t + (R() - .5) * 2; lay += `<path d="M${-h - 3},${f(yy)} Q0,${f(yy + (R() - .5) * 5)} ${h + 3},${f(yy + (R() - .5) * 3)} L${h + 3},${f(yy + bh + 2)} L${-h - 3},${f(yy + bh + 2)}Z" fill="${p.g(c, .25, .25)}"/>`; yy += bh; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
        <g ${p.sh(1)}><path d="${shape}" fill="#7a3e1a"/></g>
        <g clip-path="url(#${id})">${lay}<path d="${shape}" fill="#8a4a18" opacity=".25"/></g>
        <path d="${shape}" fill="none" stroke="#4a2008" stroke-width=".9"/>
        ${wa2Shine(`M${f(-h * .7)},${f(-h * .25)} Q0,${f(-h * .42)} ${f(h * .6)},${f(-h * .28)}`, 2, .75)}
        ${wa2Shine(`M${f(-h * .6)},${f(h * .45)} Q${f(-h * .1)},${f(h * .35)} ${f(h * .3)},${f(h * .42)}`, 1.3, .5)}</g>`;
}

// 厚みのある大根（半月・輪切り）を煮たもの。飴色で角に面取りの線
function wa2Daikon(p, x, y, s, r = 0, { c = '#d9a45a', shape = 'half' } = {}){
    const hs = s / 2;
    let d;
    if (shape === 'half') d = `M${-hs},${f(hs * .3)} A${hs},${f(hs * .95)} 0 0 1 ${hs},${f(hs * .3)} Q0,${f(hs * .42)} ${-hs},${f(hs * .3)}Z`;
    else if (shape === 'quarter') d = `M${f(-hs * .5)},${f(hs * .5)} L${f(-hs * .5)},${f(-hs * .9)} A${f(hs * 1.4)},${f(hs * 1.4)} 0 0 1 ${f(hs * .9)},${f(hs * .5)} Z`;
    else d = `M${-hs},0 A${hs},${f(hs * .92)} 0 1 1 ${hs},0 A${hs},${f(hs * .92)} 0 1 1 ${-hs},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.rg(c, .28, .25, .4, .4)}" stroke="${dk(c, .3)}" stroke-width=".8" stroke-linejoin="round"/></g>
        <path d="${d}" fill="none" stroke="${lt(c, .3)}" stroke-width="1.6" opacity=".35" transform="scale(.84)"/>
        <path d="${d}" fill="#fff8e4" opacity=".14" transform="scale(.55)"/>
        ${shape === 'half' ? wa2Shine(`M${f(-hs * .6)},${f(-hs * .1)} Q${f(-hs * .2)},${f(-hs * .6)} ${f(hs * .3)},${f(-hs * .55)}`, 1.6, .6) : shape === 'quarter' ? wa2Shine(`M${f(-hs * .3)},${f(-hs * .4)} Q${f(0)},${f(-hs * .65)} ${f(hs * .3)},${f(-hs * .45)}`, 1.4, .6) : wa2Shine(`M${f(-hs * .55)},${f(-hs * .3)} Q${f(-hs * .2)},${f(-hs * .66)} ${f(hs * .25)},${f(-hs * .62)}`, 1.8, .6)}</g>`;
}

// ぶりのあら・切り身を煮たもの（濃い茶、皮と血合い）
function wa2BuriChunk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'buri' + seed + x);
    const k = s / 30;
    const pts = ring(14, 8, .25, R, 1.15, .85, .3);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#8a5226', .3, .32)}" stroke="#4a2a10" stroke-width=".8"/></g>
        <path d="${smooth(pts.slice(0, 5).map(([a, b]) => [a * .92, b * .92]), false)}" stroke="#3e4650" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M-6,-2 C-2,2 4,2 8,-1 C5,4 -3,5 -6,-2Z" fill="#5c1e12" opacity=".55"/>
        <path d="M-10,4 Q-2,8 9,5" stroke="#d9a873" stroke-width="1.2" fill="none" opacity=".55"/>
        ${wa2Shine('M-10,-5 Q-3,-10 6,-8', 1.8, .7)}</g>`;
}

// いか（輪切り・煮た色）
function wa2SquidRing(p, x, y, s, r = 0, { c = '#e9c9a4' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .4)}" fill="none" stroke="${dk(c, .3)}" stroke-width="${f(s * .26)}"/><ellipse rx="${s / 2}" ry="${f(s * .4)}" fill="none" stroke="${c}" stroke-width="${f(s * .2)}"/></g>
        <path d="M${f(-s * .42)},${f(-s * .2)} Q${f(-s * .2)},${f(-s * .44)} ${f(s * .15)},${f(-s * .42)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(s * .1)},${f(s * .38)} Q${f(s * .35)},${f(s * .3)} ${f(s * .48)},${f(s * .05)}" stroke="#c0704a" stroke-width="1.3" fill="none" opacity=".45"/></g>`;
}
// いかの足（くるりと丸まった吸盤つき）
function wa2Tentacles(p, x, y, s, r = 0, { c = '#d9a47c' } = {}){
    const k = s / 30;
    const legs = [[-8, -12], [-2, -14], [5, -12], [10, -6]].map(([ex, ey], i) => {
        const d = `M0,6 Q${f(ex * .4 - 3)},${f(ey * .3)} ${ex},${ey} q${f(3 + i)},-2 ${f(2 + i * .5)},2`;
        return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f6e2cc" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-dasharray=".4 2.2" opacity=".9"/>`;
    }).join('');
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${legs}<ellipse cx="0" cy="7" rx="6" ry="4.5" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g></g>`;
}

// ごぼうのささがき（薄くて細長い削り片）
function wa2Sasagaki(p, x, y, s, { n = 18, c = '#9a6a3a', seed = 1 } = {}){
    const R = rng(p.id + 'ssg' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .8, a = R() * 180, L = 8 + R() * 6;
        out += `<path ${T(cx, cy, a)} d="M${-L / 2},0 Q0,-2.2 ${L / 2},0 Q0,1.6 ${-L / 2},0Z" fill="${R() < .5 ? c : lt(c, .2)}" stroke="${dk(c, .35)}" stroke-width=".4"/>`;
    }
    return out;
}

// 白髪ねぎ（細い白い線）
function wa2Shiraga(p, x, y, s, { n = 14, seed = 1 } = {}){
    return `<g ${p.sh(.4)}>${K.shreds(p, x, y, s, { c: '#f6f7ee', n, w: 1.1, len: .9, seed, curve: .5 })}</g>`;
}

// ぶつ切りの長ねぎを焼いた/煮たもの（側面から：長さ s）
function wa2NegiLog(p, x, y, s, r = 0, { c = '#e9e2c2', tip = '#a9c46a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-s / 2}" y="${f(-s * .2)}" width="${s}" height="${f(s * .4)}" rx="${f(s * .18)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .4)},${f(-s * .06)} L${f(s * .4)},${f(-s * .06)} M${f(-s * .4)},${f(s * .08)} L${f(s * .4)},${f(s * .08)}" stroke="${dk(c, .15)}" stroke-width=".5" opacity=".6"/>
        <ellipse cx="${f(s * .42)}" cy="0" rx="${f(s * .08)}" ry="${f(s * .17)}" fill="${tip}" opacity=".6"/>
        ${wa2Shine(`M${f(-s * .35)},${f(-s * .12)} L${f(s * .3)},${f(-s * .12)}`, 1.2, .7)}</g>`;
}

// 斜め切りの長ねぎ（煮たもの・やや透明）
function wa2NegiSlant(p, x, y, s, r = 0, { c = '#e6dcb4', green = false } = {}){
    const col = green ? '#9cc25a' : c;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${-s / 2},${f(-s * .14)} L${f(s * .3)},${f(-s * .18)} Q${f(s * .55)},0 ${f(s * .3)},${f(s * .18)} L${-s / 2},${f(s * .14)} Q${f(-s * .6)},0 ${-s / 2},${f(-s * .14)}Z" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .4)},${f(-s * .04)} L${f(s * .3)},${f(-s * .05)} M${f(-s * .4)},${f(s * .06)} L${f(s * .3)},${f(s * .06)}" stroke="${dk(col, .15)}" stroke-width=".5" opacity=".7"/>
        ${wa2Shine(`M${f(-s * .38)},${f(-s * .1)} L${f(s * .25)},${f(-s * .12)}`, 1, .7)}</g>`;
}

// 薄切り生姜
function wa2GingerSlice(p, x, y, s, r = 0){
    const R = rng(p.id + 'gsl' + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 7, .3, R, 1.3, .8))}" fill="${p.g('#e9cf8a', .3, .2)}" stroke="#b99a4a" stroke-width=".5"/><path d="M${f(-s * .3)},0 Q0,${f(-s * .08)} ${f(s * .3)},0" stroke="#d4b468" stroke-width=".5" fill="none"/></g>`;
}

// ピーマンの輪切り
function wa2PepperRing(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="${smooth([[-s / 2, 0], [-s * .3, -s * .42], [0, -s * .48], [s * .32, -s * .4], [s / 2, 0], [s * .3, s * .42], [0, s * .46], [-s * .32, s * .4]], true)}" fill="none" stroke="#2f6a1e" stroke-width="${f(s * .2)}"/><path d="${smooth([[-s / 2, 0], [-s * .3, -s * .42], [0, -s * .48], [s * .32, -s * .4], [s / 2, 0], [s * .3, s * .42], [0, s * .46], [-s * .32, s * .4]], true)}" fill="none" stroke="#5aa636" stroke-width="${f(s * .12)}"/></g>`;
}

// 短冊のにんじん
function wa2Tanzaku(p, x, y, w, h, r = 0, { c = '#ec7b2d' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M${-w / 2 + 1.5},${-h / 2 + 1} L${w / 2 - 1.5},${-h / 2 + 1}" stroke="#fff" stroke-width=".7" opacity=".6"/></g>`;
}

// 焼き豆腐風（煮汁がしみた木綿豆腐）
function wa2Tofu(p, x, y, w, h, r = 0, { c = '#e8c98e' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .12)}" fill="${p.rg(c, .35, .3, .35, .35)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <rect x="${-w / 2 + 3}" y="${-h / 2 + 3}" width="${w - 6}" height="${h - 6}" rx="3" fill="#fbf2dc" opacity=".35"/>
        ${wa2Shine(`M${f(-w / 2 + 3)},${f(-h / 2 + 3)} L${f(w / 2 - 5)},${f(-h / 2 + 3)}`, 1.4, .8)}</g>`;
}

// 小さな青み（さやいんげん斜め切り・ほうれん草の束）
function wa2GreenBundle(p, x, y, w, h, r = 0, { c = '#3f8a2c' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .35)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <rect x="${f(w * .12)}" y="${f(-h / 2 + 1)}" width="${f(w * .38 - 1)}" height="${h - 2}" rx="${f(h * .3)}" fill="#a8cc6a" opacity=".85"/>
        <path d="M${f(-w / 2 + 3)},${f(-h * .15)} L${f(w * .1)},${f(-h * .15)} M${f(-w / 2 + 3)},${f(h * .18)} L${f(w * .1)},${f(h * .18)}" stroke="${dk(c, .3)}" stroke-width=".6" opacity=".6"/>
        ${wa2Shine(`M${f(-w / 2 + 3)},${f(-h * .3)} L${f(w * .05)},${f(-h * .3)}`, 1, .6)}</g>`;
}

// 薄切りの牛肉を煮たもの（ひらひら・脂の筋）。s は長さ
function wa2Beef(p, x, y, s, r = 0, { c = '#7a4426', seed = 1 } = {}){
    const R = rng(p.id + 'wbeef' + seed + x + y), k = s / 40;
    const pts = ring(11, 15, .5, R, 1.45, .95);
    const body = smooth(pts, true, .8);
    let folds = '';
    for (let i = 0; i < 4; i++){ const fx = -14 + i * 9 + (R() - .5) * 4; folds += `<path d="M${f(fx)},${f(-5 + R() * 2)} Q${f(fx + 3)},0 ${f(fx - 1)},${f(5 - R() * 2)}" stroke="${dk(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`; }
    return `<g ${T(x, y, r, k)}><path d="${body}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="M-15,2 Q-6,-1 2,2.5 T16,1 M-10,-5 Q-3,-3 6,-6" stroke="${mix(c, '#e8c89a', .5)}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>
        ${folds}
        ${wa2Shine('M-13,-4 Q-4,-7 7,-5', 1.4, .6)}</g>`;
}

// ごぼうの5cm棒切り（煮たもの）
function wa2GoboStick(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-s / 2}" y="-3.2" width="${s}" height="6.4" rx="2.6" fill="${p.g('#8a5a30', .3, .3)}" stroke="#4e3018" stroke-width=".6"/></g>
        <ellipse cx="${-s / 2 + 1.5}" cy="0" rx="1.6" ry="2.8" fill="#c9a476"/>
        <path d="M${-s / 2 + 5},-1.5 L${s / 2 - 3},-1.5" stroke="#d1aa7a" stroke-width=".8" opacity=".6"/>
        <path d="M${-s / 3},1.4 l3,0 M${s / 8},1.6 l4,0" stroke="#4e3018" stroke-width=".6" opacity=".6"/></g>`;
}

// 里芋（六方むき・煮汁がしみたもの）
function wa2Satoimo(p, x, y, s, r = 0, { c = '#dcc496' } = {}){
    const R = rng(p.id + 'sato' + x + y);
    const pts = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.28 + .3, rr = s / 2 * (.92 + R() * .1); return [Math.cos(a) * rr * 1.08, Math.sin(a) * rr * .9]; });
    const d = smooth(pts, true, .45);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${d}" fill="${p.rg(c, .3, .3, .38, .36)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - s * .04, b * .55 - s * .04]), true, .45)}" fill="#f6ecd6" opacity=".45"/>
        ${pts.slice(0, 3).map(([a, b]) => `<path d="M${f(a * .55)},${f(b * .55)} L${f(a * .92)},${f(b * .92)}" stroke="${dk(c, .15)}" stroke-width=".6" opacity=".5"/>`).join('')}
        <ellipse cx="${f(-s * .17)}" cy="${f(-s * .16)}" rx="${f(s * .15)}" ry="${f(s * .07)}" fill="#fff" opacity=".8" transform="rotate(-20 ${f(-s * .17)} ${f(-s * .16)})"/></g>`;
}

// からし
function wa2Karashi(p, x, y, s){
    return `<g ${p.sh(.4)}><path ${T(x, y)} d="${smooth(ring(s / 2, 7, .3, rng(p.id + 'kar' + x), 1.1, .9))}" fill="${p.rg('#e7b928', .3, .2)}" stroke="#b88a10" stroke-width=".5"/></g><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .15)}" rx="${f(s * .15)}" ry="${f(s * .08)}" fill="#fff" opacity=".6"/>`;
}


// 青梗菜（茎の白緑と濃い葉）
function wa2Chingensai(p, x, y, s, r = 0){
    const k = s / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>
        <path d="M2,-9 C10,-14 22,-12 22,0 C22,12 10,14 2,9 Z" fill="${p.g('#2f7a2a', .3, .3)}" stroke="#1f5a1c" stroke-width=".6"/>
        <path d="M-20,-3 C-10,-6 0,-8 6,-7 L6,7 C0,8 -10,6 -20,3 Q-21,0 -20,-3Z" fill="${p.g('#cfe3a4', .3, .2)}" stroke="#8aa85a" stroke-width=".6"/></g>
        <path d="M-18,0 L6,0 M-14,-2.4 L4,-4 M-14,2.4 L4,4" stroke="#a9c87a" stroke-width=".7" opacity=".8"/>
        <path d="M6,0 Q14,-1 20,0" stroke="#6aa84a" stroke-width=".8" fill="none"/>
        ${wa2Shine('M-16,-2.6 L2,-5', 1, .7)}</g>`;
}

const SAUCE_SOY = '#7a3f17';
const LEMON_ROUND = (p, x, y, s) => `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#efc22e"/></g><circle r="${f(s / 2 - 1.8)}" fill="#fbeb94"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 3))},${f(Math.sin(i * .785) * (s / 2 - 3))}" stroke="#fffbe0" stroke-width="1.2"/>`).join('')}<circle r="2" fill="#fffbe0"/></g>`;

export default {
    // 鮭のムニエル: 白い皿にこんがり焼いた鮭、焦がしバターソース、輪切りレモン、パセリ、粉ふきいもとブロッコリー
    meuniere: p => [
        K.plate(p),
        K.pool(p, 90, 104, 110, '#d39a3e', { op: .6, seed: 2, sy: .7 }),
        `<g ${p.sh(1.2)}>`,
        K.potato(p, 142, 130, 26, 20, { c: '#f2dca0', seed: 1 }), K.potato(p, 120, 148, 24, -30, { c: '#f2dca0', seed: 2 }),
        K.broccoli(p, 154, 104, 28, 10), K.broccoli(p, 144, 76, 24, -20),
        wa2Kirimi(p, 86, 102, 118, -8, { flesh: '#f29a62', skin: '#8a8f93', browned: .85, seed: 1, gloss: .8 }),
        `</g>`,
        LEMON_ROUND(p, 74, 92, 28),
        K.parsley(p, 92, 80, 14),
        wa2Butter(p, 100, 116, 12, 15),
    ].join(''),

    // さばの味噌煮: 茶の鉢にとろりとした味噌だれ、皮目に切り目のさば2切れ、針しょうが
    sabamiso: p => [
        K.bowl(p, { glaze: '#5b3a28', inside: '#efe3cf' }),
        K.liquid(p, { R: 70, c: '#a8702c', op: .95 }),
        `<g ${p.sh(1.1)}>`,
        wa2Saba(p, 96, 78, 108, 48, -6, { mode: 'miso', seed: 1 }),
        wa2Saba(p, 104, 124, 104, 46, 4, { mode: 'miso', seed: 2 }),
        `</g>`,
        K.glaze(p, 100, 104, 126, '#a8692a', { seed: 3, op: .22 }),
        `<g ${p.sh(.4)}>`, K.shreds(p, 104, 100, 32, { c: '#f4e09e', n: 14, w: 1.3, len: .8, seed: 4 }), `</g>`,
    ].join(''),

    // ぶりの照り焼き: 白い皿に照りの濃い切り身2切れ、たれ、焼いたししとう
    buriteri: p => [
        K.plate(p),
        K.pool(p, 92, 106, 112, '#7a3a14', { op: .85, seed: 3, sy: .75 }),
        `<g ${p.sh(1.2)}>`,
        wa2Kirimi(p, 84, 80, 96, -10, { flesh: '#b0622a', skin: '#3e3a3a', fat: '#c88040', chiai: '#5a1a10', glazeC: '#8a3e10', seed: 1, gloss: .9 }),
        wa2Kirimi(p, 92, 124, 96, 6, { flesh: '#b0622a', skin: '#3e3a3a', fat: '#c88040', chiai: '#5a1a10', glazeC: '#8a3e10', seed: 2, gloss: .9 }),
        `</g>`,
        wa2Shishito(p, 148, 92, 42, 75), wa2Shishito(p, 160, 112, 40, 100, { c: '#58a032' }), wa2Shishito(p, 142, 128, 38, 60),
    ].join(''),

    // 鮭のちゃんちゃん焼き: 鉄板にキャベツ・玉ねぎ・にんじん・しめじと鮭、味噌だれ、バター
    chanchan: p => [
        K.stonePot(p),
        K.liquid(p, { R: 76, c: '#7a4a24', op: .5, shine: false }),
        `<g ${p.sh(1)}>`,
        ...[[50, 92, 34, 20], [58, 128, 32, -30], [92, 152, 34, 10], [136, 146, 32, 60], [154, 104, 32, -50], [132, 56, 32, 30], [80, 54, 30, -20], [150, 70, 28, 80], [52, 64, 26, 50]].map(([x, y, s, r], i) => K.leafPiece(p, x, y, s, r, { c: '#d3e49a', vein: '#e9f0c4', seed: i + 1, cooked: true })),
        K.onion(p, 66, 112, 24, 30, { c: '#ead39c' }), K.onion(p, 138, 124, 22, -150, { c: '#ead39c' }), K.onion(p, 110, 58, 22, 160, { c: '#ead39c' }), K.onion(p, 74, 74, 20, -60, { c: '#ead39c' }),
        wa2Tanzaku(p, 62, 76, 20, 6, 30), wa2Tanzaku(p, 148, 82, 20, 6, -40), wa2Tanzaku(p, 78, 140, 20, 6, 70), wa2Tanzaku(p, 152, 128, 18, 6, 10), wa2Tanzaku(p, 44, 112, 18, 6, -70), wa2Tanzaku(p, 112, 152, 18, 6, -20),
        K.shimeji(p, 124, 146, 28, -70), K.shimeji(p, 62, 142, 26, -130), K.shimeji(p, 142, 58, 24, -40), K.shimeji(p, 56, 66, 22, -120),
        wa2Kirimi(p, 100, 102, 104, -10, { flesh: '#f29a62', skin: '#8a8f93', browned: .3, seed: 1 }),
        `</g>`,
        K.pool(p, 104, 100, 56, '#b4772e', { op: .82, seed: 5, sy: .6 }),
        wa2Butter(p, 104, 98, 16, 12),
        K.scallions(p, 100, 104, 50, { n: 8 }),
    ].join(''),

    // 筑前煮: 藍の鉢に、鶏肉・れんこん・ごぼう・にんじん・こんにゃく・しいたけ、絹さや
    chikuzen: p => [
        K.bowl(p, { glaze: '#2f4a6e', inside: '#efe8da' }),
        K.liquid(p, { R: 66, c: '#9a5f28', op: .9 }),
        `<g ${p.sh()}>`,
        K.konnyaku(p, 70, 124, 22, 20), K.konnyaku(p, 130, 76, 22, -30), K.konnyaku(p, 112, 140, 20, 60),
        K.gobo(p, 62, 94, 26, 40), K.gobo(p, 138, 120, 26, -30), K.gobo(p, 96, 64, 24, 10),
        K.chickenPiece(p, 84, 84, 30, 10, { c: '#b9773a', skin: '#8a4a1a', seed: 1, glazeIt: true }),
        K.chickenPiece(p, 122, 102, 30, -30, { c: '#b9773a', skin: '#8a4a1a', seed: 2, glazeIt: true }),
        K.chickenPiece(p, 92, 124, 28, 60, { c: '#b9773a', skin: '#8a4a1a', seed: 3, glazeIt: true }),
        K.lotus(p, 112, 72, 30, 10, { c: '#d9b07a' }), K.lotus(p, 64, 112, 26, -20, { c: '#d9b07a' }), K.lotus(p, 136, 136, 24, 30, { c: '#d9b07a' }),
        K.carrotChunk(p, 104, 98, 22, 20, { c: '#e2702a' }), K.carrotChunk(p, 72, 70, 20, -40, { c: '#e2702a' }), K.carrotChunk(p, 146, 96, 20, 80, { c: '#e2702a' }), K.carrotChunk(p, 118, 128, 18, 140, { c: '#e2702a' }),
        K.shiitake(p, 140, 68, 22, 20), K.shiitake(p, 74, 142, 20, -10),
        `</g>`,
        K.snowPea(p, 96, 108, 22, -30), K.snowPea(p, 118, 86, 20, 40), K.snowPea(p, 82, 104, 18, 100),
    ].join(''),

    // ぶり大根: 黒の鉢に、飴色の厚い輪切り大根と照りのぶり、針しょうが、青み
    buridaikon: p => [
        K.bowl(p, { glaze: '#2a2522', inside: '#ece4d4' }),
        K.liquid(p, { R: 68, c: '#8a5424', op: .92 }),
        `<g ${p.sh()}>`,
        wa2Daikon(p, 70, 76, 52, 0, { c: '#c98a44', shape: 'round' }), wa2Daikon(p, 136, 126, 50, 0, { c: '#c98a44', shape: 'round' }), wa2Daikon(p, 74, 132, 48, 0, { c: '#cf9248', shape: 'round' }),
        wa2Kirimi(p, 124, 80, 62, 30, { flesh: '#9a5a28', skin: '#3e3a3a', fat: '#b87a42', chiai: '#4a160c', glazeC: '#7a3a12', seed: 1, gloss: .85 }),
        wa2Kirimi(p, 100, 110, 64, -35, { flesh: '#9a5a28', skin: '#3e3a3a', fat: '#b87a42', chiai: '#4a160c', glazeC: '#7a3a12', seed: 2, gloss: .85 }),
        `</g>`,
        `<g ${p.sh(.4)}>`, K.shreds(p, 104, 100, 26, { c: '#f4e09e', n: 14, w: 1.2, len: .85, seed: 6 }), `</g>`,
        wa2Chingensai(p, 120, 150, 30, -10),
    ].join(''),

    // さばの塩焼き: 長皿に皮目をこんがり焼いたさば、大葉に大根おろしと醤油、すだち
    sabashio: p => [
        K.longPlate(p),
        `<g ${p.sh(1.2)}>`, wa2Saba(p, 78, 98, 118, 58, -4, { mode: 'grill', seed: 1 }), `</g>`,
        K.shiso(p, 154, 118, 40, -20),
        K.grated(p, 154, 118, 34),
        `<ellipse cx="156" cy="113" rx="5" ry="3.2" fill="${SAUCE_SOY}" opacity=".8"/>`,
        `<g ${T(156, 76)}>${K.sudachi(p, 0, 0, 20)}</g>`,
    ].join(''),

    // さんまの塩焼き: 長皿に一尾、大根おろしとすだち
    sanma: p => [
        K.longPlate(p),
        `<g ${p.sh(1.2)}>`, wa2Sanma(p, 98, 84, 166, -3), `</g>`,
        K.grated(p, 132, 128, 36),
        `<ellipse cx="134" cy="124" rx="5" ry="3.2" fill="${SAUCE_SOY}" opacity=".8"/>`,
        `<g ${T(162, 128)}>${K.sudachi(p, 0, 0, 22)}</g>`,
    ].join(''),

    // あじフライ: 白い皿に開いたあじのフライ2枚、千切りキャベツ、レモン、ミニトマト
    ajifry: p => [
        K.plate(p),
        K.cabbageShreds(p, 130, 72, 52, { seed: 4 }),
        `<g ${p.sh(1.1)}>`,
        wa2AjiFry(p, 82, 84, 94, 200, { seed: 1 }),
        wa2AjiFry(p, 98, 128, 94, 168, { seed: 2 }),
        `</g>`,
        K.lemon(p, 150, 118, 30, -50),
        K.cherryTomato(p, 152, 80, 18),
        K.parsley(p, 140, 136, 12),
    ].join(''),

    // いわしの梅煮: クリーム色の鉢にいわし4尾、梅干し、薄切り生姜、煮汁
    iwashiume: p => [
        K.bowl(p, { glaze: '#d8cbb0', inside: '#f3ede0' }),
        K.liquid(p, { R: 66, c: '#7a4620', op: .9 }),
        `<g ${p.sh()}>`,
        wa2Iwashi(p, 96, 66, 88, 4), wa2Iwashi(p, 104, 90, 90, -4), wa2Iwashi(p, 96, 114, 90, 4), wa2Iwashi(p, 104, 138, 82, -6),
        `</g>`,
        K.umeboshi(p, 148, 104, 20), K.umeboshi(p, 52, 100, 18),
        wa2GingerSlice(p, 62, 76, 14, 20), wa2GingerSlice(p, 140, 132, 13, -30), wa2GingerSlice(p, 64, 128, 12, 60),
    ].join(''),

    // かれいの煮付け: 楕円の深皿に一尾（ひれのふち・尾）、つやのある煮汁、棒切りごぼう、針しょうが
    kareini: p => [
        K.ovalDish(p, { base: '#f2ede2', rim: '#6e4b33', deep: true }),
        `<ellipse cx="100" cy="100" rx="78" ry="60" fill="${p.rg('#8a4a1c', .2, .25)}" opacity=".8"/>`,
        `<g ${p.sh(1.2)}>`, wa2Karei(p, 90, 96, 126, 80, -4), `</g>`,
        wa2GoboStick(p, 120, 146, 40, -8), wa2GoboStick(p, 84, 150, 38, 4),
        `<g ${p.sh(.4)}>`, K.gingerShreds(p, 92, 92, 22), `</g>`,
    ].join(''),

    // 鮭のホイル焼き: 開いたアルミホイルの中に玉ねぎ・鮭・しめじ・ピーマン、バターとレモン
    hoilyaki: p => [
        K.plate(p),
        wa2Foil(p, 82),
        K.liquid(p, { R: 58, c: '#e3b768', op: .55, shine: false }),
        `<g ${p.sh(1)}>`,
        K.onion(p, 62, 94, 28, 30, { c: '#f0dfb0' }), K.onion(p, 136, 124, 28, -150, { c: '#f0dfb0' }), K.onion(p, 78, 132, 26, 70, { c: '#f0dfb0' }), K.onion(p, 128, 70, 24, -100, { c: '#f0dfb0' }),
        wa2Kirimi(p, 100, 100, 112, -8, { flesh: '#f4a06c', skin: '#8a8f93', seed: 1 }),
        K.shimeji(p, 62, 128, 34, -110), K.shimeji(p, 142, 80, 32, -40), K.shimeji(p, 124, 140, 30, -70), K.shimeji(p, 78, 66, 28, -150),
        `</g>`,
        wa2PepperRing(p, 86, 72, 15, 10), wa2PepperRing(p, 110, 132, 15, -20), wa2PepperRing(p, 148, 106, 13, 30), wa2PepperRing(p, 56, 110, 13, 30),
        wa2Butter(p, 102, 98, 18, -10),
        K.lemon(p, 120, 116, 22, -20),
    ].join(''),

    // いかと里芋の煮物: クリームの鉢に、六方むきの里芋といかの輪切り・足、ゆずの皮
    ikasatoimo: p => [
        K.bowl(p, { glaze: '#e4d6b8', inside: '#f4eee2' }),
        K.liquid(p, { R: 66, c: '#b07c40', op: .9 }),
        `<g ${p.sh()}>`,
        wa2Satoimo(p, 78, 80, 36, 20), wa2Satoimo(p, 126, 76, 34, -30), wa2Satoimo(p, 90, 128, 36, 10),
        wa2Satoimo(p, 138, 120, 32, 50), wa2Satoimo(p, 62, 116, 28, -10),
        wa2SquidRing(p, 106, 100, 28, 10, { c: '#ecd2b2' }), wa2SquidRing(p, 100, 62, 22, -20, { c: '#ecd2b2' }), wa2SquidRing(p, 118, 144, 22, 30, { c: '#ecd2b2' }), wa2SquidRing(p, 150, 94, 20, 60, { c: '#ecd2b2' }),
        wa2Tentacles(p, 72, 100, 40, -60), wa2Tentacles(p, 124, 108, 36, 120),
        `</g>`,
        K.shreds(p, 104, 96, 16, { c: '#e8c33a', n: 5, w: 1.6, len: .8, seed: 3 }),
        K.mitsuba(p, 116, 88, 18, 20),
    ].join(''),

    // 手羽元のさっぱり煮: 茶の鉢に照りの手羽元、煮汁の色のゆで卵、煮汁、ねぎ
    tebasappari: p => [
        K.bowl(p, { glaze: '#7a5236', inside: '#efe5d3' }),
        K.liquid(p, { R: 70, c: '#8e5424', op: .92 }),
        `<g ${p.sh()}>`,
        wa2Drumstick(p, 82, 72, 56, 20), wa2Drumstick(p, 126, 76, 54, 160),
        wa2Drumstick(p, 70, 112, 54, -10), wa2Drumstick(p, 130, 118, 56, 200),
        wa2Drumstick(p, 98, 140, 52, -20), wa2Drumstick(p, 104, 98, 52, 70),
        `</g>`,
        K.eggHalf(p, 142, 96, 30, 20, { stain: '#c88a3c', yolk: '#f0a92a' }),
        K.eggHalf(p, 60, 92, 28, -30, { stain: '#c88a3c', yolk: '#f0a92a' }),
        K.scallions(p, 104, 100, 50, { n: 10 }),
    ].join(''),

    // 豚バラ大根: 茶の鉢に、飴色のいちょう切り大根と豚バラ、小口ねぎ
    butadaikon: p => [
        K.bowl(p, { glaze: '#8a6a4c', inside: '#efe5d3' }),
        K.liquid(p, { R: 68, c: '#9a6230', op: .9 }),
        `<g ${p.sh()}>`,
        ...[[70, 78, 40, 0], [126, 70, 38, 80], [142, 116, 40, 170], [100, 138, 40, 230], [60, 120, 36, 290], [96, 92, 38, 40], [136, 148, 28, 200]].map(([x, y, s, r], i) => wa2Daikon(p, x, y, s, r, { c: i % 2 ? '#d29a52' : '#c98d48', shape: 'quarter' })),
        K.porkSlice(p, 100, 70, 52, 15, { c: '#bf8a5a', fat: '#f0dfc0', char: false, seed: 1, gloss: .5 }),
        K.porkSlice(p, 122, 104, 50, -60, { c: '#bf8a5a', fat: '#f0dfc0', char: false, seed: 2, gloss: .5 }),
        K.porkSlice(p, 76, 108, 50, 110, { c: '#bf8a5a', fat: '#f0dfc0', char: false, seed: 3, gloss: .5 }),
        K.porkSlice(p, 112, 140, 46, 170, { c: '#bf8a5a', fat: '#f0dfc0', char: false, seed: 4, gloss: .5 }),
        `</g>`,
        K.scallions(p, 100, 100, 70, { n: 16 }),
    ].join(''),

    // 豚の角煮: 黒の鉢に層の見える角煮、煮卵の半分、青梗菜、白髪ねぎ、からし
    kakuni: p => [
        K.bowl(p, { glaze: '#2a2522', inside: '#ece4d4' }),
        K.liquid(p, { R: 66, c: '#6e3a16', op: .92 }),
        wa2Chingensai(p, 70, 134, 48, -40), wa2Chingensai(p, 56, 120, 44, -60),
        `<g ${p.sh(1.2)}>`,
        wa2Kakuni(p, 80, 80, 40, -8, { seed: 1 }), wa2Kakuni(p, 124, 76, 40, 6, { seed: 2 }),
        wa2Kakuni(p, 120, 120, 40, -4, { seed: 3 }),
        `</g>`,
        K.eggHalf(p, 92, 122, 34, 30, { stain: '#b06a28', yolk: '#f2a320' }),
        wa2Shiraga(p, 104, 98, 26, { n: 14, seed: 2 }),
        wa2Karashi(p, 148, 104, 12),
    ].join(''),

    // 牛肉とごぼうのしぐれ煮: 小鉢にこっくり煮た牛肉とささがきごぼう、針しょうが
    shigureni: p => [
        K.kobachi(p, { glaze: '#4a5a6a', inside: '#efe8da' }),
        `<circle cx="100" cy="100" r="62" fill="${p.rg('#5a3016', .2, .2)}" opacity=".85"/>`,
        `<g ${p.sh(1)}>`,
        wa2Sasagaki(p, 100, 104, 100, { n: 26, c: '#8a5a2e', seed: 1 }),
        ...[[80, 76, 48, 10], [124, 76, 46, -30], [138, 110, 44, 70], [116, 136, 48, 20], [74, 124, 48, -20], [100, 102, 50, 40], [62, 98, 40, 90], [100, 64, 40, 0]].map(([x, y, s, r], i) => wa2Beef(p, x, y, s, r, { c: '#7a4222', seed: i + 1 })),
        wa2Sasagaki(p, 100, 100, 90, { n: 22, c: '#a8784a', seed: 2 }),
        `</g>`,
        `<g ${p.sh(.4)}>`, K.shreds(p, 102, 96, 26, { c: '#f4e09e', n: 12, w: 1.2, len: .85, seed: 6 }), `</g>`,
    ].join(''),

    // 肉豆腐: 茶の鉢に煮汁、味のしみた木綿豆腐、牛肉、斜め切りのねぎ、しらたき
    nikudofu: p => [
        K.bowl(p, { glaze: '#6e4b33', inside: '#efe5d3' }),
        K.liquid(p, { R: 70, c: '#9a6028', op: .92 }),
        K.threads(p, 112, 120, 80, { c: '#efeadb', n: 16, w: 1.6 }),
        `<g ${p.sh()}>`,
        wa2Tofu(p, 76, 80, 36, 30, 6, { c: '#d9ad6c' }), wa2Tofu(p, 124, 76, 36, 30, -6, { c: '#d9ad6c' }), wa2Tofu(p, 132, 122, 34, 30, 8, { c: '#d9ad6c' }), wa2Tofu(p, 80, 126, 36, 30, -4, { c: '#d9ad6c' }),
        wa2Beef(p, 102, 102, 58, 10, { c: '#8a4a2a', seed: 1 }), wa2Beef(p, 106, 144, 50, -20, { c: '#8a4a2a', seed: 2 }),
        wa2Beef(p, 54, 104, 44, 80, { c: '#8a4a2a', seed: 3 }), wa2Beef(p, 100, 60, 50, 0, { c: '#8a4a2a', seed: 4 }), wa2Beef(p, 146, 100, 40, 90, { c: '#8a4a2a', seed: 5 }),
        wa2NegiSlant(p, 148, 96, 28, 70), wa2NegiSlant(p, 106, 120, 26, -30), wa2NegiSlant(p, 64, 146, 24, 20, { green: true }), wa2NegiSlant(p, 120, 98, 24, 50, { green: true }),
        `</g>`,
    ].join(''),

    // 厚揚げのそぼろあんかけ: 青磁の鉢に厚揚げ、とろりとしたあんと鶏そぼろ、ねぎ
    atsuagesoboro: p => [
        K.bowl(p, { glaze: '#8fae9c', inside: '#f1efe6' }),
        K.liquid(p, { R: 68, c: '#c08a4a', op: .85 }),
        `<g ${p.sh()}>`,
        K.atsuage(p, 78, 80, 36, 8), K.atsuage(p, 124, 78, 36, -6), K.atsuage(p, 130, 124, 36, 12), K.atsuage(p, 78, 126, 36, -10), K.atsuage(p, 104, 102, 34, 40),
        `</g>`,
        `<g opacity=".9">${K.mince(p, 100, 100, 96, { c: '#a06c3c', n: 85, seed: 1 })}</g>`,
        K.glaze(p, 100, 102, 128, '#c8904c', { seed: 2, op: .38 }),
        K.scallions(p, 104, 98, 46, { n: 14 }),
    ].join(''),
};
