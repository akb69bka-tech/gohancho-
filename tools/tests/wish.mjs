#!/usr/bin/env node
// 家族の「食べたい」（案A 食べたいものを送る）の回帰テスト（Playwright。使い方: node tools/tests/wish.mjs [http://localhost:8794/]）
//  W1 リンクを作る: 設定 › 家族 → 料理を選ぶ → 送る文。リンクの中身は # のうしろ（#g=…）に入り、料理名が文で読める
//  W2 別の端末として開く → 読みこむ: 受けとる画面・アドレス欄から消える・中身をどこにも送らない（# のうしろはサーバーに届かない）・受けとると候補に入る
//  W3 決めた献立は変わらない: 決めたあとに受けとっても S.cook・今日の画面の案は同じ。次に献立を新しく作るときだけ1品入る。札・なぜの1行・食卓の1行
//  W4 苦手・アレルギーに当たる料理は候補にならない（受けとる画面で知らせる。あとからアレルギーを足しても入らない）
//  W5 一人暮らしには出ない（今日・記録タブに入口・印・言葉なし。設定 › 家族の1行だけ）。赤い丸の印を使わない・相手に自動で返さない
//  W6 こわれたリンク・長すぎるリンク・形のちがうリンク・知らない料理・同じリンク2回・名前のタグで落ちない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const FAM2 = [{id: 'f1', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}];
const DOC = 'https://akb69bka-tech.github.io/gohancho-/';
const b64u = s => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const linkOf = o => DOC + '#g=' + b64u(JSON.stringify(o));
const hashOf = u => u.slice(u.indexOf('#'));
// 外へ出ていく通信を全部控える（アプリの中身・リンクの中身が送られていないかを見る）
const open = async (state = {}, hash = '') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
    const reqs = [];
    ctx.on('request', r => reqs.push(r.url() + ' ' + (r.postData() || '')));
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(SEED));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')){ localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01'}, st, {settings: Object.assign({country: 'JP', dishCount: 3, servings: 2}, st.settings || {})}))); } }, state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_ + hash); await ready(p);
    return {p, ctx, reqs};
};
const sheetKind = p => p.evaluate(() => sheet && sheet.kind);
const sheetText = p => p.evaluate(() => (document.querySelector('#sheet-root') || {}).textContent || '');
const viewText = p => p.evaluate(() => document.querySelector('#view').textContent);

