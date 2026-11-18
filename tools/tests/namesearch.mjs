#!/usr/bin/env node
// 料理名から（オーナーの指示 11/17）: 下のタブに「料理名から」（材料から と 調理道具 のあいだ）。料理の名前で 21の国・地域から
//   1段目「その料理」・2段目「世界の似た料理」・3段目「ひとひねり」を出す
//  使い方: node tools/tests/namesearch.mjs [http://localhost:9331/]
//  N1 カレーで、日本の料理（カレーライス）と海外の料理（インドなど）が1段目に、2段目にほかの国の似た料理が出る。いまの国の料理が先
//     カレー／かれー／curry／咖喱 のどれでも、カレーライスに当たる。ハンバーグ・味噌汁でも3段が出る。カードを押すと作り方が開く
//     当たらない名前には案内文（材料からのタブへ）。決めた献立は変わらない
//  N2 アレルギー（小麦・えび）・食の決まり（ハラール・ヴィーガン）: 当たる料理は3段のどこにも出ない。出さなかった数を言う。ひとひねり案も当たらない
//  N3 狭い幅（195〜390px）: 8つ（ひとひねりあり）・7つ（ひとひねりが隠れる: 英語・アメリカ）のどちらでも、どのタブも画面に入り、押せる（真ん中を押すとそのタブ）。
//     字が枠からはみ出さない。横にスクロールしない
//  N2b 辛いのが苦手（家族全員）: 3段とひとひねりのタブに、辛い材料（唐辛子・コチュジャンなど。テスト側の言葉で見る）を使う料理・案が出ない
//  N5 読みこみ: タブを開いただけでは20か国を読まない。最初にさがしたときに読む。読み終えて足すとき、もう出ているカードの並びは動かさず、
//     足す分は下の「ほかの国からも見つかりました」に入る
//  N6 入力の整え: NFKC（か＋濁点の2文字）・幅のない空白・制御文字を取りのぞく。入力欄は40字まで。「見つかりませんでした」の語も40字まで
//  N7 4Mbps で読みこみの途中にさがしても、出ていたカード（3段とも）の位置は読み終えたあとも変わらない（2段目・3段目は読み終えてから出す）
//  N8 返事が来ない国がある・1.5Mbps でも、3段目はすぐ、2段目は最長3秒ほどで読めた国の分だけで出て、出ていたカードは1pxも動かない
//  N9 別の呼び方（ムサカ・hamburger・lasagne など）でも当たる（R220）・N10 幅195×422 で最初の画面に1件目のカードが見える（R221）・N11 ドイツ語の短い名前（R222）
//  N12 読みこみのあいだ、出ているカードを作り直さない・画面全体の描き直しがない。途中でほかのタブへ移っても、そのタブに影響しない
//  N13 ほかの国がすべて止まり、当たる料理がないとき、読みこみ中（3秒まで）は「見つかりませんでした」と言わない（R225）・N14 かっこつきの長い名前をそのまま／外だけ／中だけで入れても出る（R220 の続き）
//  N15 止まっていた国があとから届いたら、「見つかりませんでした」をやめて一覧を出し直す（R225 の続き）
//  N1k 検索欄（料理名から・材料から）の × は灰色（青を使わない）
//  N4 18言語: 「料理名から」の名前が訳されていて、幅 195・260・320・390 で、タブの字（長い名前か短い名前）が切れない。画面の見出しもはみ出さない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const ALL_LANGS = ['ja', ...fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''))];
const LANGS = process.env.LANGS ? process.env.LANGS.split(',') : ALL_LANGS;
const FAM0 = {id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: []};

const b = await chromium.launch(LAUNCH);
const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: 844}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: Object.assign({country: o.cc || 'JP', uiLang: o.lg || 'ja', dishCount: 3, servings: 2}, o.settings || {}), family: o.family || [FAM0]});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push((o.lg || 'ja') + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    return {p, ctx};
};
// 料理名からのタブを開き、ほかの国を読みこみ終えるまで待つ
// （ほかの国は、タブを開いたときではなく最初にさがしたときに読む。ask が読み終えるまで待つ）
const openTab = async p => {
    await p.click('nav.tabs button[data-tab="name"]');
    await p.waitForFunction(() => tab === 'name' && document.querySelector('#ns-input'), null, {timeout: 30000});
};
const loaded = p => p.waitForFunction(() => !nsLoading && COUNTRIES.every(c => c.cc === currentCountry() || BROWSE[c.cc] || browseErr.has(c.cc)), null, {timeout: 90000});
// 入力欄に入れて、結果の3段を読む（カードの料理の id・国）
const ask = async (p, q) => {
    await p.fill('#ns-input', q);
    await p.waitForFunction(q => session.nsQ === q.slice(0, 40) && document.querySelector('#ns-results'), q, {timeout: 10000});
    await loaded(p); await p.waitForTimeout(80);
    return p.evaluate(() => {
        // 1段目・2段目には、いちばん下（3段目より下）に足した分もふくめる（最初の検索では、ほかの国の料理は下に出る）
        const sel = {same: '[data-tier="same"] .dcard, [data-of="same-more"] .dcard', world: '[data-tier="world"] .dcard, [data-of="world"] .dcard, [data-of="world-more"] .dcard', twist: '[data-tier="twist"] .dcard'};
        const tier = k => [...document.querySelectorAll(sel[k].split(', ').map(x => '#ns-results ' + x + ' .head[data-act="open"]').join(', '))].map(e => { const r = byId(e.dataset.id); return {id: e.dataset.id, cc: r ? (r.pack || 'JP') : '?', name: e.textContent.trim(), alg: r ? allergyConflict(r) : null, av: r ? isAvoided(r) : null, twAv: r && String(r.id).startsWith('a~') ? twistAvoided(r) : null}; });
        const none = document.querySelector('#ns-results .ns-none');
        return {same: tier('same'), world: tier('world'), twist: tier('twist'), none: none ? none.innerText : '', hid: (document.querySelector('#ns-results .ns-hid') || {}).innerText || '', heads: [...document.querySelectorAll('#ns-results .ns-tier h3')].map(e => e.textContent)};
    });
};

