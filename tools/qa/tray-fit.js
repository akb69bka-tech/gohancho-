// 今日の献立のお膳: スクロールせずに、全部の器・料理名・「かえる」・まるごと入れ替えが、下に固定された「決定」の帯（と下のタブ）の上端より上に入ることを確かめる（基準書 2-3・オーナーの指示）
//  画面 390×844・360×740・390×844 文字「もっと大きい」 × 席 2〜8（品数の設定 1〜7 と「あと1品」）× ja・en・ko・de・ar・th × ライト／ダーク
//  ・器（.vessel）・料理名（.nm）・かえる（.swap）・真ん中の丸（.tg-mid .shuffle）の下端 ≤ 帯の上端、上端 ≥ 0（1px も隠れない）
//  ・横にはみ出さない。お膳は上下2段（上 ⌈席/2⌉・下 ⌊席/2⌋）
//  ・料理名は … で切れない、種類の字・「かえる」がお膳のふちで切れない、「かえる」は 44×44 以上（デザイン部長の点検1）
//  ・長い料理名（点検2）: 18言語 × 7席 × 文字「もっと大きい」× 390・360 で、どの枠もいちばん長い名前の料理にしても、名前が帯の後ろに入らない・切れない・お膳ではかっこの説明を出さない
// 使い方: BASE=http://localhost:8890/ node tools/qa/tray-fit.js   （VPS=390x844:0,360x740:0 LANGS=ja,en で絞れる）
const { chromium, LAUNCH, BASE, ready } = require('../lib/pw.cjs');
// 末尾に :c を付けた画面は、帯の上に入るかは見ず、名前・字が切れない・「かえる」の大きさだけを見る（基準書 2-3 の対象外の 360×740 文字大）
const VPS = (process.env.VPS || '390x844:0,360x740:0,390x844:2,360x740:2:c').split(',').map(x => { const [vp, ts, c] = x.split(':'); const [w, h] = vp.split('x').map(Number); return {w, h, ts: Number(ts) || 0, clipOnly: c === 'c'}; });
const LANGS = (process.env.LANGS || 'ja,en,ko,de,ar,th').split(',');
const CC = {ja: 'JP', en: 'US', ko: 'KR', de: 'DE', ar: 'EG', th: 'TH'};
let bad = 0, n = 0; const seen = new Set();
(async () => {
  const b = await chromium.launch(LAUNCH);
  for (const vp of VPS) for (const lang of LANGS) for (const dark of [false, true]) {
    const ctx = await b.newContext({viewport: {width: vp.w, height: vp.h}, colorScheme: dark ? 'dark' : 'light', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, lang, ts]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: lang, dishCount: 3, servings: 2, textSize: ts || undefined}})); } }, [CC[lang], lang, vp.ts]);
    await p.goto(BASE); await ready(p); await p.waitForTimeout(600);
    await p.evaluate(() => { window.hasPro = () => true; });
    for (const v of [1, 2, 3, 4, 5, 6, 7, 'plus']) {
      const r = await p.evaluate(async ([v, clipOnly]) => {
        window.scrollTo(0, 0); setTab('today');
        S.settings.dishCount = v === 'plus' ? 7 : v; session.mood = 'all'; session.menu = null; render();
        if (v === 'plus') {   // 「あと1品」で1つ足す（席 8 まで）
          const have = new Set(menuIds());
          const r = RECIPES.find(x => !have.has(x.id) && !isAvoided(x) && x.type === '副菜' && (w => w && w.mode === 'add')(oneWhere(x)));
          if (r) oneAdd(r.id);
          render();
        }
        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        const tr = document.querySelector('#view .tray'); if (!tr) return {err: 'お膳がない'};
        let floor = innerHeight;
        document.querySelectorAll('nav.tabs, .actionbar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(e).position) && q.top > innerHeight * .4 && q.top < floor) floor = q.top; });
        const parts = [...tr.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .tg-mid .shuffle')];
        const hid = parts.filter(e => { const q = e.getBoundingClientRect(); return q.bottom > floor + .5 || q.top < -.5 || q.left < -.5 || q.right > innerWidth + .5; }).map(e => (e.className || e.tagName).toString().split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().bottom));
        // 料理名は … で切らない（入りきらない名前は 12px・3行まで）。種類の字・「かえる」はお膳のふちで切れない。「かえる」は 44×44 以上（点検1）
        const cut = [...tr.querySelectorAll('.spot-label .nm')].filter(e => e.scrollHeight > e.clientHeight + 1).map(e => 'nm:' + e.textContent.trim().slice(0, 12));
        const textW = e => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width; };   // 字の幅（::before の印は含まない）
        const clip = [...tr.querySelectorAll('.spot-label .slot, .spot .swap:not(.swap-ph)')].filter(e => { const q = e.getBoundingClientRect(), sp = e.closest('.spot').getBoundingClientRect(); return textW(e) > e.clientWidth + 1 || q.left < sp.left - .5 || q.right > sp.right + .5; }).map(e => (e.className || '').split(' ')[0] + ':' + e.textContent.trim().slice(0, 10));
        const small = [...tr.querySelectorAll('.spot .swap:not(.swap-ph)')].filter(e => { const q = e.getBoundingClientRect(); return q.width < 44 - .5 || q.height < 44 - .5; }).map(e => Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
        if (clipOnly) hid.length = 0;
        hid.push(...cut, ...clip.map(x => 'clip ' + x), ...small.map(x => 'small ' + x));
        const rows = [...tr.querySelectorAll('.tg-row')].map(e => e.children.length), seats = rows.reduce((a, x) => a + x, 0);
        return {seats, rows, hid, floor: Math.round(floor), top: Math.round(tr.getBoundingClientRect().top), sw: document.documentElement.scrollWidth - innerWidth, mid: !!tr.querySelector('.tg-mid .shuffle')};
      }, [v, vp.clipOnly]);
      n++;
      const tag = `${vp.w}x${vp.h}${vp.ts ? ' 文字' + vp.ts : ''} ${lang}${dark ? ' dark' : ''} 設定${v} 席${r.seats}`;
      if (r.seats) seen.add(r.seats);
      const okRows = r.rows && r.rows[0] === Math.ceil(r.seats / 2) && (r.rows[1] || 0) === Math.floor(r.seats / 2);
      if (r.err || r.hid.length || r.sw > 0 || !r.mid || !okRows) { bad++; console.log('NG', tag, JSON.stringify(r)); }
    }
    if (errs.length) { bad++; console.log('NG JSエラー', vp.w, lang, errs.slice(0, 2).join('|')); }
    await ctx.close();
  }
  // 長い料理名（点検2）: 17言語＋日本語 × 7席 × 文字「もっと大きい」 × 390・360。どの枠もその国でいちばん長い名前の料理にして、名前が帯の後ろに入らず・… で切れないことを見る
  const CC_ALL = {ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW'};
  for (const [lang, cc] of Object.entries(CC_ALL)) for (const vp of [{w: 390, h: 844}, {w: 360, h: 740}]) {
    if (process.env.LANGS && !LANGS.includes(lang)) continue;
    const ctx = await b.newContext({viewport: {width: vp.w, height: vp.h}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, lang]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: lang, dishCount: 7, servings: 2, textSize: 2}})); } }, [cc, lang]);
    await p.goto(BASE); await ready(p); await p.waitForTimeout(600);
    if (cc !== 'JP') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, cc, {timeout: 30000}).catch(() => {});
    const r = await p.evaluate(async () => {
      window.hasPro = () => true; window.scrollTo(0, 0); setTab('today'); session.menu = null; render();
      const used = new Set(), m = session.menu;
      m.items.forEach(it => { if (!it.r) return; const c = RECIPES.filter(x => slotOf(x) === it.slot && !used.has(x.id) && !isAvoided(x) && (it.slot !== '主菜' || x.main !== false)).sort((a, b) => b.name.length - a.name.length)[0]; if (c){ it.r = c; used.add(c.id); } });
      render(); await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      const tr = document.querySelector('#view .tray'); let floor = innerHeight;
      document.querySelectorAll('nav.tabs, .actionbar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(e).position) && q.top > innerHeight * .4 && q.top < floor) floor = q.top; });
      // 帯の上に入るかは、基準書 2-3 の対象の 390 で見る。360（対象外）は、名前が切れない・かっこを出さないだけを見る（いちばん長い名前ばかりのポーランド語の7席は、360 では帯にかかる）
      const hid = innerWidth < 380 ? [] : [...tr.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .tg-mid .shuffle')].filter(e => e.getBoundingClientRect().bottom > floor + .5).map(e => (e.className || '').split(' ')[0] + ':' + e.textContent.trim().slice(0, 14));
      const cut = [...tr.querySelectorAll('.spot-label .nm')].filter(e => e.scrollHeight > e.clientHeight + 1).map(e => 'cut:' + e.textContent.trim().slice(0, 14));
      const paren = [...tr.querySelectorAll('.spot-label .nm')].filter(e => /[（(][^）)]*[）)]\s*$/.test(e.textContent.trim())).map(e => 'paren:' + e.textContent.trim().slice(0, 20));
      return {over: Math.round(Math.max(...[...tr.querySelectorAll('.spot .nm')].map(e => e.getBoundingClientRect().bottom)) - floor), seats: [...tr.querySelectorAll('.spot')].length, names: m.items.filter(x => x.r).map(x => x.r.name.length), bad: [...hid, ...cut, ...paren]};
    });
    n++;
    if (r.bad.length || errs.length) { bad++; console.log('NG 長い名前', vp.w + 'x' + vp.h, '文字2', lang, JSON.stringify(r), errs.slice(0, 1).join('')); }
    await ctx.close();
  }
  await b.close();
  const want = [2, 3, 4, 5, 6, 7].filter(k => !seen.has(k));   // 席 8 は「あと1品」で足せるときだけ（おかず6のときは足せない）
  if (want.length) { bad++; console.log('NG 試せなかった席の数', want.join(',')); }
  console.log(bad ? `NG ${bad} / ${n}` : `OK ${n}（席 ${[...seen].sort((a, b) => a - b).join(',')}）`);
  process.exit(bad ? 1 : 0);
})();
