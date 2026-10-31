#!/usr/bin/env node
// 1週間プランの「この日は作らない」の回帰テスト（Playwright。使い方: node tools/tests/week-skip.mjs [http://localhost:8794/]）
//  ・作らない／戻す／別の案 のどれを押しても、押した日以外の日（日付・料理・副菜汁もの・skip）が1つも変わらない
//  ・作らない日の料理は買い物メモ・送る文面（「作らない日」と出る）・今日の主菜から外れ、戻すと同じ料理に戻る
//  ・作らない日に「別の案」は効かない（入れかえで作らない日の料理が動かない）。作り直しても作らない日は日付で残る
//  ・今日の献立・冷蔵庫・記録・お気に入りには触らない。週カードの画像も作れる
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_, N = Number(process.env.N || 6);
const CCS = (process.env.CCS || 'JP,US,KR,FR,IN,TH').split(',');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
for (const cc of CCS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('week-skip', String(++seedN))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3}})); } }, cc);
    await p.goto(URL_); await ready(p); await p.evaluate(() => { hasPro = () => true; });
    const r = await p.evaluate(async N => {
        const bad = [], snapDay = x => JSON.stringify({d:x.d, id:x.id, extra:x.extra, skip:!!x.skip});
        const outside = () => JSON.stringify([S.fridge, S.history, S.favs, S.cook, session.menu && session.menu.items.map(i => i.r && i.r.id)]);
        const click = (act, d) => { const e = document.createElement('button'); e.dataset.act = act; e.dataset.d = d; document.body.appendChild(e); e.click(); e.remove(); };
        S.staples = []; S.fridge = [];
        for (let k = 0; k < N; k++){
            S.week = null; makeWeek(); S.settings.weekSides = k % 2 === 0; if (S.settings.weekSides) ensureWeekExtras();
            const ds = S.week.days.map(x => x.d);
            const base = outside();
            for (let i = 0; i < ds.length; i++){
                const before = S.week.days.map(snapDay), shopFull = shoppingList().map(e => e.key).join();
                click('week-skip', ds[i]);
                S.week.days.forEach((x, j) => { if (j !== i && snapDay(x) !== before[j]) bad.push('skip: ' + j + ' が変わった'); });
                if (!S.week.days[i].skip || S.week.days[i].id !== JSON.parse(before[i]).id) bad.push('skip: 押した日の状態 ' + i + before[i] + JSON.stringify(S.week.days[i]));
                if (visiblePlanDays().some(x => x.d === ds[i])) bad.push('visiblePlanDays に作らない日が残る');
                const txt = weekShareText(); if (!txt.includes(t('作らない日'))) bad.push('送る文面に作らない日が出ない');
                // 作らない日だけの料理の材料は買い物メモから減る（他の日の分は残る）
                const others = new Set(visiblePlanDays().flatMap(x => dayDishes(x).map(r => r.id)));
                shoppingList().forEach(e => { if (e.dishes.some(n => { const r = S.week.days[i]; const rr = byId(r.id); return rr && n === rr.name && !others.has(rr.id); })) bad.push('買い物メモに作らない日の料理: ' + e.label); });
                // 作らない日に別の案を押しても何も動かない
                const mid = S.week.days.map(snapDay); click('week-reroll', ds[i]);
                if (S.week.days.map(snapDay).join() !== mid.join()) bad.push('作らない日の別の案で何かが動いた');
                // ほかの日の別の案: 作らない日の料理・flag は不動
                const j = (i + 3) % ds.length; if (j !== i){ const s2 = S.week.days.map(snapDay); click('week-reroll', ds[j]);
                    S.week.days.forEach((x, m) => { if (m !== j && snapDay(x) !== s2[m]) bad.push('reroll: 他の日 ' + m + ' が動いた'); }); }
                const mid2 = S.week.days.map(snapDay);
                click('week-skip', ds[i]);
                S.week.days.forEach((x, m) => { if (m !== i && snapDay(x) !== mid2[m]) bad.push('戻す: 他の日が変わった'); });
                if (S.week.days[i].skip || S.week.days[i].id !== JSON.parse(mid2[i]).id) bad.push('戻す: 同じ料理に戻らない');
                if (outside() !== base) bad.push('週の外（献立・冷蔵庫・記録）が動いた');
            }
            // 日ごとの担当: 押した日の who だけが変わる（料理・副菜汁もの・skip・ほかの日・週の外は不変）。別の案・作らないでも who は残り、作り直しても日付で残る
            { const who = (d, v) => { click('week-who', d); if (!sheet || sheet.kind !== 'who') { bad.push('担当の画面が開かない'); return; } const e = document.createElement('button'); e.dataset.act = 'who-pick'; e.dataset.v = v; document.body.appendChild(e); e.click(); e.remove(); };
              S.week.days.forEach(x => { delete x.skip; delete x.who; }); const w0 = S.week.days.map(snapDay), b2 = outside(), sh0 = shoppingList().map(e => e.key).join();
              for (let i = 0; i < ds.length; i++){ const nm = i % 2 ? '父' : '母' + i; const bf = S.week.days.map(snapDay); who(ds[i], nm);
                  S.week.days.forEach((x, j) => { if (snapDay(x) !== bf[j]) bad.push('who: 料理・skip が変わった ' + j); if (j !== i && x.who !== (bf[j] && S.week.days[j].who)) {} });
                  if (S.week.days[i].who !== nm) bad.push('who が入らない');
                  S.week.days.forEach((x, j) => { if (j > i && x.who) bad.push('who: 押していない日に入った'); });
                  if (!weekShareText().includes(t('担当：{name}', {name:nm}))) bad.push('送る文面に担当が出ない'); }
              if (outside() !== b2) bad.push('who: 週の外が動いた'); if (shoppingList().map(e => e.key).join() !== sh0) bad.push('who: 買い物メモが変わった');
              if (S.week.days.map(snapDay).join() !== w0.join()) bad.push('who: 料理が変わった');
              const wh = S.week.days.map(x => x.who).join(); const j2 = 3 % ds.length; click('week-reroll', ds[j2]);
              if (S.week.days.map(x => x.who).join() !== wh) bad.push('別の案で担当が動いた');
              click('week-skip', ds[1]); if (S.week.days[1].who !== '父') bad.push('作らないで担当が消えた'); if (weekShareText().split('\n').some(l => l.includes(t('作らない日')) && l.includes('担当'))) bad.push('作らない日に担当が出た');
              click('week-who', ds[1]); if (sheet) bad.push('作らない日に担当の画面が開いた');
              click('week-skip', ds[1]);
              click('week-who', ds[2]); const ee = document.createElement('button'); ee.dataset.act = 'who-clear'; document.body.appendChild(ee); ee.click(); ee.remove(); if (S.week.days[2].who) bad.push('担当をはずせない');
              const wk = S.week.days.map(x => x.who || '').join(); makeWeek(); if (S.week.days.map(x => x.who || '').join() !== wk) bad.push('作り直しで担当が日付で残らない');
              const td = S.week.days.find(x => x.d === TODAY); td.who = '母'; td.skip = false; if (!menuShareText(session.menu, TODAY).includes(t('担当：{name}', {name:'母'}))) bad.push('今日の献立の文面に担当が出ない'); td.skip = true; if (menuShareText(session.menu, TODAY).includes(t('担当：{name}', {name:'母'}))) bad.push('作らない日の献立文面に担当'); td.skip = false;
              S.week.days.forEach(x => { delete x.who; delete x.skip; }); }
            // 作り直しても作らない日は日付で残る／今日が作らない日なら weekToday は null
            click('week-skip', ds[0]); click('week-skip', ds[2]);
            if (weekToday()) bad.push('今日が作らない日なのに weekToday');
            makeWeek(); const sk = S.week.days.filter(x => x.skip).map(x => x.d).join();
            if (sk !== [ds[0], ds[2]].join()) bad.push('作り直しで作らない日が残らない: ' + sk);
            // 通知: 作らない日の予約は出ない
            S.settings.remind = 8; const idsOf = () => notifBuild(new Date(0)).map(n => n.id);
            S.week.days.forEach(x => delete x.skip); const all = idsOf(); S.week.days[2].skip = true; const part = idsOf();
            if (all.length - part.length !== 1 || !all.includes(NOTIFY_DAY_ID + 2) || part.includes(NOTIFY_DAY_ID + 2)) bad.push('作らない日のお知らせが残る/他の日が消えた');
            S.week.days[2].skip = false; S.week.days.forEach(x => delete x.skip); S.week.days[0].skip = true; S.week.days[2].skip = true;
            // 全部作らない日でも落ちない・週カードが描ける
            S.week.days.forEach(x => x.skip = true);
            try{ render(); weekShareText(); shoppingList(); }catch(e){ bad.push('全部skipで例外 ' + e.message); }
            // 全部作らない日: 毎日くり返す一括のお知らせ(1001)は予約しない。作らない日の個別の予約も出さない（無料・有料どちらでも）
            { const ns = notifBuild(new Date(0)), skipIdx = new Set(S.week.days.filter(x => x.skip).map(x => Math.round((parseYmd(x.d) - parseYmd(TODAY)) / 864e5)));
              if (ns.some(n => n.id === NOTIFY_ID)) bad.push('全部作らない日なのに毎日くり返すお知らせ(1001)が予約される');
              if (ns.some(n => skipIdx.has(n.id - NOTIFY_DAY_ID))) bad.push('作らない日にお知らせが予約される');
              if (!ns.some(n => !skipIdx.has(n.id - NOTIFY_DAY_ID))) bad.push('作る日(週のあと)のお知らせまで消えた'); }
            const cv = await cardCanvas('week'); if (!cv) bad.push('週カードが作れない');
            S.week.days.forEach(x => delete x.skip); S.week.days[1].skip = true;
            const cv2 = await cardCanvas('week'); if (!cv2) bad.push('週カード(一部skip)が作れない');
        }
        return bad;
    }, N);
    ok(!r.length, cc + ": " + [...new Set(r)].slice(0, 6).join(" | ") + (process.env.DBG ? " :: " + r.length : ""));
    await ctx.close();
}
// 390px のスマホで、週の行（担当・別の案・作らない・作る日に戻す）が画面からはみ出さず、ボタンが44px以上で押せる
for (const lang of (process.env.LAYOUT_LANGS || 'ja,de,ar,th,fr,vi').split(',')){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('week-skip', String(++seedN))));
    const p = await ctx.newPage();
    await p.addInitScript(lang => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), lang, settings:{country:'JP', dishCount:3, lang}, family:[{id:'f1', name:'母', role:'adult', avoid:[], allergy:[], mild:false}]})); } }, lang);
    await p.goto(URL_); await ready(p);
    await p.evaluate(async lang => { await setLang(lang); hasPro = () => true; if (!S.week) makeWeek(); S.week.days[0].skip = true; S.week.days[1].who = '長い名前の人長い名前'; render(); }, lang);
    const m = await p.evaluate(() => { const bad = [], W = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > W) bad.push('横にはみ出す ' + document.documentElement.scrollWidth);
        document.querySelectorAll('.week .item').forEach(it => { const ir = it.getBoundingClientRect(); it.querySelectorAll('button').forEach(bt => { const r = bt.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) bad.push('小さい ' + bt.textContent.trim()); if (r.right > W + .5 || r.left < -.5 || r.right > ir.right + .5 || r.left < ir.left - .5) bad.push('はみ出す ' + bt.textContent.trim()); }); });
        return bad; });
    ok(!m.length, 'layout ' + lang + ': ' + [...new Set(m)].slice(0, 4).join(' | '));
    await ctx.close();
}
await b.close();
errs.forEach(e => { fails++; console.log('ERR', e); });
console.log(fails ? 'FAIL ' + fails : 'OK', checks + ' checks');
process.exit(fails ? 1 : 0);
