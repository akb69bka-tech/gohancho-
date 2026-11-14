#!/usr/bin/env node
// 二日酔いの日の「あっさり」の見分け直し（第33回モニター R155・R157）の回帰テスト（Playwright。使い方: node tools/tests/hang-r2.mjs [http://localhost:8765/]）
//  R1 こってりの例（かつ丼・すき焼き・牛丼・ハヤシライス・カレーうどん・ハンバーグ・焼き餃子・照り焼き・ボロネーゼ／ミートソース・ピカディージョ）が、21か国のどこでも「あっさり」に入らない
//  R2 焼く・炒める・揚げる料理は、作り方に「蒸し焼き」があっても「蒸す」に数えない（汁けの多い料理・日本の表の料理を除いて、あっさりに入らない）。
//     煮る主菜でも、牛肉・ひき肉が主役の料理・ルウ／クリームのソース・甘辛いたれの料理はあっさりに入らない
//  R3 21か国で、オンの最初の案（300回）の主菜のうち、いちばん多い1品が 22% 以下（少ない国で同じ1品ばかりにならない）。オフより主菜のあっさりが減らない
//  R4 設定のモードのタブに「二日酔いの日（今日だけ）」の切り替え。上の端のモードのシート・条件のシートと同じ値（S.settings.hangover）。押しても今の案は変わらない。
//     家の設定でお酒を避ける（ハラール向けも）なら出さない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const N = Number(process.env.N || 300), TOP_MAX = Number(process.env.TOP_MAX || 0.22);
const KEY = 'gohancho.v1';
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const BASE_ST = {onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 4, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const newPage = async ({w = 390, h = 844, st = BASE_ST, tag = 'h'} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('hang2', tag)));
    await ctx.addInitScript(([st, KEY]) => { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(st)); }, [st, KEY]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};

// ---- R1〜R3（21か国）----
{
    const {p, ctx} = await newPage({tag: 'r1'});
    const HEAVY_RE = 'かつ丼|すき焼|牛丼|ハヤシ|カレーうどん|ハンバーグ|餃子|照り焼|ボロネーゼ|ミートソース|\\bbolognese\\b|picadillo|ピカディージョ|sloppy joe|katsu|sukiyaki|gyoza|teriyaki';
    const seenHeavy = new Set(), rows = [];
    for (const cc of CCS){
        const r = await p.evaluate(async ([cc, N, HEAVY_RE]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.history = []; S.hidden = []; session.mood = 'all'; delete S.settings.hangover;
            const re = new RegExp(HEAVY_RE, 'i'), nm = r => [r.name, r.nameEn || '', ...(r.alt || [])].join(' ');
            const all = RECIPES.filter(r => !isAvoided(r));
            const heavyEx = all.filter(r => re.test(nm(r)) && !/lentil|veg|tofu|豆腐|soja|soy/i.test(nm(r)));
            const heavyLight = heavyEx.filter(hangLight).map(r => r.id);
            // 焼く・炒める・揚げる料理（汁けの多い料理・日本の表の料理を除く）があっさりに入らない
            const grill = all.filter(r => ['焼', '炒', '揚'].includes(r.method) && hangLight(r) && !hangInfo(r).soupy && !HANG_LIGHT_ID.has(r.id) && !(r.pack && r.soft === true)).map(r => r.id);
            // 煮る主菜: 牛肉・ひき肉が主役（汁けの多い料理を除く）・ルウ／クリーム・甘辛いたれ
            const mains = all.filter(r => r.main);
            const meat = mains.filter(r => (r.family === '牛' || r.family === 'ひき肉') && !soupyMain(r) && !HANG_LIGHT_ID.has(r.id) && hangLight(r)).map(r => r.id);
            const sauce = all.filter(r => /クリーム|シチュー|ハヤシ|カレー|curry|stroganoff|teriyaki|照り焼|甘辛|sweet and sour|糖醋/i.test(nm(r)) && hangLight(r)).map(r => r.id);
            const run = on => { if (on) S.settings.hangover = TODAY; else delete S.settings.hangover;
                const cnt = {}; let lt = 0;
                for (let i = 0; i < N; i++){ session.rejected = new Set(); newMenu(); const m = session.menu.items[0].r; if (!m) continue; cnt[m.id] = (cnt[m.id] || 0) + 1; if (hangLight(m) || hangPlain(m)) lt++; }
                const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || ['', 0];
                return {top: top[1] / N, topId: top[0], lt: lt / N}; };
            const off = run(false), on = run(true); delete S.settings.hangover;
            return {heavyEx: heavyEx.map(r => r.id), heavyLight, grill, meat, sauce, off, on};
        }, [cc, N, HEAVY_RE]);
        r.heavyEx.forEach(x => seenHeavy.add(x));
        ok(r.heavyLight.length === 0, `R1 ${cc} こってりの例があっさりに入らない: ${r.heavyLight.join(',')}`);
        ok(r.grill.length === 0, `R2a ${cc} 焼く・炒める・揚げる料理（蒸し焼き）があっさりに入らない: ${r.grill.join(',')}`);
        ok(r.meat.length === 0, `R2b ${cc} 牛肉・ひき肉が主役の主菜があっさりに入らない: ${r.meat.join(',')}`);
        ok(r.sauce.length === 0, `R2c ${cc} ルウ・クリーム・カレー・甘辛いたれの料理があっさりに入らない: ${r.sauce.join(',')}`);
        ok(r.on.top <= TOP_MAX, `R3a ${cc} オンの最初の案で、いちばん多い主菜が ${TOP_MAX * 100}% 以下: ${r.on.topId} ${(r.on.top * 100).toFixed(0)}%`);
        ok(r.on.lt >= r.off.lt, `R3b ${cc} オンで主菜のあっさりが減らない: ${r.off.lt} → ${r.on.lt}`);
        rows.push(`${cc} いちばん多い主菜 ${(r.off.top * 100).toFixed(0)}%→${(r.on.top * 100).toFixed(0)}%（${r.on.topId}）・主菜のあっさり ${(r.off.lt * 100).toFixed(0)}%→${(r.on.lt * 100).toFixed(0)}%`);
    }
    console.log('R3 国別（' + N + '回・シード ' + SEED + '）\n  ' + rows.join('\n  '));
    if (CCS.includes('JP')) for (const id of ['katsudon', 'sukiyaki', 'gyudon', 'hayashi', 'curryudon', 'hamburg', 'gyoza', 'teriyaki', 'meatsauce']) ok(seenHeavy.has(id), 'R1b 日本のこってりの例を見ている: ' + id);
    if (CCS.includes('MX')) ok(seenHeavy.has('mx_picadillo'), 'R1c ピカディージョを見ている');
    await ctx.close();
}

