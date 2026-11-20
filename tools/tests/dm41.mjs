#!/usr/bin/env node
// dm41（オーナー指示「糖尿病の人が食べられるレシピの開発と、そのモードの追加」）の回帰テスト。モードの名前は「糖質ひかえめ」（健康・効き目はうたわない）
//  使い方: node tools/tests/dm41.mjs [http://localhost:9241/]   （ONLY=D1,D5 で絞る・CCS=JP,US で D5 の国を絞る）
//  D0 文言（ブラウザ不要）: 新しい文言 13 件が 17 言語にある（日本語が残らない・{n}{name} がある）。名前・説明に病名や効き目の言い方がない。注意の文にも効き目の言い方がない
//  D1 はじめての設定の「使い方」に「糖質ひかえめ」があり、選ぶとモードがオン・献立が出る。注意（主治医・管理栄養士の指示を優先…）がお膳の下に1回だけ出る
//     （「わかりました」で消え、開き直しても・切ってもう一度オンにしても出ない）
//  D2 設定画面・上の「モード」のシートから切り替えられる（どちらも同じ値）。切り替えても、まだ決めていない案・決めた献立は変わらない
//  D3 主食は小盛り: お膳の主食の名前に「小盛り」、糖質の目安も 2/3 の量で数える。オフなら出ない
//  D4 糖質の目安: お膳の下に合計（g）、作り方の画面に1品の目安（g）。値は材料の量 × 食材の表（出典つき）。表にない食材が多い料理は「目安なし」。オフなら出ない
//  D5 21か国: 糖質の多くない料理が 主菜 7・副菜 14・汁もの 7 以上あり、1週間プラン（副菜・汁ものも）が糖質の多い料理を使わず・同じ料理を重ねずに回る。
//     献立（4品）の主菜・副菜・汁ものも、糖質の多くない料理から出る（ご飯もの・麺の主菜は出ない）
//  D6 アレルギー（卵）・食の決まり（ベジタリアン向け）の判定はそのまま（糖質ひかえめでも当たる料理を出さない）。「かえる」は押した料理だけを変える
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];

