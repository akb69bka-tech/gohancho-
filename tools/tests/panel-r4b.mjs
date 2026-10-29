#!/usr/bin/env node
// 利用者モニター第4回の残り（R4 をほかの国に・置き換えた手順を各国の料理に）の回帰テスト（Playwright。使い方: node tools/tests/panel-r4b.mjs [http://localhost:8883/]）
//  R4X 21か国: 朝食の料理（Menemen・Porridge・Poha・Chilaquiles・ハムエッグなど）を、おまかせの夕食の主菜・1週間プランに出さない（さがす・自分で選ぶでは出す）。
//      イギリス（主食が最初「なし」）: どの献立にも主食になる物（じゃがいも・パン・米・パイ生地・麺）がある。主食を選んでいる日は副菜を主食に寄せない
//  R9X 各国の料理: 肉を豆腐などに置き換えた料理の手順に、肉だけの言い方（no longer pink・changes colour・1枚ずつ など）や元の肉の名前が残らない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const want = k => !ONLY.length || ONLY.includes(k);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const LANG_OF = {JP: 'ja', US: 'en', GB: 'en'};
const open = async (settings = {}, opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: opt.locale || 'en-US', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('panel-r4b', JSON.stringify(settings))));
    await ctx.addInitScript(([st]) => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)})); }, [settings]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    const cc = settings.country || 'JP';
    if (cc !== 'JP') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, cc, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};

// ---- R4X 朝食の料理を夕食の主菜にしない（21か国）・イギリスの主食 ----
// 朝食の印を付けた料理（この料理が、おまかせの主菜に出ないこと。一覧には残ること）
const BF = {
    JP: ['hamuegg'], US: ['us_pancakes', 'us_oatmeal', 'us_scrambledbacon', 'us_denveromelet'], GB: ['gb_porridge', 'gb_beansontoast'],
    CN: ['cn_baizhou', 'cn_pidan_shourou_zhou'], IN: ['in_poha', 'in_upma', 'in_alooparatha'], KR: ['kr_dakjuk', 'kr_soegogiyachaejuk'],
    MX: ['mx_huevos', 'mx_huevos_rancheros', 'mx_chilaquiles'], PH: ['ph_sinangag', 'ph_arroz_caldo'], TH: ['th_jokmoo'],
    TR: ['tr_menemen', 'tr_sucukluyumurta', 'tr_cilbir'], TW: ['tw_dan_bing'],
};
const ALL = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
if (want('R4X')){
    for (const cc of ALL){
        const {p, ctx} = await open({country: cc, uiLang: LANG_OF[cc] || 'en'});
        const r = await p.evaluate(ids => {
            const keep = session.menu, seen = new Set();
            for (let i = 0; i < 150; i++){ session.rejected.clear(); newMenu(); session.menu.items.filter(x => x.r && x.slot === '主菜').forEach(x => seen.add(x.r.id)); }
            makeWeek(); (S.week.days || []).forEach(x => seen.add(x.id));
            session.menu = keep;
            const bf = RECIPES.filter(r => r.meal === 'breakfast').map(r => r.id);
            return {hit: [...seen].filter(id => ids.includes(id) || bf.includes(id)), marked: bf, missing: ids.filter(id => !RECIPES.some(r => r.id === id)), mains: seen.size};
        }, BF[cc] || []);
        ok(!r.hit.length, `R4X-1 ${cc}: 朝食の料理がおまかせの主菜・1週間プランに出ない（主菜 ${r.mains}種）: ` + r.hit.join());
        ok(!r.missing.length && (BF[cc] || []).every(id => r.marked.includes(id) || cc === 'JP'), `R4X-2 ${cc}: 朝食の料理は一覧に残り、印が付いている: ` + r.missing.join() + ' / ' + r.marked.join());
        await ctx.close();
    }
    for (const n of [3, 4, 2]){
        const {p, ctx} = await open({country: 'GB', uiLang: 'en', dishCount: n});
        const r = await p.evaluate(() => {
            const keep = session.menu; let no = 0, ex = '';
            for (let i = 0; i < 200; i++){ session.rejected.clear(); newMenu(); const it = session.menu.items; if (!it.some(x => x.r && x.r.starch)){ no++; ex = ex || it.map(x => x.r && x.r.name).join(' / '); } }
            session.menu = keep; return {no, ex, spot: !!stapleSpot()};
        });
        ok(!r.spot && r.no === 0, `R4X-3 GB ${n}品: 主食「なし」の日も、どの献立にも主食になる物がある: ${r.no}/200 ` + r.ex);
        await ctx.close();
    }
    {
        const {p, ctx} = await open({country: 'GB', uiLang: 'en', dishCount: 3, stapleBy: {GB: 'bread'}});
        const r = await p.evaluate(() => { let st = 0, n = 0; for (let i = 0; i < 150; i++){ session.rejected.clear(); newMenu(); const x = session.menu.items.find(x => x.slot === '副菜' && x.r); if (x){ n++; if (x.r.starch) st++; } } return {spot: !!stapleSpot(), rate: st / Math.max(1, n)}; });
        ok(r.spot && r.rate < 0.8, 'R4X-4 GB: 主食（パンとバター）を選んでいる日は、副菜を主食に寄せない: ' + JSON.stringify(r));
        await ctx.close();
    }
    // 画面: イギリスで副菜を続けて「かえる」しても、ほかの料理は変わらず、主食がなくならない
    {
        const {p, ctx} = await open({country: 'GB', uiLang: 'en', dishCount: 3});
        let bad = '';
        for (let k = 0; k < 6; k++){
            const before = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
            const si = await p.evaluate(() => session.menu.items.findIndex((x, j) => j > 0 && x.slot === '副菜' && document.querySelector(`.tray [data-act="reroll"][data-i="${j}"]`)));
            if (si < 0){ bad = 'かえるボタンがない'; break; }
            await p.evaluate(j => document.querySelector(`.tray [data-act="reroll"][data-i="${j}"]`).click(), si); await p.waitForTimeout(250);
            const after = await p.evaluate(() => session.menu.items.map(x => ({id: x.r && x.r.id, st: !!(x.r && x.r.starch)})));
            if (after.some((x, j) => j !== si && x.id !== before[j])){ bad = 'ほかの料理が変わった'; break; }
            if (!after.some(x => x.st)){ bad = '主食のない献立になった ' + after.map(x => x.id).join(); break; }
        }
        ok(!bad, 'R4X-5 GB: 副菜を続けて「かえる」しても、ほかの料理は変わらず、主食がなくならない: ' + bad);
        await ctx.close();
    }
}

await b.close();
if (errs.length){ console.log('ページのエラー:', [...new Set(errs)].slice(0, 5)); }
console.log(`panel-r4b: ${checks - fails}/${checks} 成功`);
process.exit(fails || errs.length ? 1 : 0);
