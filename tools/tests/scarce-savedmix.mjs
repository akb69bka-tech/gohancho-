#!/usr/bin/env node
// 「手に入りにくい食材」と「国ミックス献立の保存・復元・共有」の回帰テスト（Playwright。使い方: node tools/tests/scarce-savedmix.mjs [http://localhost:8795/]）
//  手に入りにくい食材:
//   ・登録した食材を必須の材料に使う料理は出ない（なくても可の材料だけの料理は出る）。置き換え（代わりの食材）にも使われない
//   ・登録・解除で変わるのは、その食材を使っていた枠だけ（ほかの枠・ご飯の欄・記録は動かない）
//   ・画面の文は「手に入りにくい食材（…）を使う料理は出しません」で、「苦手な食材を置き換えています」とは出さない
//   ・国ごとに別々に覚える
//  国ミックス献立:
//   ・保存すると枠ごとの国を覚え、復元すると同じ料理・同じ国の組み合わせに戻る（国のデータが未読みこみでも）
//   ・復元時に使えない料理（今は出さない）があっても、変わるのはその枠だけ
//   ・送る文に国名が入る（ミックスでない献立には入らない）
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = (process.env.CCS || 'JP,US,KR,FR,IN,TH').split(',');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const open = async (cc, n = 4) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, n]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({foldOpen:{upg:true,tw:true,week:true}, onboarded:true, firstUse:'2026-10-26', settings:{country:cc, dishCount:n}})); } }, [cc, n]);
    await p.goto(URL_); await p.waitForTimeout(1500); await p.evaluate(() => { hasPro = () => true; session.menu = null; render(); });
    return {ctx, p};
};
for (const cc of CCS){
    /* ---- 手に入りにくい食材 ---- */
    {
        const {ctx, p} = await open(cc);
        const r = await p.evaluate(async () => {
            const out = {errs: []};
            const ids = () => session.menu.items.map(x => x.slot + ':' + (x.r && x.r.id));
            const outside = () => JSON.stringify([S.fridge, S.history, S.favs, S.cook, S.savedMenus]);
            // 副菜の必須の材料から、主菜には使われていない食材を選ぶ
            const m = session.menu, side = m.items.findIndex((x, i) => i > 0 && x.r && x.r.items.some(g => !g.opt && g.label && g.label.length >= 2));
            if (side < 0) return {skip: true};
            const mainKeys = new Set(m.items[0].r.items.map(g => g.key));
            const it = m.items[side].r.items.find(g => !g.opt && g.label && g.label.length >= 2 && !mainKeys.has(g.key)); if (!it) return {skip: true};
            const word = it.label;
            const before = ids(), o0 = outside(), settings0 = JSON.stringify(S.settings.avoid);
            // 画面の入力欄から登録する
            S.settings.scarce = []; setTab('settings'); render();
            const inp = document.querySelector('#scarce-input'); out.hasField = !!inp;
            inp.value = word; document.querySelector('form[data-form="add-scarce"]').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
            out.registered = scarceList().length > 0; out.word = word; out.list = scarceList().join();
            const after = ids();
            out.changed = before.map((x, j) => x !== after[j] ? j : -1).filter(j => j >= 0);
            out.badSide = side;
            out.leftover = session.menu.items.filter(x => x.r && isScarce(x.r)).length;
            out.outsideSame = outside() === o0; out.avoidSame = JSON.stringify(S.settings.avoid) === settings0;
            // 献立の画面と設定の画面の文
            setTab('today'); render();
            const view = document.querySelector('#view').innerText;
            out.foot = view.includes(t('手に入りにくい食材（{list}）を使う料理は出しません。', {list: joinNames(scarceList())}));
            out.noSwapWord = !view.includes(t('苦手な食材を置き換えています')) && !view.includes(t('苦手な食材（{list}）を使う料理は出しません。', {list: word}));
            // 登録した食材を必須に使う料理は全部出ない。なくても可だけの料理は出る
            const reqHit = RECIPES.filter(r => isScarce(r)), onlyOpt = RECIPES.filter(r => r.items.some(g => g.opt && itemAvoided(g, scarceCtx())) && !isScarce(r));
            out.reqHit = reqHit.length; out.optOk = onlyOpt.every(r => !isScarce(r));
            // 置き換え: 苦手な食材（なかま）を置き換えるとき、手に入りにくい食材には置き換えない
            const sc = scarceList().slice();
            ['pork', 'chicken', 'beef', 'fish'].forEach(f => {
                S.settings.avoid = ['@' + f]; avoidCtxFor.c = null;
                RECIPES.forEach(r => { const w = recipeSwaps(r); if (w) w.swaps.forEach(x => { if (itemAvoided(x.to, scarceCtx())) out.errs.push('置き換え先が手に入りにくい食材 ' + r.id + ' -> ' + x.to.key); }); });
            });
            S.settings.avoid = [];
            // 解除: 献立は動かない
            const b2 = ids(); document.querySelector('#view'); setTab('settings'); render();
            for (let g = 0; g < 9 && document.querySelector('[data-act="scarce-del"]'); g++){ document.querySelector('[data-act="scarce-del"]').click(); setTab('settings'); render(); }
            out.removed = scarceList().length === 0; out.stayAfterRemove = ids().join() === b2.join(); out.dbg = b2.join() + ' -> ' + ids().join();
            // 国ごとに覚える
            S.settings.scarce = [word]; S.countryData = S.countryData || {};
            return out;
        });
        if (r.skip) { console.log('skip scarce', cc); } else {
            ok(r.hasField && r.registered, cc + ' 入力欄から登録できない ' + JSON.stringify(r));
            ok(r.changed.every(j => j === r.badSide), cc + ' 登録で関係ない枠が変わった ' + r.changed + ' 副菜=' + r.badSide);
            ok(r.leftover === 0, cc + ' 登録した食材を使う料理が献立に残った');
            ok(r.outsideSame && r.avoidSame, cc + ' 登録で記録・苦手の設定が動いた');
            ok(r.reqHit > 0 && r.optOk, cc + ' 必須の材料だけを見るはず ' + r.reqHit);
            ok(r.foot && r.noSwapWord, cc + ' 画面の文が事実どおりでない');
            ok(r.errs.length === 0, cc + ' ' + r.errs.slice(0, 3).join(' / '));
            ok(r.removed && r.stayAfterRemove, cc + ' 解除で献立が動いた ' + r.dbg);
        }
        await ctx.close();
    }
    /* ---- 国ミックス献立の保存・復元・共有 ---- */
    {
        const {ctx, p} = await open(cc);
        const others = ['US', 'KR', 'FR', 'IN', 'TH', 'JP'].filter(x => x !== cc);
        const mixCcs = {'主菜': others[0], '汁物': others[1]};
        // 画面の選択から国を混ぜる
        for (const [slot, mc] of Object.entries(mixCcs)){
            await p.evaluate(([slot, mc]) => { const sel = document.querySelector('select[data-act="mix"][data-slot="' + slot + '"]'); sel.value = mc; sel.dispatchEvent(new Event('change', {bubbles: true})); }, [slot, mc]);
            await p.waitForTimeout(2000);
        }
        const s = await p.evaluate(() => {
            const ids = session.menu.items.map(x => x.slot + ':' + x.r.id); const share = menuShareText();
            saveMenu(); const sm = S.savedMenus[0];
            return {ids, mix: sm.mix, share, sid: sm.id, packs: session.menu.items.map(x => x.slot + ':' + (x.r.pack || 'JP')), home: currentCountry()};
        });
        const cn = await p.evaluate(ccs => ccs.map(c => countryLabel(countryOf(c))), Object.values(mixCcs));
        ok(JSON.stringify(s.mix) === JSON.stringify(mixCcs), cc + ' 保存した国ミックスが違う ' + JSON.stringify(s.mix));
        ok(cn.every(n => s.share.includes(n)), cc + ' 送る文に国名が入っていない: ' + s.share.replace(/\n/g, ' / '));
        // ミックスをやめて別の献立にしてから復元
        await p.evaluate(() => { S.settings.mix = {}; save(); session.menu = null; render(); });
        const r1 = await p.evaluate(sid => { const plain = menuShareText(); applySavedMenu(sid); return {plain, ids: session.menu.items.map(x => x.slot + ':' + x.r.id), mix: JSON.stringify(S.settings.mix)}; }, s.sid);
        ok(!cn.some(n => r1.plain.includes('（' + n + '）') || r1.plain.includes('(' + n + ')')) , cc + ' ミックスでない献立の文に国名が付いた');
        await p.waitForTimeout(500);
        const r2 = await p.evaluate(() => ({ids: session.menu.items.map(x => x.slot + ':' + x.r.id), mix: JSON.stringify(S.settings.mix)}));
        ok(r2.ids.join() === s.ids.join(), cc + ' 復元した献立が保存と違う ' + s.ids.join() + ' -> ' + r2.ids.join());
        ok(r2.mix === JSON.stringify(mixCcs), cc + ' 復元で国の組み合わせが戻らない ' + r2.mix);
        // 復元後、何もしなければ変わらない
        const r3 = await p.evaluate(() => { reconcileMenu(); render(); return session.menu.items.map(x => x.slot + ':' + x.r.id); });
        ok(r3.join() === s.ids.join(), cc + ' 復元後に再調整で変わった');
        // 国のデータが未読みこみのとき（開き直した直後）も同じに復元できる
        await p.evaluate(() => { Object.keys(BROWSE).forEach(k => delete BROWSE[k]); S.settings.mix = {}; save(); session.menu = null; render(); });
        await p.evaluate(sid => { applySavedMenu(sid); }, s.sid); await p.waitForTimeout(3000);
        const r4 = await p.evaluate(() => session.menu.items.map(x => x.slot + ':' + x.r.id));
        ok(r4.join() === s.ids.join(), cc + ' 未読みこみからの復元が違う ' + r4.join());
        // 復元時に1品が「今は出さない」でも、変わるのはその枠だけ
        const r5 = await p.evaluate(sid => {
            const sm = S.savedMenus.find(x => x.id === sid), vic = sm.ids[1]; S.hidden.push(vic); applySavedMenu(sid);
            const ids = session.menu.items.map(x => x.r.id), ch = sm.ids.map((x, j) => x !== ids[j] ? j : -1).filter(j => j >= 0); S.hidden = S.hidden.filter(x => x !== vic);
            return ch;
        }, s.sid);
        ok(r5.length === 1 && r5[0] === 1, cc + ' 使えない1品の復元で他の枠が変わった ' + r5);
        // 保存一覧に国が出る／古い保存（国の記録なし）はそのまま復元できる
        const r6 = await p.evaluate(sid => {
            setTab('log'); render(); const html = document.querySelector('#saved-menus').textContent;
            const sm = S.savedMenus.find(x => x.id === sid); const old = Object.assign({}, sm, {id: 'old1'}); delete old.mix; delete old.names; S.savedMenus.push(old);
            S.settings.mix = {}; session.menu = null; applySavedMenu('old1'); return {html, ok: !!session.menu};
        }, s.sid);
        ok(cn.every(n => r6.html.includes(n)) && r6.ok, cc + ' 保存一覧に国が出ない／古い保存が復元できない ' + JSON.stringify([cn, r6.html.slice(0, 300), r6.ok]));
        await ctx.close();
    }
}
await b.close();
console.log(`scarce-savedmix: ${checks - fails}/${checks} ok`, errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : '');
process.exit(fails || errs.length ? 1 : 0);
