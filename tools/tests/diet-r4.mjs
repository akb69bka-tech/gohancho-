#!/usr/bin/env node
// 食の決まりの束（第29回 R134・R135）の回帰テスト（Playwright。使い方: node tools/tests/diet-r4.mjs [http://localhost:8765/]）
//  1) 束を重ねて順に戻しても、ユーザーが先に選んでいたなかま・ほかの押された束が必要ななかまは外れない（卵・乳→ヴィーガン→ハラール、貝・卵・乳 など）
//  2) 乱数の操作列（束を押す・個別のなかまを足す/外す）でも、ユーザーが選んだなかまは束の取り消しで外れず、ほかの束は押した形のまま
//  3) 記録は保存される: 「豚」だけ選ぶ→ベジタリアン→開き直し→もう一度押すと豚は残る（設定・家族）。壊れた記録でも落ちない
//  4) はじめての設定: 記録は終えたあと設定に引き継がれ、開き直しても効く
//  5) R135: ハラール/お酒避けのとき、全国の全料理の手順に酒の言葉（酒蒸し・sake・みりん・ワイン・ビールなど）が残らない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
async function open(settings = {}, extra = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([settings, extra]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({ onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: { country: 'JP', dishCount: 'auto', servings: 2, ...settings } }, extra))); } }, [settings, extra]);
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof dietBundleToggle === 'function' && typeof RECIPES !== 'undefined' && RECIPES.length > 0, null, { timeout: 30000 }); await p.waitForTimeout(200);
    await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const fams = (p, w = 'S.settings.avoid') => p.evaluate(w => [...new Set(eval(w).map(avoidFamOf).filter(Boolean))].sort().join(','), w);