// ---- W1 リンクを作る（食べる人の端末） ----
let link = '', text = '';
{
    const {p, ctx} = await open({family: FAM2, settings: {sendName: 'ゆうき'}});
    await p.evaluate(() => { setTab('settings'); });
    ok(await p.evaluate(() => !!document.querySelector('#set-family [data-act="wish-open"]')), 'W1a 設定 › 家族 に「食べたいものを送る」がある');
    await p.click('#set-family [data-act="wish-open"]');
    ok(await sheetKind(p) === 'wish-send', 'W1b 食べたいものを選ぶ画面が開く');
    ok(await p.evaluate(() => document.querySelectorAll('#wish-grid .wsh-card').length) >= 3, 'W1c 家でよく出る料理が並ぶ');
    // 料理名でさがして選ぶ
    await p.fill('#wish-q', '唐揚げ'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => [...document.querySelectorAll('#wish-grid .wsh-card')].some(x => x.dataset.id === 'karaage')), 'W1d 料理名でさがせる');
    await p.click('#wish-grid [data-id="karaage"]');
    await p.fill('#wish-q', 'さばの味噌煮'); await p.waitForTimeout(400);
    await p.click('#wish-grid [data-id="sabamiso"]');
    ok(await p.evaluate(() => sheet.sel.join()) === 'karaage,sabamiso', 'W1e 2品選べる: ' + await p.evaluate(() => sheet.sel.join()));
    ok((await p.evaluate(() => document.querySelector('[data-act="wish-make"]').textContent)).includes('2品'), 'W1f 主ボタンに品数');
    // 4品目は選べない
    await p.evaluate(() => { sheet.sel.push('hamburg'); renderSheet(); });
    await p.evaluate(() => document.querySelector('#wish-q') && (document.querySelector('#wish-q').value = ''));
    await p.evaluate(() => { sheet.q = 'ポテトサラダ'; renderSheet(); const c = document.querySelector('#wish-grid .wsh-card[aria-pressed="false"]'); if (c) c.click(); });
    ok(await p.evaluate(() => sheet.sel.length) === 3, 'W1g 3つまでしか選べない');
    await p.evaluate(() => { sheet.sel = ['karaage', 'sabamiso']; renderSheet(); });
    await p.click('[data-act="wish-word"][data-v="1"]');
    await p.click('[data-act="wish-make"]');
    ok(await sheetKind(p) === 'share', 'W1h 送る文の画面（LINE・コピー・ほかのアプリ）');
    text = await p.evaluate(() => document.querySelector('#share-text').value);
    link = (text.match(/https:\/\/\S+/) || [''])[0];
    ok(text.includes('ゆうきの食べたいもの') && text.includes('鶏の唐揚げ') && text.includes('さばの味噌煮') && text.includes('週末でいい'), 'W1i 文だけで中身が分かる: ' + text.split('\n')[0]);
    ok(link.startsWith(DOC + '#g='), 'W1j リンクの中身は # のうしろ: ' + link.slice(0, 60));
    ok(!/[?&]/.test(link.slice(0, link.indexOf('#'))), 'W1k # の前（サーバーに届く部分）に中身を入れない');
    ok(link.length < 400, 'W1l リンクは短い（QR にも入る）: ' + link.length + '字');
    ok(!(await p.evaluate(() => !!document.querySelector('.sheet [data-act="share-card"]'))), 'W1m 画像でつくる（料理の写真）は出さない');
    await ctx.close();
}

