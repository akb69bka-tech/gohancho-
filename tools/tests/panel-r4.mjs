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

// ---- R2 台所の設定が献立に効く ----（品数は席の数なので、副菜のある 4 にする）
if (want('R2')){
    for (const cc of ['JP', 'US']){
        const base = await open({country: cc, uiLang: cc === 'JP' ? 'ja' : 'en', dishCount: 4}, {locale: cc === 'JP' ? 'ja-JP' : 'en-US'});
        const s0 = await stats(base.p); await base.ctx.close();
        const one = await open({country: cc, uiLang: cc === 'JP' ? 'ja' : 'en', dishCount: 4, kitchen: {burners: '1'}}, {locale: cc === 'JP' ? 'ja-JP' : 'en-US'});
        const s1 = await stats(one.p); await one.ctx.close();
        const nw = await open({country: cc, uiLang: cc === 'JP' ? 'ja' : 'en', dishCount: 4, kitchen: {skill: 'new'}}, {locale: cc === 'JP' ? 'ja-JP' : 'en-US'});
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

// ---- R4 アメリカの夕食に朝食の料理を出さない・主食をそろえる ----
if (want('R4')){
    const BF = /^us_(pancakes|oatmeal|scrambledbacon|denveromelet)$/;
    for (const n of [3, 4, 2]){
        const {p, ctx} = await open({country: 'US', uiLang: 'en', dishCount: n}, {locale: 'en-US'});
        const r = await p.evaluate(n => {
            const keep = session.menu; let bf = [], noStarch = 0, ex = '';
            for (let i = 0; i < 200; i++){
                session.rejected.clear(); newMenu();
                const it = session.menu.items;
                it.filter(x => x.r && x.slot === '主菜').forEach(x => { if (x.r.meal === 'breakfast') bf.push(x.r.id); });
                if (!it.some(x => x.r && x.r.starch)){ noStarch++; ex = ex || it.map(x => x.r && x.r.name).join(' / '); }
            }
            const week = (makeWeek(), (S.week.days || []).map(x => x.id));
            session.menu = keep;
            return {bf: [...new Set(bf)], noStarch, ex, week, inSearch: RECIPES.some(r => r.id === 'us_pancakes')};
        }, n);
        ok(!r.bf.length, `R4-1 ${n}品: 主菜に朝食の料理が出ない: ` + r.bf.join());
        ok(r.noStarch === 0, `R4-2 ${n}品: 主食になる物（パン・じゃがいも・米・トルティーヤ・麺）がどの献立にもある: ${r.noStarch}/200 ` + r.ex);
        if (n === 3){
            ok(!r.week.some(id => BF.test(id)), 'R4-3 1週間プランにも朝食の料理を出さない: ' + r.week.join());
            ok(r.inSearch, 'R4-4 Pancakes は料理の一覧（さがす・自分で選ぶ）には残っている');
        }
        await ctx.close();
    }
    // 画面: 副菜を「かえる」しても、主菜と汁ものは変わらず、副菜は主食になる物のまま
    {
        const {p, ctx} = await open({country: 'US', uiLang: 'en', dishCount: 3}, {locale: 'en-US'});
        let bad = '';
        for (let k = 0; k < 6; k++){
            const before = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
            const si = await p.evaluate(() => session.menu.items.findIndex((x, j) => j > 0 && x.slot === '副菜' && document.querySelector(`.tray [data-act="reroll"][data-i="${j}"]`)));
            if (si < 0){ bad = 'かえるボタンがない'; break; }
            await p.evaluate(j => document.querySelector(`.tray [data-act="reroll"][data-i="${j}"]`).click(), si); await p.waitForTimeout(250);
            const after = await p.evaluate(() => session.menu.items.map(x => ({id: x.r && x.r.id, st: !!(x.r && x.r.starch)})));
            const mainSt = await p.evaluate(() => !!(session.menu.items[0].r && session.menu.items[0].r.starch));
            if (after.some((x, j) => j !== si && x.id !== before[j])) { bad = 'ほかの料理が変わった ' + before.join() + ' → ' + after.map(x => x.id).join(); break; }
            if (!mainSt && !after[si].st){ bad = '主食のない献立になった ' + after.map(x => x.id).join(); break; }
        }
        ok(!bad, 'R4-5 副菜を続けて「かえる」しても、ほかの料理は変わらず、主食がなくならない: ' + bad);
        await ctx.close();
    }
    // 主食に Dinner rolls を選んでいるときは、副菜を主食に寄せない（主食は1つで足りる）
    {
        const {p, ctx} = await open({country: 'US', uiLang: 'en', dishCount: 3, stapleBy: {US: 'rolls'}}, {locale: 'en-US'});
        const r = await p.evaluate(() => { let st = 0, n = 0; for (let i = 0; i < 150; i++){ session.rejected.clear(); newMenu(); const x = session.menu.items.find(x => x.slot === '副菜' && x.r); if (x){ n++; if (x.r.starch) st++; } } return {spot: !!stapleSpot(), rate: st / Math.max(1, n)}; });
        ok(r.spot && r.rate < 0.8, 'R4-6 主食を選んでいる日は、副菜を主食に寄せない: ' + JSON.stringify(r));
        await ctx.close();
    }
}

// ---- R5 ベトナム語の画面: 和食の料理名・冷蔵庫の「trứng」 ----
if (want('R5')){
    const {p, ctx} = await open({country: 'JP', uiLang: 'vi'}, {locale: 'vi-VN'});
    await p.waitForFunction(() => typeof PACK_TR !== 'undefined' && PACK_TR['JP.vi'] && PACK_TR['JP.en'], null, {timeout: 20000}).catch(() => {});
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
        const en = PACK_TR['JP.en'], same = RECIPES.filter(x => en.recipes[x.id] && x.name === en.recipes[x.id].name).map(x => x.id);
        const nk = RECIPES.find(x => x.id === 'nikuudon');
        return {menu: session.menu.items.filter(x => x.r).map(x => x.r.name), same, nk: nk.name, ing: nk.items.map(i => i.name).join(' / '), steps: nk.steps.length, enSteps: en.recipes.nikuudon.steps.length, slang: nk.slang,
            shown: document.querySelector('#view').innerText.includes(session.menu.items[0].r.name)};
    });
    ok(!r.same.length, 'R5-1 和食の料理名がすべてベトナム語（英語のままの料理: ' + r.same.length + '）: ' + r.same.slice(0, 5).join());
    ok(/^Mì udon thịt bò/.test(r.nk) && /thịt bò/.test(r.ing), 'R5-2 肉うどんの名前と材料がベトナム語: ' + r.nk + ' | ' + r.ing);
    ok(r.steps === r.enSteps && r.slang === 'en', 'R5-3 手順は英語の訳を使う（日本語のまま出さない）: ' + r.steps + '/' + r.enSteps + ' ' + r.slang);
    ok(r.shown, 'R5-4 今日の献立にベトナム語の料理名が出る: ' + r.menu.join(' / '));
    // 冷蔵庫に入れて、料理が見つかる
    for (const w of ['trứng', 'Trứng, hành tây', 'thịt lợn', 'đậu hũ']){
        await p.click('nav.tabs [data-tab="fridge"]'); await p.waitForTimeout(250);
        await p.evaluate(() => { S.fridge = []; save(); render(); });
        await p.fill('#ing-input', w); await p.click('form[data-form="add-ing"] button[type=submit]'); await p.waitForTimeout(400);
        const q = await p.evaluate(() => ({fridge: S.fridge.map(keyOf), res: (document.querySelector('#fridge-results') || {}).innerText || '', bad: [...document.querySelectorAll('.c-bad')].map(e => e.textContent).join(' | ')}));
        ok(q.fridge.length && !q.bad && !/Không tìm thấy món nào/.test(q.res) && q.res.length > 40, `R5-5 冷蔵庫に「${w}」→ 料理が見つかる: ` + q.fridge.join() + ' | ' + q.bad + ' | ' + q.res.slice(0, 80).replace(/\n/g, '/'));
    }
    ok(await p.evaluate(() => S.fridge.length > 0 && S.fridge.every(f => typeof f === 'string')), 'R5-6 冷蔵庫の保存の形は今までどおり（食材の名前の文字列）');
    await ctx.close();
    // 英語の画面は今までどおり
    {
        const {p, ctx} = await open({country: 'JP', uiLang: 'en'}, {locale: 'en-US'});
        await p.waitForTimeout(500);
        const n = await p.evaluate(() => RECIPES.find(x => x.id === 'nikuudon').name);
        ok(/^Niku udon/.test(n), 'R5-7 英語の画面の和食の料理名は英語のまま: ' + n);
        await ctx.close();
    }
}