// ---- N1 カレー・ハンバーグ・味噌汁（日本・日本語） ----
{
    const {p, ctx} = await open();
    const order = await p.evaluate(() => [...document.querySelectorAll('nav.tabs button[data-tab]')].map(b => b.dataset.tab));
    ok(order.indexOf('name') === order.indexOf('fridge') + 1 && order.indexOf('tools') === order.indexOf('name') + 1, 'N1a 「料理名から」は「材料から」と「調理道具」のあいだ: ' + order.join(','));
    ok(await p.evaluate(() => document.querySelector('nav.tabs button[data-tab="name"] .tl').textContent) === '料理名から', 'N1a タブの名前は「料理名から」');
    // 決めた献立（作り方）を先に決めておき、さがしても変わらないことを確かめる
    await p.click('button[data-act=decide]').catch(() => {}); await p.waitForTimeout(400);
    const menu0 = await p.evaluate(() => JSON.stringify([S.cook && S.cook.ids, session.menu && session.menu.items.map(x => x.r && x.r.id)]));
    ok(await p.evaluate(() => !!(S.cook && S.cook.ids && S.cook.ids.length)), 'N1j 先に献立を決めておく');
    await openTab(p);
    const cur = await ask(p, 'カレー');
    ok(cur.heads.includes('その料理') && cur.heads.includes('世界の似た料理') && cur.heads.includes('ひとひねり'), 'N1b カレー: 3段の見出し（その料理・世界の似た料理・ひとひねり）: ' + cur.heads.join('/'));
    ok(cur.same.some(x => x.id === 'curry') && cur.same.some(x => x.cc === 'JP') && cur.same.some(x => x.cc !== 'JP'), 'N1b カレー: 1段目に日本（カレーライス）と海外の料理: ' + cur.same.map(x => x.cc + ':' + x.name).slice(0, 12).join(' / '));
    const firstForeign = cur.same.findIndex(x => x.cc !== 'JP'), lastJP = cur.same.map(x => x.cc).lastIndexOf('JP');
    ok(lastJP < firstForeign, 'N1b いまの国（日本）の料理が先');
    ok(cur.same.some(x => x.cc === 'IN'), 'N1b 海外の料理にインドのカレーがある');
    ok(cur.world.length >= 3 && cur.world.every(x => x.cc !== 'JP') && new Set(cur.world.map(x => x.cc)).size >= 2, 'N1c 2段目は海外の似た料理（2か国以上）: ' + cur.world.map(x => x.cc + ':' + x.name).join(' / '));
    ok(cur.world.every(x => !cur.same.some(y => y.id === x.id)), 'N1c 2段目に1段目と同じ料理を出さない');
    const why = await p.evaluate(() => [...document.querySelectorAll('#ns-results .ns-tier[data-tier="world"] .dc-note, #ns-results [data-of="world"] .dc-note, #ns-results [data-of="world-more"] .dc-note')].map(e => e.textContent));
    ok(why.length && why.every(x => x.startsWith('似ているところ: ')), 'N1c 2段目に似ているところ（データから）: ' + why.slice(0, 3).join(' / '));
    ok(cur.twist.length >= 1 && cur.twist.every(x => x.id.startsWith('a~')), 'N1d 3段目はその料理のひとひねり案: ' + cur.twist.map(x => x.name).join(' / '));
    for (const q of ['かれー', 'curry', '咖喱', 'カリー', 'CURRY']){
        const r = await ask(p, q);
        ok(r.same.some(x => x.id === 'curry'), `N1e 「${q}」でもカレーライスに当たる`);
    }
    const hb = await ask(p, 'ハンバーグ');
    ok(hb.same.some(x => x.id === 'hamburg') && hb.world.length >= 2, 'N1f ハンバーグ: 1段目にハンバーグ、2段目に海外の似た料理: ' + hb.world.map(x => x.cc + ':' + x.name).join(' / '));
    const ms = await ask(p, '味噌汁');
    ok(ms.same.length >= 3 && ms.same.every(x => x.cc === 'JP' || /みそ|味噌/.test(x.name)) && ms.world.some(x => x.cc === 'KR'), 'N1g 味噌汁: 1段目に味噌汁、2段目に韓国のみその汁もの: ' + ms.world.map(x => x.cc + ':' + x.name).join(' / '));
    const ms2 = await ask(p, 'みそしる');
    ok(ms2.same.length === ms.same.length, 'N1g みそしる（ひらがな）でも同じ数: ' + ms2.same.length + '/' + ms.same.length);
    const en = await ask(p, 'hamburg');
    ok(en.same.some(x => x.id === 'hamburg'), 'N1g hamburg（英語）でもハンバーグに当たる');
    const no = await ask(p, 'ぺけぽんたす');
    ok(no.same.length === 0 && /見つかりませんでした/.test(no.none) && /材料から/.test(no.none), 'N1h 当たらない名前には案内文: ' + no.none);
    // カードを押すと作り方が開く（1段目・2段目・3段目）
    for (const k of ['same', 'world', 'twist']){
        await ask(p, 'カレー');
        const id = await p.evaluate(k => { const e = document.querySelector(`#ns-results .ns-tier[data-tier="${k}"] .dcard .head[data-act="open"]`); return e && e.dataset.id; }, k);
        await p.click(`#ns-results .ns-tier[data-tier="${k}"] .dcard .head[data-act="open"]`);
        await p.waitForTimeout(400);
        const opened = await p.evaluate(() => { const m = document.querySelector('#modal-root'); return m ? m.innerText.length : 0; });
        ok(id && opened > 50, `N1i ${k} のカードを押すと作り方が開く`);
        await p.keyboard.press('Escape'); await p.waitForTimeout(300);
        await p.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    }
    // 検索欄の × は青くしない（料理名から・材料から とも灰色）
    const gray = [];
    for (const [tb, id] of [['name', 'ns-input'], ['fridge', 'search-input']]){ await p.evaluate(tb => setTab(tb), tb); await p.waitForTimeout(200); gray.push(await p.evaluate(id => { const e = document.getElementById(id); if (!e) return 'なし'; const rs = []; for (const sh of document.styleSheets){ try{ for (const r of sh.cssRules) if (r.selectorText && r.selectorText.split(',').some(x => x.trim() === '#' + id + '::-webkit-search-cancel-button')) rs.push(r.style.filter); }catch(_){} } return id + ':' + (rs.join('|') || 'なし'); }, id)); }
    ok(gray.every(f => /grayscale\(1\)/.test(f)), 'N1k 検索欄（料理名から・材料から）の × は灰色: ' + gray.join(' / '));
    await p.evaluate(() => setTab('name'));
    const menu1 = await p.evaluate(() => JSON.stringify([S.cook && S.cook.ids, session.menu && session.menu.items.map(x => x.r && x.r.id)])).catch(() => null);
    ok(menu0 === menu1, 'N1j さがしても、決めた献立・今日の献立は変わらない');
    await ctx.close();
}

