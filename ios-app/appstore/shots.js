// App Store のスクリーンショットを、今のアプリ（gohancho/）の実際の画面から作る。
//   使い方: リポジトリのルートで `python3 -m http.server 8811 -d gohancho` を動かしてから
//           node ios-app/appstore/shots.js [http://localhost:8811/]
//   出力: ios-app/appstore/screenshots/（日本語）・screenshots-en/（英語）に
//         6.9inch-01〜06.png（1320×2868）と 6.5inch-01〜06.png（1284×2778）
//   ・iPhone アプリ版と同じ表示にするため、Capacitor の代わり（通知・共有）を入れて開く。外への通信は止める（同梱のファイルだけで動く）
//   ・背景はアプリと同じ生成り・柿色・こげ茶。青は使わない。購入画面は入れない（全員無料で出すため）
//   ・Playwright が必要（npm i -g playwright）
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'http://localhost:8811/').replace(/\/?$/, '/');
const OUT = __dirname;
const SIZES = [{name: '6.9inch', w: 440, h: 956}, {name: '6.5inch', w: 428, h: 926}];   // ×3 で 1320×2868・1284×2778
const COPY = {
    ja: [
        ['お膳ごと、おまかせ', '主菜・副菜・汁もの。「まるごと入れ替え」もワンタップ'],
        ['1週間の献立と買い物メモ', '同じ料理や肉・魚が続かないように組みます'],
        ['家族に送る', '1週間の予定と買い物メモを、そのまま送れます'],
        ['冷蔵庫の材料から探せる', '今ある材料で作れる料理がすぐわかる'],
        ['分量は人数に合わせて', 'アレルゲンの目安と、わかりやすい作り方'],
        ['21の国と地域の家庭料理', '世界のレシピも、毎日の献立に'],
    ],
    en: [
        ['A whole meal, decided', 'Main, sides and soup. Swap them all in one tap'],
        ['Your week and grocery list', 'No repeats of the same dish, meat or fish'],
        ['Send it to your family', 'Share the week\'s plan and grocery list'],
        ['Cook from your fridge', 'See what you can make right now'],
        ['Amounts for your household', 'Allergen notes and clear steps'],
        ['Home cooking, 21 countries', 'World recipes for every day'],
    ],
};
const NATIVE = () => {
    const notif = {checkPermissions: async () => ({display: 'granted'}), requestPermissions: async () => ({display: 'granted'}), schedule: async () => {}, cancel: async () => {}, getPending: async () => ({notifications: []})};
    window.Capacitor = {isNativePlatform: () => true, getPlatform: () => 'ios', isPluginAvailable: n => n === 'LocalNotifications' || n === 'Share', Plugins: {LocalNotifications: notif, Share: {share: async () => {}}}};
};
const wait = ms => new Promise(r => setTimeout(r, ms));

async function appShots(b, lang, size){
    const ctx = await b.newContext({viewport: {width: size.w, height: size.h}, deviceScaleFactor: 3, locale: lang === 'ja' ? 'ja-JP' : 'en-US', timezoneId: lang === 'ja' ? 'Asia/Tokyo' : 'America/New_York', isMobile: true, hasTouch: true, serviceWorkers: 'block'});
    await ctx.addInitScript(NATIVE);
    await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort('internetdisconnected'));
    const p = await ctx.newPage();
    await p.goto(BASE, {waitUntil: 'load'}); await wait(1800);
    // はじめての設定: 候補の国（ja=日本・en=アメリカ）→ 次へ → 献立を見る
    let dlg = p.locator('[role=dialog]').last();
    await dlg.locator('[role=tabpanel] button').first().click(); await wait(300);
    await dlg.locator('.ob-actions button').last().click(); await wait(500);
    await p.locator('[role=dialog]').last().locator('.ob-actions button').last().click(); await wait(1500);
    const shots = [];
    const snap = async () => { await wait(500); shots.push(await p.screenshot()); };
    const closeSheets = async () => { for (let k = 0; k < 4 && await p.locator('#modal-root .modal, [role=dialog]').count(); k++){ await p.keyboard.press('Escape'); await wait(400); } };
    const tab = async re => { await closeSheets(); const t = (await p.locator('nav.tabs [role=tab]').all()); for (const x of t){ const a = (await x.getAttribute('aria-label')) || (await x.innerText()); if (re.test(a)){ await x.click(); break; } } await wait(1200); await p.evaluate(() => scrollTo(0, 0)); };
    // 1 今日の献立
    await snap();
    // 2 1週間の主菜と買い物メモ
    await p.evaluate(() => { const d = [...document.querySelectorAll('details')].find(x => x.querySelector('[data-act="make-week"]')); if (d) d.open = true; });
    await wait(400);
    await p.locator('[data-act="make-week"]').first().click(); await wait(1500);
    await p.evaluate(() => { const s = document.querySelector('[data-act="share-week"]'); const h = [...document.querySelectorAll('h2')].find(x => x.closest('details') && x.closest('details').querySelector('[data-act="share-week"]')); (h || s).scrollIntoView({block: 'start'}); scrollBy(0, -12); });
    await snap();
    // 3 家族に送る
    await p.locator('[data-act="share-week"]').first().click(); await wait(1000);
    await snap();
    // 4 材料から（例の材料を入れて、作れる料理まで送る）
    await tab(/^(材料から|Fridge)$/);
    await p.locator('[data-act="sample-ing"]').first().click(); await wait(1200);
    await p.evaluate(() => { const h = [...document.querySelectorAll('h2')].find(x => /作れる料理|What you can make|can make/i.test(x.textContent)); if (h) { h.scrollIntoView({block: 'start'}); scrollBy(0, -12); } });
    await snap();
    // 5 レシピ（今日の献立の主菜を開く）
    await tab(/^(今日の献立|Today)$/);
    await p.getByRole('button', {name: /の作り方を見る|^See how to make|recipe/i}).first().click(); await wait(1200);
    await p.evaluate(() => { const d = document.querySelector('[role=dialog] .dsheet, .dsheet') || document.querySelector('[role=dialog]'); const h = d && d.querySelector('h2'); if (h && d) { const sc = h.closest('.dsheet') || d; sc.scrollTop = Math.max(0, h.offsetTop - 24); } });
    await snap();
    // 6 世界のレシピ
    await tab(/^(世界のレシピ|World)$/);
    await snap();
    await ctx.close();
    return shots;
}

