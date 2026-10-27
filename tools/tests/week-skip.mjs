#!/usr/bin/env node
// 1週間プランの「この日は作らない」の回帰テスト（Playwright。使い方: node tools/tests/week-skip.mjs [http://localhost:8794/]）
//  ・作らない／戻す／別の案 のどれを押しても、押した日以外の日（日付・料理・副菜汁もの・skip）が1つも変わらない
//  ・作らない日の料理は買い物メモ・送る文面（「作らない日」と出る）・今日の主菜から外れ、戻すと同じ料理に戻る
//  ・作らない日に「別の案」は効かない（入れかえで作らない日の料理が動かない）。作り直しても作らない日は日付で残る
//  ・今日の献立・冷蔵庫・記録・お気に入りには触らない。週カードの画像も作れる
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8794/', N = Number(process.env.N || 6);
const CCS = (process.env.CCS || 'JP,US,KR,FR,IN,TH').split(',');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
for (const cc of CCS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3}})); } }, cc);
    await p.goto(URL_); await p.waitForTimeout(900); await p.evaluate(() => { hasPro = () => true; });
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
            const cv = await cardCanvas('week'); if (!cv) bad.push('週カードが作れない');
            S.week.days.forEach(x => delete x.skip); S.week.days[1].skip = true;
            const cv2 = await cardCanvas('week'); if (!cv2) bad.push('週カード(一部skip)が作れない');
        }
        return bad;
    }, N);
    ok(!r.length, cc + ": " + [...new Set(r)].slice(0, 6).join(" | ") + (process.env.DBG ? " :: " + r.length : ""));
    await ctx.close();
}
await b.close();
errs.forEach(e => { fails++; console.log('ERR', e); });
console.log(fails ? 'FAIL ' + fails : 'OK', checks + ' checks');
process.exit(fails ? 1 : 0);
