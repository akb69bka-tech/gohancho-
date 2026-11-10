#!/usr/bin/env node
// 2つのタブの知らせ（「別のタブの保存で…一部が消えました」など）を2行にちぢめたときに、全文が読めることの回帰テスト（第37回 利用者モニター R170。使い方: node tools/tests/note37.mjs [http://localhost:8795/]）
//  R170 幅195・260・320・390（と低い横向き）× 文字の大きさ3段 × 18言語 × 知らせ2つで:
//       ・たたんだまま: 知らせは画面の高さの半分未満・ボタンは枠を送らずに見えて 44px 以上（R168 のまま）。2行で切れるときは「続きを見る」が出る
//       ・「続きを見る」は button で aria-expanded・aria-controls を持つ。読み上げ用に文は いつも全文が入っている
//       ・押して広げると: 知らせは画面の半分未満のまま・ボタンは見えて 44px 以上・文は切れずに読める（入りきるか、欄の中を送って最後まで届く）
//       ・もう一度押すとたたむ
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const isReady = () => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *') && GH.booted;
const LANGS = ['ja', 'en', 'de', 'es', 'fr', 'it', 'pt-BR', 'pl', 'tr', 'ar', 'hi', 'id', 'fil', 'th', 'vi', 'ko', 'zh-Hans', 'zh-Hant'];
const TEXT = {other: '別のタブ・窓で内容が変わりました。このタブは保存を止めています', lost: '別のタブの保存で、アレルギー・家族・決めた献立の一部が消えました'};
const SIZES = [[195, 422], [260, 640], [320, 568], [390, 844], [740, 360]];

// 知らせの様子を測る
const measure = () => {
    const box = document.querySelector('#gh-notes .gh-note'), host = document.getElementById('gh-notes'), p = box.querySelector('p'), mb = box.querySelector('.gh-more');
    const vis = x => { const s = getComputedStyle(x); return s.display !== 'none' && s.visibility !== 'hidden' && x.getBoundingClientRect().height > 0; };
    const btns = [...box.querySelectorAll('button')].filter(vis).map(x => { const q = x.getBoundingClientRect(); return {t: x.textContent, top: q.top, bottom: q.bottom, left: q.left, right: q.right, h: q.height, w: q.width}; });
    const pr = p.getBoundingClientRect(), ps = getComputedStyle(p);
    const col = getComputedStyle(box).borderTopColor.match(/\d+/g).map(Number), mc = mb ? getComputedStyle(mb).color.match(/\d+/g).map(Number) : [0, 0, 0];
    const blue = c => c[2] > c[0] + 40 && c[2] > c[1] + 40;
    // 欄の中を送って最後まで届くか
    let reach = p.scrollHeight <= p.clientHeight + 1;
    if (!reach && /auto|scroll/.test(ps.overflowY)){ const t0 = p.scrollTop; p.scrollTop = 1e6; reach = p.scrollTop + p.clientHeight >= p.scrollHeight - 1; p.scrollTop = t0; }
    return {h: box.getBoundingClientRect().height, vh: innerHeight, vw: innerWidth, scroll: host.scrollHeight - host.clientHeight, btns, blue: blue(col) || blue(mc),
        clamped: p.scrollHeight > p.clientHeight + 1, reach, pTop: pr.top, pBottom: pr.bottom, text: p.textContent,
        more: mb ? {vis: vis(mb), tag: mb.tagName, exp: mb.getAttribute('aria-expanded'), ctl: mb.getAttribute('aria-controls'), pid: p.id, label: mb.textContent} : null};
};