// ---- D0 文言 ----
const K = {
    name: '糖質ひかえめ',
    desc: 'ご飯・めん・いもを控えめにし、野菜・たんぱく質のおかずを多めにした献立。1人分の糖質の目安（g）を表示',
    more: 'オンにすると、献立を選ぶときに、糖質の少ない料理を先に出し、ご飯もの・めん・いもの多い料理や、甘い煮もの・衣の厚い揚げ物、いも・春雨・めんの入った汁ものは後にします（外しはしません。決めた献立は変えません）。主食は小盛りで表示します。',
    caution: '糖尿病などで食事の指示を受けている方は、主治医・管理栄養士の指示を優先してください。表示の数値は目安です。',
    ok: 'わかりました', staple: '{name}（小盛り）', dish: '糖質 約 {n} g（1人分・目安）', dishLow: '糖質 1 g 未満（1人分・目安）', dishNa: '糖質の目安なし（量や値のわからない材料が多いため）',
    tray: 'お膳の糖質：約 {n} g（1人分・目安。主食は小盛り）', trayNoStaple: 'お膳の糖質：約 {n} g（1人分・目安）',
    trayNa: 'お膳の糖質の目安はありません（「{name}」の目安がないため）', trayNaStaple: 'お膳の糖質の目安はありません（主食の目安がないため）',
};
// 病名（名前・説明・切り替えの説明・表示に出さない。注意の文だけは「糖尿病など」と事実として書く）
const DISEASE = /糖尿|血糖|インスリン|diabet|blood sugar|glucose|insulin|glyc[ae]mi|zucker(?:krank|spiegel)|glyc[ée]mie|glucemia|glicemia|glicemi|cukrzyc|cukier we krwi|şeker hastal|kan şeker|السكري|سكر الدم|मधुमेह|डायबिटीज़|ब्लड शुगर|糖尿病|血糖|당뇨|혈당|เบาหวาน|น้ำตาลในเลือด|đái tháo đường|tiểu đường|đường huyết|gula darah|asukal sa dugo/i;
// 効き目・健康の言い方（全部の文言）
const CLAIM = /健康|改善|予防|治療|治る|下げ|効果|効く|やせ|痩せ|ダイエット|healthy|health|improv|prevent|cure|treat|lower(?:s|ing)? (?:your|blood)|weight loss|lose weight|gesund|verbesser|vorbeug|heil|santé|amélior|prévien|guéri|salud|mejora|previen|cura|saúde|melhora|previne|salute|miglior|prevenzion|zdrow|popraw|zapobieg|lecz|sağlık|iyileş|önle|tedavi|صحة|صحي|تحسين|وقاية|علاج|सेहत|स्वास्थ्य|सुधार|रोकथाम|इलाज|健康|改善|预防|預防|治疗|治療|건강|개선|예방|치료|สุขภาพ|ปรับปรุง|ป้องกัน|รักษา|sức khỏe|cải thiện|phòng ngừa|chữa|kesehatan|memperbaiki|mencegah|mengobati|kalusugan|pagbuti|maiwasan|gamot/i;
if (want('D0')){
    for (const [k, v] of Object.entries(K)){ ok(!CLAIM.test(v), `D0a ja ${k}: 効き目の言い方がない: ${v}`); if (k !== 'caution') ok(!DISEASE.test(v), `D0b ja ${k}: 病名がない: ${v}`); }
    ok(/主治医・管理栄養士の指示を優先/.test(K.caution) && /目安/.test(K.caution), 'D0c 注意の文（主治医・管理栄養士の指示を優先・数値は目安）');
    const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
    ok(Object.values(K).every(v => html.includes("t('" + v + "'")), 'D0d 文言はキー（CARB_TX）で t() に通している');
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    ok(langs.length === 17, 'D0e 辞書が17言語: ' + langs.length);
    const bad = [];
    for (const lg of langs){
        let d = null; const c2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(c2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), c2);
        for (const [k, src] of Object.entries(K)){
            const v = d && d[src];
            if (typeof v !== 'string' || !v) { bad.push(`${lg} ${k} 訳がない`); continue; }
            if (/[ぁ-んァ-ヶ]/.test(v)) bad.push(`${lg} ${k} 日本語が残る`);
            for (const ph of src.match(/\{\w+\}/g) || []) if (!v.includes(ph)) bad.push(`${lg} ${k} ${ph} がない`);
            if (CLAIM.test(v)) bad.push(`${lg} ${k} 効き目の言い方「${v.match(CLAIM)[0]}」`);
            if (k !== 'caution' && DISEASE.test(v)) bad.push(`${lg} ${k} 病名「${v.match(DISEASE)[0]}」`);
        }
    }
    ok(!bad.length, 'D0f 17言語の訳がそろい、病名（注意の文のほか）・効き目の言い方がない: ' + bad.slice(0, 6).join(' / '));
}

