#!/usr/bin/env node
// モード（オーナーの案）: 「10分以内」「いちばん簡単」「じっくり」。Playwright。使い方: node tools/tests/panel-mode.mjs [http://localhost:8999/]
//  1. 気分の「時間」の並びに3つのモードがあり、国（JP・US・KR）ごとに、どの席もモードの条件（ゆるめた段階を含む）に合う料理だけ。空の席は作らない
//  2. その国に合う料理が少ないときは、ゆるめた段階を画面に書く（ゆるめていないときは書かない）
//  3. 「かえる」の候補・「まるごと入れ替え」も、モードの条件に合う
//  4. 作り方（決めたあとの手順の画面）と料理の詳細で、モードごとの見え方が出る（10分以内: 手順の帯と分・合計、いちばん簡単: 「これだけ」3行、じっくり: 「ここで待つ」とタイマー）。おまかせでは出ない
//  5. お膳の札（10分・かんたん・じっくり）は、モードのときだけ
//  6. アレルギー・苦手は、どのモードでも守る
//  7. 決めた献立は、モードを変えても変わらない
//  8. 第17回の直し: R49 「かんたん」の札はゆるめない条件（主菜 25分・手順3つ・材料6つ、副菜・汁もの 15分・手順2つ）に合う料理だけ（ゆるめた段階には付けない）。
//     R50 ゆるめた知らせは、お膳の上の「条件を変える」の中の短い1行（390×844 で、文字ふつう・もっと大きいとも決定の帯より上に見える）と、条件のシートの全文。お膳の下には出さない。お膳は押し下げない
//     R51 「10分以内」の作り方の見出しは、いま効いている上限（15分以内など。近い順の少数は「手早い順」）。「おく・漬ける」の10分を超える待ちは「＋おく○分」と別に出し、合計には入れない。「10分」の札はその待ちがない料理だけ。知らせに「最長○分」は出ない
//     R52 知らせに「手順99つまで」は出ない（「手順の数は問わない」）
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
    const txt = easyRelaxText();
    // R50: 短い1行はお膳の上の「条件を変える」の中、全文は条件のシート。お膳の下には出さない
    const head = document.querySelector('#view .p2-sv .sv-relax'), under = [...document.querySelectorAll('#view .small.muted')].some(e => txt && e.textContent === txt);
    openCondSheet(); const full = document.querySelector('#sheet-root .cond-relax'); const inSheet = !!full && full.textContent === txt; closeSheet();
    const shown = !!head && head.textContent.length > 0 && inSheet && !under;
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
        if (mode !== 'slow'){   // R49・R51: 札はゆるめない条件の料理だけ（かんたん: 主菜25分・手順3つ・材料6つ、副菜・汁もの15分・手順2つ。10分: 目安10分以内で、10分を超える「おく」待ちがない）。段階をゆるめた国でも、ゆるめた段階の料理には付けない
            const bad = await p.evaluate(mode => { const out = []; for (let k = 0; k < 6; k++){ session.rejected.clear(); newMenu(); render();
                session.menu.items.forEach(it => { if (!it.r || !modeBadgeOk(it.r, mode, it.slot)) return; const main = easyKind(it.r) === 'main';
                    if (mode === 'simple' && (it.r.min > (main ? 25 : 15) || stepCount(it.r) > (main ? 3 : 2) || (main && ingCount(it.r) > 6) || easyHeavy(it.r))) out.push(it.r.name + '(' + it.r.min + '分/' + stepCount(it.r) + '手順/' + ingCount(it.r) + ')');
                    if (mode === 'ten' && (it.r.min > 10 || passiveWaitMin(it.r) > 10)) out.push(it.r.name + '(' + it.r.min + '分/おく' + passiveWaitMin(it.r) + '分)'); }); } return out; }, mode);
            ok(!bad.length, `${cc} M8 ${mode}: 札は、ゆるめない条件（分・手順・材料／10分を超える待ちなし）に合う料理にだけ: ` + JSON.stringify(bad.slice(0, 5)));
        }
        ok(!/99/.test(r.txt) && !/最長/.test(r.txt), `${cc} M8 ${mode}: 知らせに「手順99つまで」「最長○分」が出ない（R51・R52）: ` + r.txt);
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
    // R50: 390×844 で、ゆるめた知らせの短い1行が決定の帯・下のタブより上に、スクロールなしで見える（文字ふつう・もっと大きい）。お膳の位置は1行を消しても変わらない（2px まで）
    for (const ts of [0, 2]){
        const r = await p.evaluate(ts => { S.settings.textSize = ts || undefined; applyTextSize(); session.mood = 'ten'; session.rejected.clear(); newMenu(); render(); window.scrollTo(0, 0);
            const q = s => document.querySelector(s), rc = e => e ? e.getBoundingClientRect() : null, rl = q('#view .p2-sv .sv-relax'), tray = q('#view .tray'), bar = q('#view .decide-bar'), tabs = q('nav.tabs');
            if (!rl) return {none: true, txt: easyRelaxText()};
            const a = rc(rl), t0 = rc(tray).top, cut = rl.scrollWidth > rl.clientWidth + 1;
            rl.style.display = 'none'; const t1 = rc(tray).top; rl.style.display = '';
            const out = {top: Math.round(a.top), bottom: Math.round(a.bottom), barTop: bar ? Math.round(rc(bar).top) : null, tabTop: tabs ? Math.round(rc(tabs).top) : null, trayShift: Math.round(t0 - t1), cut, txt: rl.textContent, btnH: Math.round(rc(q('#view .p2-sv')).height)};
            S.settings.textSize = undefined; applyTextSize(); return out; }, ts);
        ok(!r.none && r.top >= 0 && r.bottom < Math.min(r.barTop || 9999, r.tabTop || 9999) && !r.cut && Math.abs(r.trayShift) <= 2 && r.btnH <= 48, `JP M8 R50 文字${ts ? 'もっと大きい' : 'ふつう'}: ゆるめた知らせの1行が決定の帯・タブより上に見え、切れず、お膳を押し下げない: ` + JSON.stringify(r));
    }
    // R51: 「10分以内」の作り方の見出しは、いま効いている上限。「おく」の待ちは「＋おく○分」で合計とは別
    {
        const r = await p.evaluate(() => { session.mood = 'ten'; session.rejected.clear(); newMenu(); render();
            const out = [];
            session.menu.items.filter(x => x.r).forEach(x => { openModal(x.r.id); const md = document.querySelector('#modal-root'), head = (md.querySelector('.mode-view .eyebrow') || {}).textContent || '', total = (md.querySelector('.mode-total') || {}).textContent || '';
                const f = modeInfo('ten', x.slot), lim = f.ids || f.none ? null : MODE_TIERS.ten[x.slot === '主菜' ? 'main' : 'side'][f.lv];
                out.push({name: x.r.name, min: x.r.min, head, total, want: lim === null ? '手早い順' : lim + '分以内', okMin: lim === null || x.r.min <= lim}); closeModal(); });
            openModal('kabuamazu'); const md = document.querySelector('#modal-root');
            const kabu = {mins: [...md.querySelectorAll('.mtl-m')].map(e => e.textContent), total: (md.querySelector('.mode-total') || {}).textContent || '', wait: (md.querySelector('.mode-total .mode-wait') || {}).textContent || '', badge: modeBadgeOk(byId('kabuamazu'), 'ten', '副菜'), pw: passiveWaitMin(byId('kabuamazu'))}; closeModal();
            return {out, kabu}; });
        ok(r.out.length && r.out.every(x => x.head === x.want && x.okMin), 'JP M8 R51 料理の詳細の見出しは、いま効いている上限（10分以内／15分以内など／手早い順）で、料理の分はその中: ' + JSON.stringify(r.out));
        ok(r.kabu.mins.includes('＋おく30分') && r.kabu.wait === '＋おく30分' && /ぜんぶで10分/.test(r.kabu.total) && !r.kabu.badge && r.kabu.pw === 30, 'JP M8 R51 かぶの甘酢漬け: 「30分おく」は「＋おく30分」で別に出し、合計は10分のまま、「10分」の札は付かない: ' + JSON.stringify(r.kabu));
    }
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
