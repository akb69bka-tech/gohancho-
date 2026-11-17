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
const openTab = async p => {
    await p.click('nav.tabs button[data-tab="name"]');
    await p.waitForFunction(() => tab === 'name' && document.querySelector('#ns-input') && !nsLoading && COUNTRIES.every(c => c.cc === currentCountry() || BROWSE[c.cc] || browseErr.has(c.cc)), null, {timeout: 60000});
};
// 入力欄に入れて、結果の3段を読む（カードの料理の id・国）
const ask = async (p, q) => {
    await p.fill('#ns-input', q);
    await p.waitForFunction(q => session.nsQ === q && document.querySelector('#ns-results'), q, {timeout: 10000});
    await p.waitForTimeout(80);
    return p.evaluate(() => {
        const tier = k => [...document.querySelectorAll(`#ns-results .ns-tier[data-tier="${k}"] .dcard .head[data-act="open"]`)].map(e => { const r = byId(e.dataset.id); return {id: e.dataset.id, cc: r ? (r.pack || 'JP') : '?', name: e.textContent.trim(), alg: r ? allergyConflict(r) : null, av: r ? isAvoided(r) : null, twAv: r && String(r.id).startsWith('a~') ? twistAvoided(r) : null}; });
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
    const why = await p.evaluate(() => [...document.querySelectorAll('#ns-results .ns-tier[data-tier="world"] .dc-note')].map(e => e.textContent));
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
