#!/usr/bin/env node
// 飲んだ次の日（二日酔いの日。オーナー指示 11/09）の回帰テスト（Playwright。使い方: node tools/tests/hang-r1.mjs [http://localhost:8765/]）
//  H1 切り替え: 条件のシートの「気分」の下に出る。初期はオフ。押すと S.settings.hangover が今日の日付になり保存される。いまの献立（まだ決めていない案・決めた献立）は変わらない。
//     切ると消える。前の日の日付・壊れた値は効かない（読み込みで捨てる）。家の設定でお酒を避ける人（ハラール向けも）には出さない。家族のだれかがお酒を避けるだけなら出す
//  H2 21か国（シード固定）: オンにすると、主菜のあっさりした料理の割合・献立全体のあっさりした料理の割合が上がり、揚げ物・こってり・辛い料理の割合が下がる。
//     外しはしない（オンでも揚げ物などが出ることがある・候補の数は変わらない）。汁ものの欄があれば埋まる（汁けの多い主菜の日を除く）
//  H3 除外が漏れない: アレルゲン・家族のアレルギー・苦手（豚）・今は出さないを入れて 21か国でオンの献立を作り、当たる料理が1つも出ない
//  H4 おかゆの日はおかゆのなかまだけ（オンでも）。日本ではオンのとき雑炊・お茶漬けも主菜に出ることがある
//  H5 文言: 17言語に訳がある。効き目の言い切り（効く・回復・肝臓・治る など）が0。health-claims の言い方（二日酔いの語そのものを除く）にも当たらない
//  H6 狭い幅（195〜430px × 文字の大きさ × ja/de/ar/vi）: 条件のシートの切り替えの欄・条件のボタンが横にはみ出さない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const N = Number(process.env.N || 300);   // 120回だと国によっては差が境目（+0.15 ちょうど）になり、乱数の種しだいで落ちた
const KEY = 'gohancho.v1';
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const BASE_ST = {onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const newPage = async ({w = 390, h = 844, st = BASE_ST, tag = 'h'} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('hang', tag)));
    await ctx.addInitScript(([st, KEY]) => { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(st)); }, [st, KEY]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};

