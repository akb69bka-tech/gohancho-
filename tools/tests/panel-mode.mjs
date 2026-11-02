#!/usr/bin/env node
// モード（オーナーの案）: 「10分以内」「いちばん簡単」「じっくり」。Playwright。使い方: node tools/tests/panel-mode.mjs [http://localhost:8999/]
//  1. 気分の「時間」の並びに3つのモードがあり、国（JP・US・KR）ごとに、どの席もモードの条件（ゆるめた段階を含む）に合う料理だけ。空の席は作らない
//  2. その国に合う料理が少ないときは、ゆるめた段階を画面に書く（ゆるめていないときは書かない）
//  3. 「かえる」の候補・「まるごと入れ替え」も、モードの条件に合う
//  4. 作り方（決めたあとの手順の画面）と料理の詳細で、モードごとの見え方が出る（10分以内: 手順の帯と分・合計、いちばん簡単: 「これだけ」3行、じっくり: 「ここで待つ」とタイマー）。おまかせでは出ない
//  5. お膳の札（10分・かんたん・じっくり）は、モードのときだけ
//  6. アレルギー・苦手は、どのモードでも守る
//  7. 決めた献立は、モードを変えても変わらない
//  環境変数: BASE, SEED, CCS（既定 JP,US,KR）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const CCS = (process.env.CCS || 'JP,US,KR').split(',').filter(Boolean);
const MODES = ['ten', 'simple', 'slow'];
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
let cur = '';
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ' CCS=' + cur + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (cc, tag) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('mode', cc, tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript((cc) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: 'ja', dishCount: 4, servings: 2}})); } }, cc);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
// 献立の全部の席を、モードの条件（ゆるめた段階を含む）と照らす
const checkMenu = (p, mode, n) => p.evaluate(([mode, n]) => {
    const bad = [], empty = [], strict = {}, relaxed = new Set();
    for (let k = 0; k < n; k++){
        session.mood = mode; session.rejected.clear(); newMenu(); render();
        const m = session.menu;
        if (!m.items[0].r) empty.push('主菜');
        m.items.forEach((it, i) => {
            if (!it.r){ if (!(it.slot === '汁物' && (soupyMain(m.items[0].r) || primoMain(m.items[0].r)))) empty.push(it.slot); return; }
            if (!modeOk(it.r, mode, it.slot)) bad.push(it.slot + ':' + it.r.name + '(' + it.r.min + '分/' + stepCount(it.r) + '手順/' + ingCount(it.r) + '材料)');
            if (modeBadgeOk(it.r, mode, it.slot)) strict[it.slot] = (strict[it.slot] || 0) + 1;
        });
        ['主菜', '副菜', '汁物'].forEach(sl => { if (modeInfo(mode, sl).lv > 0) relaxed.add(sl); });
    }
    const txt = easyRelaxText(), shown = [...document.querySelectorAll('#view .small.muted')].some(e => e.textContent === txt && txt);
    const badges = document.querySelectorAll('.tray .badge.mode').length;
    const infos = Object.fromEntries(['主菜', '副菜', '汁物'].map(sl => [sl, (f => ({lv: f.lv, n: f.n, none: f.none, few: !!f.ids}))(modeInfo(mode, sl))]));
    return {bad, empty, strict, relaxed: [...relaxed], txt, shown, badges, infos, n: session.menu.items.length};
}, [mode, n]);

