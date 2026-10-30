// 今日の献立のお膳: スクロールせずに、全部の器・料理名・「かえる」・まるごと入れ替えが、下に固定された「決定」の帯（と下のタブ）の上端より上に入ることを確かめる（基準書 2-3・オーナーの指示）
//  画面 390×844・360×740・390×844 文字「もっと大きい」 × 席 2〜8（品数の設定 1〜7 と「あと1品」）× ja・en・ko・de・ar・th × ライト／ダーク
//  ・器（.vessel）・料理名（.nm）・かえる（.swap）・真ん中の丸（.tg-mid .shuffle）の下端 ≤ 帯の上端、上端 ≥ 0（1px も隠れない）
//  ・横にはみ出さない。お膳は上下2段（上 ⌈席/2⌉・下 ⌊席/2⌋）
//  ・料理名は … で切れない、種類の字・「かえる」がお膳のふちで切れない、「かえる」は 44×44 以上（デザイン部長の点検1）
//  ・長い料理名（点検2）: 18言語 × 7席 × 文字「もっと大きい」× 390・360 で、どの枠もいちばん長い名前の料理にしても、名前が帯の後ろに入らない・切れない・お膳ではかっこの説明を出さない
//  ・お膳の下の押す場所が、決定の帯に半分かかっていない
//  ・375×667 は帯の上に入るかは見ない（:c）。器を覆わないこと・切れないことは見る
//  ・器の面積の10%以上を、ほかの部品（かえる・札・名前・ほかの器・真ん中の丸）が覆わない（点検3。360・375×667・390・文字大 × 2〜8席）
//  ・アレルギーの家族あり・家族リクエストあり（第8回 S22）: 360・390・430 × 文字3段階 × JP・KR・TH。⚠ の札も帯の上に入り、隠れない・12px 以上・印のない段に場所を空けない
// 使い方: BASE=http://localhost:8890/ node tools/qa/tray-fit.js   （VPS=390x844:0,360x740:0 LANGS=ja,en で絞れる）
const { chromium, LAUNCH, BASE, ready } = require('../lib/pw.cjs');
// 末尾に :c を付けた画面は、帯の上に入るかは見ず、名前・字が切れない・「かえる」の大きさだけを見る（基準書 2-3 の対象外の 360×740 文字大）
const VPS = (process.env.VPS || '390x844:0,360x740:0,375x667:0:c,390x844:2,360x740:2').split(',').map(x => { const [vp, ts, c] = x.split(':'); const [w, h] = vp.split('x').map(Number); return {w, h, ts: Number(ts) || 0, clipOnly: c === 'c'}; });
const LANGS = (process.env.LANGS || 'ja,en,ko,de,ar,th').split(',');
const CC = {ja: 'JP', en: 'US', ko: 'KR', de: 'DE', ar: 'EG', th: 'TH'};
let bad = 0, n = 0; const seen = new Set(), scrolled = [];
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
        const clip = [...tr.querySelectorAll('.spot-label .slot, .spot .swap:not(.swap-ph)')].filter(e => e.getClientRects().length).filter(e => {   // 出していない種類の字（いちばん詰めたとき noslot）は見ない
           const q = e.getBoundingClientRect(), sp = e.closest('.spot').getBoundingClientRect(); return textW(e) > e.clientWidth + 1 || q.left < sp.left - .5 || q.right > sp.right + .5; }).map(e => (e.className || '').split(' ')[0] + ':' + e.textContent.trim().slice(0, 10));
        const small = [...tr.querySelectorAll('.spot .swap:not(.swap-ph)')].filter(e => { const q = e.getBoundingClientRect(); return q.width < 44 - .5 || q.height < 44 - .5; }).map(e => Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
        // お膳の下の押す場所が、決定の帯に半分かかっていない（帯の上に入るか、帯より下＝スクロールの先）
        hid.push(...[...document.querySelectorAll('#view button, #view [data-act]')].filter(e => !e.closest('.actionbar') && !tr.contains(e)).filter(e => { const q = e.getBoundingClientRect(); return q.height > 0 && q.top < floor - 1 && q.bottom > floor + 1; }).map(e => 'straddle:' + (e.dataset.act || e.tagName)));
        // 360 の文字大で入らないときは、帯をお膳の下に置く形（bar-static：スクロールで全部見られる）でもよい。帯がお膳に重ならないことを見る（点検3: かえるを器に重ねないため）
        const scrollOk = innerWidth < 390 && document.documentElement.getAttribute('data-ts') && document.body.classList.contains('bar-static'), bar = document.querySelector('.actionbar');
        if (clipOnly || scrollOk) hid.length = 0;
        if (scrollOk && bar && bar.getBoundingClientRect().top < tr.getBoundingClientRect().bottom - .5) hid.push('bar-over-tray');
        document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });   // 器が下から上がる動き（rise）の途中ではなく、止まった形で見る
        const cover = [...tr.querySelectorAll('.spot .vessel')].map(v => { const a = v.getBoundingClientRect(), area = a.width * a.height; if (!area) return null;
          const by = [...tr.querySelectorAll('.spot .swap:not(.swap-ph), .spot .fresh-tag, .spot .wsh-tag, .spot-label .slot, .spot-label .nm, .spot-label .ex > *, .spot .vessel, .tg-mid .shuffle')].filter(e => e !== v && !v.contains(e) && !e.contains(v) && getComputedStyle(e).visibility !== 'hidden');
          const hit = by.map(e => { const q = e.getBoundingClientRect(); return {e, s: Math.max(0, Math.min(a.right, q.right) - Math.max(a.left, q.left)) * Math.max(0, Math.min(a.bottom, q.bottom) - Math.max(a.top, q.top))}; }).filter(x => x.s > 0);
          const tot = hit.reduce((t, x) => t + x.s, 0); return tot > area * .1 ? 'cover:' + Math.round(tot / area * 100) + '%:' + hit.map(x => (x.e.className || '').split(' ')[0]).join('+') : null; }).filter(Boolean);   // 器の面積の10%以上を、ほかの部品（かえる・札・名前・ほかの器・真ん中の丸）が覆わない（点検3）
        hid.push(...cover, ...cut, ...clip.map(x => 'clip ' + x), ...small.map(x => 'small ' + x));
        const rows = [...tr.querySelectorAll('.tg-row')].map(e => e.children.length), seats = rows.reduce((a, x) => a + x, 0);
        return {scrollOk, seats, rows, hid, floor: Math.round(floor), top: Math.round(tr.getBoundingClientRect().top), sw: document.documentElement.scrollWidth - innerWidth, mid: !!tr.querySelector('.tg-mid .shuffle')};
      }, [v, vp.clipOnly]);
      n++;
      const tag = `${vp.w}x${vp.h}${vp.ts ? ' 文字' + vp.ts : ''} ${lang}${dark ? ' dark' : ''} 設定${v} 席${r.seats}`;
      if (r.seats) seen.add(r.seats); if (r.scrollOk) scrolled.push(tag);
      const okRows = r.rows && r.rows[0] === Math.ceil(r.seats / 2) && (r.rows[1] || 0) === Math.floor(r.seats / 2);
      if (r.err || r.hid.length || r.sw > 0 || !r.mid || !okRows) { bad++; console.log('NG', tag, JSON.stringify(r)); }
    }
    if (errs.length) { bad++; console.log('NG JSエラー', vp.w, lang, errs.slice(0, 2).join('|')); }
    await ctx.close();
  }
  // 長い料理名（点検2）: 17言語＋日本語 × 7席 × 文字「もっと大きい」 × 390・360。どの枠もその国でいちばん長い名前の料理にして、名前が帯の後ろに入らず・… で切れないことを見る
  const CC_ALL = {ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW'};
  for (const [lang, cc] of Object.entries(CC_ALL)) for (const vp of [{w: 390, h: 844}, {w: 360, h: 740}, {w: 375, h: 667}]) {
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
      // 390 は帯の上に入ることを見る。360・375×667 は、入らないときは帯をお膳の下に置く形（bar-static：スクロールで全部見られる）でもよい（点検3: かえるを器に重ねないため）
      const scrollOk = innerWidth < 390 && document.body.classList.contains('bar-static'), bar = document.querySelector('.actionbar.decide-bar, .actionbar');
      if (scrollOk && bar && bar.getBoundingClientRect().top < tr.getBoundingClientRect().bottom - .5) return {bad: ['bar-over-tray']};   // 帯がお膳に重なっていない
      const hid = scrollOk ? [] : [...tr.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .tg-mid .shuffle')].filter(e => e.getBoundingClientRect().bottom > floor + .5).map(e => (e.className || '').split(' ')[0] + ':' + e.textContent.trim().slice(0, 14));
      const cut = [...tr.querySelectorAll('.spot-label .nm')].filter(e => e.scrollHeight > e.clientHeight + 1).map(e => 'cut:' + e.textContent.trim().slice(0, 14));
      document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });   // 器が下から上がる動き（rise）の途中ではなく、止まった形で見る
        const cover = [...tr.querySelectorAll('.spot .vessel')].map(v => { const a = v.getBoundingClientRect(), area = a.width * a.height; if (!area) return null;
          const by = [...tr.querySelectorAll('.spot .swap:not(.swap-ph), .spot .fresh-tag, .spot .wsh-tag, .spot-label .slot, .spot-label .nm, .spot-label .ex > *, .spot .vessel, .tg-mid .shuffle')].filter(e => e !== v && !v.contains(e) && !e.contains(v) && getComputedStyle(e).visibility !== 'hidden');
          const hit = by.map(e => { const q = e.getBoundingClientRect(); return {e, s: Math.max(0, Math.min(a.right, q.right) - Math.max(a.left, q.left)) * Math.max(0, Math.min(a.bottom, q.bottom) - Math.max(a.top, q.top))}; }).filter(x => x.s > 0);
          const tot = hit.reduce((t, x) => t + x.s, 0); return tot > area * .1 ? 'cover:' + Math.round(tot / area * 100) + '%:' + hit.map(x => (x.e.className || '').split(' ')[0]).join('+') : null; }).filter(Boolean);   // 器の面積の10%以上を、ほかの部品（かえる・札・名前・ほかの器・真ん中の丸）が覆わない（点検3）
      const paren = [...tr.querySelectorAll('.spot-label .nm')].filter(e => /[（(][^）)]*[）)]\s*$/.test(e.textContent.trim())).map(e => 'paren:' + e.textContent.trim().slice(0, 20));
      return {over: Math.round(Math.max(...[...tr.querySelectorAll('.spot .nm')].map(e => e.getBoundingClientRect().bottom)) - floor), seats: [...tr.querySelectorAll('.spot')].length, names: m.items.filter(x => x.r).map(x => x.r.name.length), bad: [...hid, ...cover, ...cut, ...paren], scrollOk, cls: document.body.className + '|' + tr.className};
    });
    n++;
    if (r.scrollOk) scrolled.push(vp.w + 'x' + vp.h + ' ' + lang);
    if (r.bad.length || errs.length) { bad++; console.log('NG 長い名前', vp.w + 'x' + vp.h, '文字2', lang, JSON.stringify(r), errs.slice(0, 1).join('')); }
    await ctx.close();
  }
  // アレルギーの家族あり・家族リクエストあり（第8回 S22）: 360・390・430 × 文字3段階 × JP・KR・TH × 席 3・5（品数 2・4）。
  //  ⚠・🔍 の札が下の段に出る献立を探して、器・名前・かえる・真ん中の丸・⚠ の札が帯の上に入る（360×740 は、帯をお膳の下に置く形でもよい）。
  //  ⚠ の札は隠さない（帯の後ろ・お膳のふちで切れない、文字は 12px 以上）。印のない段に札の場所を空けない。点検3（10%）も同じに見る
  const FAM_ALG = {ja: ['fish'], ko: ['shrimp', 'crab', 'fish'], th: ['egg', 'fish']}, FAM_CC = {ja: 'JP', ko: 'KR', th: 'TH'};
  for (const vp of [{w: 360, h: 740}, {w: 390, h: 844}, {w: 430, h: 932}]) for (const ts of [0, 1, 2]) for (const lang of ['ja', 'ko', 'th']) {
    if (process.env.LANGS && !LANGS.includes(lang)) continue;
    const ctx = await b.newContext({viewport: {width: vp.w, height: vp.h}, serviceWorkers: 'block', timezoneId: 'Asia/Tokyo'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, lang, ts, alg]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', family: [{id: 'f1', name: lang === 'ja' ? '夫' : 'A', role: 'adult', avoid: alg.map(x => '@' + x), allergy: alg.map(x => '@' + x), mild: false}], settings: {country: cc, uiLang: lang, dishCount: 4, servings: 2, textSize: ts || undefined}})); } }, [FAM_CC[lang], lang, ts, FAM_ALG[lang]]);
    await p.clock.setFixedTime(new Date('2026-10-30T12:15:00+09:00'));   // お昼（あいさつが長い「お昼のうちに夜の献立を…」）
    await p.goto(BASE); await ready(p); await p.waitForTimeout(600);
    if (lang !== 'ja') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, FAM_CC[lang], {timeout: 30000}).catch(() => {});
    // お膳を見る（器・名前・かえる・丸・⚠ の札が帯の上・札が隠れない・印のない段に場所を空けない・点検3）。あいさつの行（2行・⚠ の文）も出した形で測る
    await p.evaluate(() => { window.__fitChk = async (opt) => {
        const tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        TRAY_FIT.key = ''; TRAY_FIT.base = ''; TRAY_FIT.state = null; render(); await tick();   // 開いたときと同じ（前の大きさを引きつがない）
        document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
        const tr = document.querySelector('#view .tray'); if (!tr) return {err: 'お膳がない', bad: []};
        let floor = innerHeight;
        document.querySelectorAll('nav.tabs, .actionbar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(e).position) && q.top > innerHeight * .4 && q.top < floor) floor = q.top; });
        // 360×740 は、⚠ の札が上下の段に出て名前も2行の日（いちばん詰めても入らない）は、帯をお膳の下に置く形でもよい（スクロールで全部見られる）。390・430 は帯の上に入ること
        const scrollOk = innerWidth < 390 && document.body.classList.contains('bar-static'), bar = document.querySelector('.actionbar');
        const bad = [];
        if (!document.querySelector(opt.warn !== undefined ? '#greet .req-btn' : '#greet .req-btn.has')) bad.push('家族リクエストの入口がない');   // 決めたあとにアレルゲンを足すと、届いた料理が当たって数が消えることがある（入口は残る）
        const gt = document.querySelector('#greet .greet-tx'), greet = gt ? (getComputedStyle(gt).display === 'none' ? '(出さない)' : gt.textContent.slice(0, 14) + ' ' + Math.round(gt.getBoundingClientRect().height) + 'px') : '';
        if (opt.warn && !(gt && /⚠/.test(gt.textContent))) bad.push('⚠ のあいさつにならない');
        const parts = [...tr.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .tg-mid .shuffle, .spot .alg-tag')];
        if (!scrollOk) bad.push(...parts.filter(e => { const q = e.getBoundingClientRect(); return q.bottom > floor + .5 || q.top < -.5; }).map(e => 'hid:' + (e.className || '').split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().bottom)));
        if (scrollOk && bar && bar.getBoundingClientRect().top < tr.getBoundingClientRect().bottom - .5) bad.push('bar-over-tray');
        const tags = [...tr.querySelectorAll('.spot .alg-tag')];
        tags.forEach(e => { const q = e.getBoundingClientRect(), sp = e.closest('.spot').getBoundingClientRect(), cs = getComputedStyle(e);
          if (cs.display === 'none' || cs.visibility === 'hidden' || q.height < 8) bad.push('alg-hidden');
          if (parseFloat(cs.fontSize) < 12) bad.push('alg-small:' + cs.fontSize);
          if (e.scrollHeight > e.clientHeight + 1 || q.left < sp.left - .5 || q.right > sp.right + .5) bad.push('alg-cut:' + e.textContent.trim().slice(0, 10)); });
        if (opt.warn && !tags.some(e => !e.classList.contains('may'))) bad.push('⚠ の札がない');
        // 印のない段に札の場所を空けない（開いたばかりの形で見る）
        [...tr.querySelectorAll('.tg-row')].forEach((row, k) => { if (!row.querySelector('.alg-tag') && [...row.querySelectorAll('.spot-label .ex')].some(e => parseFloat(getComputedStyle(e).getPropertyValue('--exa')) > 0)) bad.push('alg-room-row' + k); });
        const cover = [...tr.querySelectorAll('.spot .vessel')].map(v => { const a = v.getBoundingClientRect(), area = a.width * a.height; if (!area) return null;
          const by = [...tr.querySelectorAll('.spot .swap:not(.swap-ph), .spot .fresh-tag, .spot-label .slot, .spot-label .nm, .spot-label .ex > *, .spot .vessel, .tg-mid .shuffle')].filter(e => e !== v && !v.contains(e) && !e.contains(v) && getComputedStyle(e).visibility !== 'hidden');
          const hit = by.map(e => { const q = e.getBoundingClientRect(); return {e, s: Math.max(0, Math.min(a.right, q.right) - Math.max(a.left, q.left)) * Math.max(0, Math.min(a.bottom, q.bottom) - Math.max(a.top, q.top))}; }).filter(x => x.s > 0);
          const tot = hit.reduce((t, x) => t + x.s, 0); return tot > area * .1 ? 'cover:' + Math.round(tot / area * 100) + '%:' + hit.map(x => (x.e.className || '').split(' ')[0]).join('+') : null; }).filter(Boolean);
        bad.push(...cover);
        const rows = [...tr.querySelectorAll('.tg-row')].map(e => e.children.length), seats = rows.reduce((a, x) => a + x, 0);
        if (!(rows[0] === Math.ceil(seats / 2) && (rows[1] || 0) === Math.floor(seats / 2)) || !tr.querySelector('.tg-mid .shuffle')) bad.push('rows:' + rows.join('/'));
        return {bad, tags: tags.length, tagRows: [...tr.querySelectorAll('.tg-row')].map(x => x.querySelector('.alg-tag') ? 1 : 0).join(''), scrollOk, seats, greet, sw: document.documentElement.scrollWidth - innerWidth};
    }; });
    const report = (r, what) => { n++; const tag = `アレルギーの家族＋家族リクエスト ${vp.w}x${vp.h}${ts ? ' 文字' + ts : ''} ${lang} ${what} 席${r.seats} 札${r.tags}(${r.tagRows}) あいさつ「${r.greet}」`;
      if (r.scrollOk) scrolled.push(tag);
      if (r.err || r.bad.length || r.sw > 0) { bad++; console.log('NG', tag, JSON.stringify(r)); } else if (process.env.VERBOSE) console.log('ok', tag, r.scrollOk ? '(帯はお膳の下)' : ''); };
    for (const v of [2, 4]) {
      const r = await p.evaluate(async v => {
        const tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        window.hasPro = () => true; window.scrollTo(0, 0); setTab('today'); S.settings.dishCount = v; session.mood = 'all';
        const w = RECIPES.find(x => slotOf(x) === '主菜' && !isAvoided(x)); S.wants = w ? [{id: w.id, at: TODAY, n: famMembers()[0].name, m: 0}] : [];   // 家族リクエスト（届いた1件）
        for (let i = 0; i < 40; i++){ session.menu = null; render(); await tick(); const rows = [...document.querySelectorAll('#view .tray .tg-row')]; if (rows.length > 1 && rows[1].querySelector('.alg-tag')) break; }
        return window.__fitChk({});
      }, v);
      report(r, '品数' + v);
    }
    // 決めたあとに家族のアレルゲンを足して、決めた献立に ⚠ が出た形（あいさつは「⚠の印の料理があります…」。第8回 P9）
    {
      const r = await p.evaluate(async () => {
        const tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        S.settings.dishCount = 4; session.menu = null; setTab('today'); render(); await tick();
        const b = document.querySelector('#view [data-act="decide"]'); if (b) b.click(); await tick(); setTab('today'); render(); await tick();
        const m = session.menu, fm = famMembers()[0];
        const ALG = ['egg', 'milk', 'dairy', 'wheat', 'soy', 'pork', 'chicken', 'beef', 'sesame', 'shrimp', 'crab'];
        for (const id of ALG){ const hit = m.items.filter(x => x.r && algSelectedHits(x.r, [id]).length).length; if (hit && !fm.allergy.includes('@' + id)){ fm.avoid = fm.avoid.concat('@' + id); fm.allergy = fm.allergy.concat('@' + id); break; } }
        if (typeof famAlgIds !== 'undefined' && famAlgIds.c) famAlgIds.c = null;
        session.menu = null; render(); await tick(); window.scrollTo(0, 0);
        const warn = !!document.querySelector('#view .tray .alg-tag:not(.may)');
        return Object.assign(await window.__fitChk({warn: warn}), {warnOn: warn});
      });
      report(r, '決めたあと⚠' + (r.warnOn ? '' : '（⚠ を出せなかった）'));
    }
    if (errs.length) { bad++; console.log('NG JSエラー（アレルギーの家族）', vp.w, lang, errs.slice(0, 2).join('|')); }
    await ctx.close();
  }
  await b.close();
  const want = [2, 3, 4, 5, 6, 7].filter(k => !seen.has(k));   // 席 8 は「あと1品」で足せるときだけ（おかず6のときは足せない）
  if (want.length) { bad++; console.log('NG 試せなかった席の数', want.join(',')); }
  if (scrolled.length) console.log('帯をお膳の下に置いた（スクロール）:', scrolled.join(', '));
  console.log(bad ? `NG ${bad} / ${n}` : `OK ${n}（席 ${[...seen].sort((a, b) => a - b).join(',')}）`);
  process.exit(bad ? 1 : 0);
})();