// ---- H1 切り替え ----
{
    const {p, ctx} = await newPage({tag: 'h1'});
    const r = await p.evaluate(() => {
        const o = {};
        setTab('today'); session.menu = null; render();
        o.off = !hangOn() && S.settings.hangover === undefined;
        openCondSheet(); const f = document.querySelector('#hang-field'); o.field = !!f; o.checked = f ? f.querySelector('input[data-act="hangover"]').checked : null;
        // 気分の欄の下にある
        const fields = [...document.querySelectorAll('#sheet-root .field')]; const iMood = fields.map(x => !!x.querySelector('[data-act="mood"]')).lastIndexOf(true); o.afterMood = fields.indexOf(f) === iMood + 1;
        o.before = JSON.stringify(menuIds());
        f.querySelector('input[data-act="hangover"]').click();
        saveNow(); o.on = hangOn() && S.settings.hangover === TODAY && JSON.parse(localStorage.getItem('gohancho.v1')).settings.hangover === TODAY;
        o.after = JSON.stringify(menuIds());
        o.now = !!document.querySelector('#hang-field .hang-now'); o.chip = (document.querySelector('[data-act="cond-open"] .sv1') || {}).textContent || '';
        // 決めた献立も変わらない
        const m = session.menu; S.cook = {d: TODAY, ids: menuIds(), slots: m.items.filter(x => x.r).map(x => x.slot)}; save(); render(); openCondSheet();
        o.decided = menuIsDecided(); const cook0 = JSON.stringify(S.cook), ids0 = JSON.stringify(menuIds());
        document.querySelector('#hang-field input[data-act="hangover"]').click();   // 切る
        o.offAgain = !hangOn() && S.settings.hangover === undefined;
        document.querySelector('#hang-field input[data-act="hangover"]').click();   // 入れる
        o.decSame = JSON.stringify(S.cook) === cook0 && JSON.stringify(menuIds()) === ids0 && menuIsDecided();
        o.sheet = sheet && sheet.kind;   // 確かめのシートなどに替わらない
        delete S.cook; S.settings.hangover = addDays(TODAY, -1); o.yesterday = !hangOn();
        delete S.settings.hangover; save(); closeSheet && closeSheet();
        return o;
    });
    ok(r.off, 'H1a 初期はオフ: ' + JSON.stringify(r));
    ok(r.field && r.checked === false && r.afterMood, 'H1b 条件のシートの気分の下に切り替え（初期はオフ）: ' + JSON.stringify(r));
    ok(r.on, 'H1c 押すと今日の日付で保存される');
    ok(r.before === r.after, 'H1d 押しても、まだ決めていない案は変わらない: ' + r.before + ' → ' + r.after);
    ok(r.now && /二日酔い/.test(r.chip), 'H1e オンのとき、いまの献立は変えない旨の一言・条件のボタンに「二日酔い」: ' + r.chip);
    ok(r.decided && r.decSame && r.offAgain, 'H1f 決めた献立は切り替えても変わらない: ' + JSON.stringify(r));
    ok(r.yesterday, 'H1g 前の日の日付では効かない');
    await ctx.close();
    // 読み込みで壊れた値を捨てる
    for (const bad of [123, 'yes', true]){
        const c = await newPage({st: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {hangover: bad})}), tag: 'h1bad'});
        const v = await c.p.evaluate(() => S.settings.hangover);
        ok(v === undefined, 'H1h 壊れた値を捨てる: ' + JSON.stringify(bad) + ' → ' + JSON.stringify(v));
        await c.ctx.close();
    }
    // お酒を避ける設定（家・ハラール向け）では出さない。家族のだれかだけなら出す
    for (const [name, st, want] of [
        ['家の設定でお酒', {settings: Object.assign({}, BASE_ST.settings, {avoid: ['@alcohol']})}, false],
        ['家の設定でハラール向け', {settings: Object.assign({}, BASE_ST.settings, {avoid: ['@pork', '@alcohol']})}, false],
        ['家族の1人がお酒', {family: [BASE_ST.family[0], {id: 'f1', name: 'こども', role: 'child', avoid: ['@alcohol'], allergy: []}]}, true]]){
        const c = await newPage({st: Object.assign({}, BASE_ST, st), tag: 'h1alc' + name});
        const v = await c.p.evaluate(() => { openCondSheet(); const o = !!document.querySelector('#hang-field'); S.settings.hangover = TODAY; render(); openCondSheet(); const on = !!document.querySelector('#hang-field'); delete S.settings.hangover; return {o, on}; });
        ok(v.o === want, `H1i ${name}: 切り替えを${want ? '出す' : '出さない'}: ` + JSON.stringify(v));
        ok(v.on, `H1j ${name}: すでにオンなら切れるように出す`);
        await c.ctx.close();
    }
}