for (const cc of CCS){
    cur = cc;
    const {p, ctx} = await open(cc, 'sel');
    // 1. 気分の選び方（条件のシート）に3つのモードのチップがある。押すと session.mood が変わる
    {
        await p.evaluate(() => openCondSheet());
        const chips = await p.evaluate(() => [...document.querySelectorAll('#sheet-root [data-act=mood]')].map(e => e.dataset.k));
        ok(MODES.every(k => chips.includes(k)) && chips.includes('quick') && chips.includes('easy'), `${cc} M1 条件のシートに 10分以内・いちばん簡単・じっくり のチップ（20分以内・ラクの日もそのまま）: ` + chips.join());
        await p.click('#sheet-root [data-act=mood][data-k=ten]'); await p.waitForTimeout(150);
        const r = await p.evaluate(() => ({mood: session.mood, head: (document.querySelector('.p2-sv .sv1') || {}).textContent || ''}));
        ok(r.mood === 'ten' && /10分以内/.test(r.head), `${cc} M1 チップを押すとモードになり、お膳の上の1行に出る: ` + JSON.stringify(r));
        await p.evaluate(() => { if (sheet) closeSheet(); });
    }
    // 2. 各モードで、献立の全部の席が条件（ゆるめた段階を含む）に合う。空の席なし。ゆるめたときだけ知らせを出す
    for (const mode of MODES){
        const r = await checkMenu(p, mode, 6);
        ok(!r.bad.length && !r.empty.length, `${cc} M2 ${mode}: 6回の献立で、全部の席がモードの条件に合い、空の席がない: ` + JSON.stringify({bad: r.bad.slice(0, 4), empty: r.empty, infos: r.infos}));
        const need = r.relaxed.length > 0;
        ok(need ? (r.txt.length > 0 && r.shown) : r.txt === '', `${cc} M2 ${mode}: ゆるめた席（${r.relaxed.join('・') || 'なし'}）があるときだけ、ゆるめた内容の知らせを画面に出す: ` + JSON.stringify({txt: r.txt, shown: r.shown, infos: r.infos}));
        if (mode !== 'slow'){   // 10分以内・いちばん簡単の日は、品数おまかせのときに1品減らす（20分以内・ラクの日と同じ）。じっくりはそのまま
            const c = await p.evaluate(mode => { const d0 = S.settings.dishCount; S.settings.dishCount = 'auto'; const m0 = session.mood; session.mood = 'all'; const a = menuCount(); session.mood = mode; const b = menuCount(); session.mood = m0; S.settings.dishCount = d0; return {a, b}; }, mode);
            ok(c.b === Math.max(2, c.a - 1), `${cc} M2 ${mode}: 品数おまかせの日は1品少なめ（おまかせ ${c.a} → ${c.b}）`);
        }
        // 5. お膳の札: 段階 0 の条件に合う料理の数だけ札が出る
        const nStrict = await p.evaluate(mode => session.menu.items.filter(it => it.r && modeBadgeOk(it.r, mode, it.slot)).length, mode);
        ok(r.badges === nStrict && (mode !== 'ten' || r.badges === 0 || (await p.evaluate(() => [...document.querySelectorAll('.tray .badge.mode')].every(e => e.textContent === '10分')))), `${cc} M5 ${mode}: お膳の札（10分・かんたん・じっくり）は、条件に合う料理にだけ（札 ${r.badges} / 合う料理 ${nStrict}。「10分」は10分以内の料理だけ）`);
        console.log(`    ${cc} ${mode} 段階: ` + JSON.stringify(r.infos));
    }
    // 3. かえる・まるごと入れ替えもモードの条件に合う
    for (const mode of MODES){
        const r = await p.evaluate(mode => {
            session.mood = mode; session.rejected.clear(); newMenu(); render();
            const bad = [];
            const m = session.menu;
            m.items.forEach((it, i) => { if (!it.r) return; swapCands(i, null).forEach(c => { if (!modeOk(c, mode, it.slot)) bad.push('かえる ' + it.slot + ':' + c.name); }); });
            for (let k = 0; k < 4; k++){
                document.querySelector('.tray [data-act=new-menu]').click();
                session.menu.items.forEach(it => { if (it.r && !modeOk(it.r, mode, it.slot)) bad.push('まるごと ' + it.slot + ':' + it.r.name); });
            }
            return {bad, mood: session.mood};
        }, mode);
        ok(!r.bad.length && r.mood === mode, `${cc} M3 ${mode}: 「かえる」の候補と「まるごと入れ替え」4回が、モードの条件に合う: ` + JSON.stringify(r.bad.slice(0, 5)));
    }
    // 6. アレルギー（卵・魚・甲殻類）は、どのモードでも守る
    {
        const r = await p.evaluate(() => {
            const bad = [];
            for (const alg of ['egg', 'fish', 'crustacean']){
                S.settings.allergens = [alg]; save();
                for (const mode of ['ten', 'simple', 'slow']){
                    session.mood = mode; session.rejected.clear(); newMenu(); render();
                    session.menu.items.forEach(it => { if (it.r && (allergyConflict(it.r) || isAvoided(it.r))) bad.push(alg + '/' + mode + ':' + it.r.name); if (it.r && !modeOk(it.r, mode, it.slot)) bad.push(alg + '/' + mode + ' 条件外:' + it.r.name); });
                    if (!session.menu.items[0].r) bad.push(alg + '/' + mode + ': 主菜なし');
                }
            }
            S.settings.allergens = []; save(); return bad;
        });
        ok(!r.length, `${cc} M6 アレルギー（卵・魚・甲殻類）の料理は、どのモードでも出ない（条件も守る）: ` + JSON.stringify(r.slice(0, 5)));
    }
    await ctx.close();
}

