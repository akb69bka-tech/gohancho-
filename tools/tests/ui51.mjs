#!/usr/bin/env node
// ui51（第47回 R212）: 全員無料（PLAN.billingMode 'off'）のあいだは、サポートのページ（support*.html。設定 › その他 ›「サポート・よくある質問」）に
// 課金の質問（解約・無料お試し・購入を復元・月額）を見せない。代わりに「いま全員無料です」の1問と、無料のあいだの機種変更の手順（ファイルで書き出す・読み込む）を出す
//  使い方: node tools/tests/ui51.mjs [http://localhost:9331/]
//  S1 ある言語のサポートのページすべて（support.html・support-*.html）: 見えている文字に「解約・お試し・購入を復元・月額・請求・サブスクリプション」（英語は cancel・trial・restore purchases・monthly・subscription・charged・Apple Account）が 0 件
//  S2 「全員無料」の1問と、機種変更の質問（書き出す・読み込むの手順）が見える。手順の言葉は、アプリの設定のボタンの名前と同じ（訳も）
//  S3 課金の質問は消さずに data-billing="paid" で hidden のまま残っている（課金を始めるときに戻せる）。billingMode が 'off' でなければ、逆（paid が見え、free が隠れる）でないといけない
//  S4 アプリのリンク（docPage）が指すページがある（ja・ほかの言語）
//  S5 課金ありのとき（オーナー決定 2026-11-23: 'native'＝iPhone アプリ版だけ。登録した最初の1か月は無料・次の月から月額300円）: 課金の質問（料金・お試し・解約・購入の復元）が見え、
//     年額・「年の縛り」の語が見える所に0件（年額は確認まとめ85で確認中）。Web 版のこと（11/24 オーナー回答86B で Web 版も課金モデル）と月額・最初の1か月無料が書いてある。機種変更のときの記録の移し方（ボタンの名前どおり）はどちらでも見える
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = (process.argv[2] || process.env.BASE || BASE_).replace(/\/?$/, '/');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
const OFF = /billingMode:\s*'off'/.test(src);
const PAGES = fs.readdirSync(ROOT).filter(f => /^support(-[\w-]+)?\.html$/.test(f)).sort();
const YEAR = {ja: /年額|年の縛り|1年|毎年|3,000円|3000円/, en: /year|annual|3,000|commitment/i};
const BAD = {ja: /解約|お試し|購入を復元|月額|請求|サブスクリプション|300円/, en: /cancel|trial|restore purchases|monthly|subscription|charged|Apple Account/i};
const enTr = (() => { let d = null; vm.runInNewContext(fs.readFileSync(ROOT + '/i18n/en.js', 'utf8'), {GOHAN_I18N: (l, o) => { d = o; }, window: {}}); return d; })();
const LABELS = {ja: ['ファイルで書き出す', 'ファイルから読み込む', 'データの引っ越し・バックアップ'], en: ['ファイルで書き出す', 'ファイルから読み込む', 'データの引っ越し・バックアップ'].map(k => enTr[k])};

ok(PAGES.includes('support.html') && PAGES.includes('support-en.html'), 'S4a サポートのページ: ' + PAGES.join(' '));
const docPage = (src.match(/function docPage\(name\)\{([^}]*)\}/) || [])[1] || '';
ok(/'-en'/.test(docPage) && PAGES.includes('support-en.html'), 'S4b アプリのリンク（docPage）が指すページがある: ' + docPage.trim());