// ---- R4 設定のモードのタブ ----
{
    const {p, ctx} = await newPage({tag: 'r4'});
    const r = await p.evaluate(async () => {
        const o = {}; const tick = () => new Promise(res => setTimeout(res, 60));
        setTab('today'); render(); await tick(); o.before = JSON.stringify(menuIds());
        setTab('settings'); await tick();
        const tabBtn = document.querySelector('#view .set-tab[data-k="mode"]'); if (tabBtn) tabBtn.click(); await tick();
        let card = document.querySelector('#view #hang-card'); o.card = !!card;
        o.inMode = !!card && (card.closest('.set-panel') || {}).dataset?.t === 'mode' && card.offsetParent !== null;
        o.first = !!card && card.parentElement.querySelector('.set-group') === card;
        o.off = card ? !card.querySelector('input[data-act="hangover"]').checked : null;
        card && card.querySelector('input[data-act="hangover"]').click(); await tick();
        saveNow(); o.on = S.settings.hangover === TODAY && JSON.parse(localStorage.getItem('gohancho.v1')).settings.hangover === TODAY;
        card = document.querySelector('#view #hang-card'); o.checked = card ? card.querySelector('input').checked : null;
        o.stay = !!card && !card.closest('.set-panel').hidden;   // 押して描き直しても、モードのタブのまま
        openModeSheet(); const mr = document.querySelector('#sheet-root .mode-row[data-mode="hangover"] input'); o.sheetOn = mr ? mr.checked : null; closeSheet();
        setTab('today'); await tick(); openCondSheet(); const hf = document.querySelector('#hang-field input[data-act="hangover"]'); o.condOn = hf ? hf.checked : null; closeSheet();
        o.after = JSON.stringify(menuIds());
        // シートで切ると設定でも切れている
        openModeSheet(); document.querySelector('#sheet-root .mode-row[data-mode="hangover"] input').click(); closeSheet();
        setTab('settings'); await tick(); const c2 = document.querySelector('#view #hang-card input'); o.offAgain = c2 ? !c2.checked && S.settings.hangover === undefined : null;
        // 説明の文言が、シート・条件のシートと同じ
        o.desc = (document.querySelector('#view #hang-card .small') || {}).textContent || '';
        return o;
    });
    ok(r.card && r.inMode, 'R4a 設定のモードのタブに二日酔いの日の切り替え: ' + JSON.stringify(r));
    ok(r.first, 'R4b モードのタブのいちばん上（モードのシートと同じ並び）');
    ok(r.off === true && r.on && r.checked && r.stay, 'R4c 初期はオフ・押すと今日の日付で保存: ' + JSON.stringify(r));
    ok(r.sheetOn === true && r.condOn === true, 'R4d モードのシート・条件のシートでもオン: ' + JSON.stringify(r));
    ok(r.offAgain === true, 'R4e シートで切ると設定でも切れている');
    ok(r.before === r.after, 'R4f 切り替えても今の案は変わらない: ' + r.before + ' → ' + r.after);
    ok(/汁けの多い料理/.test(r.desc) && !/汁もの多め/.test(r.desc), 'R4g 説明は「汁もの多め」と言い切らない: ' + r.desc);
    await ctx.close();
    for (const [name, avoid] of [['お酒', ['@alcohol']], ['ハラール向け', ['@pork', '@alcohol']]]){
        const c = await newPage({st: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {avoid})}), tag: 'r4' + name});
        const v = await c.p.evaluate(async () => { setTab('settings'); await new Promise(res => setTimeout(res, 60)); const tb = document.querySelector('#view .set-tab[data-k="mode"]'); if (tb) tb.click(); await new Promise(res => setTimeout(res, 60));
            const a = !!document.querySelector('#view #hang-card'); S.settings.hangover = TODAY; render(); await new Promise(res => setTimeout(res, 60)); const bOn = !!document.querySelector('#view #hang-card'); delete S.settings.hangover; save(); return {a, bOn}; });
        ok(!v.a && v.bOn, `R4h 家の設定で${name}: 設定のタブにも出さない（すでにオンなら切れるように出す）: ` + JSON.stringify(v));
        await c.ctx.close();
    }
}

await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー: ' + [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(`hang-r2: ${checks - fails}/${checks} ok` + (fails ? `（${fails} 件 FAIL）` : ''));
process.exit(fails ? 1 : 0);