// ---- N2 アレルギー・食の決まり ----
{
    const cases = [
        ['小麦アレルギー', {}, {allergens: ['wheat']}, ['カレー', 'ハンバーグ', 'ラーメン'], true],
        ['えびアレルギー', {}, {allergens: ['shrimp']}, ['カレー', 'えび', '天ぷら'], true],
        ['ハラール', {avoid: ['@pork', '@alcohol'], allergy: []}, {}, ['カレー', 'とんかつ', '味噌汁'], false],
        ['ヴィーガン', {avoid: ['@pork', '@chicken', '@beef', '@fish', '@shellfish', '@egg', '@dairy'], allergy: []}, {}, ['カレー', 'ハンバーグ', '味噌汁'], false],
    ];
    for (const [nm, f, st, qs, alg] of cases){
        const {p, ctx} = await open({family: [Object.assign({}, FAM0, f)], settings: st});
        await openTab(p);
        let shown = 0, bad = [], hidN = 0;
        for (const q of qs){
            const r = await ask(p, q);
            const all = [...r.same, ...r.world, ...r.twist];
            shown += all.length;
            all.forEach(x => { if (x.av || (alg && x.alg) || x.twAv) bad.push(q + ':' + x.cc + ':' + x.name); });
            if (r.hid) hidN++;
        }
        ok(bad.length === 0, `N2 ${nm}: 当たる料理は3段のどこにも出ない: ` + bad.slice(0, 5).join(' / '));
        ok(hidN >= 1, `N2 ${nm}: 出さなかった料理の数を言う`);
        ok(shown > 0, `N2 ${nm}: 当たらない料理は出る（${shown}品）`);
        await ctx.close();
    }
    // 小麦アレルギーでは、カレーライス（ルウ）を出さない
    const {p, ctx} = await open({settings: {allergens: ['wheat']}});
    await openTab(p);
    const r = await ask(p, 'カレー');
    ok(!r.same.some(x => x.id === 'curry') && /アレルギー/.test(r.hid), 'N2 小麦アレルギー: カレーライスは出さず、アレルギーで出していないと言う: ' + r.hid);
    await ctx.close();
}