const b = await chromium.launch(LAUNCH);
const BASE_ST = {onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('dm41', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const has = (p, fn) => p.evaluate(fn).catch(() => false);
const trayState = p => p.evaluate(() => ({
    on: typeof carbOn === 'function' && carbOn(), note: [...document.querySelectorAll('#view .carb-note')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()),
    sum: ((document.querySelector('#view .carb-sum') || {}).textContent || '').trim(), staple: [...document.querySelectorAll('#view .tray .spot.rice .nm')].map(e => e.textContent).join('|'),
    ids: JSON.stringify(typeof menuIds === 'function' ? menuIds() : [])}));

// ---- D1 はじめての設定で選ぶ・注意は1回だけ ----
if (want('D1')){
    const {p, ctx} = await ctxOf({state: {onboarded: false, firstUse: '2026-10-01', settings: {country: '', uiLang: 'ja', dishCount: 'auto', servings: 2}}}, 'd1');
    await p.waitForSelector('#sheet-root [data-act=cc-choose]', {timeout: 30000});
    await pickCountry(p, 'JP');
    await p.waitForSelector('#sheet-root [data-act=ob-mode]', {timeout: 30000}); await p.waitForTimeout(150);
    const m = await p.evaluate(() => [...document.querySelectorAll('#sheet-root [data-act=ob-mode]')].map(e => ({v: e.dataset.v, nm: (e.querySelector('b') || {}).textContent, d: (e.querySelector('.om-d') || {}).textContent})));
    const carb = m.find(x => x.v === 'carb');
    ok(!!carb && carb.nm === K.name && carb.d === K.desc && ['all', 'ten', 'simple', 'slow', 'diet'].every(k => m.some(x => x.v === k)), 'D1a 使い方に「糖質ひかえめ」（名前と事実だけの説明）。ほかの使い方もそのまま: ' + JSON.stringify(m.map(x => x.v)));
    if (carb){
        await p.click('#sheet-root [data-act=ob-mode][data-v=carb]');
        await p.click('#sheet-root [data-act=ob-done]');
        await p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view .tray'), null, {timeout: 30000}); await p.waitForTimeout(400);
        const s = await trayState(p);
        ok(s.on && s.note.length === 1 && s.note[0].includes(K.caution) && /お膳の糖質/.test(s.sum), 'D1b 選ぶとオン・献立が出る・注意がお膳の下に1つ・糖質の合計が出る: ' + JSON.stringify(s));
        const mood = await p.evaluate(() => ({mood: session.mood, diet: !!S.settings.diet, noted: S.settings.carbNoted === true}));
        ok(mood.mood === 'all' && !mood.diet && mood.noted, 'D1c 気分はおまかせのまま・ダイエットモードはオフ・注意を出したことを覚える: ' + JSON.stringify(mood));
        await p.click('#view .carb-note [data-act=carb-note-ok]'); await p.waitForTimeout(150);
        const s2 = await trayState(p);
        ok(!s2.note.length && s2.ids === s.ids, 'D1d 「わかりました」で消える（献立はそのまま）: ' + JSON.stringify(s2));
        await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, {timeout: 30000}); await p.waitForTimeout(300);
        await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
        const s3 = await trayState(p);
        ok(s3.on && !s3.note.length, 'D1e 開き直しても注意は出ない（モードはオンのまま）: ' + JSON.stringify(s3));
        const s4 = await p.evaluate(async () => { setTab('settings'); setTabShow('mode'); await __tick(); const i = () => document.querySelector('#view #carb-card input[data-act="carb-mode"]'); i().click(); await __tick(); i().click(); await __tick(); setTab('today'); await __tick(); return null; }).then(() => trayState(p));
        ok(s4.on && !s4.note.length, 'D1f 切ってもう一度オンにしても、注意は2回目は出ない: ' + JSON.stringify(s4));
    }
    await ctx.close();
}

// ---- D2 設定・モードのシートで切り替える（献立は変えない） ----
if (want('D2')){
    const {p, ctx} = await ctxOf({state: BASE_ST}, 'd2');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const s0 = await trayState(p);
    ok(!s0.on && !s0.note.length && !s0.sum && !/小盛り/.test(s0.staple), 'D2a はじめはオフ（糖質の行・小盛り・注意なし）: ' + JSON.stringify(s0));
    const r = await p.evaluate(async () => { setTab('settings'); setTabShow('mode'); await __tick(); const i = document.querySelector('#view #carb-card input[data-act="carb-mode"]'); if (!i) return {none: true}; i.click(); await __tick();
        const card = document.querySelector('#view #carb-card').innerText; setTab('today'); await __tick(); return {card, on: carbOn(), saved: (saveNow(), JSON.parse(localStorage.getItem('gohancho.v1')).settings.carb === true)}; });
    const s1 = await trayState(p);
    ok(!r.none && r.on && r.saved && r.card.includes(K.name), 'D2b 設定画面（モードのタブ）のスイッチでオン・保存される: ' + JSON.stringify(r));
    ok(s1.ids === s0.ids && s1.note.length === 1 && /お膳の糖質/.test(s1.sum), 'D2c まだ決めていない案は変わらない・注意が1回・糖質の合計: ' + JSON.stringify({s0: s0.ids, s1}));
    await p.click('#mode-btn'); await p.waitForTimeout(150);
    const ms = await p.evaluate(() => { const r = document.querySelector('#sheet-root .mode-row[data-mode="carb-mode"]'); return r ? {on: r.querySelector('input').checked, nm: r.querySelector('b').textContent, d: [...r.querySelectorAll('.mode-d')].map(x => x.textContent).join('|')} : null; });
    ok(ms && ms.on && ms.nm === K.name && ms.d.includes(K.desc), 'D2d 上の「モード」のシートにも同じスイッチ（オン）: ' + JSON.stringify(ms));
    // 決めた献立は、切り替えても変わらない
    const r2 = await p.evaluate(async () => { closeSheet(); await __tick(); const m = session.menu; S.cook = {d: TODAY, ids: menuIds(), slots: m.items.filter(x => x.r).map(x => x.slot)}; save(); render(); await __tick();
        const c0 = JSON.stringify(S.cook), i0 = JSON.stringify(menuIds());
        openModeSheet(); const inp = () => document.querySelector('#sheet-root .mode-row[data-mode="carb-mode"] input'); inp().click(); await __tick(); const off = !carbOn(); inp().click(); await __tick();
        const o = {off, on: carbOn(), same: JSON.stringify(S.cook) === c0 && JSON.stringify(menuIds()) === i0 && menuIsDecided()}; closeSheet(); delete S.cook; save(); render(); return o; });
    ok(r2.off && r2.on && r2.same, 'D2e シートで切る・入れる。決めた献立は変わらない: ' + JSON.stringify(r2));
    await ctx.close();
}

// ---- D3・D4 小盛り・糖質の目安 ----
if (want('D3') || want('D4')){
    const {p, ctx} = await ctxOf({state: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {carb: true, carbNoted: true})})}, 'd3');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const st = stapleSpot(), mc = menuCarb(session.menu), rs = session.menu.items.map(x => x.r).filter(Boolean);
        const dish = rs.map(r => carbOf(r)), sumDish = dish.reduce((a, c) => a + (c.raw || 0), 0);
        return {st, small: st && carbStaple(st), full: st && CARB_STAPLE[st.id], mc, sumDish, dish: dish.map(c => c.st + ':' + c.v)}; });
    const s = await trayState(p);
    ok(r.st && /小盛り/.test(s.staple) && Math.abs(r.small - r.full * 2 / 3) < 0.01, 'D3a 主食は小盛り（名前に「小盛り」・糖質は 2/3 の量）: ' + JSON.stringify({staple: s.staple, small: r.small, full: r.full}));
    ok(r.mc.st === 'ok' && Math.abs(r.mc.v - Math.round(r.sumDish + r.small)) <= 1 && s.sum.includes(String(r.mc.v)) && /小盛り/.test(s.sum), 'D4a お膳の下に合計の目安（料理＋小盛りの主食）: ' + JSON.stringify({sum: s.sum, mc: r.mc, dish: r.dish}));
    // 作り方の画面（料理の詳細）
    const d = await p.evaluate(async () => { const id = menuIds()[0]; openModal(id); await __tick(); const v = document.querySelector('.cb-v'); const o = {txt: v ? v.textContent : null, want: carbText(carbOf(byId(id)))}; return o; });
    ok(d.txt && d.txt === d.want && /糖質 (約 \d+ g|1 g 未満)/.test(d.txt), 'D4b 作り方の画面に1品の糖質の目安: ' + JSON.stringify(d));
    // 値の確かめ: 豚の生姜焼き（豚ロース 250g・玉ねぎ 1/2個・みりん 大さじ2・醤油 大さじ2・酒 大さじ1・キャベツ 1/8個?）→ 糖質はみりん・玉ねぎ・醤油が中心
    const v = await p.evaluate(() => { const r = byId('shogayaki'), x = kcalRaw(r); return {c: carbOf(r), rows: x.rows.filter(q => q.c).map(q => q.txt + ':' + q.c.toFixed(1))}; });
    ok(v.c.st === 'ok' && v.c.v >= 8 && v.c.v <= 20, 'D4c 値の確かめ（豚の生姜焼き 1人分 8〜20g）: ' + JSON.stringify(v));
    const na = await p.evaluate(() => { const r = {id: 'u_test', name: 'テスト', type: '主菜', main: true, ings: ['ふしぎな食材 200g', 'なぞの粉 100g'], seasBase: '塩 少々', items: []}; return carbText(carbOf(r)); });
    ok(na === K.dishNa, 'D4d 表にない食材が多い料理は「目安なし」（でっち上げない）: ' + na);
    const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
    const blk = src.slice(src.indexOf('糖質ひかえめモード（設定'), src.indexOf('function carbOn()'));
    ok(/日本食品標準成分表（八訂）/.test(blk) && fs.existsSync(path.resolve(ROOT, '../docs/carb-sources.md')) && /日本食品標準成分表（八訂）/.test(fs.readFileSync(path.resolve(ROOT, '../docs/carb-sources.md'), 'utf8')), 'D4e 出典（日本食品標準成分表（八訂））をコードと docs/carb-sources.md に書いている');
    // オフにすると出ない
    const off = await p.evaluate(async () => { if (typeof closeModal === 'function') closeModal(); delete S.settings.carb; save(); render(); await __tick(); return null; }).catch(() => null).then(() => trayState(p));
    const off2 = await p.evaluate(async () => { const id = menuIds()[0]; openModal(id); await __tick(); return !!document.querySelector('.cb-v'); });
    ok(!off.sum && !/小盛り/.test(off.staple) && !off2, 'D3b/D4f オフなら、糖質の行・小盛り・作り方の画面の糖質は出ない: ' + JSON.stringify({off, off2}));
    await ctx.close();
}

