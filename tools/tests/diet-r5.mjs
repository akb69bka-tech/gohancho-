#!/usr/bin/env node
// お酒由来の材料（酒粕・料理酒・みりん・ワイン・ビール・チチャ・ラム酒・紹興酒・米酒など）の回帰テスト（第29回 R136。R135 の続き）（Playwright。使い方: node tools/tests/diet-r5.mjs [http://localhost:8765/]）
//  1) 判定の語: 酒粕・酒かす・日本酒・料理酒・みりん・紹興酒・ラム酒・米酒・チチャ・ワインなどはお酒、お酢（ワインビネガー・米酢）とチチャ・モラーダ（紫とうもろこしの飲み物）はお酒でない
//  2) 粕汁（酒粕が主役）は、お酒を避ける設定・ハラール向けでは出さない（画面の言語に依らない）。避けない設定・豚だけ避ける設定では出る
//  3) 全21か国の全料理: ハラール／お酒避けのとき、出す料理の材料（キー・名前・原語名）・調味・手順に、お酒由来の語（酒粕・日本酒・料理酒・みりん・ワイン・ビール・ラム酒・紹興酒・米酒・chicha de jora など）が残らない
//  4) チチャ・デ・ホラを入れない料理（パリウエラ）は、手順の「チチャを注ぐ」も残らない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
async function open(settings = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([settings]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({ onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: { country: 'JP', dishCount: 'auto', servings: 2, ...settings } })); } }, [settings]);
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof dietAlc === 'function' && typeof RECIPES !== 'undefined' && RECIPES.length > 0, null, { timeout: 30000 }); await p.waitForTimeout(200);
    return { ctx, p };
}
{   // 1) 判定の語
    const { ctx, p } = await open();
    const r = await p.evaluate(() => {
        const yes = ['酒粕', '酒かす', 'さけかす', 'サケカス', '日本酒', '料理酒', '酒', 'みりん', '本みりん', '紹興酒', '老酒', 'ラム酒', '米酒', '料酒', 'sake lees', 'cooking sake', 'mirin', 'red wine', 'dark beer', 'chicha de jora', 'Chicha de jora o cerveza', 'rhum', 'rượu gạo', 'マッコリ'];
        const no = ['अजवाइन', 'अजवाइनी अरबी', 'ワインビネガー', 'red wine vinegar', '米酢', '酢', 'chicha morada', 'Chicha morada (opcional)', 'chicharrón', 'salchicha', 'みそ', 'しょうゆ', 'だし', '砂糖'];
        return { yes: yes.filter(x => !dietAlc(algNorm(x))), no: no.filter(x => dietAlc(algNorm(x))) };
    });
    ok(!r.yes.length, '1) お酒と見分けられない語: ' + r.yes.join(','));
    ok(!r.no.length, '1) お酒でないのにお酒と見た語: ' + r.no.join(','));
    await ctx.close();
}
{   // 2) 粕汁
    for (const [label, avoid, want] of [['お酒を避ける', ['@alcohol'], true], ['ハラール向け', ['@pork', '@alcohol'], true], ['避けない', [], false], ['豚だけ避ける', ['@pork'], false]]){
        const { ctx, p } = await open({ avoid });
        for (const lang of ['ja', 'en', 'ar', 'zh-Hans']){
            const got = await p.evaluate(async lang => { if (lang !== 'ja') await setLang(lang); const r = RECIPES.find(x => x.id === 'kasujiru'); return r ? isAvoided(r) : null; }, lang);
            ok(got === want, `2) 粕汁 ${label}/${lang}: 避ける判定 ${got}（期待 ${want}）`);
        }
        await ctx.close();
    }
}
{   // 3) 全21か国の全料理
    const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
    // 画面に出す料理に残ってはいけない語。お酢（〜ビネガー・〜酢・vinegar）は除いて見る
    const ALC = /酒|みりん|味醂|ミリン|ワイン|ビール|ラム酒|リキュール|ブランデー|シェリー|焼酎|紹興|老酒|\bsake\b|\bmirin\b|\bwines?\b|\bbeers?\b|\brum\b|\bbrandy\b|\bliqueur\b|\bliquor\b|\bsherry\b|\bmarsala\b|\bcognac\b|shaoxing|\bvodka\b|\bwhisk(?:e)?y\b|\bbourbon\b|\bsoju\b|\bbaijiu\b|makgeolli|vermouth|\bchampagne\b|prosecco|tequila|\bpisco\b|cacha[cç]a|chicha de jora|\bcerveza\b|\bcerveja\b|\bbirra\b|\bbi[èe]re\b|\bpiwo\b|\bvinho\b|\bvino\b|\bvin (?:blanc|rouge)\b|\bwein\b|rượu|와인|맥주|소주|막걸리|啤酒|葡萄酒|红酒|紅酒|料酒|黄酒|黃酒|米酒|白酒|ไวน์|เหล้า|เบียร์|نبيذ|خمر|شراب|(?<!अज)वाइन|शराब|anggur|şarap/i;
    const VIN = /(?:wine|vino|vin|wein|vinho|wina|sherry|sake|mirin|rice|champagne|cider|malt)[ -]*(?:vinegar|vinagre|vinaigre|essig|ocet|aceto)|(?:vinegar|vinagre|vinaigre|aceto|essig|ocet)\s+(?:de |di |d'|of |z |do )?(?:red |white |rice )?(?:vino|vin|wine|wein|vinho|wina|arroz)|(?:aceto|vinagre|vinaigre|vinagre|ocet|essig)\s+(?:di |de |d'|z )?\S+|\p{L}*weinessig|(?:ワイン|酒|みりん|味醂|米|赤ワイン|白ワイン)(?:ビネガー|酢)|ワイン酢|ワイン?ビネガー|醋|식초|giấm|น้ำส้มสายชู|خل|सिरका|cuka|sirke|ocet/giu;
    for (const [bundle, avoid] of [['halal', ['@pork', '@alcohol']], ['alcohol', ['@alcohol']]]){
        const ccs = bundle === 'halal' ? CCS : ['JP', 'PE', 'TW', 'CN'];
        for (const cc of ccs){
            const { ctx, p } = await open({ country: cc, avoid });
            const res = await p.evaluate(({ src, vsrc }) => {
                const re = new RegExp(src, 'iu'), vin = new RegExp(vsrc, 'giu'), left = []; let shown = 0;
                RECIPES.forEach(r => {
                    let av, w; try{ av = isAvoided(r); w = av ? null : swappedRecipe(r); }catch(e){ left.push('ERR ' + r.id + ' ' + e.message); return; }
                    if (av || !w) return; shown++;
                    const parts = [...(w.items || []).map(i => [i.key, i.name, i.label, i.en, i.stepLabel].filter(Boolean).join(' / ')), w.seas, ...(w.steps || []).map(s => typeof s === 'string' ? s : s.t)];
                    parts.forEach(t => { const s = String(t || '').replace(vin, ' '); const m = s.match(re); if (m) left.push(r.id + ': 「' + m[0] + '」 ' + s.slice(Math.max(0, m.index - 12), m.index + 24)); });
                });
                return { left, shown, total: RECIPES.length };
            }, { src: ALC.source, vsrc: VIN.source });
            ok(res.shown > 20, `3) ${cc}/${bundle}: 出る料理が少なすぎる ${res.shown}/${res.total}`);
            ok(!res.left.length, `3) ${cc}/${bundle}: お酒の語が残る ${JSON.stringify(res.left.slice(0, 4))}`);
            await ctx.close();
        }
    }
}
{   // 4) パリウエラ（チチャ・デ・ホラは入れない）
    const { ctx, p } = await open({ country: 'PE', avoid: ['@alcohol'] });
    const r = await p.evaluate(() => { const x = RECIPES.find(y => y.id === 'pe_parihuela'); if (!x) return null; const av = isAvoided(x); const w = av ? null : swappedRecipe(x); return { av, steps: w ? (w.steps || []).map(s => typeof s === 'string' ? s : s.t).join('|') : '' }; });
    if (r && !r.av) ok(!/chicha/i.test(r.steps), '4) パリウエラ: 手順にチチャが残る ' + r.steps.slice(0, 80));
    const m = await p.evaluate(() => { const x = RECIPES.find(y => y.id === 'pe_arroz_arabe'); return x ? isAvoided(x) : null; });
    ok(m !== true, '4) チチャ・モラーダ（紫とうもろこしの飲み物）の料理は出す');
    await ctx.close();
}
ok(!errs.length, 'pageerror: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `diet-r5: ${fails} 件失敗` : 'diet-r5: OK');
process.exit(fails ? 1 : 0);