let cutBefore = 0, combos = 0;
const bad = [];
for (const [w, h] of SIZES){
    for (const ts of [0, 1, 2]){
        const ctx = await b.newContext({ viewport: { width: w, height: h }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP', serviceWorkers: 'block' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
        const p = await ctx.newPage(); const errs = [];
        p.on('pageerror', e => errs.push(e.message));
        for (const L of LANGS){
            await p.goto(URL_ + 'about-blank-404').catch(() => {});
            await p.evaluate(([L, ts]) => { localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: L, dishCount: 3}, ts ? {textSize: ts} : {})})); }, [L, ts]).catch(() => {});
            await p.goto(URL_); await p.waitForFunction(isReady, null, { timeout: 30000 }); await p.waitForTimeout(150);
            for (const id of ['other', 'lost']){
                combos++;
                const tag = `${w}x${h} ts${ts} ${L} ${id}`;
                const full = await p.evaluate(([id, k]) => { GH.clear('other'); GH.clear('lost'); otherNoted = false; if (id === 'other') otherNote(true); else lostNote(); return t(k); }, [id, TEXT[id]]);
                const why = [];
                const chk = (r, st) => {
                    if (r.h >= r.vh / 2) why.push(`${st} 高さ ${Math.round(r.h)}/${r.vh}`);
                    if (r.scroll > 1) why.push(`${st} 枠を送らないと見えない`);
                    if (r.blue) why.push(`${st} 青`);
                    r.btns.forEach(x => { if (x.top < 0 || x.bottom > r.vh || x.left < 0 || x.right > r.vw + 0.5 || x.h < 43.5 || x.w < 44) why.push(`${st} ボタン「${x.t}」${Math.round(x.top)}-${Math.round(x.bottom)} ${Math.round(x.w)}x${Math.round(x.h)}`); });
                    if (r.btns.filter(x => x.t !== (r.more && r.more.label)).length !== 2) why.push(`${st} ボタンが2つでない`);
                    if (r.text !== full) why.push(`${st} 文が全文でない（読み上げ）`);
                    if (r.pTop < 0 || r.pBottom > r.vh + 0.5) why.push(`${st} 文が画面の外`);
                };
                const r0 = await p.evaluate(measure);
                chk(r0, 'たたみ');
                if (!r0.more) why.push('「続きを見る」がない');
                else {
                    if (r0.more.tag !== 'BUTTON' || r0.more.exp !== 'false' || !r0.more.ctl || r0.more.ctl !== r0.more.pid) why.push(`「続きを見る」の作り ${JSON.stringify(r0.more)}`);
                    if (r0.clamped){
                        cutBefore++;
                        if (!r0.more.vis) why.push('2行で切れているのに「続きを見る」が見えない');
                    }
                    if (r0.more.vis){
                        await p.click('#gh-note-' + id + ' .gh-more');
                        const r1 = await p.evaluate(measure);
                        chk(r1, '広げ');
                        if (r1.more.exp !== 'true') why.push('広げても aria-expanded が true でない');
                        if (!r1.reach) why.push('広げても全文に届かない');
                        if (r1.more.label === r0.more.label) why.push('広げてもボタンの名前が変わらない');
                        await p.click('#gh-note-' + id + ' .gh-more');
                        const r2 = await p.evaluate(measure);
                        if (r2.more.exp !== 'false' || r2.more.label !== r0.more.label || Math.abs(r2.h - r0.h) > 1) why.push('もう一度押してもたたまない');
                    }
                }
                if (w >= 390 && h > 520 && ts !== 2 && r0.more && r0.more.vis) why.push('広い画面で「続きを見る」が出ている');
                await p.evaluate(id => GH.clear(id), id);
                if (why.length) bad.push(`${tag}: ${why.join(' / ')}`);
            }
        }
        eq(errs, [], `R170 ${w}x${h} ts${ts} 例外なし`);
        await ctx.close();
    }
}
ok(!bad.length, `R170 2つのタブの知らせ: たたんでも広げても画面の半分未満・ボタンが見えて 44px 以上・広げると全文が読める（${combos}通り） ` + bad.slice(0, 8).join(' | ') + (bad.length > 8 ? ` …ほか${bad.length - 8}` : ''));
console.log(`  2行で切れていた組み合わせ（「続きを見る」で全文を読めるようにした）: ${cutBefore}/${combos}`);

await b.close();
console.log(`note37: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