// ---- D5 21か国で1週間回る ----
if (want('D5')){
    const {p, ctx} = await ctxOf({state: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {carb: true, carbNoted: true, dishCount: 4, weekSides: true})})}, 'd5');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const ccs = process.env.CCS ? process.env.CCS.split(',') : ALL_CC;
    const lines = [], bad = [];
    for (const cc of ccs){
        const r = await p.evaluate(async cc => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.settings.carb = true; S.settings.weekSides = true; S.settings.dishCount = 4;
            const pool = slot => poolForMood(slot, 'all').filter(r => slotOf(r) === slot && (slot !== '主菜' || r.main) && !isAvoided(r));
            const n = {main: pool('主菜').filter(r => !carbHeavy(r)).length, side: pool('副菜').filter(r => !carbHeavy(r)).length, soup: pool('汁物').filter(r => !carbHeavy(r)).length};
            const out = {n, weekBad: [], menuBad: []};
            for (let k = 0; k < 3; k++){
                S.week = null; makeWeek(); ensureWeekExtras();
                const days = S.week.days, mains = days.map(x => byId(x.id)), sides = days.map(x => byId((x.extra || {}).side)).filter(Boolean), soups = days.map(x => byId((x.extra || {}).soup)).filter(Boolean);
                if (days.length !== 7) out.weekBad.push('days ' + days.length);
                mains.forEach(r => { if (carbHeavy(r)) out.weekBad.push('主菜 ' + r.id); });
                sides.forEach(r => { if (carbHeavy(r)) out.weekBad.push('副菜 ' + r.id); });
                soups.forEach(r => { if (carbHeavy(r)) out.weekBad.push('汁物 ' + r.id); });
                [mains, sides, soups].forEach((l, j) => { const ids = l.map(r => r.id); if (new Set(ids).size !== ids.length) out.weekBad.push(['主菜', '副菜', '汁物'][j] + 'が重なる ' + ids.join(',')); });
            }
            for (let k = 0; k < 6; k++){
                session.rejected.clear(); newMenu();
                session.menu.items.forEach(x => { if (x.r && carbHeavy(x.r)) out.menuBad.push(x.slot + ' ' + x.r.id); });
            }
            S.week = null; save();
            return out;
        }, cc);
        lines.push(`${cc} 主菜${r.n.main} 副菜${r.n.side} 汁物${r.n.soup}`);
        if (r.n.main < 7 || r.n.side < 14 || r.n.soup < 7) bad.push(`${cc} 品数が足りない ${JSON.stringify(r.n)}`);
        if (r.weekBad.length) bad.push(`${cc} 1週間: ${r.weekBad.slice(0, 4).join(' / ')}`);
        if (r.menuBad.length) bad.push(`${cc} 献立: ${r.menuBad.slice(0, 4).join(' / ')}`);
    }
    console.log('   糖質の多くない料理: ' + lines.join(' | '));
    ok(!bad.length, `D5 ${ccs.length}か国: 糖質の多くない料理が 主菜7・副菜14・汁もの7 以上、1週間プラン（3回）と献立（6回）に糖質の多い料理が出ない・重ならない: ` + bad.slice(0, 8).join(' || '));
    await ctx.close();
}