// ---- W2・W3 別の端末（作る人）として開く → 読みこむ。決めた献立は変わらない ----
{
    const {p, ctx, reqs} = await open({family: FAM2});
    // 今日の一膳を先に決めておく
    await p.evaluate(() => { setTab('today'); render(); });
    await p.evaluate(() => document.querySelector('[data-act="decide"]').click());
    await p.waitForTimeout(450);
    const cook0 = await p.evaluate(() => JSON.stringify(S.cook.ids)), menu0 = await p.evaluate(() => menuIds().join());
    const n0 = reqs.length;
    // 開いたままのページで届いたリンクを開く（# のうしろだけ変わる）
    await p.evaluate(h => { location.hash = h; }, hashOf(link));
    await p.waitForFunction(() => sheet && sheet.kind === 'wish-in', null, {timeout: 5000}).catch(() => {});
    ok(await sheetKind(p) === 'wish-in', 'W2a 受けとる画面が開く');
    const st = await sheetText(p);
    ok(st.includes('ゆうき') && st.includes('鶏の唐揚げ') && st.includes('さばの味噌煮') && st.includes('週末でいい'), 'W2b 誰から・何が・ひとことが読める');
    ok(st.includes('は変わりません'), 'W2c 「今日の決めた一膳は変わりません」を書く');
    ok(st.includes('このスマホの中だけで読みました'), 'W2d 中身は端末の中だけで読んだと書く');
    ok(await p.evaluate(() => location.hash === ''), 'W2e 読んだらアドレス欄から消す: ' + await p.evaluate(() => location.hash));
    const code = link.slice(link.indexOf('#g=') + 3);
    ok(!reqs.slice(n0).some(u => u.includes(code.slice(0, 20)) || (!u.startsWith(URL_) && u.includes('karaage'))), 'W2f リンクの中身・料理をどこにも送らない（アプリの絵を読むだけ）: ' + reqs.slice(n0).filter(u => !u.startsWith(URL_)).join(' '));
    await p.click('[data-act="wish-accept"]');
    const w = await p.evaluate(() => S.wants.map(x => x.id + ':' + x.n + ':' + x.m).join());
    ok(w === 'karaage:ゆうき:1,sabamiso:ゆうき:1' || w === 'sabamiso:ゆうき:1,karaage:ゆうき:1', 'W2g 受けとると候補に入る: ' + w);
    ok(await p.evaluate(() => JSON.stringify(S.cook.ids)) === cook0, 'W3a 受けとっても決めた献立は変わらない');
    ok(await p.evaluate(() => menuIds().join()) === menu0, 'W3b いま出ている今日の画面の案も変わらない');
    ok(!reqs.slice(n0).some(u => /POST|line\.me/.test(u) && !u.startsWith('http://localhost')), 'W3c 受けとったことを相手に自動で返さない（送る通信がない）');
    // 同じリンクをもう一度開いても、2回は読みこまない
    await p.evaluate(h => { location.hash = h; }, hashOf(link));
    await p.waitForTimeout(300);
    ok((await sheetText(p)).includes('前に読みこみました') && await p.evaluate(() => S.wants.length) === 2, 'W3d 同じリンクは2回読みこまない');
    await p.evaluate(() => wishClose());
    // 決める段の入口「食べたいもの（2）」（数は入口の（）だけ。赤い丸は使わない）
    await p.evaluate(() => { session.stage = 'decide'; setTab('today'); });
    ok((await viewText(p)).includes('食べたいもの（2）'), 'W3e 決める段に小さな入口「食べたいもの（2）」');
    ok(await p.evaluate(() => !document.querySelector('.badge-dot, .dot-badge, [class*="unread"]')), 'W3f 赤い丸の通知の印がない');
    // 今日は決めてあるので、決めた一膳はそのまま。次の日（まだ決めていない日）に新しく作る献立に1品だけ入る（週末でいい → 土曜日にする）
    const r = await p.evaluate(() => {
        let d = TODAY; for (let i = 1; i <= 7; i++){ d = addDays(TODAY, 1); TODAY = d; if (parseYmd(TODAY).getDay() === 6) break; }
        session.menu = null; session.rejected.clear(); S.cook = null; delete S.day; S.week = null; draftTried = true;
        ensureMenu(); const ids = menuIds();
        const hits = ids.filter(id => ['karaage', 'sabamiso'].includes(id));
        return {ids, hits, sat: parseYmd(TODAY).getDay()};
    });
    ok(r.hits.length === 1, 'W3g 新しく作る献立に1品だけ入る: ' + r.ids.join() + ' （曜日 ' + r.sat + '）');
    await p.evaluate(() => { session.stage = 'decide'; setTab('today'); render(); });
    const vt = await viewText(p);
    ok(vt.includes('ゆうきの食べたいもの') || r.hits[0] === 'sabamiso', 'W3h 主菜の札「ゆうきの食べたいもの」');
    ok(vt.includes('ゆうきから「週末でいい」と届いた料理'), 'W3i なぜこの料理かの1行');
    // まるごと入れ替えでは、同じ日にまた戻ってこない
    const again = await p.evaluate(first => { const out = []; for (let i = 0; i < 4; i++){ newMenu(); out.push(menuIds().filter(id => ['karaage', 'sabamiso'].includes(id))); } return {first, out}; }, r.hits[0]);
    ok(again.out.every(x => x.length <= 1 && !x.includes(again.first)) && again.out.slice(1).every(x => !x.length), 'W3j まるごと入れ替えで同じ日に同じ料理がまた入らない（1回の献立に1品まで）: ' + JSON.stringify(again));
    await p.evaluate(() => { if (['karaage', 'sabamiso'].includes(menuIds()[0])) setMenuMain(recipeById('hamburg')); keepDraft(); render(); });
    // 「今日に入れる」: 確認 → 入れかえ → 元に戻す
    const before = await p.evaluate(() => menuIds().join());
    await p.evaluate(() => { sheet = {kind: 'wish-list'}; renderSheet(); });
    await p.click('.sheet [data-act="wish-today"][data-id="karaage"]');
    ok((await sheetText(p)).includes('入れかえますか'), 'W3k 今日に入れる前に確かめる');
    await p.click('.sheet [data-act="wish-today-ok"]');
    ok(await p.evaluate(() => menuIds()[0]) === 'karaage', 'W3l 今日に入れると主菜だけ変わる');
    await p.click('[data-act="toast-undo"]');
    ok(await p.evaluate(() => menuIds().join()) === before, 'W3m 元に戻すで前の案に戻る: ' + before + ' → ' + await p.evaluate(() => menuIds().join()));
    // 食卓: 出せた日だけ1行。「作ったよと送る」は押した人だけ
    await p.evaluate(() => { if (menuIds()[0] !== 'karaage') setMenuMain(recipeById('karaage')); keepDraft(); render(); document.querySelector('[data-act="decide"]').click(); });
    await p.waitForTimeout(450);
    await p.evaluate(() => { S.cook.done = {}; cookItems().forEach(x => { S.cook.done[x.r.id] = x.r.steps.map((_, i) => i); }); S.cook.shopOK = true; session.stage = 'table'; setTab('today'); render(); });
    const tt = await viewText(p);
    ok(tt.includes('ゆうきの食べたいもの、今日出せました'), 'W3n 食卓に「ゆうきの食べたいもの、今日出せました。」: ' + tt.slice(0, 80));
    ok(await p.evaluate(() => !!document.querySelector('[data-act="wish-made"]')), 'W3o 「作ったよと送る」がある（押したときだけ送る）');
    await p.click('[data-act="wish-made"]');
    ok((await p.evaluate(() => document.querySelector('#share-text').value)).includes('今日作りました'), 'W3p 作ったよの文');
    await ctx.close();
}

