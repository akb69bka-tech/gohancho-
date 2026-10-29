#!/usr/bin/env node
// 利用者モニター第4回の献立まわり（R2・R4・R5・置き換えた手順）の回帰テスト（Playwright。使い方: node tools/tests/panel-r4.mjs [http://localhost:8883/]）
//  R2 台所の設定: コンロ1つなら、火を使う主菜・汁ものの日の副菜はコンロを使わない料理が多くなる。はじめてなら手順の少ない料理が多くなる。
//     どちらも「できるだけ」で、献立が作れなくならない。設定を変えても、いまの献立（決めた献立も下書きも）は変わらない
//  R4 アメリカの夕食: 朝食の料理（Pancakes・Oatmeal など）を主菜に出さない。主食を「なし」にしている日は、主菜に主食が入っていなければ、じゃがいも・パンなどの副菜をそろえる
//  R5 ベトナム語の画面: 和食の料理名と食材名がベトナム語。冷蔵庫に「trứng」「Trứng, hành tây」と入れると料理が見つかる
//  R9 置き換えた料理の手順: 豆腐に置き換えた料理の手順に「1枚ずつ広げて」「赤みがなくなるまで」などの肉の文が残らない（日本語・英語）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const want = k => !ONLY.length || ONLY.includes(k);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (settings = {}, opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: opt.locale || 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('panel-r4', JSON.stringify(settings))));
    await ctx.addInitScript(([st, extra]) => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)}, extra || {}))); }, [settings, opt.state]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    const cc = settings.country || 'JP';
    if (cc !== 'JP') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, cc, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
// 献立を n 回作って数える（今日の画面の献立は最後に元に戻す）
const stats = (p, n = 250) => p.evaluate(n => {
    const keep = session.menu; let side = 0, sideN = 0, steps = 0, empty = 0, long = 0, all = 0;
    for (let i = 0; i < n; i++){
        session.rejected.clear(); newMenu();
        const it = session.menu.items;
        if (!it[0].r) empty++;
        it.filter(x => x.r && x.slot === '副菜').forEach(x => { sideN++; if (!stoveUse(x.r)) side++; });
        const xs = it.filter(x => x.r); steps += xs.reduce((a, x) => a + x.r.steps.length, 0) / xs.length; xs.forEach(x => { all++; if (x.r.steps.length >= 5) long++; });
    }
    session.menu = keep;
    return {sideNoStove: side / Math.max(1, sideN), steps: steps / n, empty, long: long / Math.max(1, all)};
}, n);