// ---- H2〜H4 献立のえらび（21か国）----
{
    const {p, ctx} = await newPage({tag: 'h2'});
    const rows = [];
    let heavyOnAll = 0;
    for (const cc of CCS){
        const r = await p.evaluate(async ([cc, N]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.history = []; S.hidden = []; session.mood = 'all'; delete S.settings.hangover;
            const isL = r => hangLight(r) || hangPlain(r);
            const run = on => { if (on) S.settings.hangover = TODAY; else delete S.settings.hangover;
                const st = {n: 0, ml: 0, mh: 0, mf: 0, in: 0, il: 0, ih: 0, soupSlot: 0, soupFilled: 0};
                for (let i = 0; i < N; i++){
                    session.rejected = new Set(); newMenu(); const m = session.menu, main = m.items[0].r; if (!main) continue;
                    st.n++; if (isL(main)) st.ml++; if (hangHeavy(main)) st.mh++; if (hangInfo(main).fried) st.mf++;
                    m.items.forEach(x => { if (!x.r) return; st.in++; if (hangLight(x.r)) st.il++; if (hangHeavy(x.r)) st.ih++; });
                    const si = m.items.findIndex(x => x.slot === '汁物');
                    if (si >= 0 && !soupyMain(main) && !primoMain(main)){ st.soupSlot++; if (m.items[si].r && m.items[si].r.type === '汁物') st.soupFilled++; }
                }
                return st; };
            const poolN = () => RECIPES.filter(r => !isAvoided(r)).length;
            const p0 = poolN(); const off = run(false); const on = run(true); const p1 = poolN();
            const avail = {main: poolFor('主菜').filter(r => r.main && !isAvoided(r) && (hangLight(r) || hangPlain(r))).length, side: poolFor('副菜').filter(r => slotOf(r) === '副菜' && !isAvoided(r) && hangLight(r)).length, soup: poolFor('汁物').filter(r => slotOf(r) === '汁物' && !isAvoided(r) && hangLight(r)).length, all: p0, fried: RECIPES.filter(r => hangInfo(r).fried).length};
            delete S.settings.hangover;
            return {off, on, p0, p1, avail};
        }, [cc, N]);
        const q = (st, k, d) => st[k] / st[d];
        const f = x => (x * 100).toFixed(0) + '%';
        rows.push(`${cc} 全${r.avail.all}品（あっさり 主菜${r.avail.main}・副菜${r.avail.side}・汁もの${r.avail.soup}／揚げ物${r.avail.fried}） 主菜のあっさり ${f(q(r.off, 'ml', 'n'))}→${f(q(r.on, 'ml', 'n'))}・主菜の揚げ物 ${f(q(r.off, 'mf', 'n'))}→${f(q(r.on, 'mf', 'n'))}・主菜の重い料理 ${f(q(r.off, 'mh', 'n'))}→${f(q(r.on, 'mh', 'n'))}・献立のあっさり ${f(q(r.off, 'il', 'in'))}→${f(q(r.on, 'il', 'in'))}・献立の重い料理 ${f(q(r.off, 'ih', 'in'))}→${f(q(r.on, 'ih', 'in'))}`);
        ok(r.on.n === N && r.off.n === N, `H2a ${cc} 主菜が毎回入る: ${r.off.n}/${r.on.n}`);
        ok(q(r.on, 'il', 'in') > q(r.off, 'il', 'in') + 0.08, `H2b ${cc} 献立のあっさりした料理の割合が上がる: ${q(r.off, 'il', 'in')} → ${q(r.on, 'il', 'in')}`);
        ok(q(r.on, 'ml', 'n') >= q(r.off, 'ml', 'n'), `H2c ${cc} 主菜のあっさりした料理の割合が下がらない: ${q(r.off, 'ml', 'n')} → ${q(r.on, 'ml', 'n')}`);
        const few = r.avail.main < 6;   // あっさりの主菜が少ない国（MX・IN・GB・US など。アプリは説明を出す・確認まとめ 57）は伸びしろが小さく、+0.15／6割の境目だと乱数の種しだいで落ちた
        if (r.avail.main >= 3) ok(q(r.on, 'ml', 'n') > q(r.off, 'ml', 'n') + (few ? 0.10 : 0.15), `H2d ${cc} 主菜のあっさりした料理の割合が上がる: ${q(r.off, 'ml', 'n')} → ${q(r.on, 'ml', 'n')}`);
        ok(r.off.mf >= 5 ? r.on.mf < r.off.mf * (few ? 0.75 : 0.6) : r.on.mf <= r.off.mf + 1, `H2e ${cc} 主菜の揚げ物の割合が下がる: ${r.off.mf} → ${r.on.mf}`);
        ok(q(r.on, 'ih', 'in') < q(r.off, 'ih', 'in'), `H2f ${cc} 献立の揚げ物・こってり・辛い料理の割合が下がる: ${q(r.off, 'ih', 'in')} → ${q(r.on, 'ih', 'in')}`);
        ok(r.p0 === r.p1, `H2g ${cc} 候補の数は変わらない（外さない）: ${r.p0} → ${r.p1}`);
        ok(r.on.soupSlot === 0 || r.on.soupFilled === r.on.soupSlot, `H2h ${cc} 汁ものの欄は埋まる: ${r.on.soupFilled}/${r.on.soupSlot}`);
        ok(r.avail.main + r.avail.side + r.avail.soup >= 15, `H2i ${cc} あっさりした料理が十分にある: ${JSON.stringify(r.avail)}`);
        heavyOnAll += r.on.ih;
    }
    console.log('H2 国別（' + N + '回・シード ' + SEED + '）\n  ' + rows.join('\n  '));
    ok(heavyOnAll > 0, 'H2j オンでも揚げ物・こってり・辛い料理が出ることがある（外していない）: ' + heavyOnAll);

    // H3 除外
    for (const cc of CCS){
        const r = await p.evaluate(async cc => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.settings.allergens = ['egg', 'shrimp']; S.settings.avoid = ['@pork']; S.family = [S.family[0], {id: 'f9', name: 'あおい', role: 'child', avoid: ['@dairy'], allergy: ['@dairy']}]; setEaters(null);
            const hid = RECIPES.filter(r => r.main).slice(0, 3).map(r => r.id); S.hidden = hid.slice(); save();
            S.settings.hangover = TODAY; const bad = [];
            for (let i = 0; i < 30; i++){ session.rejected = new Set(); session.mood = 'all'; newMenu(); session.menu.items.forEach(x => { if (x.r && (isAvoided(x.r) || allergyConflict(x.r) || S.hidden.includes(x.r.id))) bad.push(x.r.id); }); }
            delete S.settings.hangover; S.settings.allergens = []; S.settings.avoid = []; S.family = [S.family[0]]; S.hidden = []; setEaters(null); save();
            return bad;
        }, cc);
        ok(r.length === 0, `H3 ${cc} 除外が漏れない: ${[...new Set(r)].join(',')}`);
    }

    // H4 おかゆの日・雑炊
    {
        const r = await p.evaluate(async () => {
            if (currentCountry() !== 'JP') await setCountry('JP');
            S.settings.hangover = TODAY; session.mood = 'okayu'; const notOk = [];
            for (let i = 0; i < 40; i++){ session.rejected = new Set(); newMenu(); const m = session.menu.items[0].r; if (!m || !okayuDayOk(m)) notOk.push(m && m.id); }
            session.mood = 'all'; const seen = new Set();
            for (let i = 0; i < 200; i++){ session.rejected = new Set(); newMenu(); seen.add(session.menu.items[0].r.id); }
            delete S.settings.hangover; const seenOff = new Set();
            for (let i = 0; i < 200; i++){ session.rejected = new Set(); newMenu(); seenOff.add(session.menu.items[0].r.id); }
            return {notOk, zosui: seen.has('zosui') || seen.has('ochazuke'), offZ: seenOff.has('zosui') || seenOff.has('ochazuke')};
        });
        ok(r.notOk.length === 0, 'H4a おかゆの日はオンでもおかゆのなかまだけ: ' + r.notOk.join(','));
        ok(r.zosui, 'H4b オンのとき、雑炊・お茶漬けも主菜に出ることがある');
        ok(!r.offZ, 'H4c オフでは雑炊・お茶漬けを主菜に出さない（今までどおり）');
    }
    await ctx.close();
}