// ---- W4 苦手・アレルギーに当たる料理は候補にならない ----
{
    const fam = [{id: 'f1', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}, {id: 'f2', name: 'そら', role: 'child', avoid: ['えび'], allergy: ['えび'], sometimes: true}];
    const L = linkOf({v: 1, k: 'w', n: 'ゆうき', d: ['ebifry', 'nikujaga'], t: '20261028'});
    const {p, ctx} = await open({family: fam}, hashOf(L));
    ok(await sheetKind(p) === 'wish-in', 'W4a 起動時に届いたリンクを開く');
    const st = await sheetText(p);
    ok(/えび.*候補には入れません|合わないので候補に入れていません/.test(st), 'W4b 「えびが入るので、候補には入れません」と知らせる（ときどき一緒に食べる家族の分も）: ' + st.slice(0, 120));
    await p.click('[data-act="wish-accept"]');
    ok(await p.evaluate(() => S.wants.map(w => w.id).join()) === 'nikujaga', 'W4c アレルギーに当たる料理は受けとらない: ' + await p.evaluate(() => S.wants.map(w => w.id).join()));
    // 何度献立を作っても、えびの料理は出ない。肉じゃがは入る
    const r = await p.evaluate(() => { S.cook = null; let ebi = 0, nj = 0; for (let i = 0; i < 20; i++){ session.wishT = null; session.menu = null; newMenu(); const ids = menuIds(); if (ids.includes('ebifry')) ebi++; if (ids.includes('nikujaga')) nj++; } return {ebi, nj}; });
    ok(r.ebi === 0, 'W4d アレルギーの料理は献立に入らない');
    ok(r.nj >= 15, 'W4e 合う料理は候補に入る: ' + r.nj + '/20');
    // あとから家族にアレルギー（じゃがいも）を足すと、届いていた肉じゃがも候補から外れる
    const r2 = await p.evaluate(() => { S.family[0].avoid = ['じゃがいも']; S.family[0].allergy = ['じゃがいも']; save(); let nj = 0; for (let i = 0; i < 10; i++){ session.wishT = null; session.menu = null; newMenu(); if (menuIds().includes('nikujaga')) nj++; } return {nj, active: wishesActive().length, why: wishBlockWhy(recipeById('nikujaga'))}; });
    ok(r2.nj === 0 && r2.active === 0, 'W4f あとからアレルギーを足すと、届いていた料理も候補にしない: ' + JSON.stringify(r2));
    ok(r2.why.includes('じゃがいも'), 'W4g 理由を言える: ' + r2.why);
    await ctx.close();
}