const b = await chromium.launch(LAUNCH);
const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
const p = await ctx.newPage();
const bad = [], miss = [], kept = [];
for (const f of PAGES){
    const lg = f === 'support.html' ? 'ja' : f.replace(/^support-|\.html$/g, '');
    await p.goto(URL_ + f);
    const r = await p.evaluate(() => {
        document.querySelectorAll('details').forEach(d => d.open = true);
        const vis = e => !!e.getClientRects().length;
        return {txt: document.body.innerText, paid: [...document.querySelectorAll('[data-billing="paid"]')].map(e => ({vis: vis(e), txt: e.textContent})),
            free: [...document.querySelectorAll('[data-billing="free"]')].map(e => ({vis: vis(e), txt: e.innerText}))};
    });
    const re = BAD[lg] || BAD.en;
    if (OFF){
        const hits = (r.txt.match(new RegExp(re.source, 'g' + (re.flags.includes('i') ? 'i' : ''))) || []);
        if (hits.length) bad.push(`${f} ${[...new Set(hits)].join('・')}（${hits.length}件）`);
        if (r.free.length < 2 || r.free.some(x => !x.vis)) miss.push(`${f} 無料の質問 ${r.free.filter(x => x.vis).length}/${r.free.length}`);
        const all = r.free.map(x => x.txt).join(' ');
        (LABELS[lg] || LABELS.en).forEach(l => { if (!all.includes(l)) miss.push(`${f} 手順に「${l}」がない`); });
        if (!/無料|free/i.test(all)) miss.push(`${f} 「全員無料」の1問がない`);
        if (r.paid.length < 3 || r.paid.some(x => x.vis) || !r.paid.some(x => re.test(x.txt))) kept.push(`${f} 課金の質問 ${r.paid.length}（見えている ${r.paid.filter(x => x.vis).length}）`);
    } else {
        if (r.paid.length < 4 || r.paid.some(x => !x.vis) || r.free.some(x => x.vis)) kept.push(`${f} 課金を始めたのに、出し分けが無料のまま（課金の質問 ${r.paid.filter(x => x.vis).length}/${r.paid.length}・無料の質問の見えている ${r.free.filter(x => x.vis).length}）`);
        const yr = YEAR[lg] || YEAR.en, hits = r.txt.match(new RegExp(yr.source, 'g' + (yr.flags.includes('i') ? 'i' : ''))) || [];
        if (hits.length) bad.push(`${f} 年額・年の縛りの語 ${[...new Set(hits)].join('・')}`);
        const paid = r.paid.map(x => x.txt).join(' ');
        const need = lg === 'ja' ? [/月額300円/, /最初の1か月は無料|1か月の無料/, /Web 版/, /購入を復元/, /解約/] : [/monthly/i, /first month[^.]*is free/i, /web version/i, /Restore purchases/, /Cancel/]   // 11/24 オーナー回答86B: Web 版も課金モデル（「Web 版は無料」とは書かない。料金の答えに Web 版のことがある）;
        need.forEach(x => { if (!x.test(paid)) miss.push(`${f} 課金の質問に ${x} がない`); });
        (LABELS[lg] || LABELS.en).forEach(l => { if (!r.txt.includes(l)) miss.push(`${f} 機種変更の手順に「${l}」がない`); });
    }
}
await b.close();
ok(!bad.length, OFF ? `S1 ${PAGES.length}ページ: 全員無料のあいだは、課金の言葉（解約・お試し・購入を復元・月額 など）が見える所に0件: ` + bad.join(' / ')
    : `S5a ${PAGES.length}ページ: 課金ありのとき、年額・「年の縛り」の語が見える所に0件（月額だけの方針）: ` + bad.join(' / '));
ok(!miss.length, OFF ? 'S2 「全員無料」の1問と、無料のあいだの機種変更の手順（アプリのボタンの名前どおり）が見える: ' + miss.join(' / ')
    : 'S5b 課金の質問に月額300円・最初の1か月無料・Web 版のこと・購入を復元・解約があり、機種変更の手順（アプリのボタンの名前どおり）も見える: ' + miss.join(' / '));
ok(!kept.length, OFF ? `S3 課金の質問は消さずに data-billing="paid" で隠して残す（billingMode 'off' と出し分けが合う）: ` + kept.join(' / ')
    : `S3 課金ありのとき: 課金の質問（data-billing="paid"）が見え、全員無料の質問（free）は消さずに hidden で残す（billingMode と出し分けが合う）: ` + kept.join(' / '));
console.log(`ui51: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