// ---- H5 文言（17言語）----
{
    const KEYS = ['飲んだ次の日', '二日酔いの日（今日だけ）', 'あっさりした料理（煮もの・蒸し料理・汁けの多い料理など）を出しやすくします。揚げ物・こってり・辛い料理は出にくくします（外しはしません）。明日には元に戻ります。', 'いまの献立は変えません。「まるごと入れ替え」か、料理を押して「かえる」で選び直せます。', '体調がすぐれないときは無理をせず、水分をとってください。', '二日酔い'];
    // health-claims.mjs の言い方（二日酔い・飲んだ次の日の語そのものは除く）
    const hc = fs.readFileSync(path.resolve(ROOT, '../tools/tests/health-claims.mjs'), 'utf8');
    const CLAIM = new Function('return ' + hc.slice(hc.indexOf('const CLAIM = {') + 'const CLAIM = '.length, hc.indexOf('};', hc.indexOf('const CLAIM = {')) + 1))();
    const HANG_WORD = /\|(?:二日酔|hangover|해장|숙취|술 마신 다음|解酒|醒酒|เมาค้าง|giải rượu|\\bkater\\b|gueule de bois|resaca|ressaca|\\bkac\\b)(?=\||$)/g;
    // 効き目の言い切り（効く・回復・肝臓・治る・やわらげる・すっきり など）
    const EFFECT = {
        ja: /効|回復|肝臓|治|予防|解消|和らげ|やわらげ|楽にな|すっきり|スッキリ|酔い覚まし|酔いざまし|健康|栄養/,
        en: /\bcure|reliev|recover|liver|remed|helps? (?:with|you)|\bfix|sooth|detox|health|nutri|\beases?\b/i,
        de: /heil|lindert|erholung|erholt|leber|hilft gegen|gesund|wirk/i,
        fr: /guéri|soulag|récupér|\bfoie\b|remède|santé|efficace|aide à/i,
        es: /cura|alivi|recupera|hígado|remedio|salud|eficaz|ayuda a/i,
        'pt-BR': /cura|alivi|recupera|fígado|remédio|saúde|eficaz|ajuda a/i,
        it: /cura|guari|allevi|recuper|fegato|rimedio|salute|efficace|aiuta a/i,
        pl: /lecz|złagodz|łagodzi|regener|wątrob|lekarstw|zdrow|pomaga na/i,
        tr: /tedavi|iyileş|hafiflet|karaciğer|çare|sağlık|faydalı|iyi gelir/i,
        ar: /علاج|يعالج|يشفي|يخفف|تعافي|الكبد|صحة|صحي|مفيد/,
        hi: /इलाज|ठीक कर|राहत|लीवर|जिगर|सेहत|स्वास्थ्य|फ़ायदेमंद|फायदेमंद/,
        id: /obat|menyembuh|meredakan|pemulihan|hati\b|kesehatan|berkhasiat|ampuh/i,
        fil: /lunas|gamot|pampagaling|ginhawa|atay|kalusugan|mabisa/i,
        ko: /효과|낫|회복|간에|간 건강|해소|치료|건강|좋아져|해장/,
        th: /แก้|หาย|ฟื้น|ตับ|บรรเทา|รักษา|สุขภาพ|ช่วยให้/,
        vi: /chữa|khỏi bệnh|hồi phục|giải rượu|gan\b|giảm (?:đau|mệt)|sức khỏe|bổ/i,
        'zh-Hans': /解酒|醒酒|治|恢复|缓解|护肝|养肝|肝脏|健康|功效|有效/,
        'zh-Hant': /解酒|醒酒|治|恢復|緩解|護肝|養肝|肝臟|健康|功效|有效/,
    };
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    ok(langs.length === 17, 'H5a 辞書が17言語: ' + langs.length);
    const check = (lg, v, k) => {
        const e = EFFECT[lg.startsWith('zh') ? lg : lg] || EFFECT.en;
        ok(!e.test(v), `H5c ${lg} 効き目の言い切り: ${v}`);
        const c = CLAIM[lg]; if (!c) return;
        const src = c.source.replace(HANG_WORD, ''); const re = new RegExp(src, c.flags);
        ok(!re.test(''), `H5d ${lg} 言い方の作り直しに失敗`);
        ok(!re.test(v), `H5e ${lg} health-claims の言い方に当たる: ${v}`);
    };
    for (const k of KEYS) check('ja', k, k);
    for (const lg of langs){
        let d = null; const ctx2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(ctx2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), ctx2);
        for (const k of KEYS){
            const v = d && d[k];
            ok(typeof v === 'string' && v.length > 0 && v !== k, `H5b ${lg} 訳がない: ${k.slice(0, 12)}`);
            if (typeof v === 'string') check(lg, v, k);
        }
    }
}