// ---- N2b 辛いのが苦手（アプリの判定とは別に、材料・調味料・名前の言葉で見る） ----
{
    const SPICY = /辛|唐辛子|一味|七味|豆板醤|コチュジャン|ラー油|チリ|タバスコ|ハリッサ|chili|chilli|cayenne|sriracha|gochujang|gochugaru|harissa|jalape|habanero|sambal|tabasco|ピリ辛|激辛/i;
    const txtOf = 'r => [...(r.items || []).filter(i => !i.opt).map(i => [i.name, i.key, i.en, i.label].join(" ")), String(r.seasBase != null ? r.seasBase : r.seas || ""), r.name, r.nameEn || ""].join(" | ")';
    const {p, ctx} = await open({family: [Object.assign({}, FAM0, {mild: true})]});
    await openTab(p);
    const bad = []; let shown = 0, tw = 0;
    for (const q of ['カレー', 'ハンバーグ', '味噌汁', '麻婆', 'チゲ', 'キムチ', 'ラーメン', '焼きそば', 'curry']){
        await ask(p, q);
        const r = await p.evaluate(([src, txtOf]) => { const re = new RegExp(src, 'i'), tx = eval(txtOf); return [...document.querySelectorAll('#ns-results .dcard .head[data-act="open"]')].map(e => { const r = byId(e.dataset.id); return {id: e.dataset.id, name: r && r.name, hit: r ? (tx(r).match(re) || [''])[0] : 'なし'}; }); }, [SPICY.source, txtOf]);
        shown += r.length; tw += r.filter(x => x.id.startsWith('a~')).length;
        r.filter(x => x.hit).forEach(x => bad.push(`${q}: ${x.name}（${x.hit}）`));
    }
    ok(bad.length === 0 && shown > 0, `N2b 辛いのが苦手: 3段に辛い材料の料理・案が出ない（${shown}品・ひとひねり${tw}）: ` + bad.slice(0, 6).join(' / '));
    // ひとひねりのタブでも出ない（おまかせ・味の方向をいろいろ変えて 30回）
    const bad2 = await p.evaluate(([src, txtOf]) => { const re = new RegExp(src, 'i'), tx = eval(txtOf), out = [];
        for (let i = 0; i < 30; i++){ const fl = ['any', ...Object.keys(FLAVORS)][i % (Object.keys(FLAVORS).length + 1)]; generateTwists({level: 1 + i % 3, flavor: fl, count: 3}).forEach(t => { const m = tx(t).match(re); if (m) out.push(t.name + '（' + m[0] + '）'); }); }
        return out; }, [SPICY.source, txtOf]);
    ok(bad2.length === 0, 'N2b 辛いのが苦手: ひとひねりのタブの案にも辛い材料が出ない: ' + [...new Set(bad2)].slice(0, 6).join(' / '));
    await ctx.close();
}

// ---- N5 読みこみ（タブを開いただけでは読まない・足す分は下に） ----
{
    const {p, ctx} = await open();
    await ctx.route(/\/packs\/.*\.js/, async r => { await new Promise(res => setTimeout(res, 2500)); await r.continue(); });
    const k0 = await p.evaluate(() => Object.keys(BROWSE).sort().join());
    await p.click('nav.tabs button[data-tab="name"]'); await p.waitForTimeout(1500);
    const k1 = await p.evaluate(() => [Object.keys(BROWSE).sort().join(), !!nsLoading]);
    ok(k1[0] === k0 && !k1[1], 'N5 タブを開いただけでは、ほかの国を読まない: ' + JSON.stringify([k0, k1]));
    await p.fill('#ns-input', 'カレー');
    await p.waitForFunction(() => session.nsQ === 'カレー' && document.querySelector('#ns-results .ns-tier'), null, {timeout: 10000});
    const before = await p.evaluate(() => [!!nsLoading, [...document.querySelectorAll('#ns-results .ns-tier[data-tier="same"] > .dlist:not(.ns-extra) .head[data-act="open"]')].map(e => e.dataset.id)]);
    ok(before[0] && before[1].length > 0, 'N5 さがすと読みはじめる（読んでいるあいだも、いまの国の料理はすぐ出る）: ' + before[1].join(','));
    await loaded(p); await p.waitForTimeout(200);
    const after = await p.evaluate(() => ({base: [...document.querySelectorAll('#ns-results .ns-tier[data-tier="same"] > .dlist:not(.ns-extra) .head[data-act="open"]')].map(e => e.dataset.id),
        extra: [...document.querySelectorAll('#ns-results .ns-tier[data-tier="more"] [data-of="same-more"] .head[data-act="open"]')].map(e => e.dataset.id), more: [...document.querySelectorAll('#ns-results .ns-more')].map(e => e.textContent.trim())}));
    ok(JSON.stringify(after.base) === JSON.stringify(before[1]), 'N5 読み終えても、もう出ているカードの並びは動かない: ' + JSON.stringify([before[1], after.base]));
    ok(after.extra.length > 0 && after.more.includes('ほかの国からも見つかりました') && after.extra.every(id => /^[a-z]{2}_/.test(id)), 'N5 足す分は下の「ほかの国からも見つかりました」に入る（ほかの国の料理）: ' + after.extra.slice(0, 6).join(','));
    await ctx.close();
}
// ---- N7 読みこみの途中でさがしても、出ているカード（3段とも）の位置が読み終えたあとに変わらない（北条 keep.cjs・4Mbps） ----
for (const q of ['カレー', 'スープ', 'curry']){
    const {p, ctx} = await open();
    const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 1024 * 1024 / 8});
    await openTab(p);
    await p.fill('#ns-input', q); await p.press('#ns-input', 'Enter'); await p.waitForTimeout(400);
    const pos = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ns-results .dcard .head[data-act="open"]')].map(e => [e.closest('.ns-tier').dataset.tier + ':' + e.dataset.id, Math.round(e.getBoundingClientRect().top + scrollY)])));
    const a = await pos(), wasLoading = await p.evaluate(() => !!nsLoading);
    await loaded(p); await p.waitForTimeout(300);
    const z = await pos();
    const moved = Object.keys(a).filter(k => z[k] !== a[k]).map(k => k + ' ' + a[k] + '→' + z[k]);
    const tiersA = [...new Set(Object.keys(a).map(k => k.split(':')[0]))], tiersZ = [...new Set(Object.keys(z).map(k => k.split(':')[0]))];
    ok(wasLoading && Object.keys(a).length > 0 && moved.length === 0, `N7 「${q}」: 読みこみの途中で出ていたカード（${Object.keys(a).length}枚・${tiersA.join('/')}）は、読み終えても位置が変わらない: ` + moved.slice(0, 4).join(' / '));
    ok(tiersZ.includes('twist') && (tiersZ.includes('world') || tiersZ.includes('more')), `N7 「${q}」: 読み終えたら2段目（3段目より下のこともある）・3段目も出る: ` + tiersZ.join('/'));
    ok(tiersA.includes('twist'), `N7 「${q}」: 3段目（ひとひねり）は読みこみを待たずに出る: ` + tiersA.join('/'));
    await ctx.close();
}
// ---- N8 返事が来ない国がある・遅い回線（北条 nsfail.cjs）: 3段目はすぐ・2段目は最長3秒で読めた国の分だけ・出ていたカードは1pxも動かない ----
{
    const CASES = [
        ['1か国の返事が来ない（タイ）', async ctx => ctx.route(/\/packs\/th\.js/, () => {}), null],
        ['3か国の返事が来ない（タイ・インド・トルコ）', async ctx => ctx.route(/\/packs\/(th|in|tr)\.js/, () => {}), null],
        ['すべての国の返事が来ない', async ctx => ctx.route(/\/packs\/(?!i18n)[a-z]{2}\.js/, () => {}), null],
        ['1.5Mbps', null, 1.5],
        ['1.5Mbps で1か国の返事が来ない（インド）', async ctx => ctx.route(/\/packs\/in\.js/, () => {}), 1.5],
    ];
    for (const [nm, setup, mbps] of CASES){
        const {p, ctx} = await open();
        if (setup) await setup(ctx);
        if (mbps){ const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 200, downloadThroughput: mbps * 1024 * 1024 / 8, uploadThroughput: 512 * 1024 / 8}); }
        await openTab(p);
        const t0 = Date.now();
        await p.fill('#ns-input', 'カレー'); await p.press('#ns-input', 'Enter');
        const pos = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ns-results .dcard .head[data-act="open"]')].map(e => [e.closest('.ns-tier').dataset.tier + ':' + e.dataset.id, Math.round(e.getBoundingClientRect().top + scrollY)])));
        const st = () => p.evaluate(() => ({twist: document.querySelectorAll('#ns-results [data-tier="twist"] .dcard').length, wcards: document.querySelectorAll('#ns-results [data-tier="world"] .dcard, #ns-results [data-of="world"] .dcard').length, wstat: (document.querySelector('#ns-results .ns-wstat') || {}).textContent || ''}));
        await p.waitForTimeout(600);
        const s1 = await st(), snaps = [await pos()];
        // 3.6秒までに2段目（料理か「似た料理は見つかりませんでした」）
        let s2 = null, tW = null;
        for (let i = 0; i < 20; i++){ s2 = await st(); if (s2.wcards || /見つかりませんでした|下に出しています/.test(s2.wstat)){ tW = Date.now() - t0; break; } await p.waitForTimeout(200); snaps.push(await pos()); }
        snaps.push(await pos());
        // そのあと（遅れて届く国）も8秒みる
        for (let i = 0; i < 8; i++){ await p.waitForTimeout(1000); snaps.push(await pos()); }
        const moved = [];
        snaps.forEach((sn, k) => { if (!k) return; for (const key in sn){ for (let j = 0; j < k; j++){ if (key in snaps[j] && snaps[j][key] !== sn[key]){ moved.push(`${key} ${snaps[j][key]}→${sn[key]}`); break; } } } });
        ok(s1.twist > 0, `N8 ${nm}: 3段目（ひとひねり）は待たずに出る（0.6秒）: ` + JSON.stringify(s1));
        ok(tW !== null && tW <= 4200, `N8 ${nm}: 2段目は最長3秒ほどで出る（${tW}ms）: ` + JSON.stringify(s2));
        ok(!moved.length, `N8 ${nm}: 出ていたカードは1pxも動かない: ` + [...new Set(moved)].slice(0, 4).join(' / '));
        await ctx.close();
    }
}

