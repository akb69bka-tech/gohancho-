#!/usr/bin/env node
// 「落ちない・落ちても安全」の回帰テスト（Playwright で障害を注入する。使い方: node tools/tests/resilience.mjs [http://localhost:8795/]）
//  A. エラーの受け皿: 画面ひとつの描画が例外でも他のタブは動く / 起動の途中で例外・構文エラーでも真っ白にならず、
//     「再読み込み」「データを書き出す」が出る（書き出しは端末のデータそのまま）/ 画面が空のときだけ未処理の例外で案内を出す
//  B. 保存: localStorage が使えない・容量いっぱいでもメモリで動き続け、保存できないことを1回だけ知らせる。
//     書き込みに失敗しても前のデータはそのまま。壊れた保存データは gohancho.broken.<日付> に残して新しく始める（捨てない）
//  C. 外部ファイル: 国のデータ・画面の辞書・レシピの訳が読めない・時間切れ・中身が壊れているとき、国や言語が中途半端に変わらない。やり直せる
//  D. 極端な画面（幅280・高さ400・横向き・iPad・分割表示）で横にはみ出さない・操作できる
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ST = (o = {}) => ({ onboarded: true, firstUse: '2026-01-01', history: [{ id: 'nikujaga', d: '2026-10-20' }], favs: ['nikujaga'], fridge: ['卵', '玉ねぎ'], settings: Object.assign({ country: 'JP', dishCount: 3, uiLang: 'ja' }, o.settings || {}), ...Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'settings')) });