function frameHtml(img, head, sub, lang, size){
    const font = lang === 'ja' ? "'Hiragino Mincho ProN','Noto Serif CJK JP','Noto Serif JP',serif" : "Georgia,'Noto Serif',serif";
    const body = lang === 'ja' ? "'Hiragino Kaku Gothic ProN','Noto Sans CJK JP','Noto Sans JP',sans-serif" : "system-ui,'Noto Sans',sans-serif";
    const sw = Math.round(size.w * 0.76), sh = Math.round(sw * size.h / size.w);
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
html,body{margin:0;width:${size.w}px;height:${size.h}px;overflow:hidden}
body{background:#fbf5ec;color:#3a2a1f;display:flex;flex-direction:column;align-items:center;font-family:${body}}
.band{position:absolute;left:0;right:0;bottom:0;height:${Math.round(size.h * 0.42)}px;background:#b8521f}
.head{position:relative;text-align:center;padding:${Math.round(size.h * 0.045)}px 20px 0}
h1{white-space:nowrap;font-family:${font};font-weight:700;font-size:${lang === 'ja' ? 31 : 30}px;line-height:1.3;margin:0;letter-spacing:${lang === 'ja' ? '.06em' : '0'}}
p{margin:10px 0 0;font-size:15.5px;line-height:1.5;color:#756354}
.rule{width:44px;height:4px;border-radius:2px;background:#b8521f;margin:14px auto 0}
.phone{position:relative;margin-top:${Math.round(size.h * 0.03)}px;width:${sw}px;height:${sh}px;border-radius:34px;padding:9px;background:#3a2a1f;box-shadow:0 18px 40px rgba(58,42,31,.28)}
.phone img{width:100%;height:100%;border-radius:26px;display:block;object-fit:cover;object-position:top}
</style></head><body><div class="band"></div><div class="head"><h1>${head}</h1><div class="rule"></div><p>${sub}</p></div>
<div class="phone"><img src="data:image/png;base64,${img.toString('base64')}"></div>
<script>const h=document.querySelector('h1');let f=parseFloat(getComputedStyle(h).fontSize);while(h.scrollWidth>innerWidth-32&&f>18){f-=1;h.style.fontSize=f+'px';}</script></body></html>`;   // 見出しは1行。入りきらなければ字を小さくする
}

(async () => {
    const b = await chromium.launch();
    for (const lang of ['ja', 'en']){
        const dir = path.join(OUT, lang === 'ja' ? 'screenshots' : 'screenshots-en');
        fs.mkdirSync(dir, {recursive: true});
        for (const size of SIZES){
            const shots = await appShots(b, lang, size);
            const ctx = await b.newContext({viewport: {width: size.w, height: size.h}, deviceScaleFactor: 3});
            const p = await ctx.newPage();
            for (let i = 0; i < shots.length; i++){
                const [head, sub] = COPY[lang][i];
                await p.setContent(frameHtml(shots[i], head, sub, lang, size), {waitUntil: 'load'});
                const f = path.join(dir, `${size.name}-0${i + 1}.png`);
                await p.screenshot({path: f});
                console.log('wrote', path.relative(process.cwd(), f));
            }
            await ctx.close();
        }
    }
    await b.close();
})();