// ---- N9 呼び名の言いかえ（第51回 R220） ----
{
    const {p, ctx} = await open();
    await openTab(p);
    const bad = [];
    for (const q of ['ムサカ', 'hamburger', 'lasagne', 'Lasagne', 'スパゲティ', 'ピッツァ', 'aubergine', 'yoghurt', 'パエリャ', 'chilli con carne', 'borscht', 'ケバップ', 'courgette']){
        const r = await ask(p, q);
        if (!r.same.length) bad.push(q + ': 0品');
    }
    ok(bad.length === 0, 'N9 別の呼び方・英米のつづり・カタカナのゆれでも当たる: ' + bad.join(' / '));
    const hb = await ask(p, 'hamburger');
    ok(hb.same.some(x => /burger/i.test(x.id + x.name) && x.cc !== 'JP') && hb.same.some(x => x.id === 'hamburg'), 'N9 hamburger で、ハンバーガー（海外）とハンバーグ（日本）の両方に当たる: ' + hb.same.slice(0, 6).map(x => x.cc + ':' + x.name).join(' / '));
    const ms = await ask(p, 'ムサカ');
    ok(ms.same.some(x => /musakka|moussaka|ムサカ/i.test(x.id + x.name)), 'N9 ムサカで、トルコのムサカに当たる: ' + ms.same.map(x => x.cc + ':' + x.name).join(' / '));
    await ctx.close();
}
// ---- N10 幅195px でも、最初の画面に1件目のカードが見える（第51回 R221） ----
for (const [lg, ts, min] of [['ja', 0, 40], ['de', 0, 40], ['ja', 1, 40], ['ar', 0, 40], ['ja', 2, 1]]){
    const {p, ctx} = await open({lg, w: 195, settings: {textSize: ts || undefined}});
    await p.setViewportSize({width: 195, height: 422});
    await p.click('nav.tabs button[data-tab="name"]');
    await p.fill('#ns-input', 'カレー'); await p.press('#ns-input', 'Enter'); await loaded(p); await p.waitForTimeout(300);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const c = document.querySelector('#ns-results .dcard'), nav = document.querySelector('nav.tabs').getBoundingClientRect(), q = c && c.getBoundingClientRect(); return {vis: q ? Math.round(Math.min(q.bottom, nav.top) - q.top) : -1, input: !!document.querySelector('#ns-input').getBoundingClientRect().width}; });
    ok(r.vis >= min && r.input, `N10 195×422 ${lg} 文字${ts}: 最初の画面に1件目のカードが ${min}px 以上見える: ` + JSON.stringify(r));
    await ctx.close();
}
// ---- N11 ドイツ語の下のタブの短い名前が、何のタブかわかる語（第51回 R222） ----
{
    const {p, ctx} = await open({lg: 'de', w: 195});
    await p.setViewportSize({width: 195, height: 422}); await p.waitForTimeout(300);
    const r = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])')].map(b => [b.dataset.tab, (b.querySelector('.tsn') || {}).textContent])));
    ok(r.name && r.log && !/^(Name|Log)$/.test(r.name) && !/^(Name|Log)$/.test(r.log), 'N11 ドイツ語の短い名前は「Name」「Log」ではない: ' + JSON.stringify(r));
    await ctx.close();
}