// ---- H6 狭い幅 ----
{
    for (const lg of ['ja', 'de', 'ar', 'vi']) for (const w of [195, 260, 320, 375, 430]) for (const ts of [undefined, 2]){
        const st = Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {uiLang: lg}, ts ? {textSize: ts} : {})});
        const {p, ctx} = await newPage({w, h: 800, st, tag: 'h6' + lg + w + ts});
        await p.evaluate(() => { S.settings.hangover = TODAY; session.mood = 'fish'; S.settings.dishCount = 4; newMenu(); save(); setTab('today'); render(); });
        await p.waitForTimeout(150);
        const chip = await p.evaluate(() => {
            const e = document.querySelector('[data-act="cond-open"]'); if (!e) return null; const r = e.getBoundingClientRect();
            return {l: r.left, r: r.right, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, over: e.scrollWidth > e.clientWidth + 1};
        });
        ok(chip && chip.l >= -0.5 && chip.r <= chip.vw + 0.5 && chip.sw <= chip.vw && !chip.over, `H6a ${lg} ${w}px 文字${ts || 0} 条件のボタンがはみ出さない: ${JSON.stringify(chip)}`);
        await p.evaluate(() => openCondSheet()); await p.waitForTimeout(150);
        const g = await p.evaluate(() => {
            const f = document.querySelector('#hang-field'); if (!f) return null;
            const vw = document.documentElement.clientWidth, out = [];
            f.querySelectorAll('*').forEach(x => { const r = x.getBoundingClientRect(); if (r.width && (r.left < -0.5 || r.right > vw + 0.5)) out.push(x.tagName + ':' + Math.round(r.left) + '-' + Math.round(r.right)); if (x.scrollWidth > x.clientWidth + 1 && getComputedStyle(x).overflowX !== 'visible') out.push('scroll:' + x.tagName); });
            return {out, fw: f.scrollWidth <= f.clientWidth + 1, sw: document.documentElement.scrollWidth <= vw};
        });
        ok(g && g.out.length === 0 && g.fw && g.sw, `H6b ${lg} ${w}px 文字${ts || 0} 切り替えの欄がはみ出さない: ${JSON.stringify(g)}`);
        await ctx.close();
    }
}

await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー: ' + [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(`hang-r1: ${checks - fails}/${checks} ok` + (fails ? `（${fails} 件 FAIL）` : ''));
process.exit(fails ? 1 : 0);