// 新しい文脈で開く。opts: state（最初の1回だけ保存しておく）/ raw（保存データの文字そのもの）/ init（ページより先に走らせる文字列）/ route（ctx.route を足す関数）/ w,h,locale
async function open(opts = {}){
    const ctx = await b.newContext({ viewport: { width: opts.w || 390, height: opts.h || 844 }, locale: opts.locale || 'ja-JP', serviceWorkers: 'block', acceptDownloads: true });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
    if (opts.route) await opts.route(ctx);
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.ctx = ctx;
    const seed = opts.raw !== undefined ? opts.raw : opts.state === null ? null : JSON.stringify(opts.state || ST());
    if (opts.init) await p.addInitScript(opts.init);
    await p.addInitScript(x => { try{ if (x != null && !sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded', '1'); localStorage.setItem('gohancho.v1', x); } }catch(e){} }, seed);
    await p.goto(URL_); await p.waitForFunction(() => window.GH && window.GH.booted, null, { timeout: 15000 }).catch(() => {}); await sleep(250);
    // 負荷が高いと、ページが自分で読み直した（起動の立て直しなど）直後の evaluate が「実行環境が破棄された」で落ちることがある。読み直しが終わるのを待って1回だけやり直す（起きたら印を出す）
    const ev = p.evaluate.bind(p);
    p.evaluate = async (...a) => {
        for (let k = 0; ; k++){
            try{ return await ev(...a); }
            catch(e){
                if (k >= 2 || !/Execution context was destroyed|navigation/i.test(String(e && e.message))) throw e;
                console.log('(note) evaluate 中にページが読み直された。待ってやり直す:', String(a[0]).slice(0, 60).replace(/\s+/g, ' '));
                await p.waitForLoadState('load').catch(() => {}); await p.waitForFunction(() => window.GH && window.GH.booted, null, { timeout: 15000 }).catch(() => {}); await sleep(250);
            }
        }
    };
    return p;
}
const raw = (p, k = 'gohancho.v1') => p.evaluate(k => { try{ return localStorage.getItem(k); }catch(e){ return 'THROW'; } }, k);
const notes = p => p.evaluate(() => [...document.querySelectorAll('#gh-notes .gh-note')].map(n => ({ id: n.id, text: n.querySelector('p').textContent, btns: [...n.querySelectorAll('button')].map(x => x.dataset.gh) })));
const viewN = p => p.evaluate(() => document.getElementById('view').children.length);
async function download(p, sel){
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.click(sel)]);
    const path = await d.path(); return (await import('node:fs')).readFileSync(path, 'utf8');
}
const toastText = p => p.evaluate(() => document.getElementById('toast-root').textContent);
// 本体の HTML を書きかえて返す route（障害を本体のコードに入れる）
const patchHtml = fn => async ctx => ctx.route(u => new URL(u).pathname === '/' || new URL(u).pathname.endsWith('/index.html'), async r => { const resp = await r.fetch(); await r.fulfill({ response: resp, body: fn(await resp.text()) }); });

// ================= A. エラーの受け皿 =================
{   // A1. 画面ひとつが例外でも、ほかのタブは動く
    const p = await open();
    ok(await viewN(p) > 0 && !(await notes(p)).length, 'A1 通常起動で案内は出ない');
    await p.evaluate(() => { window.__vf = window.viewFridge; window.viewFridge = () => { throw new Error('boom'); }; setTab('fridge'); });
    eq(await p.locator('#view .gh-view-fail').count(), 1, 'A1 失敗した画面には案内');
    eq(await p.locator('#view .gh-view-fail button[data-gh]').count(), 2, 'A1 再読み込みと書き出しの2つ');
    ok((await p.locator('#view .gh-view-fail p').textContent()).includes('うまく表示できませんでした'), 'A1 文言');
    eq(await p.locator('nav.tabs button:visible').count() >= 5, true, 'A1 下のタブは残る');
    ok(await p.locator('header.top h1').isVisible(), 'A1 見出しは残る');
    await p.evaluate(() => setTab('log'));
    eq(await p.locator('#view .gh-view-fail').count(), 0, 'A1 ほかのタブは動く');
    ok(await viewN(p) > 0, 'A1 記録タブが描かれる');
    await p.evaluate(() => setTab('today')); ok(await viewN(p) > 0, 'A1 献立タブも');
    await p.evaluate(() => { window.viewFridge = window.__vf; setTab('fridge'); });
    eq(await p.locator('#view .gh-view-fail').count(), 0, 'A1 直れば元に戻る');
    // 書き出しは今のデータ
    await p.evaluate(() => { window.viewFridge = () => { throw new Error('boom'); }; setTab('fridge'); });
    const j = JSON.parse(await download(p, '#view .gh-view-fail [data-gh="export"]'));
    ok(j._gohancho && j.favs.includes('nikujaga') && j.history.length === 1, 'A1 書き出したデータに記録が入っている');
    await p.ctx.close();
}
{   // A2. 起動の途中で例外 → 真っ白にしない
    const p = await open({ route: patchHtml(h => h.replace('function applyStaticText(){', "function applyStaticText(){ throw new Error('boom');")) });
    const n = await notes(p);
    eq(n.length, 1, 'A2 案内が1つ'); eq(n[0] && n[0].btns, ['reload', 'export', 'close'], 'A2 ボタン');
    ok(n[0] && n[0].text.includes('うまく表示できませんでした。もう一度開くか、データを書き出してください'), 'A2 文言');
    ok(await p.locator('header.top h1').isVisible(), 'A2 見出しは見える');
    ok(await viewN(p) > 0, 'A2 画面の中身も出ている');
    const j = JSON.parse(await download(p, '#gh-note-bootfail [data-gh="export"]'));
    ok(j.favs && j.favs.includes('nikujaga'), 'A2 書き出しにデータが入っている');
    const nav = p.waitForEvent('framenavigated'); await p.click('#gh-note-bootfail [data-gh="reload"]'); await nav;
    ok(true, 'A2 再読み込みが動く');
    await p.ctx.close();
}
{   // A3. 本体が構文エラーで動かない → 英語/日本語の案内だけは出る（端末の言語で）
    for (const [loc, want] of [['ja-JP', 'うまく表示できませんでした'], ['en-US', 'Could not show this screen']]){
        const p = await open({ locale: loc, route: patchHtml(h => h.replace('const RECIPES = [];', 'const RECIPES = [;')) });
        await sleep(2000);
        const n = await notes(p);
        eq(n.length, 1, `A3 ${loc} 案内`); ok(n[0] && n[0].text.includes(want), `A3 ${loc} 文言 ${n[0] && n[0].text}`);
        const stored = await raw(p);
        eq(await download(p, '#gh-note-fatal [data-gh="export"]'), stored, `A3 ${loc} 端末のデータそのものを書き出す`);
        await p.ctx.close();
    }
}
{   // A4. 未処理の例外・拒否: 画面があれば静か、画面が空なら案内
    const p = await open();
    await p.evaluate(() => { Promise.reject(new Error('x')); setTimeout(() => { throw new Error('y'); }, 0); }); await sleep(400);
    eq((await notes(p)).length, 0, 'A4 画面があるときは案内を出さない');
    await p.evaluate(() => { document.getElementById('view').innerHTML = ''; Promise.reject(new Error('z')); }); await sleep(400);
    eq((await notes(p)).length, 1, 'A4 画面が空なら案内');
    await p.evaluate(() => setTab('today')); await sleep(100);
    eq((await notes(p)).length, 0, 'A4 描き直せたら案内は消える');
    await p.ctx.close();
}
{   // A5. シートやモーダルの描画が失敗しても落ちない
    const p = await open();
    await p.evaluate(() => { window.renderSheetBody = () => { throw new Error('boom'); }; openCountrySheet(); });
    eq(await p.evaluate(() => document.getElementById('sheet-root').innerHTML), '', 'A5 シートは閉じる');
    ok((await toastText(p)).includes('うまく表示できませんでした'), 'A5 トースト');
    await p.evaluate(() => { window.renderModalBody = () => { throw new Error('boom'); }; openModal('nikujaga'); });
    eq(await p.evaluate(() => document.getElementById('modal-root').innerHTML), '', 'A5 モーダルも閉じる');
    await p.evaluate(() => setTab('log')); ok(await viewN(p) > 0, 'A5 そのあとも動く');
    await p.ctx.close();
}

// ================= B. 保存 =================
const QUOTA = "(function(){ var o = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if (window.__quota && (window.__quota === true || window.__quota(k, v, this))){ var e = new DOMException('full', 'QuotaExceededError'); throw e; } return o.call(this, k, v); }; })();";
{   // B1. localStorage がまったく使えない（SecurityError）→ メモリで動き続け、1回だけ知らせる
    const p = await open({ state: null, init: "Object.defineProperty(window, 'localStorage', {get(){ throw new DOMException('denied', 'SecurityError'); }, configurable: true});" });
    ok(await viewN(p) > 0 || await p.evaluate(() => !!sheet), 'B1 使えなくても起動する');
    await p.evaluate(() => setCountry('JP')); await p.evaluate(() => { S.onboarded = true; closeSheet(); setTab('today'); });
    for (let i = 0; i < 3; i++){ await p.evaluate(i => { S.favs.push('fav' + i); save(); }, i); await sleep(450); }
    const n = await notes(p);
    eq(n.filter(x => x.id === 'gh-note-store').length, 1, 'B1 保存できない知らせは1回だけ');
    ok(n[0] && n[0].text.includes('この端末では保存できない'), 'B1 本当のことを言う: ' + (n[0] && n[0].text));
    ok(n[0] && n[0].btns.includes('export'), 'B1 書き出しボタン');
    eq(await p.evaluate(() => S.favs.length), 3, 'B1 メモリの中では続けて使える');
    await p.evaluate(() => setTab('log')); ok(await viewN(p) > 0, 'B1 画面も動く');
    const j = JSON.parse(await download(p, '#gh-note-store [data-gh="export"]'));
    eq(j.favs, ['fav0', 'fav1', 'fav2'], 'B1 今のデータを書き出せる');
    eq(p.errs.length, 0, 'B1 例外なし: ' + p.errs.join('|'));
    await p.ctx.close();
}
{   // B2. 容量いっぱい: 前のデータはそのまま、1回だけ知らせる、空きができたら保存される
    const p = await open({ init: QUOTA }); await sleep(800);
    const before = await raw(p);
    await p.evaluate(() => { window.__quota = true; S.favs.push('q1'); save(); }); await sleep(500);
    eq(await raw(p), before, 'B2 書き込みに失敗しても前のデータはそのまま');
    await p.evaluate(() => { S.favs.push('q2'); save(); }); await sleep(500);
    eq(await raw(p), before, 'B2 2回目も同じ');
    const n = await notes(p);
    eq(n.length, 1, 'B2 知らせは1回だけ'); ok(n[0] && n[0].text.includes('端末の空きが足りず'), 'B2 文言'); ok(n[0].btns.includes('export'), 'B2 書き出しボタン');
    eq(await p.evaluate(() => S.favs.slice(-2)), ['q1', 'q2'], 'B2 メモリは更新されている');
    await p.evaluate(() => { window.__quota = false; save(); }); await sleep(500);
    eq(JSON.parse(await raw(p)).favs.slice(-2), ['q1', 'q2'], 'B2 空きができたら保存される');
    eq((await notes(p)).length, 0, 'B2 保存できたら知らせは消える');
    await p.ctx.close();
}
{   // B3. 容量が足りないとき、写真の控え・「元に戻す」の控えより先に本体を守る
    const p = await open({ init: QUOTA + "window.__quota = function(k, v, st){ var t = 0; for (var i = 0; i < st.length; i++){ var kk = st.key(i); if (kk !== k) t += (kk.length + st.getItem(kk).length); } return t + k.length + v.length > 400000; };" });
    await p.evaluate(() => { localStorage.setItem('gohancho.photos.v2', 'x'.repeat(250000)); localStorage.setItem('gohancho.undo', 'y'.repeat(60000)); });
    await p.evaluate(() => { S.favs.push('z'.repeat(120000)); save(); }); await sleep(500);
    const v = JSON.parse(await raw(p));
    ok(v.favs.some(x => x.startsWith('zzzz')), 'B3 本体は保存できた');
    eq(await raw(p, 'gohancho.photos.v2'), null, 'B3 写真の控えを空けた');
    ok(await raw(p, 'gohancho.undo') !== null, 'B3 「元に戻す」の控えは残した');
    eq((await notes(p)).length, 0, 'B3 空けて保存できたので知らせない');
    await p.ctx.close();
}
const today = new Date(); const pad = n => String(n).padStart(2, '0'); const TODAY = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
for (const bad of ['{"history":[', '[1,2,3]', '"str"', '{{{{', '12345']){   // B4. 壊れた保存データ
    const p = await open({ raw: bad });
    ok(await viewN(p) > 0 || await p.evaluate(() => !!sheet), `B4 [${bad}] 壊れていても起動する`);
    const key = await p.evaluate(() => Object.keys(localStorage).find(k => k.startsWith('gohancho.broken.')));
    ok(key && key.startsWith('gohancho.broken.' + TODAY.slice(0, 7)), `B4 [${bad}] 退避した: ${key}`);
    eq(await raw(p, key), bad, `B4 [${bad}] 退避したのは元の文字そのまま`);
    const n = await notes(p);
    eq(n.length, 1, `B4 [${bad}] 案内`); ok(n[0] && n[0].text.includes('新しく始めました'), `B4 [${bad}] 文言`); ok(n[0] && n[0].btns.includes('brk'), `B4 [${bad}] 壊れたデータを書き出すボタン`);
    eq(await download(p, '#gh-note-broken [data-gh="brk"]'), bad, `B4 [${bad}] 壊れたデータを取り出せる`);
    await p.evaluate(() => { S.onboarded = true; S.favs.push('new'); save(); }); await sleep(450);
    const v = JSON.parse(await raw(p));
    ok(v && typeof v === 'object' && !Array.isArray(v) && v.favs.includes('new'), `B4 [${bad}] 新しいデータは新しく保存される`);
    eq(await raw(p, key), bad, `B4 [${bad}] 退避は上書きされない`);
    await p.reload(); await sleep(900);
    eq((await notes(p)).length, 0, `B4 [${bad}] 2回目の起動では案内は出ない`);
    eq(await raw(p, key), bad, `B4 [${bad}] 退避は残っている`);
    await p.ctx.close();
}
{   // B5. 同じ日に2回壊れても、先の退避を上書きしない
    const p = await open({ raw: '{"a":' }); await sleep(900);
    await p.evaluate(() => { window.saveNow = () => {}; localStorage.setItem('gohancho.v1', '{"b":'); }); await p.reload(); await sleep(900);
    const keys = await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('gohancho.broken.')).sort());
    eq(keys.length, 2, 'B5 退避は2つ'); eq(await Promise.all(keys.map(k => raw(p, k))), ['{"a":', '{"b":'], 'B5 どちらも残る');
    await p.ctx.close();
}
{   // B6. 一部の記録だけ形が合わないとき: 読める分で起動し、元のデータは残す
    const st = ST(); st.history = [{ id: 'nikujaga', d: '2026-10-20' }, { id: 'x', d: '2026-02-30' }, 'oops'];
    const p = await open({ raw: JSON.stringify(st) });
    eq(await p.evaluate(() => S.history.length), 1, 'B6 読める記録だけ使う');
    const key = await p.evaluate(() => Object.keys(localStorage).find(k => k.startsWith('gohancho.broken.')));
    eq(JSON.parse(await raw(p, key)).history.length, 3, 'B6 元のデータは残してある');
    const n = await notes(p); ok(n[0] && n[0].text.includes('一部が読めなかった'), 'B6 案内');
    await p.ctx.close();
}
{   // B7. 退避できない（容量）ときは、壊れたデータを新しいデータで上書きしない
    const p = await open({ raw: '{"history":[', init: QUOTA + "window.__quota = function(k){ return k.indexOf('gohancho.broken.') === 0; };" });
    ok(await viewN(p) > 0 || await p.evaluate(() => !!sheet), 'B7 起動する');
    await p.evaluate(() => { S.onboarded = true; S.favs.push('n'); save(); }); await sleep(500);
    eq(await raw(p), '{"history":[', 'B7 壊れたデータは上書きされない');
    const n = await notes(p); ok(n.some(x => x.id === 'gh-note-hold'), 'B7 保存されないことを知らせる');
    eq(await p.evaluate(() => S.favs.includes('n')), true, 'B7 メモリでは動く');
    await p.ctx.close();
}
{   // B8. 'null' や空のデータは「壊れた」とは言わない
    for (const r of ['null', '']){
        const p = await open({ raw: r });
        eq(await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('gohancho.broken.')).length), 0, `B8 [${r}] 退避しない`);
        eq((await notes(p)).length, 0, `B8 [${r}] 案内しない`);
        await p.ctx.close();
    }
}