// ---- N12 読みこみのあいだ、出ているカードを作り直さない（描き直しは変わったところだけ）・ほかのタブに影響しない ----
for (const [nm, setup, mbps] of [['ふつう', null, null], ['1か国の返事が来ない（タイ）', async ctx => ctx.route(/\/packs\/th\.js/, () => {}), null], ['1.5Mbps', null, 1.5]]){
    const {p, ctx} = await open();
    if (setup) await setup(ctx);
    if (mbps){ const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 200, downloadThroughput: mbps * 1024 * 1024 / 8, uploadThroughput: 512 * 1024 / 8}); }
    await openTab(p);
    await p.evaluate(() => { window.__rm = []; window.__rn = 0; const r0 = window.render; window.render = function(...a){ if (tab === 'name') window.__rn++; return r0.apply(this, a); };
        new MutationObserver(ms => ms.forEach(m => [...m.removedNodes].forEach(n => { if (n.nodeType === 1 && (n.matches('.dcard, .ns-tier, .list') || n.querySelector('.dcard'))) window.__rm.push((n.className || n.tagName) + ''); }))).observe(document.getElementById('view'), {childList: true, subtree: true}); });
    await p.fill('#ns-input', 'カレー'); await p.press('#ns-input', 'Enter');
    await p.waitForTimeout(1200);
    await p.evaluate(() => { window.__rm = []; window.__rn = 0; });   // 最初に描いたあとから数える
    await p.waitForTimeout(mbps ? 12000 : 7000);
    const r = await p.evaluate(() => ({rm: window.__rm, rn: window.__rn, cards: document.querySelectorAll('#ns-results .dcard').length}));
    ok(r.rm.length === 0 && r.rn === 0 && r.cards > 0, `N12 ${nm}: 最初に描いたあと、カードの入れ物を作り直さず（${r.rm.length}）、画面全体の描き直しもない（${r.rn}回）: ` + r.rm.slice(0, 4).join(' / '));
    await ctx.close();
}
// ほかのタブ: 料理名からでさがして、読みこみの途中に「今日」「世界のレシピ」へ移っても、そのタブの画面は作り直されない
for (const other of ['today', 'world']){
    const {p, ctx} = await open();
    await ctx.route(/\/packs\/th\.js/, () => {});
    const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 200, downloadThroughput: 1.5 * 1024 * 1024 / 8, uploadThroughput: 512 * 1024 / 8});
    await openTab(p);
    await p.fill('#ns-input', 'カレー'); await p.press('#ns-input', 'Enter'); await p.waitForTimeout(300);
    await p.click(`nav.tabs button[data-tab="${other}"]`); await p.waitForTimeout(1500);
    await p.evaluate(() => { window.__first = document.querySelector('#view').firstElementChild; window.__ns = 0; const f0 = window.nsPaint; window.nsPaint = function(...a){ window.__ns++; return f0.apply(this, a); }; });
    await p.waitForTimeout(8000);
    const r = await p.evaluate(other => ({tab, same: window.__first === document.querySelector('#view').firstElementChild || other === 'world', ns: !!document.querySelector('#ns-results'), loading: !!nsLoading}), other);
    ok(r.tab === other && !r.ns && r.same, `N12 料理名からの読みこみの途中に「${other}」へ移っても、料理名からの描き直しはそのタブに出ない: ` + JSON.stringify(r));
    await ctx.close();
}