// ---- R9 置き換えた料理の手順の文（豆腐に「1枚ずつ広げて色が変わるまで」が残らない） ----
if (want('R9')){
    const sweep = (p) => p.evaluate(() => {
        const NG = /1枚ずつ広げ|赤みがなくなる|脂を出|余分な脂|筋を切|色が変わ|\bno pink\b|\bno longer pink\b|changes? colou?r/i, out = {n: 0, bad: [], left: []};
        RECIPES.forEach(r0 => {
            const r = swappedRecipe(r0); if (!r.swapped) return;
            const tofu = r.swapped.swaps.filter(x => x.tip === 'tofu'); if (!tofu.length) return; out.n++;
            r.steps.forEach((s, k) => { const tx = String(typeof s === 'string' ? s : s.t);
                tx.split(/(?<=[。.])\s*/).forEach(sn => { if (tofu.some(x => [x.to.name, x.to.label, 'tofu'].some(n => n && sn.toLowerCase().includes(String(n).toLowerCase()))) && NG.test(sn)) out.bad.push(r0.id + '#' + k + ' ' + sn); });
                if (/\b(?:pork|beef|meat)\b(?! (?:stock|broth|bouillon|fat))|(?<![一-龠ァ-ヶーきぎ])肉(?![一-龠ァ-ヶーじ])/.test(tx) && !r.items.some(i => ['豚', '鶏', '牛', 'ひき肉'].includes(FAMILY[i.key]))) out.left.push(r0.id + '#' + k + ' ' + tx); });
        });
        return out;
    });
    for (const [lang, avoid, locale] of [['ja', ['肉', '魚'], 'ja-JP'], ['en', ['pork', 'chicken', 'beef'], 'en-US'], ['vi', ['豚肉', '鶏肉', '牛肉'], 'vi-VN']]){
        const {p, ctx} = await open({uiLang: lang, avoid}, {locale});
        await p.waitForTimeout(400);
        const r = await sweep(p);
        ok(r.n >= 5 && !r.bad.length, `R9-1 ${lang}: 豆腐に置き換えた料理（${r.n}品）の手順に、肉だけの言い方が残らない: ` + r.bad.slice(0, 3).join(' | '));
        ok(!r.left.length, `R9-2 ${lang}: 肉をすべて置き換えた料理の手順に「肉」「pork」などが残らない: ` + r.left.slice(0, 3).join(' | '));
        await ctx.close();
    }
    // 英語の手順で、豚肉→鶏肉に置き換えたとき「the pork」が残らない
    {
        const {p, ctx} = await open({uiLang: 'en', avoid: ['pork']}, {locale: 'en-US'});
        await p.waitForTimeout(400);
        const r = await p.evaluate(() => RECIPES.map(r0 => swappedRecipe(r0)).filter(r => r.swapped && r.swapped.swaps.some(x => FAMILY[x.from.key] === '豚')).flatMap(r => r.steps.map(s => String(typeof s === 'string' ? s : s.t)).filter(t => /\bpork\b/i.test(t)).map(t => r.id + ' ' + t)));
        ok(!r.length, 'R9-3 en: 豚肉を替えた料理の手順に「pork」が残らない: ' + r.slice(0, 3).join(' | '));
        await ctx.close();
    }
    // 画面: 肉と魚を外した人が冷しゃぶサラダの作り方を開く
    {
        const {p, ctx} = await open({avoid: ['肉', '魚']});
        await p.evaluate(() => openModal('reishabu')); await p.waitForTimeout(400);
        const txt = await p.evaluate(() => document.querySelector('#modal-root').innerText);
        await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/R9_reishabu.png'}).catch(() => {});
        ok(/木綿豆腐を食べやすく切って入れ、2分ほどゆでて温める/.test(txt) && !/1枚ずつ広げて色が変わるまで/.test(txt), 'R9-4 冷しゃぶサラダ（豆腐）の手順が豆腐に合う文: ' + (txt.match(/[^\n]*木綿豆腐[^\n]*ゆで[^\n]*/) || [''])[0]);
        ok(/豚しゃぶしゃぶ用肉 の代わりに 木綿豆腐/.test(txt), 'R9-5 置き換えの説明はそのまま出る');
        await ctx.close();
    }
}

await b.close();
if (errs.length){ console.log('ページのエラー:', [...new Set(errs)].slice(0, 5)); }
console.log(`panel-r4: ${checks - fails}/${checks} 成功`);
process.exit(fails || errs.length ? 1 : 0);