// ---- W5 一人暮らしには出ない ----
{
    const {p, ctx} = await open({family: []});
    for (const st of ['decide', 'shop', 'table']){
        await p.evaluate(s => { session.stage = s; setTab('today'); render(); }, st);
        ok(!(await viewText(p)).includes('食べたい'), 'W5a 今日タブ（' + st + '）に食べたいの入口・言葉がない');
    }
    await p.evaluate(() => { setTab('log'); });
    ok(!(await viewText(p)).includes('食べたいもの'), 'W5b 記録タブに入口がない');
    await p.evaluate(() => { setTab('settings'); });
    ok(await p.evaluate(() => document.querySelectorAll('[data-act="wish-open"]').length) === 1, 'W5c 入口は設定 › 家族の1行だけ');
    // 「これはわたし」だけの家族も一人暮らし
    await p.evaluate(() => { S.family = [{id: 'm', name: 'わたし', role: 'adult', avoid: [], allergy: [], me: true}]; setTab('log'); });
    ok(!(await viewText(p)).includes('食べたいもの'), 'W5d 家族の欄が自分だけなら記録タブに出さない');
    // 家族がいれば記録タブにも入口
    await p.evaluate(() => { S.family.push({id: 'k', name: 'そら', role: 'child', avoid: [], allergy: []}); setTab('log'); });
    ok((await viewText(p)).includes('食べたいものを送る'), 'W5e 家族がいれば記録タブにも入口');
    // 一人暮らしでも、届いたときは受けとる画面が出る
    await p.evaluate(h => { S.family = []; location.hash = h; }, hashOf(linkOf({v: 1, k: 'w', n: '母', d: ['nikujaga'], t: '20261028'})));
    await p.waitForTimeout(300);
    ok(await sheetKind(p) === 'wish-in', 'W5f 一人暮らしでも、届いたときだけ受けとる画面が出る');
    await ctx.close();
}