// ---- N13 ほかの国がすべて止まり、いまの国にも当たる料理がないとき、読みこみ中は「見つかりませんでした」と言わない（第52回 R225） ----
{
    const {p, ctx} = await open();
    await ctx.route(/\/packs\/(?!i18n)[a-z]{2}\.js/, () => {});
    await openTab(p);
    await p.fill('#ns-input', 'ラージマ'); await p.press('#ns-input', 'Enter'); await p.waitForTimeout(800);
    const a = await p.evaluate(() => ({wait: !!document.querySelector('#ns-results .ns-wait'), none: !!document.querySelector('#ns-results .ns-none'), loading: !!nsLoading}));
    await p.waitForTimeout(3200);
    const z = await p.evaluate(() => ({wait: !!document.querySelector('#ns-results .ns-wait'), none: !!document.querySelector('#ns-results .ns-none'), load: !!document.querySelector('#ns-results .ns-none .ns-still')}));
    ok(a.loading && a.wait && !a.none, 'N13 読みこみ中（0.8秒）は「読みこみ中」とだけ出し、「見つかりませんでした」は出さない: ' + JSON.stringify(a));
    ok(!z.wait && z.none && z.load, 'N13 3秒の区切りのあとは「見つかりませんでした」に「まだ読みこみ中の国があります」を添える: ' + JSON.stringify(z));
    await ctx.close();
}
// ---- N15 止まっていた国があとから届いたら、「見つかりませんでした」をやめて一覧を出し直す（第53回 R225 の続き）。18言語で添える一言が訳されている ----
{
    const {p, ctx} = await open();
    await ctx.route(/\/packs\/(?!i18n)[a-z]{2}\.js/, async r => { await new Promise(res => setTimeout(res, 5000)); await r.continue(); });
    await openTab(p);
    await p.fill('#ns-input', 'ラージマ'); await p.press('#ns-input', 'Enter'); await p.waitForTimeout(3800);
    const a = await p.evaluate(() => ({none: !!document.querySelector('#ns-results .ns-none'), still: (document.querySelector('#ns-results .ns-still') || {}).textContent || ''}));
    await loaded(p); await p.waitForTimeout(400);
    const z = await p.evaluate(() => ({none: !!document.querySelector('#ns-results .ns-none'), still: !!document.querySelector('#ns-results .ns-still'), cards: [...document.querySelectorAll('#ns-results .dcard .head[data-act="open"]')].map(e => e.dataset.id)}));
    ok(a.none && /まだ読みこみ中の国があります/.test(a.still), 'N15 届く前（3.8秒）: 「見つかりませんでした」と「まだ読みこみ中の国があります」: ' + JSON.stringify(a));
    ok(!z.none && !z.still && z.cards.some(id => id.startsWith('in_')), 'N15 届いたら、一覧を出し直す（インドのラージマが出る）: ' + JSON.stringify(z).slice(0, 200));
    await ctx.close();
    const fs2 = await import('node:fs'), vm2 = await import('node:vm'); const miss = [];
    for (const lg of ALL_LANGS.filter(l => l !== 'ja')){ let d = null; vm2.runInNewContext(fs2.readFileSync(`${ROOT}/i18n/${lg}.js`, 'utf8'), {GOHAN_I18N: (l, o) => { d = o; }, window: {}}); if (!d || !d['まだ読みこみ中の国があります。届いたら、ここに出します']) miss.push(lg); }
    ok(miss.length === 0, 'N15 添える一言は17言語に訳がある: ' + miss.join(','));
}
// ---- N14 画面に出ている長い料理名（かっこつき）を、そのまま・かっこの外だけ・かっこの中だけのどれで入れても、その料理が出る（第52回 R220 の続き） ----
for (const lg of ['ja', 'en']){
    const {p, ctx} = await open({lg});
    await openTab(p);
    const r = await p.evaluate(async () => {
        await Promise.all(COUNTRIES.filter(c => c.cc !== currentCountry()).map(c => loadBrowse(c.cc)));
        const all = COUNTRIES.flatMap(c => c.cc === currentCountry() ? RECIPES : (BROWSE[c.cc] || [])).filter(r => /[（(][^）)]+[）)]/.test(r.name) && !isAvoided(r));
        const miss = {full: [], out: [], in: []};
        const hit = (q, r) => { const x = nsSearch(q); return !!(x && x.hits.some(h => h.id === r.id)); };
        all.forEach(r => { const m = r.name.match(/[（(]([^）)]*)[）)]/), out = r.name.replace(/[（(][^）)]*[）)]/g, '').trim();
            if (!hit(r.name, r)) miss.full.push(r.name); if (out && !hit(out, r)) miss.out.push(r.name); if (m && m[1].trim() && !hit(m[1], r)) miss.in.push(r.name); });
        return {n: all.length, full: miss.full.slice(0, 4), out: miss.out.slice(0, 4), in: miss.in.slice(0, 4), nf: miss.full.length, no: miss.out.length, ni: miss.in.length};
    });
    ok(r.n > 50 && r.nf === 0 && r.no === 0 && r.ni === 0, `N14 ${lg}: かっこつきの名前 ${r.n}品を、そのまま・外だけ・中だけで入れても出る: ` + JSON.stringify(r));
    await ctx.close();
}

// ---- N6 入力の整え ----
{
    const {p, ctx} = await open();
    await openTab(p);
    ok(await p.evaluate(() => document.querySelector('#ns-input').maxLength) === 40, 'N6 入力欄は40字まで（maxlength）');
    for (const [q, id, nm] of [['ハンハ\u3099ーク\u3099', 'hamburg', 'バ・グを濁点の2文字に分けた形'], ['カ\u200Bレ\uFEFFー', 'curry', '幅のない空白'], ['カレ\u0007ー', 'curry', '制御文字'], ['ｶﾚｰ', 'curry', '半角カナ']]){
        const r = await p.evaluate(q => { const x = nsSearch(q); return x ? x.hits.map(r => r.id) : []; }, q);
        ok(r.includes(id), `N6 ${nm}でも当たる（整えてからさがす）: ` + r.slice(0, 3).join(','));
    }
    ok(await p.evaluate(() => nsClean('ガ\u0000ー\u200D') === 'ガー' && nsClean('か\u3099') === 'が' && nsClean('x'.repeat(100)).length === 40), 'N6 nsClean: 制御文字・幅のない空白を取り、か＋濁点は「が」、100字は40字に');
    const long = 'ぺ'.repeat(80);
    await p.evaluate(q => { session.nsQ = q; nsRefresh(); }, long); await loaded(p); await p.waitForTimeout(100);
    const msg = await p.evaluate(() => (document.querySelector('#ns-results .ns-none') || {}).textContent || '');
    const m = msg.match(/「(ぺ*)」/);
    ok(m && m[1].length <= 40, 'N6 「見つかりませんでした」の語は40字まで: ' + (m ? m[1].length : msg.slice(0, 40)));
    await ctx.close();
}