// ---- D6 アレルギー・食の決まり・かえる ----
if (want('D6')){
    const {p, ctx} = await ctxOf({state: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {carb: true, carbNoted: true, dishCount: 4, allergens: ['egg']})})}, 'd6');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const r = await p.evaluate(async () => {
        const hits = [];
        for (const cc of ['JP', 'US', 'ES', 'PE']){
            if (currentCountry() !== cc) await setCountry(cc);
            for (let k = 0; k < 5; k++){ session.rejected.clear(); newMenu(); session.menu.items.forEach(x => { if (x.r && isAvoided(x.r)) hits.push(cc + ' ' + x.r.id); }); }
            S.week = null; makeWeek(); S.week.days.forEach(x => { const r = byId(x.id); if (r && isAvoided(r)) hits.push(cc + ' 週 ' + r.id); }); S.week = null;
        }
        await setCountry('US'); const eggOut = isAvoided(byId('us_eggdrop'));
        S.settings.avoid = dietBundleToggle(S.settings.avoid, 'vegi', S.settings); save(); reconcileMenu();
        const vegHits = []; for (let k = 0; k < 5; k++){ session.rejected.clear(); newMenu(); session.menu.items.forEach(x => { if (x.r && ['us_chickenvegsoup', 'us_lemonchicken', 'us_sausageveg'].includes(x.r.id)) vegHits.push(x.r.id); if (x.r && isAvoided(x.r)) vegHits.push('avoid ' + x.r.id); }); }
        const chickOut = isAvoided(byId('us_chickenvegsoup')) && isAvoided(byId('us_lemonchicken'));
        return {hits, eggOut, vegHits, chickOut};
    });
    ok(!r.hits.length && r.eggOut, 'D6a 卵のアレルギー: 糖質ひかえめでも当たる料理を出さない（新しい卵のスープも外れる）: ' + JSON.stringify(r));
    ok(!r.vegHits.length && r.chickOut, 'D6b 食の決まり（ベジタリアン向け）: 新しい鶏肉・ソーセージの料理も外れる: ' + JSON.stringify(r));
    // かえる: 押した料理だけが変わる
    const rr = await p.evaluate(async () => { await setCountry('JP'); S.settings.allergens = []; S.settings.avoid = []; save(); reconcileMenu(); session.rejected.clear(); newMenu(); render(); await __tick(); return JSON.stringify(menuIds()); });
    const before = JSON.parse(rr);
    let same = true, changed = 0; const log = [];
    for (let k = 0; k < 4; k++){
        const i = 1 + (k % Math.max(1, before.length - 1));
        const ids0 = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
        await p.click(`#view .tray [data-act=reroll][data-i="${i}"]`).catch(() => {}); await p.waitForTimeout(200);
        const ids1 = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
        ids0.forEach((id, j) => { if (j !== i && ids1[j] !== id){ same = false; log.push(`${j}: ${id}→${ids1[j]}`); } });
        if (ids1[i] !== ids0[i]) changed++;
    }
    ok(same && changed >= 1, 'D6c 糖質ひかえめで「かえる」: 押した料理だけが変わる: ' + JSON.stringify({changed, log}));
    await ctx.close();
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`dm41: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