// ---- W6 こわれたリンク・長すぎるリンクで落ちない ----
{
    const {p, ctx} = await open({family: FAM2});
    const cases = [
        ['こわれた文字', '#g=@@@!!', 'wish-bad'],
        ['空', '#g=', 'wish-bad'],
        ['途中で切れた', hashOf(link).slice(0, 30), 'wish-bad'],
        ['長すぎる', '#g=' + 'A'.repeat(5000), 'wish-bad'],
        ['JSON でない', '#g=' + b64u('hello'), 'wish-bad'],
        ['UTF-8 でない', '#g=' + Buffer.from([0xff, 0xfe, 0xfd]).toString('base64').replace(/=+$/, ''), 'wish-bad'],
        ['形がちがう', hashOf(linkOf({v: 1, k: 'w', n: 'x', d: 'karaage'})), 'wish-bad'],
        ['版がちがう', hashOf(linkOf({v: 9, k: 'w', d: ['karaage']})), 'wish-bad'],
        ['種類がちがう', hashOf(linkOf({v: 1, k: 'zz', d: ['karaage']})), 'wish-bad'],
        ['配列', hashOf(linkOf([1, 2, 3])), 'wish-bad'],
        ['知らない料理だけ', hashOf(linkOf({v: 1, k: 'w', d: ['no_such_dish', 'a~karaage~x~y~z', '../etc']})), 'wish-in'],
    ];
    for (const [name, h, want] of cases){
        await p.evaluate(() => { if (sheet) closeSheet(); });
        await p.evaluate(h => { location.hash = h; }, h);
        await p.waitForTimeout(250);
        ok(await sheetKind(p) === want, 'W6 ' + name + ' → ' + want + ': ' + await sheetKind(p));
    }
    ok((await sheetText(p)).includes('読める料理がありませんでした'), 'W6b 知らない料理は捨てる（受けとるボタンなし）');
    ok(await p.evaluate(() => !document.querySelector('[data-act="wish-accept"]')), 'W6c 読める料理がなければ受けとれない');
    // 名前にタグ・見えない文字・長い名前 → 文字として出すだけ・10文字まで
    await p.evaluate(() => closeSheet());
    await p.evaluate(h => { location.hash = h; }, hashOf(linkOf({v: 1, k: 'w', n: '<img src=x onerror=window.__x=1>‮あいうえおかきくけこさしす', d: ['karaage', 'karaage', 'nikujaga', 'hamburg', 'sabamiso'], m: 7, t: '20261399'})));
    await p.waitForTimeout(300);
    const s = await p.evaluate(() => ({n: sheet.p.n, ids: sheet.p.ids, m: sheet.p.m, t: sheet.p.t, img: !!document.querySelector('.sheet img[src="x"]'), x: window.__x}));
    ok(!s.img && !s.x && !/[<>‮]/.test(s.n) && [...s.n].length <= 10, 'W6d 名前は文字として出すだけ・10文字まで: ' + s.n);
    ok(s.ids.join() === 'karaage,nikujaga,hamburg' && s.m === null && s.t === '', 'W6e 料理は重なりを除いて3つまで・ひとことと日付は正しい値だけ: ' + JSON.stringify(s));
    await p.evaluate(() => closeSheet());
    // 貼りつけ（設定 › 家族 › 届いたものを貼りつける）
    await p.evaluate(() => { setTab('settings'); });
    await p.click('#set-family [data-act="wish-paste-open"]');
    await p.fill('#wish-paste', 'ちがう文です');
    await p.click('.wsh-paste [type="submit"]');
    ok(await sheetKind(p) === 'wish-bad', 'W6f 貼りつけた文にリンクがなければ、読めないと出す');
    await p.evaluate(() => { sheet = {kind: 'wish-paste'}; renderSheet(); });
    await p.fill('#wish-paste', '【ご飯帖】母の食べたいもの：肉じゃが\nご飯帖で開く → ' + linkOf({v: 1, k: 'w', n: '母', d: ['nikujaga'], t: '20261028'}));
    await p.click('.wsh-paste [type="submit"]');
    ok(await sheetKind(p) === 'wish-in' && (await sheetText(p)).includes('肉じゃが'), 'W6g 届いた文を貼りつけて読める');
    // こわれた保存データ（S.wants の形がちがう）でも起動する
    const {p: p2, ctx: c2} = await open({family: FAM2, wants: [{id: 'karaage', at: '2026-99-99'}, 'x', null, {id: '<b>', at: '2026-10-28'}, {id: 'nikujaga', at: new Date().toISOString().slice(0, 10), n: 123, m: 'a'}], wantSeen: [1, 'ok1', {}]});
    const w2 = await p2.evaluate(() => ({w: S.wants.map(x => x.id + ':' + x.n + ':' + x.m).join(), s: S.wantSeen.join(), v: !!document.querySelector('#view > *')}));
    ok(w2.v && w2.w === 'nikujaga::null' && w2.s === 'ok1', 'W6h 形のちがう保存データでも起動して、使える分だけ残す: ' + JSON.stringify(w2));
    await c2.close();
    await ctx.close();
}

await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