// ================= C. 外部ファイル =================
const hit = { n: 0 };
const countingAbort = (re) => async ctx => ctx.route(re, r => { hit.n++; r.abort(); });
{   // C1. 国のデータが読めない → 国は変わらない。電波が戻れば選べる
    const p = await open({ route: countingAbort(/\/packs\/fr\.js/) });
    const fridge = await p.evaluate(() => JSON.stringify(S.fridge));
    const r = await p.evaluate(() => setCountry('FR'));
    eq(r, false, 'C1 失敗は false');
    ok(hit.n >= 2, 'C1 やり直しを1回する: ' + hit.n);
    eq(await p.evaluate(() => [S.settings.country, LANG, JSON.stringify(S.fridge), PACK, packFail]), ['JP', 'ja', fridge, null, null], 'C1 何も変わらない');
    ok((await toastText(p)).includes('読みこめませんでした'), 'C1 失敗を知らせる');
    await p.ctx.unroute(/\/packs\/fr\.js/);
    eq(await p.evaluate(() => setCountry('FR')), true, 'C1 つながれば選べる');
    eq(await p.evaluate(() => [S.settings.country, PACK && PACK.country, RECIPES[0].id.slice(0, 3), PACK_LOADED_OK('FR')]), ['FR', 'FR', 'fr_', true], 'C1 国が切りかわった');
    await p.evaluate(() => setCountry('JP'));
    eq(await p.evaluate(() => [S.settings.country, JSON.stringify(S.fridge)]), ['JP', fridge], 'C1 戻すと冷蔵庫ももとのまま');
    await p.ctx.close();
}
{   // C2. 時間切れ（返事がこない）→ 待ち続けず失敗にする
    const p = await open({ route: async ctx => ctx.route(/\/packs\/fr\.js/, () => { /* 返事をしない */ }) });
    await p.clock.install();
    const done = p.evaluate(() => { window.__r = 'pending'; setCountry('FR').then(v => { window.__r = v; }); });
    await done;
    for (let i = 0; i < 6; i++){ await p.clock.runFor(10000); await sleep(100); }
    eq(await p.evaluate(() => window.__r), false, 'C2 時間切れで失敗');
    eq(await p.evaluate(() => [S.settings.country, countryBusy]), ['JP', false], 'C2 国は変わらず、次の操作を受けつける');
    await p.ctx.close();
}
{   // C3. 中身が壊れた国のデータ: 半分だけ使わない
    for (const [name, body] of [['必須の項目が欠けている', "GOHAN_PACK({country:'FR', lang:'fr', recipes:[{id:'fr_x'}]});"], ['途中で切れている', "GOHAN_PACK({country:'FR', lang:'fr', recipes:[{id:'fr_x', ings:["], ['空', '']]){
        const p = await open({ route: async ctx => ctx.route(/\/packs\/fr\.js/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body })) });
        eq(await p.evaluate(() => setCountry('FR')), false, `C3 ${name}: 失敗`);
        eq(await p.evaluate(() => [S.settings.country, !!PACKS.FR, PACK]), ['JP', false, null], `C3 ${name}: 何も変わらない`);
        await p.ctx.close();
    }
}
{   // C4. 国のデータは読めたが、レシピの訳が読めない（電波）→ 変えない。ファイルがない（404）なら訳なしで進む
    const re = /\/packs\/i18n\/fr\.ja\.js/;
    let p = await open({ route: async ctx => ctx.route(re, r => r.abort()) });
    eq(await p.evaluate(() => setCountry('FR')), false, 'C4 訳が読めないなら国を変えない');
    eq(await p.evaluate(() => [S.settings.country, PACK, LANG, JSON.stringify(S.fridge)]), ['JP', null, 'ja', JSON.stringify(['卵', '玉ねぎ'])], 'C4 何も変わらない');
    await p.ctx.close();
    p = await open({ route: async ctx => ctx.route(re, r => r.fulfill({ status: 404, body: 'nf' })) });
    eq(await p.evaluate(() => setCountry('FR')), true, 'C4 訳のファイルがない（404）ときは訳なしで進む');
    await p.ctx.close();
}
{   // C5. 言語切替: 辞書が読めない / レシピの訳が読めない → 画面の言葉と料理の言葉がずれない
    const goSettings = async p => { await p.evaluate(() => { setTab('settings'); document.querySelector('[data-act="set-jump"][data-k="display"]').click(); }); await p.waitForSelector('[data-act="ui-lang"][data-v="en"]'); };   // 設定はまとまりごとに畳んである。目次から「表示と言語」を開く
    const p = await open({ route: async ctx => { await ctx.route(/\/i18n\/en\.js/, r => r.abort()); } });
    await goSettings(p);
    await p.click('[data-act="ui-lang"][data-v="en"]'); await sleep(2600);
    eq(await p.evaluate(() => [LANG, S.settings.uiLang, document.documentElement.lang]), ['ja', 'ja', 'ja'], 'C5 辞書が読めなければ切りかえない');
    ok((await toastText(p)).includes('この言語を読みこめませんでした'), 'C5 失敗を知らせる');
    await p.ctx.unroute(/\/i18n\/en\.js/);
    await p.ctx.route(/\/packs\/i18n\/jp\.en\.js/, r => r.abort());
    await goSettings(p);
    await p.click('[data-act="ui-lang"][data-v="en"]'); await sleep(2600);
    eq(await p.evaluate(() => [LANG, S.settings.uiLang, RECIPES[0].name]), ['ja', 'ja', await p.evaluate(() => RECIPES[0].name)], 'C5 訳が読めなければ切りかえない');
    ok(await p.evaluate(() => /[ぁ-んァ-ン一-龥]/.test(RECIPES[0].name)), 'C5 料理は日本語のまま（画面だけ英語、にならない）');
    await p.ctx.unroute(/\/packs\/i18n\/jp\.en\.js/);
    await goSettings(p);
    await p.click('[data-act="ui-lang"][data-v="en"]'); await sleep(1500);
    eq(await p.evaluate(() => [LANG, S.settings.uiLang]), ['en', 'en'], 'C5 つながれば切りかわる');
    ok(await p.evaluate(() => !/[ぁ-んァ-ン一-龥]/.test(RECIPES[0].name)), 'C5 料理の名前も英語になる: ' + await p.evaluate(() => RECIPES[0].name));
    // 続けて押しても、最後に押した言語になる
    await goSettings(p);
    await p.evaluate(() => { document.querySelector('[data-act="ui-lang"][data-v="de"]').click(); document.querySelector('[data-act="ui-lang"][data-v="fr"]').click(); }); await sleep(2500);
    eq(await p.evaluate(() => [LANG, S.settings.uiLang]), ['fr', 'fr'], 'C5 続けて押しても最後の言語');
    await p.ctx.close();
}
{   // C6. 起動のとき国のデータが読めない → 日本で開く。保存は元の国のまま。つながったらもう一度読みこめる
    const p = await open({ state: ST({ settings: { country: 'FR', uiLang: 'ja' } }), route: async ctx => ctx.route(/\/packs\/fr\.js/, r => r.abort()) });
    eq(await p.evaluate(() => [S.settings.country, !!PACK]), ['JP', false], 'C6 いまは日本で開く');
    eq(JSON.parse(await raw(p)).settings.country, 'FR', 'C6 保存は元の国のまま');
    const n = await notes(p); ok(n.length === 1 && n[0].btns.includes('retry'), 'C6 案内と「もう一度読みこむ」');
    ok(await viewN(p) > 0, 'C6 画面は出ている');
    eq(await p.evaluate(() => PACK_LOADED_OK('JP')), false, 'C6 PACK_LOADED_OK は「読めていない」を返す');
    await p.ctx.unroute(/\/packs\/fr\.js/);
    await p.click('#gh-note-pack [data-gh="retry"]'); await sleep(1200);
    eq(await p.evaluate(() => [S.settings.country, PACK && PACK.country, packFail]), ['FR', 'FR', null], 'C6 もう一度読みこめた');
    eq((await notes(p)).length, 0, 'C6 案内は消える');
    eq(JSON.parse(await raw(p)).settings.country, 'FR', 'C6 保存も FR');
    await p.ctx.close();
}
{   // C7. 国の切りかえの途中（言語の読みこみ中）に例外 → もとの国・言語・冷蔵庫に戻る
    const p = await open();
    await p.evaluate(() => { window.__ac = window.applyCountry; window.applyCountry = cc => { if (cc === 'FR') throw new Error('boom'); return window.__ac(cc); }; });
    const fridge = await p.evaluate(() => JSON.stringify(S.fridge));
    eq(await p.evaluate(() => setCountry('FR')), false, 'C7 失敗');
    eq(await p.evaluate(() => [S.settings.country, LANG, JSON.stringify(S.fridge), S.week, packFail, !!(S.countryData && S.countryData.JP)]), ['JP', 'ja', fridge, null, null, false], 'C7 もとのまま');
    await p.evaluate(() => { window.applyCountry = window.__ac; });
    eq(await p.evaluate(() => setCountry('FR')), true, 'C7 直れば選べる');
    await p.ctx.close();
}