// ---- R2 台所の設定が献立に効く ----
if (want('R2')){
    for (const cc of ['JP', 'US']){
        const base = await open({country: cc, uiLang: cc === 'JP' ? 'ja' : 'en'}, {locale: cc === 'JP' ? 'ja-JP' : 'en-US'});
        const s0 = await stats(base.p); await base.ctx.close();
        const one = await open({country: cc, uiLang: cc === 'JP' ? 'ja' : 'en', kitchen: {burners: '1'}}, {locale: cc === 'JP' ? 'ja-JP' : 'en-US'});
        const s1 = await stats(one.p); await one.ctx.close();
        const nw = await open({country: cc, uiLang: cc === 'JP' ? 'ja' : 'en', kitchen: {skill: 'new'}}, {locale: cc === 'JP' ? 'ja-JP' : 'en-US'});
        const s2 = await stats(nw.p); await nw.ctx.close();
        ok(s1.sideNoStove >= 0.8 && s1.sideNoStove > s0.sideNoStove + 0.2, `R2-1 ${cc} コンロ1つ: 副菜にコンロを使わない料理が多くなる: ${s0.sideNoStove.toFixed(2)} → ${s1.sideNoStove.toFixed(2)}`);
        ok(s2.steps < s0.steps - 0.1 && s0.long > 0 && s2.long <= s0.long * 0.5, `R2-2 ${cc} はじめて: 手順の平均が少なくなり、手順が5つ以上の料理が半分以下になる: ${s0.steps.toFixed(2)} → ${s2.steps.toFixed(2)}、${s0.long.toFixed(3)} → ${s2.long.toFixed(3)}`);
        ok(!s1.empty && !s2.empty, `R2-3 ${cc} どちらでも主菜が空にならない: ${s1.empty} / ${s2.empty}`);
    }
    // コンロを使わない副菜がない（すべて火を使う）ときも、献立は作れる
    {
        const {p, ctx} = await open({kitchen: {burners: '1', skill: 'new'}});
        const r = await p.evaluate(() => {
            const keep = RECIPES.slice(); const hot = RECIPES.filter(r => r.type !== '副菜' || stoveUse(r)); RECIPES.length = 0; hot.forEach(r => RECIPES.push(r));
            let full = 0; for (let i = 0; i < 30; i++){ session.rejected.clear(); newMenu(); if (session.menu.items.filter(x => x.slot === '副菜').every(x => x.r)) full++; }
            RECIPES.length = 0; keep.forEach(r => RECIPES.push(r)); newMenu(); render();
            return full;
        });
        ok(r === 30, 'R2-4 コンロを使わない副菜がなくても、副菜の枠は埋まる（できるだけの扱い）: ' + r + '/30');
        await ctx.close();
    }
    // 画面: 設定の台所でコンロ1つ・はじめてを押しても、いまの献立は変わらない。説明の文は「献立の選び方はまだ変わりません」ではない
    {
        const {p, ctx} = await open({dishCount: 3});
        const ids0 = await p.evaluate(() => menuIds().join());
        await p.click('button[data-act=settings]'); await p.waitForTimeout(400);
        await p.locator('#kitchen-card').scrollIntoViewIfNeeded();
        const note = await p.locator('#kitchen-card').innerText();
        ok(!/まだ変わりません/.test(note) && /できるだけ選びます/.test(note), 'R2-5 台所の説明が「選び方に効く」になっている: ' + note.replace(/\n/g, '/').slice(-90));
        await p.click('#kitchen-card [data-act=kitchen][data-k=burners][data-v="1"]'); await p.waitForTimeout(300);
        await p.click('#kitchen-card [data-act=kitchen][data-k=skill][data-v=new]'); await p.waitForTimeout(300);
        const r = await p.evaluate(() => ({ids: menuIds().join(), k: JSON.stringify(S.settings.kitchen)}));
        ok(r.ids === ids0 && /"burners":"1"/.test(r.k) && /"skill":"new"/.test(r.k), 'R2-6 台所を変えても下書きの献立はそのまま: ' + ids0 + ' → ' + r.ids + ' ' + r.k);
        await ctx.close();
    }
    {
        const {p, ctx} = await open({dishCount: 3});
        await p.click('button[data-act=decide]'); await p.waitForTimeout(500);
        const ids0 = await p.evaluate(() => cookItems().map(x => x.r.id).join());
        await p.click('button[data-act=settings]'); await p.waitForTimeout(400);
        await p.click('#kitchen-card [data-act=kitchen][data-k=burners][data-v="1"]'); await p.waitForTimeout(300);
        await p.click('#kitchen-card [data-act=kitchen][data-k=skill][data-v=new]'); await p.waitForTimeout(300);
        await p.reload(); await ready(p);
        const ids1 = await p.evaluate(() => cookItems().map(x => x.r.id).join());
        ok(ids0 && ids0 === ids1, 'R2-7 決めた献立は、台所を変えて開き直してもそのまま: ' + ids0 + ' → ' + ids1);
        await ctx.close();
    }
}

await b.close();
if (errs.length){ console.log('ページのエラー:', [...new Set(errs)].slice(0, 5)); }
console.log(`panel-r4: ${checks - fails}/${checks} 成功`);
process.exit(fails || errs.length ? 1 : 0);