// ---- N3 狭い幅のタブ ----
const tabCheck = p => p.evaluate(() => {
    const nv = document.querySelector('nav.tabs'), bs = [...nv.querySelectorAll('button[data-tab]:not([hidden])')], W = innerWidth, H = innerHeight, bad = [];
    const ico = nv.classList.contains('ico'), off = nv.classList.contains('tsn-off');
    bs.forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.left < -0.5 || r.right > W + 0.5 || r.top < 0 || r.bottom > H + 0.5) bad.push(b.dataset.tab + ':画面の外');
        if (r.width < 44 - 0.5) bad.push(b.dataset.tab + ':幅' + Math.round(r.width));
        const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
        if (!hit || !b.contains(hit)) bad.push(b.dataset.tab + ':押せない');
        const lab = ico ? (off ? null : b.querySelector('.tsn')) : b.querySelector('.tl');
        if (lab){
            const cs = getComputedStyle(lab);
            if (cs.display !== 'none' && cs.visibility !== 'hidden' && (lab.scrollWidth > lab.clientWidth + 1 || lab.scrollHeight > lab.clientHeight + 1)) bad.push(b.dataset.tab + ':字が切れる「' + lab.textContent + '」');
            if (cs.display !== 'none' && lab.getBoundingClientRect().right > r.right + 1) bad.push(b.dataset.tab + ':字がはみ出す');
        }
        if (b.scrollWidth > b.clientWidth + 1) bad.push(b.dataset.tab + ':ボタンからはみ出す');
    });
    if (document.documentElement.scrollWidth > W + 1) bad.push('横スクロール');
    return {n: bs.length, mode: [...nv.classList].filter(c => ['two', 'ico', 'c4', 'lfit', 'tsn2', 'tsn-off'].includes(c)).join('+') || '1段', bad};
});
const WIDTHS = [195, 220, 240, 260, 280, 300, 320, 360, 390];
const rows = [];
for (const [nm, o, n] of [['日本・日本語（8つ）', {}, 8], ['アメリカ・英語（ひとひねりなし 7つ）', {cc: 'US', lg: 'en'}, 7], ['アメリカ・日本語（ひとひねりなし 7つ）', {cc: 'US', lg: 'ja'}, 7]]){
    const {p, ctx} = await open(o);
    await p.click('nav.tabs button[data-tab="name"]');
    const bad = [];
    for (const w of WIDTHS){
        await p.setViewportSize({width: w, height: 700}); await p.waitForTimeout(250);
        const r = await tabCheck(p);
        rows.push(`${nm} ${w}px: ${r.n}つ ${r.mode}${r.bad.length ? ' ✗ ' + r.bad.join(',') : ''}`);
        if (r.n !== n) bad.push(w + ':' + r.n + 'つ');
        bad.push(...r.bad.map(x => w + ':' + x));
        // 料理名からの画面も、狭い幅で横にはみ出さない
        const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (ov > 1) bad.push(w + ':画面が横にはみ出す');
    }
    ok(bad.length === 0, `N3 ${nm}: 195〜390px でタブが崩れない・押せる・字が切れない: ` + bad.slice(0, 8).join(' / '));
    await ctx.close();
}
console.log(rows.join('\n'));

// ---- N4 18言語 ----
{
    const bad = [], names = [];
    for (const lg of LANGS){
        const {p, ctx} = await open({lg});
        const lab = await p.evaluate(() => [document.querySelector('nav.tabs button[data-tab="name"] .tl').textContent, document.querySelector('nav.tabs button[data-tab="name"] .tsn').textContent]);
        names.push(lg + ':' + lab.join('/'));
        if (lg !== 'ja' && (lab[0] === '料理名から' || lab[1] === '料理名' || !lab[0] || !lab[1])) bad.push(lg + ':訳がない');
        await p.click('nav.tabs button[data-tab="name"]');
        for (const w of [195, 260, 320, 390]){
            await p.setViewportSize({width: w, height: 700}); await p.waitForTimeout(250);
            const r = await tabCheck(p);
            bad.push(...r.bad.map(x => `${lg} ${w}:${x}`));
            const head = await p.evaluate(() => [...document.querySelectorAll('#view .ns-sec h2, #view .ns-sec .hint, #view .ns-sec label, #ns-input')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.tagName));
            bad.push(...head.map(x => `${lg} ${w}:見出しがはみ出す ${x}`));
        }
        // 文字を大きくしても（もっと大きい）切れない
        await p.evaluate(() => { document.documentElement.setAttribute('data-ts', '2'); fitTabs(); });
        for (const w of [320, 390]){ await p.setViewportSize({width: w, height: 700}); await p.waitForTimeout(250); const r = await tabCheck(p); bad.push(...r.bad.map(x => `${lg} ${w} 大きい字:${x}`)); }
        await ctx.close();
    }
    console.log(names.join('  '));
    ok(bad.length === 0, `N4 ${LANGS.length}言語: 「料理名から」が訳されていて、195・260・320・390px で字が切れない: ` + bad.slice(0, 10).join(' / '));
}

ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
