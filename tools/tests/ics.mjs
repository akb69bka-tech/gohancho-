#!/usr/bin/env node
// 1週間プランの .ics 書き出し（RFC 5545）の回帰テスト（Playwright。使い方: node tools/tests/ics.mjs [http://localhost:8795/]）
//  ・書き出した文字を、ここで別に書いた厳密なパーサ（行の展開・エスケープ戻し・必須項目の検査）で読み直して中身を照合する
//  ・CRLF / 75オクテット以内 / 文字の途中で切れない（日本語・アラビア語・絵文字）/ カンマ・セミコロン・バックスラッシュ・改行のエスケープ
//  ・作る日だけ（作らない日は出ない）・日付ごとに UID が安定（書き出し直しても同じ、重複なし）・無料版は見える日だけ
//  ・献立（週・買い物メモ・冷蔵庫）は書き出しで変わらない。PATH に python3 の icalendar があれば、それでも読む
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const LANGS = (process.env.LANGS || 'ja,en,ar,th,ko,zh-Hans,de').split(',');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const unesc = s => s.replace(/\\([\\;,nN])/g, (_, c) => c === 'n' || c === 'N' ? '\n' : c);
// 厳密パーサ: CRLF 必須・75 オクテット以内・展開・BEGIN/END の入れ子・必須項目
function parse(ics, bad){
    if (!ics.endsWith('\r\n')) bad.push('末尾が CRLF でない');
    if (/[^\r]\n|\r[^\n]/.test(ics)) bad.push('CRLF 以外の改行');
    const raw = ics.split('\r\n'); raw.pop();
    raw.forEach(l => { if (Buffer.byteLength(l, 'utf8') > 75) bad.push('75オクテット超: ' + Buffer.byteLength(l, 'utf8')); if (l === '') bad.push('空行'); });
    const lines = []; raw.forEach(l => { if (l[0] === ' ' || l[0] === '\t'){ if (!lines.length) bad.push('先頭が継続行'); else lines[lines.length - 1] += l.slice(1); } else lines.push(l); });
    if (lines.some(l => /�/.test(l))) bad.push('文字化け(U+FFFD): 文字の途中で切れた');
    const stack = [], events = []; let cal = null, cur = null;
    for (const l of lines){
        const m = /^([A-Za-z0-9-]+)((?:;[^:;]+=(?:"[^"]*"|[^:;]*))*):(.*)$/.exec(l); if (!m){ bad.push('行の形式が不正: ' + l.slice(0, 40)); continue; }
        const name = m[1].toUpperCase(), params = m[2], val = m[3];
        if (name === 'BEGIN'){ stack.push(val); if (val === 'VCALENDAR') cal = {props:{}}; if (val === 'VEVENT'){ cur = {props:{}, params:{}}; } }
        else if (name === 'END'){ if (stack.pop() !== val) bad.push('END が対応しない'); if (val === 'VEVENT'){ events.push(cur); cur = null; } }
        else { const t = cur || cal; if (!t){ bad.push('入れ子の外のプロパティ'); continue; } if (name in t.props) bad.push('重複プロパティ ' + name); t.props[name] = val; if (cur) cur.params[name] = params; }
    }
    if (stack.length) bad.push('BEGIN/END の数が合わない');
    if (!cal || cal.props.VERSION !== '2.0' || !cal.props.PRODID) bad.push('VCALENDAR の VERSION/PRODID がない');
    if (lines[0] !== 'BEGIN:VCALENDAR' || lines.at(-1) !== 'END:VCALENDAR') bad.push('VCALENDAR で始まり終わらない');
    return {cal, events};
}
for (const lang of LANGS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('ics', String(++seedN))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + ': ' + e.message));
    await p.addInitScript(lang => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), lang, settings:{country:'JP', dishCount:3, lang}})); } }, lang);
    await p.goto(URL_); await ready(p);
    for (const pro of [true, false]){
        const r = await p.evaluate(async ([lang, pro]) => {
            await setLang(lang); hasPro = () => pro; S.staples = []; S.fridge = []; S.settings.weekSides = true;
            S.week = null; makeWeek(); ensureWeekExtras();
            const days = S.week.days.map(x => x.d);
            S.week.days.forEach(x => { delete x.skip; delete x.who; });
            S.week.days[0].who = 'ママ, パパ; 母\\父 😀 مرحبا';   // 区切り文字・バックスラッシュ・絵文字・アラビア語
            S.week.days[2].skip = true;
            const snap = () => JSON.stringify([S.week, shoppingList().map(e => e.key), S.fridge, S.history, S.cook]);
            const before = snap(), stamp = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
            const a = weekIcs(stamp), a2 = weekIcs(new Date(Date.UTC(2026, 5, 6, 7, 8, 9)));
            // 日ごとの期待値（画面の表示と同じ関数から）
            const exp = visiblePlanDays().filter(x => byId(x.id)).map(x => { const r = byId(x.id); return {d:x.d, name:r.name, who:x.who || '', ids:[x.id, x.extra && x.extra.side, x.extra && x.extra.soup].filter(Boolean)}; });
            // 全部作らない日 → 空
            const keep = S.week.days.map(x => x.skip); S.week.days.forEach(x => x.skip = true); const none = weekIcs(); S.week.days.forEach((x, i) => x.skip = keep[i]);
            // 長い名前（折り返し）
            const same = snap() === before; const long = S.week.days[0], w0 = long.who; long.who = '日本語の長い担当名'.repeat(12) + '😀'.repeat(20) + 'ا'.repeat(30); const lg = weekIcs(stamp); long.who = w0;
            return {a, a2, exp, none, lg, same, days, skipDay: S.week.days[2].d, sideOn: weekSidesOn(), visAll: visiblePlanDaysAll().map(x => x.d), dayWord: t('{n}分', {n:5})};
        }, [lang, pro]);
        const tag = lang + (pro ? '/pro' : '/free'), bad = [];
        const {cal, events} = parse(r.a, bad); const g = parse(r.lg, bad); 
        ok(r.same, tag + ': 書き出しで週・買い物メモ・冷蔵庫・記録が変わった');
        ok(r.none === '', tag + ': 全部作らない日なのに出力がある');
        ok(events.length === r.exp.length && events.length > 0, tag + ': 予定の数 ' + events.length + ' != ' + r.exp.length);
        if (!pro) ok(events.length <= 3, tag + ': 無料版で隠れた日が出た ' + events.length);
        ok(!events.some(e => e.props['DTSTART'] === r.skipDay.replace(/-/g, '')), tag + ': 作らない日が出た');
        const uids = events.map(e => e.props.UID); ok(new Set(uids).size === uids.length, tag + ': UID 重複');
        ok(JSON.stringify(uids) === JSON.stringify(parse(r.a2, []).events.map(e => e.props.UID)), tag + ': 書き出し直しで UID が変わる');
        ok(!/^\s*(BEGIN:VTIMEZONE|DTSTART:\d{8}T)/m.test(r.a) && !/TZID/.test(r.a), tag + ': 時刻つき/TZID（終日にする）');
        events.forEach((e, i) => {
            const x = r.exp[i]; if (!x) return;
            const d = x.d.replace(/-/g, ''), nx = new Date(Date.UTC(+x.d.slice(0, 4), +x.d.slice(5, 7) - 1, +x.d.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, '');
            if (e.props['DTSTART'] !== d || !/VALUE=DATE/.test(e.params['DTSTART']) && !/^;VALUE=DATE$/.test(e.params['DTSTART'])) bad.push('DTSTART ' + e.params.DTSTART + e.props.DTSTART + ' != ' + d);
            if (e.props['DTEND'] !== nx) bad.push('DTEND(排他的な翌日) ' + e.props.DTEND + ' != ' + nx);
            if (!/^\d{8}T\d{6}Z$/.test(e.props.DTSTAMP)) bad.push('DTSTAMP が UTC でない');
            if (!/^gohancho-\d{8}@gohancho\.app$/.test(e.props.UID) || e.props.UID !== 'gohancho-' + d + '@gohancho.app') bad.push('UID の形 ' + e.props.UID);
            if (unesc(e.props.SUMMARY) !== x.name) bad.push('SUMMARY ' + unesc(e.props.SUMMARY) + ' != ' + x.name);
            const desc = unesc(e.props.DESCRIPTION || ''); if (!desc.includes(x.name)) bad.push('DESCRIPTION に献立名がない');
            if (desc.split('\n').length < (x.ids.length + (x.who ? 1 : 0))) bad.push('DESCRIPTION の行数(主菜/副菜/汁もの/担当) ' + desc.split('\n').length);
            if (!/\d/.test(desc)) bad.push('所要時間がない');
            if (x.who && desc.split('\n').pop().indexOf(x.who) < 0) bad.push('担当が元の文字のまま戻らない: ' + desc.split('\n').pop());
            if (/\\[nN,;]/.test(unesc(e.props.SUMMARY))) bad.push('エスケープが二重');
        });
        const who0 = events[0] && unesc(events[0].props.DESCRIPTION).includes('ママ, パパ; 母\\父 😀 مرحبا'); ok(who0, tag + ': 区切り文字・絵文字・アラビア語の担当が往復できない');
        ok(r.lg.split('\r\n').some(l => l.startsWith(' ')), tag + ': 長い行が折り返されていない');
        const gd = unesc(g.events[0] ? g.events[0].props.DESCRIPTION : ''); ok(gd.includes('😀'.repeat(20)) && gd.includes('ا'.repeat(30)), tag + ': 折り返し後に文字が欠ける/壊れる');
        ok(!bad.length, tag + ': ' + [...new Set(bad)].slice(0, 5).join(' | '));
        if (lang === LANGS[0] && pro){   // python の icalendar があれば、それでも読めること
            const py = spawnSync('python3', ['-I', '-c', 'import sys\nfrom icalendar import Calendar\nc=Calendar.from_ical(sys.stdin.buffer.read())\nprint(len([e for e in c.walk("VEVENT")]))'], {input: r.a});
            if (py.status === 0) ok(Number(py.stdout.toString().trim()) === events.length, 'python icalendar の予定数'); else console.log('(python icalendar なし: 省略)');
        }
    }
    await ctx.close();
}
// 画面: 週の共有シートにボタンがあり、押すと .ics のダウンロードが始まる（ブラウザ版）
{
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('ics', String(++seedN))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('ui: ' + e.message));
    await p.addInitScript(() => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:'JP', dishCount:3}})); } });
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { hasPro = () => true; makeWeek(); openShare('week'); });
    const btn = p.locator('[data-act="share-ics"]'); ok(await btn.count() === 1, 'ボタンがない');
    await p.evaluate(() => { navigator.canShare = undefined; });
    const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 5000}).catch(() => null), btn.click()]);
    ok(!!dl && /^gohancho-week-\d{8}\.ics$/.test(dl.suggestedFilename()), 'ダウンロードされない/ファイル名 ' + (dl && dl.suggestedFilename()));
    await p.evaluate(() => { S.week.days.forEach(x => x.skip = true); });
    const t0 = await p.evaluate(async () => { await exportWeekIcs(); return document.body.innerText.includes(t('カレンダーに入れる作る日がありません')); }); ok(t0, '作る日がないときの案内が出ない');
    await ctx.close();
}
await b.close();
errs.forEach(e => { fails++; console.log('ERR', e); });
console.log(fails ? 'FAIL ' + fails : 'OK', checks + ' checks');
process.exit(fails ? 1 : 0);