// 4. 作り方と料理の詳細の見え方（JP）・7. 決めた献立はモードを変えても変わらない
{
    cur = 'JP';
    const {p, ctx} = await open('JP', 'view');
    const viewOf = async (mode) => p.evaluate(async (mode) => {
        session.mood = mode; session.rejected.clear(); newMenu(); render();
        document.querySelector('.decide-bar [data-act=decide]').click(); await new Promise(r => setTimeout(r, 50));
        setTab('cook'); session.cookView = 'step'; session.cookIdx = 0; render(); await new Promise(r => setTimeout(r, 50));
        const v = document.querySelector('#view');
        const out = {mode, decided: menuIsDecided(), views: [...v.querySelectorAll('.mode-view')].map(e => e.className), minutes: v.querySelectorAll('.mode-view .mtl-m').length, mins: [...v.querySelectorAll('.mode-view .mtl-m')].filter(e => e.textContent.trim()).length,
            total: !!v.querySelector('.mode-total'), big: v.querySelectorAll('.mode-big').length, ings: (v.querySelector('.mode-ings') || {}).textContent || '', waits: v.querySelectorAll('.mode-waits .timer-chip').length, steps: v.querySelectorAll('.mode-tl li').length,
            name: cookItems()[0].r.name, nSteps: cookItems()[0].r.steps.length};
        // 料理の詳細（モーダル）
        openModal(cookItems()[0].r.id); await new Promise(r => setTimeout(r, 50));
        const md = document.querySelector('#modal-root');
        out.modal = {views: [...md.querySelectorAll('.mode-view')].map(e => e.className), waitLi: md.querySelectorAll('.steps li.wait .wait-tag .timer-chip').length, big: md.querySelectorAll('.mode-big').length, steps: md.querySelectorAll('ol.steps li').length};
        closeModal();
        // 決めた献立のまま、モードを変える: 条件のシートのチップを押しても、確かめの前には変わらない
        const ids0 = JSON.stringify(menuIds());
        setTab('today'); render(); openCondSheet(); await new Promise(r => setTimeout(r, 30));
        const chip = document.querySelector('#sheet-root [data-act=mood][data-k=' + (mode === 'ten' ? 'simple' : 'ten') + ']'); chip.click(); await new Promise(r => setTimeout(r, 80));
        out.keep = {same: JSON.stringify(menuIds()) === ids0, mood: session.mood, sheet: sheet ? sheet.kind : null};
        if (sheet) closeSheet();
        S.cook = null; save(); session.mood = mode; render();
        return out;
    }, mode);
    const ten = await viewOf('ten');
    ok(ten.decided && ten.views.some(c => /mode-ten/.test(c)) && ten.steps === ten.nSteps && ten.total && ten.ings.length > 3, `JP M4 10分以内: 作り方に、手順の帯（${ten.steps}/${ten.nSteps}手順）・分の札・合計・材料1行: ` + JSON.stringify(ten));
    ok(ten.modal.views.some(c => /mode-ten/.test(c)), `JP M4 10分以内: 料理の詳細にも同じ帯: ` + JSON.stringify(ten.modal));
    ok(ten.keep.same && ten.keep.mood === 'ten', `JP M7 決めた献立は、モードを変えても勝手に変わらない（確かめの前）: ` + JSON.stringify(ten.keep));
    const simple = await viewOf('simple');
    ok(simple.views.some(c => /mode-simple/.test(c)) && simple.big === 3 && simple.modal.big === 3, `JP M4 いちばん簡単: 作り方と詳細に「これだけ」の3行（材料の数・手順の数・道具）: ` + JSON.stringify({views: simple.views, big: simple.big, modal: simple.modal}));
    // じっくり: 「ここで待つ」のある料理（煮込みなど。待ち3分以上の手順）を主菜にして確かめる
    const slow = await p.evaluate(async () => {
        session.mood = 'slow';
        const pick = poolFor('主菜').find(r => r.main && modeStrict(r, 'slow') && r.steps.some(st => stepWaitSec(String(typeof st === 'string' ? st : st.t))));
        if (!pick) return {none: true};
        session.rejected.clear(); newMenu(); session.menu.items[0].r = pick; render();
        document.querySelector('.decide-bar [data-act=decide]').click(); await new Promise(r => setTimeout(r, 50));
        setTab('cook'); session.cookView = 'step'; session.cookIdx = 0; render(); await new Promise(r => setTimeout(r, 50));
        const v = document.querySelector('#view');
        const out = {name: pick.name, views: [...v.querySelectorAll('.mode-view')].map(e => e.className), waits: v.querySelectorAll('.mode-waits .timer-chip').length, labels: [...v.querySelectorAll('.mode-waits li span')].map(e => e.textContent)};
        openModal(pick.id); await new Promise(r => setTimeout(r, 50));
        const md = document.querySelector('#modal-root');
        out.modal = {waitLi: md.querySelectorAll('.steps li.wait').length, chips: md.querySelectorAll('.steps li.wait .wait-tag .timer-chip').length, tag: (md.querySelector('.wait-tag') || {}).textContent || ''};
        // タイマーのボタンを押すと、いつものタイマーが動く
        await new Promise(r => setTimeout(r, 400));   // 決定のすぐあとの押しまちがい防止（tapGuard）が切れるのを待つ
        const chip = md.querySelector('.steps li.wait .wait-tag .timer-chip'); chip.click(); await new Promise(r => setTimeout(r, 80));
        out.timer = TIMERS.length; TIMERS.length = 0; saveTimers(); closeModal();
        // おまかせに戻すと、モードの見え方は消える
        session.mood = 'all'; setTab('cook'); render(); await new Promise(r => setTimeout(r, 30));
        out.plain = document.querySelectorAll('#view .mode-view, #view .steps li.wait').length;
        openModal(pick.id); await new Promise(r => setTimeout(r, 30)); out.plainModal = document.querySelectorAll('#modal-root .mode-view, #modal-root .steps li.wait').length; closeModal();
        S.cook = null; save(); return out;
    });
    ok(!slow.none && slow.views.some(c => /mode-slow/.test(c)) && slow.waits > 0 && slow.labels.every(x => /\d+分待つ/.test(x)), `JP M4 じっくり: 作り方に「ここで待つ」（手順の番号・分・タイマー）: ` + JSON.stringify(slow));
    ok(!slow.none && slow.modal.waitLi > 0 && slow.modal.chips === slow.modal.waitLi && /ここで待つ/.test(slow.modal.tag) && slow.timer === 1, `JP M4 じっくり: 料理の詳細の手順に「ここで待つ」の印とタイマー（押すといつものタイマーが動く）: ` + JSON.stringify(slow.modal) + ' timers=' + slow.timer);
    ok(slow.plain === 0 && slow.plainModal === 0, `JP M4 おまかせに戻すと、モードの見え方は出ない: ` + JSON.stringify({plain: slow.plain, modal: slow.plainModal}));
    await ctx.close();
}
await b.close();
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' | '));
console.log(`\n${checks - fails}/${checks} 通過${fails ? '（失敗 ' + fails + '）' : ''}  SEED=${SEED}`);
process.exit(fails ? 1 : 0);
