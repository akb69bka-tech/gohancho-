#!/usr/bin/env node
// 第21回の献立の直しの確かめ（戸川）。Playwright。使い方: node tools/tests/panel-r21.mjs [http://localhost:8999/]
//  R76: 1週間プランの「今日」は、今日の献立の主菜（まだ決めていない案・決めた献立）と同じ。1週間分を考えたとき・今日の主菜を「かえる」・まるごと入れ替え・決めたあとも。
//       ほかの日の料理は変わらない。決めた献立は、1週間分を考えても変わらない。プランの今日の「別の案」は出さない（今日の主菜はお膳の「かえる」で。プランの操作では今日の献立を動かさない）
//  R82: 日本のおかゆの日の主菜は卵雑炊だけにならない（おかゆ・卵がゆ・梅がゆなども）。主菜はおかゆ・雑炊のなかまだけ。
//       雑炊（汁けの多いご飯）の日は汁ものを付けず、席に「汁けの多い主菜なので、なし」。米から炊くおかゆの日は今までどおり汁ものを付ける（各国の粥と同じ）
//  R83: 中華・洋の主菜の汁ものは、同じなかまの汁もの（ハンバーグ＋ワンタンスープ、麻婆なす＋コーンスープにしない）
//  環境変数: BASE, SEED
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (tag, settings = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r21', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript((st) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2}, st)})); } }, settings);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; setTab('today'); render(); });
    return {p, ctx};
};

// ---- R76: 1週間プランの今日 = 今日の献立の主菜 ----
{
    const tot = {make: 0, makeSame: 0, roll: 0, rollSame: 0, others: 0, decided: 0, decSame: 0, decKeep: 0, wr: 0, wrOk: 0, hidden: 0};
    const bad = [];
    for (let s = 0; s < 8; s++){
        const {p, ctx} = await open('r76-' + s);
        const r = await p.evaluate(async () => {
            const out = {};
            const planToday = () => { const x = S.week.days.find(y => y.d === TODAY); return x ? x.id : null; };
            const others = () => S.week.days.filter(y => y.d !== TODAY).map(y => y.d + ':' + y.id).join();
            makeWeek(); render();
            out.make = [planToday(), session.menu.items[0].r.id];
            // 主菜を「かえる」（その場で入れ替え）・まるごと入れ替え → プランの今日もそろう。ほかの日は変わらない
            const o0 = others(); out.roll = [];
            for (let k = 0; k < 3; k++){
                document.querySelector('.tray [data-act=reroll][data-i="0"]').click(); await new Promise(r => setTimeout(r, 30));
                out.roll.push([planToday(), session.menu.items[0].r && session.menu.items[0].r.id]);
                document.querySelector('.tray [data-act=new-menu]').click(); await new Promise(r => setTimeout(r, 30));
                out.roll.push([planToday(), session.menu.items[0].r && session.menu.items[0].r.id]);
            }
            out.othersSame = others() === o0;
            // 今日の「別の案」は出さない（今日の主菜はお膳の「かえる」で。プランの操作では今日の献立を動かさない）。押しても何も変わらない
            const before = JSON.stringify([session.menu.items.map(x => x.r ? x.r.id : '-'), S.week.days]);
            sheet = {kind: 'wday', d: TODAY}; renderSheet();
            const btn = !!document.querySelector('#sheet-root [data-act=week-reroll]'); if (sheet) closeSheet();
            const e = document.createElement('button'); e.dataset.act = 'week-reroll'; e.dataset.d = TODAY; document.body.appendChild(e); e.click(); e.remove();
            out.wr = {btn, same: JSON.stringify([session.menu.items.map(x => x.r ? x.r.id : '-'), S.week.days]) === before, others: others() === o0};
            // 決める → 決めた主菜がプランの今日。1週間分を考え直しても、決めた献立は変わらない。決めたあとは、今日の「別の案」を出さない
            document.querySelector('.decide-bar [data-act=decide]').click(); await new Promise(r => setTimeout(r, 50));
            const ids = JSON.stringify(S.cook.ids), dm = cookItems()[0].r.id;
            out.dec = [planToday(), dm];
            makeWeek(); render();
            out.dec2 = [planToday(), dm, JSON.stringify(S.cook.ids) === ids];
            sheet = {kind: 'wday', d: TODAY}; renderSheet(); out.hidden = !document.querySelector('#sheet-root [data-act=week-reroll]'); closeSheet();
            return out;
        });
        tot.make++; if (r.make[0] === r.make[1]) tot.makeSame++; else bad.push('考える ' + r.make.join('≠'));
        r.roll.forEach(x => { tot.roll++; if (x[0] === x[1]) tot.rollSame++; else bad.push('かえる ' + x.join('≠')); });
        if (r.othersSame) tot.others++; else bad.push('ほかの日が変わった');
        tot.wr++; if (!r.wr.btn && r.wr.same && r.wr.others) tot.wrOk++; else bad.push('別の案 ' + JSON.stringify(r.wr));
        tot.decided++; if (r.dec[0] === r.dec[1] && r.dec2[0] === r.dec2[1]) tot.decSame++; else bad.push('決めた ' + JSON.stringify([r.dec, r.dec2]));
        if (r.dec2[2]) tot.decKeep++; else bad.push('決めた献立が変わった');
        if (r.hidden) tot.hidden++; else bad.push('決めたあとに今日の別の案');
        await ctx.close();
    }
    ok(!bad.length, 'R76 1週間プランの今日は、今日の献立の主菜と同じ（考える・かえる・まるごと・決めたあと。今日の別の案は出さない）。ほかの日・決めた献立は変わらない: ' + JSON.stringify(tot) + ' ' + JSON.stringify(bad.slice(0, 5)));
    console.log('    R76 まとめ: ' + JSON.stringify(tot));
}

