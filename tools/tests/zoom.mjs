#!/usr/bin/env node
// 料理の絵を大きく見る（オーナーの依頼 11/23）の確かめ
//  使い方: node tools/tests/zoom.mjs [http://localhost:9331/]
//  Z1 お膳の絵のある料理の器を押すと、絵が前面に大きく出る（role=dialog・名前・閉じる・作り方を見る）。献立は変わらない（押していない料理を入れ替えない）。読み上げの名前は「…の写真を大きく見る」
//  Z2 ぼけない大きさ: 枠は画面の幅（16px のすき間）まで・写真風の絵（512px）は 512px まで。2本の指・2回たたくの拡大は、絵の1画素が画面の1点を超えない所で止まる。手描きの SVG は 4倍まで
//  Z3 2回たたくと大きく、もう2回でもとの大きさ。2本の指で広げると大きく（上限で止まる）
//  Z4 閉じる: 「閉じる」・まわりの暗い所を押す・Esc・戻る（history.back）。絵や「作り方を見る」の上を押しても閉じない。キーボードで開いたら、閉じると焦点は器に戻る
//  Z5 開いているあいだは後ろ（今日の画面・下のタブ・詳しい画面）に inert。閉じたら外れる
//  Z6 「作り方を見る」で、同じ料理の詳しい画面が開く。詳しい画面の絵を押しても、大きく見られる
//  Z7 絵のない料理（絵が読めない料理）は、今までどおり器を押すと作り方（大きく見るは出さない）
//  Z8 大きい絵（manifest の zoom）があれば大きく見るときだけ使い、読めなければふだんの絵に戻る
//  Z10 tools/illustrations/import-photos.mjs --zoom 1024: 元が大きい画像（1200px）からは z/<ID>.webp（1024px）を作り manifest の zoom に登録、元が 512px なら作らない（一時フォルダで動かす）
//  Z9 青を使わない（大きく見る画面の地・字・ボタン）。幅 390・320・アラビア語（右から左）で、名前・閉じる・枠・作り方を見るが画面の中で重ならない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const b = await chromium.launch(LAUNCH);
const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, serviceWorkers: 'block', hasTouch: true, isMobile: !!o.mobile, deviceScaleFactor: o.dpr || 1});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2026-11-01', settings: {country: o.cc || 'JP', uiLang: o.lang || 'ja', dishCount: 3, servings: 2}});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray .vessel[data-act=zoom]'), null, {timeout: 30000});
    await p.waitForTimeout(300);
    return {p, ctx};
};
const zst = p => p.evaluate(() => { const d = document.querySelector('#zoom-root [role=dialog]'); return {open: !!d, id: typeof zoomId !== 'undefined' ? zoomId : null, modal: !!document.querySelector('#modal-root [role=dialog]'), s: ZOOM.s, max: ZOOM.max,
    wrap: document.querySelector('body > .wrap').hasAttribute('inert'), nav: document.querySelector('body > nav.tabs').hasAttribute('inert'), mroot: document.getElementById('modal-root').hasAttribute('inert')}; });