// ================= D. 極端な画面 =================
const VPS = [[280, 400], [280, 653], [400, 280], [667, 375], [320, 568], [375, 667], [768, 1024], [1024, 768], [507, 768], [320, 768], [678, 1024]];
const measure = () => {
    const W = innerWidth, H = innerHeight, bad = [];
    document.querySelectorAll('body *').forEach(e => {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
        if (r.right <= W + 1 && r.left >= -1) return;
        const cs = getComputedStyle(e); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') return;
        let n = e.parentElement, sc = false; while (n && n !== document.body){ const o = getComputedStyle(n).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden'){ sc = true; break; } n = n.parentElement; }
        if (!sc && !e.closest('svg') && !e.closest('#timer-float')) bad.push(e.tagName + '.' + e.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
    });
    const nav = document.querySelector('nav.tabs').getBoundingClientRect(), hd = document.querySelector('header.top h1').getBoundingClientRect();
    window.scrollTo(0, document.documentElement.scrollHeight);
    const kids = document.getElementById('view').children, last = kids[kids.length - 1], lr = last && last.getBoundingClientRect();
    return { sw: document.documentElement.scrollWidth, W, H, bad: bad.slice(0, 3), navBottom: Math.round(nav.bottom), navTop: Math.round(nav.top), navH: Math.round(nav.height), h1: hd.width > 0 && hd.right <= W + 1, lastBottom: lr ? Math.round(lr.bottom) : 0 };
};
const LANGS = [['ja', 'ja-JP', 'JP'], ['de', 'de-DE', 'DE'], ['ar', 'ar-EG', 'EG']];
for (const [lang, loc, cc] of LANGS){
    for (const [w, h] of VPS){
        if (lang === 'ar' && ![[280, 400], [667, 375], [320, 568]].some(v => v[0] === w && v[1] === h)) continue;
        const p = await open({ w, h, locale: loc, state: ST({ settings: { country: cc, uiLang: lang } }) });
        for (const tab of ['today', 'cook', 'fridge', 'twist', 'world', 'log', 'settings']){
            await p.evaluate(t => setTab(t), tab); await sleep(120);
            const r = await p.evaluate(measure);
            const id = `D ${lang} ${w}x${h} ${tab}`;
            ok(r.sw <= r.W, `${id}: 横にはみ出す sw=${r.sw} W=${r.W} ${r.bad.join(' ')}`);
            ok(r.bad.length === 0, `${id}: はみ出す要素 ${r.bad.join(' ')}`);
            ok(r.navBottom <= r.H + 1 && r.navH <= r.H * 0.4, `${id}: 下のタブが画面に収まる (${r.navH}/${r.H})`);
            ok(r.h1, `${id}: 見出しが見える`);
            ok(r.lastBottom <= r.navTop + 2, `${id}: いちばん下までスクロールすると下のタブに隠れない (${r.lastBottom} > ${r.navTop})`);
        }
        // シートとモーダル
        for (const [name, fn] of [['国', () => openCountrySheet()], ['はじめて', () => startOnboard()], ['購入', () => openPaywall('dishes')], ['料理', () => openModal(RECIPES[0].id)]]){
            await p.evaluate(fn); await sleep(150);
            const r = await p.evaluate(() => {
                const W = innerWidth, d = document.querySelector('#sheet-root [role=dialog],#modal-root [role=dialog]'); if (!d) return null;
                const dr = d.getBoundingClientRect(), bad = [];
                d.querySelectorAll('*').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1)){ let n = e.parentElement, sc = false; while (n && n !== d.parentElement){ const o = getComputedStyle(n).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden'){ sc = true; break; } n = n.parentElement; } if (!sc && !e.closest('svg')) bad.push(e.tagName + '.' + e.className); } });
                const sc = d.scrollHeight > d.clientHeight ? getComputedStyle(d).overflowY : 'fit';
                return { top: Math.round(dr.top), sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 3), sc };
            });
            const id = `D ${lang} ${w}x${h} ${name}`;
            ok(r, `${id}: 開く`); if (!r) continue;
            ok(r.sw <= r.W && r.bad.length === 0, `${id}: 横にはみ出す ${r.bad.join(' ')}`);
            ok(r.top >= 0, `${id}: 上が画面の外に出ない (top=${r.top})`);
            ok(r.sc === 'fit' || /auto|scroll/.test(r.sc), `${id}: 高さが足りないときはスクロールできる (${r.sc})`);
            await p.evaluate(() => { sheet = null; document.getElementById('sheet-root').innerHTML = ''; closeModal(); document.body.style.overflow = ''; });
        }
        eq(p.errs.length, 0, `D ${lang} ${w}x${h} 例外なし: ${p.errs.join('|')}`);
        await p.ctx.close();
    }
}
{   // D2. 向きを変える（縦→横→縦）・分割表示に変わる（幅が途中で変わる）
    const p = await open({ w: 390, h: 844 });
    for (const [w, h] of [[844, 390], [390, 844], [320, 768], [678, 1024], [280, 400], [390, 844]]){
        await p.setViewportSize({ width: w, height: h }); await sleep(150);
        for (const tab of ['today', 'settings']){
            await p.evaluate(t => setTab(t), tab);
            const r = await p.evaluate(measure);
            ok(r.sw <= r.W && r.bad.length === 0, `D2 ${w}x${h} ${tab}: はみ出し ${r.bad.join(' ')}`);
        }
    }
    eq(p.errs.length, 0, 'D2 例外なし');
    await p.ctx.close();
}

await b.close();
console.log(fails ? `\n${fails} FAILED / ${checks} checks` : `\nall ${checks} checks passed`);
process.exit(fails ? 1 : 0);