// ---- R82: 日本のおかゆの日 ----
{
    const mains = {}, bad = []; let soupy = 0, soupyNo = 0, plain = 0, plainSoup = 0, n = 0;
    for (let s = 0; s < 12; s++){
        const {p, ctx} = await open('r82-' + s);
        const r = await p.evaluate(() => {
            session.mood = 'okayu'; session.rejected.clear(); newMenu(); render();
            const its = session.menu.items, m = its[0].r, so = its.find(x => x.slot === '汁物');
            const spot = [...document.querySelectorAll('#view .tray .spot.soup .nm')].map(e => e.textContent);
            return {id: m.id, name: m.name, min: m.min, ok: okayuDayOk(m), soupy: soupyMain(m), soupSeat: !!so, soup: so && so.r ? so.r.name : null, spot};
        });
        n++; mains[r.name] = (mains[r.name] || 0) + 1;
        if (!r.ok || r.min > 45) bad.push('主菜 ' + r.name + '(' + r.min + '分)');
        if (r.soupy){ soupy++; if (!r.soup && (!r.soupSeat || r.spot.includes('汁けの多い主菜なので、なし'))) soupyNo++; else bad.push('雑炊に汁もの ' + r.name + '+' + r.soup + ' ' + JSON.stringify(r.spot)); }
        else { plain++; if (r.soup || !r.soupSeat) plainSoup++; }
        await ctx.close();
    }
    const kinds = Object.keys(mains).length;
    ok(kinds >= 3 && (mains['卵雑炊'] || 0) < n, `R82 おかゆの日の主菜は卵雑炊だけにならない（${n}回で ${kinds}種類）: ` + JSON.stringify(mains));
    ok(!bad.length && soupyNo === soupy, `R82 主菜はおかゆ・雑炊のなかま（45分まで）。雑炊の日（${soupy}回）は汁ものなし: ` + JSON.stringify(bad.slice(0, 4)));
    ok(plainSoup === plain, `R82 米から炊くおかゆの日（${plain}回）は今までどおり汁もの（の席）: ` + JSON.stringify({plain, plainSoup}));
    // 鮭雑炊のように、あとから足す日本の雑炊・おじやも汁けの多い主菜として見る
    const u = await (async () => { const {p, ctx} = await open('r82-unit'); const x = await p.evaluate(() => ({zosui: soupyMain(byId('zosui')), okayu: soupyMain(byId('okayu')), name: soupyMain({type: 'ごはん', name: '鮭雑炊', id: 'x'}), ojiya: soupyMain({type: 'ごはん', name: '卵のおじや', id: 'y'}), caldo: soupyMain({pack: 'PH', type: 'ごはん', method: '煮', name: 'Arroz caldo', id: 'z'})})); await ctx.close(); return x; })();
    ok(u.zosui && !u.okayu && u.name && u.ojiya && !u.caldo, 'R82 雑炊・おじやは汁けの多い主菜、白がゆ・各国の粥（Arroz caldo）は今までどおり: ' + JSON.stringify(u));
}

// ---- R83: 中華・洋の主菜の汁ものは同じなかま ----
{
    const bad = []; let n = 0, hit = 0;
    for (let s = 0; s < 4; s++){
        const {p, ctx} = await open('r83-' + s, {dishCount: 4});
        const r = await p.evaluate(() => {
            const out = [], has = g => poolFor('汁物').some(x => x.type === '汁物' && x.genre === g && !isAvoided(x));
            for (let k = 0; k < 20; k++){
                session.mood = 'all'; session.rejected.clear(); newMenu();
                const its = session.menu.items, m = its[0].r, so = (its.find(x => x.slot === '汁物') || {}).r;
                if (m && so && ['中', '洋'].includes(m.genre)) out.push({m: m.name, mg: m.genre, s: so.name, sg: so.genre, has: has(m.genre)});
            }
            return out;
        });
        r.forEach(x => { n++; if (x.has && x.sg !== x.mg) bad.push(x.m + '(' + x.mg + ')+' + x.s + '(' + x.sg + ')'); else hit++; });
        await ctx.close();
    }
    ok(n >= 10 && !bad.length, `R83 中華・洋の主菜（${n}献立）の汁ものは同じなかま: ` + JSON.stringify(bad.slice(0, 5)));
}

await b.close();
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' | '));
console.log(`\n${checks - fails}/${checks} 通過${fails ? '（失敗 ' + fails + '）' : ''}  SEED=${SEED}`);
process.exit(fails ? 1 : 0);