{   // Z1・Z2・Z3・Z4・Z5・Z6
    const {p, ctx} = await open({mobile: true, dpr: 3});
    const v0 = await p.evaluate(() => { const v = document.querySelector('#view .tray .vessel[data-act=zoom]'); return {id: v.dataset.id, aria: v.getAttribute('aria-label'), menu: JSON.stringify(menuIds()), ph: photoOf(byId(v.dataset.id)).src}; });
    await p.tap(`#view .tray .vessel[data-act=zoom][data-id="${v0.id}"]`); await p.waitForTimeout(500);
    const z1 = await p.evaluate(() => { const d = document.querySelector('#zoom-root [role=dialog]'), im = d && d.querySelector('.zoom-img'), st = d && d.querySelector('.zoom-stage').getBoundingClientRect();
        return {nm: d && d.querySelector('.zoom-nm').textContent, close: !!(d && d.querySelector('[data-act=zoom-close]')), recipe: !!(d && d.querySelector('[data-act=zoom-recipe]')), src: im && im.getAttribute('src'), nat: im && im.naturalWidth, sw: st && Math.round(st.width), sh: st && Math.round(st.height), vw: innerWidth, menu: JSON.stringify(menuIds())}; });
    const s1 = await zst(p);
    ok(s1.open && !s1.modal && z1.nm && z1.close && z1.recipe && z1.src === v0.ph && z1.menu === v0.menu && /写真を大きく見る/.test(v0.aria), 'Z1 器を押すと絵が前面に大きく出る（詳しい画面は開かない・献立は変わらない）: ' + JSON.stringify({v0, z1, s1}));
    ok(z1.sw === z1.vw - 32 && z1.sw === z1.sh && z1.nat === 512 && Math.abs(s1.max - 512 / z1.sw) < .01 && z1.sw * s1.max <= z1.nat + .5, 'Z2 枠は画面の幅（16px のすき間）・拡大は絵の1画素 = 画面の1点まで（512px の絵）: ' + JSON.stringify({z1, max: s1.max}));
    ok(s1.wrap && s1.nav, 'Z5 開いているあいだは今日の画面・下のタブに inert: ' + JSON.stringify(s1));
    // 2回たたく
    const bx = await p.locator('#zoom-root .zoom-stage').boundingBox();
    const dbl = async () => { await p.tap('#zoom-root .zoom-stage', {position: {x: bx.width * .3, y: bx.height * .4}}); await p.waitForTimeout(60); await p.tap('#zoom-root .zoom-stage', {position: {x: bx.width * .3, y: bx.height * .4}}); await p.waitForTimeout(250); return (await zst(p)).s; };
    const d1 = await dbl(), d2 = await dbl();
    // 2本の指で広げる（PointerEvent を2本分）
    const pin = await p.evaluate(async () => { const st = document.querySelector('#zoom-root .zoom-stage'), r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const ev = (type, id, x, y) => st.dispatchEvent(new PointerEvent(type, {pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch', isPrimary: id === 1}));
        ev('pointerdown', 1, cx - 20, cy); ev('pointerdown', 2, cx + 20, cy);
        for (let k = 1; k <= 10; k++){ ev('pointermove', 1, cx - 20 - k * 6, cy); ev('pointermove', 2, cx + 20 + k * 6, cy); }
        const mid = ZOOM.s; for (let k = 11; k <= 40; k++){ ev('pointermove', 1, cx - 20 - k * 6, cy); ev('pointermove', 2, cx + 20 + k * 6, cy); }
        const top = ZOOM.s; ev('pointerup', 1, cx - 260, cy); ev('pointerup', 2, cx + 260, cy); return {mid, top, max: ZOOM.max, tf: document.querySelector('#zoom-root .zoom-img').style.transform}; });
    ok(Math.abs(d1 - s1.max) < .01 && d2 === 1 && pin.mid > 1.2 && Math.abs(pin.top - pin.max) < .001 && /scale/.test(pin.tf), 'Z3 2回たたくと大きく・もう2回でもとに。2本の指で広げると大きく、上限で止まる: ' + JSON.stringify({d1, d2, pin}));
    // 絵の上・ボタンの上を押しても閉じない
    await p.evaluate(() => { ZOOM.s = 1; zoomApply(); });
    await p.locator('#zoom-root .zoom-nm').click(); await p.waitForTimeout(150);
    const stay = (await zst(p)).open;
    // 作り方を見る
    await p.click('#zoom-root [data-act=zoom-recipe]'); await p.waitForTimeout(500);
    const s6 = await zst(p), mid = await p.evaluate(() => modalId);
    // 詳しい画面の絵を押す → 大きく。開いているあいだは詳しい画面も inert
    await p.click('#modal-root .hero[data-act=zoom]'); await p.waitForTimeout(400);
    const s6b = await zst(p);
    ok(stay && !s6.open && s6.modal && mid === v0.id && s6b.open && s6b.id === v0.id && s6b.mroot, 'Z6 「作り方を見る」で同じ料理の詳しい画面。詳しい画面の絵を押しても大きく見られる（そのあいだ詳しい画面は inert）: ' + JSON.stringify({stay, s6, mid, s6b}));
    // 閉じ方: まわりの暗い所
    await p.mouse.click(5, 5); await p.waitForTimeout(300);
    const c1 = await zst(p);
    await p.click('#modal-root .hero[data-act=zoom]'); await p.waitForTimeout(300);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const c2 = await zst(p);
    await p.click('#modal-root .hero[data-act=zoom]'); await p.waitForTimeout(300);
    await p.evaluate(() => history.back()); await p.waitForTimeout(500);
    const c3 = await zst(p);
    await p.click('#modal-root .hero[data-act=zoom]'); await p.waitForTimeout(300);
    await p.click('#zoom-root [data-act=zoom-close]'); await p.waitForTimeout(300);
    const c4 = await zst(p);
    ok(!c1.open && c1.modal && !c2.open && c2.modal && !c3.open && c3.modal && !c4.open && c4.modal && !c4.mroot, 'Z4 閉じる: まわり・Esc・戻る・「閉じる」（下の詳しい画面は残り、inert が外れる）: ' + JSON.stringify({c1, c2, c3, c4}));
    await p.evaluate(() => closeModal()); await p.waitForTimeout(300);
    const s5 = await zst(p);
    // キーボードで開いて閉じると、焦点は器に戻る
    await p.focus(`#view .tray .vessel[data-act=zoom][data-id="${v0.id}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const kb = await p.evaluate(() => ({open: !!document.querySelector('#zoom-root [role=dialog]'), inside: !!document.activeElement.closest('#zoom-root')}));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const back = await p.evaluate(() => ({act: document.activeElement.dataset.act, id: document.activeElement.dataset.id}));
    ok(!s5.wrap && !s5.nav && kb.open && kb.inside && back.act === 'zoom' && back.id === v0.id && await p.evaluate(m => JSON.stringify(menuIds()) === m, v0.menu), 'Z4b キーボードで開くと焦点は大きく見る画面の中、閉じると器に戻る。閉じたあと inert は外れ、献立は変わらない: ' + JSON.stringify({s5, kb, back}));
    // Z8 大きい絵（zoom）: 読めればそれ、読めなければふだんの絵
    const z8 = await p.evaluate(async id => { const g = GEN[id]; const tick = n => new Promise(r => setTimeout(r, n));
        g.zoom = 'img/dish/z/__none__.webp'; openZoom(id); await tick(600); const a = document.querySelector('#zoom-root .zoom-img').getAttribute('src'); closeZoom();
        g.zoom = 'icon-512.png'; openZoom(id); await tick(600); const im = document.querySelector('#zoom-root .zoom-img'), b2 = {src: im.getAttribute('src'), max: ZOOM.max}; closeZoom(); delete g.zoom; return {a, b: b2, src: g.src}; }, v0.id);
    ok(z8.a === z8.src && z8.b.src === 'icon-512.png', 'Z8 大きい絵（manifest の zoom）があれば使い、読めなければふだんの絵に戻る: ' + JSON.stringify(z8));
    // Z7 絵のない料理
    const z7 = await p.evaluate(async id => { const tick = n => new Promise(r => setTimeout(r, n)); const ph = photoOf(byId(id)); IMG_FAIL.add(ph.src); render(); await tick(200);
        const v = document.querySelector(`#view .tray .vessel[data-id="${id}"]`); const a = v && v.dataset.act; if (v) v.click(); await tick(300);
        const r = {act: a, modal: modalId, zoom: !!document.querySelector('#zoom-root [role=dialog]')}; closeModal(); IMG_FAIL.delete(ph.src); render(); return r; }, v0.id);
    ok(z7.act === 'open' && z7.modal === v0.id && !z7.zoom, 'Z7 絵のない料理は、器を押すと今までどおり作り方（大きく見るは出さない）: ' + JSON.stringify(z7));
    await ctx.close();
}
{   // Z2b 手描きの SVG は 4倍まで
    const {p, ctx} = await open({});
    // いまの同梱の絵は写真風（WebP）がほとんど。手描きの SVG（img/dish/<ID>.svg。manifest を戻すと使う）に一時的に替えて確かめる
    const r = await p.evaluate(async () => { const id = 'nikujaga', g0 = GEN[id]; GEN[id] = Object.assign({}, g0, {src: 'img/dish/nikujaga.svg', photo: false, zoom: null});
        openZoom(id); await new Promise(r => setTimeout(r, 800)); const im = document.querySelector('#zoom-root .zoom-img'); const o = {id, max: ZOOM.max, svg: document.querySelector('#zoom-root .zoom-stage').dataset.svg, nat: im.naturalWidth}; closeZoom(); GEN[id] = g0; return o; });
    ok(r && r.max === 4 && r.svg === '1' && r.nat > 0, 'Z2b 手描きの SVG（線の絵）は 4倍まで: ' + JSON.stringify(r));
    await ctx.close();
}
{   // Z9 青を使わない・幅 390・320・アラビア語で重ならない
    const bad = [];
    for (const [w, h, lang] of [[390, 844, 'ja'], [320, 568, 'ja'], [360, 740, 'ar'], [390, 844, 'en']]){
        const {p, ctx} = await open({w, h, lang});
        await p.click('#view .tray .vessel[data-act=zoom]'); await p.waitForTimeout(500);
        const r = await p.evaluate(() => {
            const els = [...document.querySelectorAll('#zoom-root *')].concat([document.querySelector('#zoom-root .zoom')]);
            const blue = []; const hue = c => { const m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/.exec(c); if (!m || m[4] === '0') return null; const [r, g, b] = [m[1], m[2], m[3]].map(Number), mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 40) return null; let hh = mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn); hh = (hh * 60 + 360) % 360; return hh; };
            els.forEach(e => { const cs = getComputedStyle(e); for (const k of ['color', 'backgroundColor', 'borderTopColor']){ const hh = hue(cs[k]); if (hh != null && hh > 180 && hh < 260) blue.push(e.className + ' ' + k + ' ' + cs[k]); } });
            const q = s => { const e = document.querySelector('#zoom-root ' + s); const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom}; };
            const parts = {nm: q('.zoom-nm'), x: q('.zoom-x'), st: q('.zoom-stage'), btn: q('[data-act=zoom-recipe]')};
            const ov = (a, b2) => Math.min(a.r, b2.r) - Math.max(a.l, b2.l) > 1 && Math.min(a.b, b2.b) - Math.max(a.t, b2.t) > 1;
            const keys = Object.keys(parts), over = []; keys.forEach((a, i) => keys.slice(i + 1).forEach(c => { if (ov(parts[a], parts[c])) over.push(a + '×' + c); }));
            const out = keys.filter(k => parts[k].l < -.5 || parts[k].r > innerWidth + .5 || parts[k].t < -.5 || parts[k].b > innerHeight + .5);
            const xr = parts.x, rtl = getComputedStyle(document.querySelector('#zoom-root .zoom-top')).direction === 'rtl';
            return {blue, over, out, rtl, xLeft: xr.l < innerWidth / 2};
        });
        if (r.blue.length || r.over.length || r.out.length || (lang === 'ar' && !(r.rtl && r.xLeft))) bad.push(`${lang} ${w} ${JSON.stringify(r)}`);
        await ctx.close();
    }
    ok(!bad.length, 'Z9 青を使わない。幅 390・320・アラビア語（右から左。閉じるは左）・英語で、名前・閉じる・枠・作り方を見るが画面の中で重ならない: ' + bad.join(' || '));
}
{   // Z10 取りこみの道具の --zoom（リポジトリの manifest・絵は変えない）
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gohancho-zoom-'));
    try{
        for (const d of ['tools/illustrations', 'tools/lib', 'gohancho/img/dish/t', 'in']) fs.mkdirSync(path.join(TMP, d), {recursive: true});
        fs.copyFileSync(path.join(REPO, 'tools/illustrations/import-photos.mjs'), path.join(TMP, 'tools/illustrations/import-photos.mjs'));
        fs.copyFileSync(path.join(REPO, 'tools/lib/pw.cjs'), path.join(TMP, 'tools/lib/pw.cjs'));
        fs.writeFileSync(path.join(TMP, 'gohancho/img/dish/manifest.json'), JSON.stringify({version: 1, items: {nikujaga: {file: 'nikujaga.svg', via: 'svg'}, karaage: {file: 'karaage.svg', via: 'svg'}}}));
        const pg = await (await b.newContext()).newPage();
        for (const [id, n] of [['nikujaga', 1200], ['karaage', 512]]){
            const b64 = await pg.evaluate(n => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); for (let i = 0; i < 40; i++){ g.fillStyle = `hsl(${i * 9 % 60 + 10},70%,${30 + i % 5 * 10}%)`; g.fillRect((i * 37) % n, (i * 53) % n, n / 6, n / 7); } return c.toDataURL('image/png').split(',')[1]; }, n);
            fs.writeFileSync(path.join(TMP, 'in', id + '.png'), Buffer.from(b64, 'base64'));
        }
        let out = ''; try{ out = execFileSync(process.execPath, [path.join(TMP, 'tools/illustrations/import-photos.mjs'), path.join(TMP, 'in'), '--zoom', '1024'], {encoding: 'utf8', cwd: TMP}); }catch(e){ out = 'ERR ' + (e.stdout || '') + (e.stderr || ''); }
        const m = JSON.parse(fs.readFileSync(path.join(TMP, 'gohancho/img/dish/manifest.json'), 'utf8')).items;
        const zf = path.join(TMP, 'gohancho/img/dish/z/nikujaga.webp'), dims = fs.existsSync(zf) ? await pg.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/webp;base64,' + b64; await im.decode(); return [im.naturalWidth, im.naturalHeight]; }, fs.readFileSync(zf).toString('base64')) : null;
        const r = {zoomN: m.nikujaga && m.nikujaga.zoom, zoomK: m.karaage && m.karaage.zoom, dims, karaageFile: fs.existsSync(path.join(TMP, 'gohancho/img/dish/z/karaage.webp')), out: out.split('\n').filter(x => /z\/|ERR/.test(x)).join(' ')};
        ok(r.zoomN === 'z/nikujaga.webp' && JSON.stringify(dims) === '[1024,1024]' && !r.zoomK && !r.karaageFile, 'Z10 取りこみの道具 --zoom 1024: 元が大きい画像だけ z/ に 1024px の絵を作り manifest の zoom に入れる: ' + JSON.stringify(r));
    } finally { fs.rmSync(TMP, {recursive: true, force: true}); }
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\nzoom: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