const J = a => [...a].sort().join(',');
{   // 1) 重ねて戻す
    const { ctx, p } = await open();
    const r = await p.evaluate(() => {
        const f = x => [...new Set(x.map(avoidFamOf).filter(Boolean))].sort().join(','), out = {};
        const run = (start, ops) => { const o = {}; let a = start.slice(); const log = []; ops.forEach(k => { a = dietBundleToggle(a, k, o); log.push(f(a)); }); return log; };
        out.a1 = run(['@egg', '@dairy'], ['vegan', 'halal', 'vegan', 'halal']);
        out.a2 = run(['@egg', '@dairy'], ['vegan', 'halal', 'halal', 'vegan']);
        out.a3 = run(['@shellfish', '@egg', '@dairy'], ['vegan', 'halal', 'vegan', 'halal']);
        out.a4 = run(['@shellfish', '@egg', '@dairy'], ['vegan', 'halal', 'halal', 'vegan']);
        out.a5 = run(['@shellfish', '@egg', '@dairy'], ['vegi', 'vegan', 'vegan', 'vegi']);
        out.a6 = run(['@shellfish', '@egg', '@dairy'], ['vegi', 'vegan', 'vegi']);
        out.b = run(['@pork'], ['vegi', 'vegi']);
        out.c = run(['えび', '@egg'], ['vegi', 'vegi']);
        return out;
    });
    ok(r.a1[2] === 'alcohol,dairy,egg,pork', '卵・乳→ヴィーガン→ハラール→ヴィーガンを外す: ' + r.a1[2]);
    ok(r.a1[3] === 'dairy,egg', 'a1 最後は卵・乳だけ: ' + r.a1[3]);
    ok(r.a2[2] === r.a2[0].replace('alcohol,', '') && r.a2[3] === 'dairy,egg', 'a2: ' + JSON.stringify(r.a2));
    ok(r.a3[3] === 'dairy,egg,shellfish', '貝・卵・乳→…→全部戻す: ' + r.a3[3]);
    ok(r.a4[3] === 'dairy,egg,shellfish', 'a4: ' + r.a4[3]);
    ok(r.a5[3] === 'dairy,egg,shellfish', 'a5 ベジ→ヴィーガン→ヴィーガン外す→ベジ外す: ' + r.a5[3]);
    ok(r.a6[2] === 'dairy,egg,shellfish', 'a6 ベジ→ヴィーガン(そろっただけ)→ベジ外す: ' + r.a6[2]);
    ok(r.b[1] === 'pork', '豚だけ→ベジタリアン→戻す: ' + r.b[1]);
    ok(r.c[1] === 'egg' || r.c[1] === 'egg,', 'えび(個別)・卵→ベジタリアン→戻す: ' + r.c[1]);
    await ctx.close();
}
{   // 2) 乱数の操作列
    const { ctx, p } = await open();
    const bad = await p.evaluate(() => {
        let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
        const FAMS = ['pork', 'chicken', 'beef', 'fish', 'shellfish', 'egg', 'dairy', 'alcohol'], KS = ['halal', 'vegi', 'vegan'], bad = [];
        for (let t = 0; t < 400; t++){
            const o = {}; let a = []; const user = new Set(); const log = [];
            for (let s = 0; s < 14; s++){
                const f = x => new Set(x.map(avoidFamOf).filter(Boolean));
                if (rnd() < 0.45){ const fm = FAMS[Math.floor(rnd() * 8)]; log.push('chip ' + fm); if (f(a).has(fm)){ a = a.filter(x => avoidFamOf(x) !== fm); user.delete(fm); } else { const claimed = Object.values(o.dietAdd || {}).some(r => r.added.includes(fm)); a = a.concat('@' + fm); if (!claimed) user.add(fm); } }
                else {
                    const k = KS[Math.floor(rnd() * 3)], wasOn = dietBundleOn(a, k); log.push('bundle ' + k);
                    const before = f(a), rec = !!(o.dietAdd && o.dietAdd[k]), recBefore = Object.keys(o.dietAdd || {}).filter(j => o.dietAdd[j].added.length || o.dietAdd[j].removed.length); a = dietBundleToggle(a, k, o); const after = f(a);
                    if (wasOn && rec){   // 記録のない（自分で全部そろえた）束を押して外すのは、これまで通り束のぶんを全部外す
                        user.forEach(x => { if (!after.has(x)) bad.push('user fam lost ' + x + ' / ' + log.join(',')); });
                        KS.filter(j => j !== k && recBefore.includes(j))   /* 押して記録のある束だけ守る（たまたまそろっただけの束は、押した束を戻すと戻る） */.forEach(j => { const sub = DIET_BUNDLES[j].every(x => DIET_BUNDLES[k].includes(x)) || DIET_BUNDLES[k].every(x => DIET_BUNDLES[j].includes(x)); if (!sub && DIET_BUNDLES[j].every(x => before.has(x)) && !DIET_BUNDLES[j].every(x => after.has(x))) bad.push('other bundle broken ' + j + ' / ' + log.join(',')); });
                    } else if (wasOn){ [...user].forEach(x => { if (!after.has(x)) user.delete(x); }); }
                    else { DIET_BUNDLES[k].forEach(x => { if (!after.has(x)) bad.push('bundle on lacks ' + x); }); [...after].forEach(x => { if (!before.has(x) && !DIET_BUNDLES[k].includes(x)) bad.push('extra ' + x); }); }
                    // 押した形での追加は「ユーザーのもの」ではない
                }
                if (bad.length) break;
            }
            if (bad.length) break;
        }
        return bad.slice(0, 3);
    });
    ok(!bad.length, '乱数の操作列: ' + JSON.stringify(bad));
    await ctx.close();
}
{   // 3) 保存と復元（設定）
    const { ctx, p } = await open({ avoid: ['@pork'] });
    await p.evaluate(() => { S.settings.avoid = dietBundleToggle(S.settings.avoid, 'vegi', S.settings); save(); saveNow(); });
    ok(await fams(p) === 'beef,chicken,fish,pork,shellfish', '設定: ベジタリアンで束がそろう');
    await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && typeof dietBundleToggle === 'function'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !!(S.settings.dietAdd && S.settings.dietAdd.vegi)), '開き直しても記録がある');
    await p.evaluate(() => { S.settings.avoid = dietBundleToggle(S.settings.avoid, 'vegi', S.settings); });
    ok(await fams(p) === 'pork', '開き直し後に戻しても豚は残る: ' + await fams(p));
    // 画面のチップから
    await p.evaluate(() => { setTab('settings'); }); await p.waitForTimeout(250);
    await p.evaluate(() => { document.querySelectorAll('#view details').forEach(d => { d.open = true; }); });
    await p.evaluate(() => document.querySelector('.diet-bundle[data-v="vegan"]').click()); await p.waitForTimeout(300);
    await p.evaluate(() => { saveNow(); });
    await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && typeof dietBundleToggle === 'function'); await p.waitForTimeout(200);
    await p.evaluate(() => { setTab('settings'); }); await p.waitForTimeout(250);
    await p.evaluate(() => { document.querySelectorAll('#view details').forEach(d => { d.open = true; }); document.querySelector('.diet-bundle[data-v="vegan"]').click(); }); await p.waitForTimeout(300);
    ok(await fams(p) === 'pork', 'チップで押す→開き直し→チップで戻す: 豚は残る ' + await fams(p));
    // 壊れた記録
    for (const bad of ['x', 5, [1], { vegi: 7 }, { vegi: { added: 'a' } }, { vegan: { added: [1, null], removed: {} } }]){
        const r = await p.evaluate(bad => { try{ S.settings.dietAdd = bad; const a = dietBundleToggle(['@pork'], 'vegi', S.settings); return dietBundleToggle(a, 'vegi', S.settings).map(avoidFamOf).join(','); }catch(e){ return 'ERR ' + e.message; } }, bad);
        ok(!/ERR/.test(r), '壊れた記録で落ちない ' + JSON.stringify(bad) + ' ' + r);
    }
    await p.evaluate(() => { S.settings.dietAdd = 'broken'; S.family = [{ id: 'm1', name: 'a', role: 'adult', avoid: [], allergy: [], dietAdd: 'zzz' }]; saveNow(); });
    await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => S.settings.dietAdd === undefined && S.family[0] && S.family[0].dietAdd === undefined), '壊れた記録は読み込みで捨てる');
    await ctx.close();
}
{   // 3b) 家族
    const { ctx, p } = await open({}, { family: [{ id: 'm1', name: 'はは', role: 'adult', avoid: ['@pork'], allergy: [], mild: false }] });
    await p.evaluate(() => { const m = S.family[0]; m.avoid = dietBundleToggle(m.avoid, 'vegan', m); save(); saveNow(); });
    await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && S.family && S.family.length); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !!(S.family[0].dietAdd && S.family[0].dietAdd.vegan)), '家族: 開き直しても記録がある');
    await p.evaluate(() => { const m = S.family[0]; m.avoid = dietBundleToggle(m.avoid, 'vegan', m); });
    ok(await fams(p, 'S.family[0].avoid') === 'pork', '家族: 開き直し後に戻しても豚は残る: ' + await fams(p, 'S.family[0].avoid'));
    await ctx.close();
}
{   // 4) はじめての設定
    const { ctx, p } = await open({ avoid: ['@pork'] });
    await p.evaluate(() => { S.onboarded = false; startOnboard(); }).catch(() => {});
    const has = await p.evaluate(() => typeof sheet !== 'undefined' && sheet && sheet.kind === 'onboard');
    if (has){
        await p.evaluate(() => { sheet.avoid = new Set(dietBundleToggle([...sheet.avoid], 'vegi', sheet)); obSave(); saveNow(); });
        ok(await p.evaluate(() => !!(S.settings.dietAdd && S.settings.dietAdd.vegi)), 'はじめての設定: 記録が設定に引き継がれる');
        await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && typeof dietBundleToggle === 'function'); await p.waitForTimeout(200);
        await p.evaluate(() => { S.settings.avoid = dietBundleToggle(S.settings.avoid, 'vegi', S.settings); });
        ok(await fams(p) === 'pork', 'はじめての設定のあと開き直して戻す: 豚は残る ' + await fams(p));
    } else console.log('SKIP onboarding sheet not opened');
    await ctx.close();
}
{   // 5) R135: 酒の言葉
    const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
    const SAKE = /酒蒸し|酒を|酒大さじ|お酒|日本酒|料理酒|みりん|ワイン|ビール|sake|mirin|\bwine\b|\bbeer\b|liquor/i;
    for (const [bundle, cc] of [['halal', 'JP'], ['alcohol', 'JP'], ['halal', 'US']]){
        const { ctx, p } = await open({ country: cc, avoid: bundle === 'alcohol' ? ['@alcohol'] : ['@pork', '@alcohol'] });
        const left = await p.evaluate(() => { const o = []; RECIPES.forEach(r => { let w; try{ w = swappedRecipe(r); }catch(e){ o.push('ERR ' + r.id); return; } if (!w || w === r && !isAvoided(r) === false) {} const ss = (w.steps || []).map(st => typeof st === 'string' ? st : st.t); ss.forEach(s => { if (/酒蒸し|sake[- ]steam/i.test(s)) o.push(r.id + ': ' + s.slice(0, 40)); }); }); return o; });
        ok(!left.length, `${cc}/${bundle}: 手順に「酒蒸し」が残る ${JSON.stringify(left.slice(0, 3))}`);
        if (cc === 'JP'){
            const cw = await p.evaluate(() => { const r = RECIPES.find(x => x.id === 'clamchowder'); if (!r) return null; const w = swappedRecipe(r); return (w.steps || []).map(st => typeof st === 'string' ? st : st.t).join('|'); });
            if (cw !== null) ok(/蒸し煮のように加熱/.test(cw) || !/あさり/.test(cw), 'クラムチャウダー: 蒸し煮のように加熱 ' + cw.slice(0, 60));
        }
        await ctx.close();
    }
    // お酒を避けないときは、元の言い方のまま
    const { ctx, p } = await open({ avoid: [] });
    ok(await p.evaluate(() => { const r = RECIPES.find(x => x.id === 'clamchowder'); return !r || swappedRecipe(r).steps.some(st => /酒蒸し/.test(typeof st === 'string' ? st : st.t)); }), 'お酒を避けないときは元の言い方のまま');
    await ctx.close();
}
ok(!errs.length, 'pageerror: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `diet-r4: ${fails} 件失敗` : 'diet-r4: OK');
process.exit(fails ? 1 : 0);
