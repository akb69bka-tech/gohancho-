// 仲間はずれの点検（category-audit）: 「仲間の中に、仲間でないものが入っている」を機械で見つける
//   21か国 × 気分（その国で選べる全部）× 品数 × 乱数いくつか で献立を作り、席（主菜・副菜・汁もの・ご飯）・絞りこみ・主食・
//   かえるの絞りこみ（冷蔵庫の物で・20分以内・魚の日・おかゆの日）・1週間プラン・明日の献立・アレルギー/苦手 を、
//   料理のデータ（種類・調理法・時間・材料・国・朝食の印）と照らす。決まりごとの表は RULES（docs/qa/category-audit.md にも同じ表）。
//   1件でも合わないものがあれば落ちる（終了コード 1）。
//   環境変数: BASE（アプリの URL）, SEED, CCS（国。既定は21か国）, RUNS（1条件あたりの献立の数。既定 4）, OUT（結果の JSON を書く場所。省略可）
const { chromium, LAUNCH, BASE, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const fs = require('fs');
const CCS = (process.env.CCS || 'JP,US,GB,FR,DE,IT,ES,PL,TR,EG,IN,CN,TW,KR,TH,VN,ID,PH,MX,BR,PE').split(',').filter(Boolean);
const RUNS = Number(process.env.RUNS || 4);

// 決まりごとの表（id: 中身）。ページの中の点検は、この id で合わないものを返す
const RULES = {
  'slot-main':     '主菜の席には主菜（主菜・ごはんもの・麺）だけ',
  'slot-side':     '副菜の席には副菜だけ（主菜級・汁もの・ごはんもの・麺を入れない）',
  'slot-soup':     '汁ものの席には汁ものだけ',
  'dup':           '同じお膳に同じ料理を2つ置かない',
  'two-staples':   '主食を2つにしない（ご飯の日・ご飯ものの主菜の日にご飯の副菜／ご飯もの・麺の主菜を2つ）',
  'soupy-soup':    '汁けの多い主菜（汁の麺・鍋・シチュー）の日に、汁ものの席を足さない',
  'sweet-soup':    '晩ごはんの汁ものに、甘い羹・甜湯を出さない',
  'breakfast':     '夕食に朝食の料理を出さない（おかゆの日の主菜は除く）',
  'light-main':    '軽い食事（卵かけご飯・お茶漬け・おにぎり・雑炊）を、おかゆの日以外の主菜にしない',
  'okayu-off':     'おかゆは、おかゆの日以外の主菜にしない',
  'season':        '時期の決まった料理（雑煮・七草がゆ・冷やし中華・そうめん）は、その月だけ',
  'avoid':         'アレルギー・苦手・品薄・今は出さないの料理を出さない',
  'mood-quick':    '20分以内の日は、どの料理も20分以内',
  'mood-easy':     'ラクの日は、ラクの日の条件に合う料理',
  'mood-bento':    'お弁当の日は、汁ものの席なし・汁けの多い料理なし・お弁当向きの料理',
  'mood-okayu':    'おかゆの日の主菜は、おかゆ・雑炊・粥だけ（麺・揚げ物は出さない）',
  'okayu-quick':   'おかゆの日の主菜は、早くできる（20分以内の）おかゆ・雑炊があればそれを先に出す',
  'event-main':    '行事のご飯（赤飯）を主菜にしない（献立・かえる・1週間プラン）',
  'mood-okayu-side': 'おかゆの日の副菜・汁ものは、やわらかい・あっさりした20分以内の料理（揚げ・焼き・炒め・辛い・生のサラダ・漬物は出さない）',
  'mood-genre':    '和・洋・中の日の主菜は、その料理のなかま',
  'mood-genre-side': '和・洋・中・韓国エスニックの日の副菜・汁もの・2品目の主菜も、そのなかま（韓国エスニックの日は中華も可。合う料理がその席にないときを除く）',
  'mood-asia':     '韓国・エスニックの日の主菜は、韓国かエスニック',
  'mood-fish':     '魚の日の主菜は、魚・魚介の料理',
  'mood-meat':     'がっつり肉の日の主菜は、肉の料理',
  'staple-okayu':  '主食がおかゆの日は、ご飯もの・麺を主菜にしない',
  'swap-filter':   'かえるの絞りこみ（冷蔵庫の物で・20分以内・魚の日・おかゆの日）の候補は、その条件に合う料理だけ',
  'swap-mood':     'かえるの絞りこみを使っても、選んでいる気分（魚の日・和食など）に合う主菜だけ',
  'swap-slot':     'かえるの候補は、押した席と同じ種類の料理だけ',
  'one-kind':      'あと1品の候補は、副菜か汁ものだけ',
  'week-main':     '1週間プランの主菜は、夕食の主菜（朝食・軽い食事・おかゆ・時期外の料理を入れない）',
  'week-dup':      '1週間プランに同じ主菜を2回入れない（主菜が7つない国を除く）',
  'week-bowl':     '1週間プランのご飯もの・麺は3日まで（候補が足りる国）',
  'week-extra':    '1週間プランの副菜・汁ものは、その種類の料理',
};

const page_audit = ({runs, seed}) => {
  const out = [], stat = {menus: 0, swaps: 0, weeks: 0, tomorrow: 0};
  const cc = currentCountry();
  // 乱数を決まった値にする（seed ごとに変える）
  const reseed = s => { let a = s >>> 0; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  window.twistAvailable = () => false;   // ひとひねり案は献立の席に入らないので作らない（速くするため）
  const bad = (rule, scene, slot, r, detail) => out.push({rule, cc, scene, slot, id: r ? r.id : '-', name: r ? String(r.name) : '-', detail: detail || ''});
  const MEAT = ['豚', '鶏', '牛', 'ひき肉'];
  let menuUsed = new Set();
  const hasCand = (slot, f) => poolFor(slot).some(x => (slot === '主菜' ? x.main : slotOf(x) === slot) && !isAvoided(x) && !S.hidden.includes(x.id) && !menuUsed.has(x.id) && f(x));   // その席に条件に合う料理があるか（ないときの「ゆるめ」は、画面で知らせる前提で数えない）
  function checkMenu(scene, also = []){
    const m = session.menu; if (!m) return;
    stat.menus++;
    const mood = session.mood, items = m.items, main = items[0] && items[0].r;
    const ids = items.filter(x => x.r).map(x => x.r.id); menuUsed = new Set([...ids, ...also]);
    if (new Set(ids).size !== ids.length) bad('dup', scene, '-', null, ids.join(','));
    const spot = stapleSpot();
    items.forEach((it, i) => {
      const r = it.r; if (!r) return;
      if (it.slot === '主菜' && !r.main) bad('slot-main', scene, it.slot, r, r.type);
      if (it.slot === '副菜' && (r.main || r.type !== '副菜')) bad('slot-side', scene, it.slot, r, r.type);
      if (it.slot === '汁物' && r.type !== '汁物') bad('slot-soup', scene, it.slot, r, r.type);
      if (it.slot === '汁物' && sweetSoup(r)) bad('sweet-soup', scene, it.slot, r);
      if (breakfastMeal(r) && !(mood === 'okayu' && it.slot === '主菜' && okayuDayOk(r))) bad('breakfast', scene, it.slot, r);
      if (it.slot === '主菜' && LIGHT_MEALS.has(r.id) && !(mood === 'okayu' && OKAYU_QUICK.includes(r.id))) bad('light-main', scene, it.slot, r);
      if (it.slot === '主菜' && isOkayu(r) && mood !== 'okayu') bad('okayu-off', scene, it.slot, r);
      if (it.slot === '主菜' && EVENT_RICE.has(r.id)) bad('event-main', scene, it.slot, r);
      if (!inSeason(r)) bad('season', scene, it.slot, r);
      if (isAvoided(r) || S.hidden.includes(r.id)) bad('avoid', scene, it.slot, r);
      const sl = it.slot === '主菜' ? '主菜' : it.slot;
      if (mixCc(sl)) return;   // 国を組み合わせた席は、本人の選んだ国の料理（絞りこみは効かせない）
      if (mood === 'quick' && r.min > 20 && hasCand(sl, x => x.min <= 20)) bad('mood-quick', scene, it.slot, r, r.min + '分');
      if (mood === 'easy' && !easyOk(r, easyInfo(sl)) && hasCand(sl, x => easyOk(x, easyInfo(sl)))) bad('mood-easy', scene, it.slot, r, r.min + '分');
      if (mood === 'bento'){
        if (it.slot === '汁物') bad('mood-bento', scene, it.slot, r, '汁ものの席');
        else if (soupyMain(r)) bad('mood-bento', scene, it.slot, r, '汁けの多い料理');
        else if (!bentoFits(r) && hasCand(sl, bentoFits)) bad('mood-bento', scene, it.slot, r, 'お弁当向きでない');
      }
      if (mood === 'okayu' && i === 0 && (!okayuDayOk(r) || r.type === '麺' || r.method === '揚')) bad('mood-okayu', scene, it.slot, r, r.type + '/' + r.method);
      if (mood === 'okayu' && (it.slot === '副菜' || it.slot === '汁物') && !okayuSoftOk(r) && hasCand(sl, okayuSoftOk)) bad('mood-okayu-side', scene, it.slot, r, r.method + '/' + r.min + '分');
      if (mood === 'okayu' && i === 0 && okayuDayOk(r) && r.min > OKAYU_TIERS[0] && hasCand('主菜', x => okayuDayOk(x) && x.min <= OKAYU_TIERS[0])) bad('okayu-quick', scene, it.slot, r, r.min + '分');
      if (i === 0 && ['和', '洋', '中'].includes(mood) && r.genre !== mood && hasCand('主菜', x => x.genre === mood)) bad('mood-genre', scene, it.slot, r, r.genre);
      if (i === 0 && mood === 'asia' && !['韓', 'エスニック'].includes(r.genre) && hasCand('主菜', x => ['韓', 'エスニック'].includes(x.genre))) bad('mood-asia', scene, it.slot, r, r.genre);
      const GM = {'和': ['和'], '洋': ['洋'], '中': ['中'], asia: ['韓', 'エスニック', '中']}[mood];   // 副菜・汁もの・2品目の主菜は、そのなかま（韓国・エスニックの日は中華も）
      if (i > 0 && GM && !GM.includes(r.genre) && hasCand(sl, x => GM.includes(x.genre))) bad('mood-genre-side', scene, it.slot, r, r.genre);
      if (i === 0 && mood === 'fish' && !['魚', '魚介'].includes(r.family) && hasCand('主菜', x => ['魚', '魚介'].includes(x.family))) bad('mood-fish', scene, it.slot, r, r.family);
      if (i === 0 && mood === 'meat' && !MEAT.includes(r.family) && hasCand('主菜', x => MEAT.includes(x.family))) bad('mood-meat', scene, it.slot, r, r.family);
    });
    if (main){
      const soup = items.find(x => x.slot === '汁物' && x.r);
      if (soup && soupyMain(main) && !mixCc('汁物')) bad('soupy-soup', scene, '汁物', soup.r, '主菜: ' + main.name);
      const riceDay = main.type === 'ごはん' || (!!spot && stapleIsRice() && !weekBowl(main));
      items.forEach(x => { if (x.r && x.slot === '副菜' && riceDay && riceSide(x.r) && !mixCc('副菜') && hasCand('副菜', y => !riceSide(y))) bad('two-staples', scene, '副菜', x.r, 'ご飯の日にご飯の副菜'); });
      const bowls = items.filter(x => x.slot === '主菜' && x.r && weekBowl(x.r));
      if (bowls.length > 1) bad('two-staples', scene, '主菜', bowls[1].r, 'ご飯もの・麺の主菜が2つ: ' + bowls.map(x => x.r.id).join(','));
      if (spot && spot.k === 'okayu' && weekBowl(main) && mood !== 'okayu') bad('staple-okayu', scene, '主菜', main, main.type);
    }
  }
  const counts = [1, 2, 'ns2', 3, 4, 5, 6];
  const setCount = c => { S.settings.noSoup = c === 'ns2'; S.settings.dishCount = c === 'ns2' ? 2 : c; };
  const moods = MOODS.map(x => x.k);
  // 気分の一覧の「おかゆの日」は、おかゆ・粥の主菜がある国だけ。かえるの「おかゆの日」の絞りこみと同じ（第8回 R21）
  if (MOODS.some(x => x.k === 'okayu') !== poolForMood('主菜', 'okayu').some(r => r.main && okayuDayOk(r))) bad('mood-okayu', '気分の一覧', '主菜', null, 'おかゆの日の有無が、粥の主菜の有無と合わない');
  if (MOODS.some(x => x.k === 'okayu') !== okayuMoodOn()) bad('mood-okayu', '気分の一覧', '主菜', null, '気分とかえるで、おかゆの日の出し方が違う');
  let s0 = seed;
  // 1) 気分 × 品数 × 乱数
  for (const mood of moods) for (const c of counts) for (let k = 0; k < runs; k++){
    reseed(s0++); setCount(c); session.mood = mood; session.rejected.clear(); newMenu(); checkMenu(`気分=${mood} 品数=${c} #${k}`);
  }
  // 2) 主食の選び方
  const stOpts = stapleOptions().map(o => o.k);
  for (const k0 of stOpts) for (const mood of ['all', 'quick', 'fish']) for (const c of [3, 4]) for (let k = 0; k < runs; k++){
    setStaple(k0); reseed(s0++); setCount(c); session.mood = mood; session.rejected.clear(); newMenu(); checkMenu(`主食=${k0} 気分=${mood} 品数=${c} #${k}`);
  }
  S.settings.stapleBy = {};
  // 3) かえるの絞りこみ（候補に出る料理）
  S.fridge = RECIPES.slice(0, 6).flatMap(r => r.items.slice(0, 2).map(i => i.name));
  const SWAPF = [null, 'fridge', 'quick', 'fish', 'okayu'];
  for (const mood of moods) for (const c of [4, 6]) for (let k = 0; k < Math.max(1, runs >> 1); k++){
    reseed(s0++); setCount(c); session.mood = mood; session.rejected.clear(); newMenu();
    const m = session.menu;
    m.items.forEach((it, i) => SWAPF.forEach(f => {
      if (f === 'okayu' && (i !== 0 || !okayuMoodOn())) return;
      const cs = swapCands(i, f); stat.swaps++;
      const scene = `かえる 気分=${mood} 品数=${c} 席${i}(${it.slot}) 絞り=${f || 'なし'} #${k}`;
      cs.forEach(r => {
        if (it.slot === '主菜' ? !r.main : slotOf(r) !== it.slot) bad('swap-slot', scene, it.slot, r, r.type);
        if (m.items.some((x, j) => j !== i && x.r && x.r.id === r.id)) bad('dup', scene, it.slot, r, 'ほかの席と同じ');
        if (isAvoided(r) || S.hidden.includes(r.id)) bad('avoid', scene, it.slot, r);
        if (breakfastMeal(r) && !(f === 'okayu' || mood === 'okayu')) bad('breakfast', scene, it.slot, r);
        if (it.slot === '主菜' && isOkayu(r) && f !== 'okayu' && mood !== 'okayu') bad('okayu-off', scene, it.slot, r);
        if (it.slot === '主菜' && EVENT_RICE.has(r.id)) bad('event-main', scene, it.slot, r);
        if (it.slot === '主菜' && LIGHT_MEALS.has(r.id) && !(f === 'okayu' || mood === 'okayu')) bad('light-main', scene, it.slot, r);
        if (f === 'quick' && r.min > 20) bad('swap-filter', scene, it.slot, r, r.min + '分');
        if (f === 'fish' && !['魚', '魚介'].includes(r.family)) bad('swap-filter', scene, it.slot, r, r.family);
        if (f === 'okayu' && (!okayuDayOk(r) || r.type === '麺')) bad('swap-filter', scene, it.slot, r, r.type);
        if (f === 'fridge' && !(matchRecipe(r, fridgeKeys()).ratio > 0)) bad('swap-filter', scene, it.slot, r, '冷蔵庫の物を使わない');
        if (i === 0 && mood !== 'all' && f !== 'okayu' && !moodOk(r, mood) && hasCand('主菜', x => moodOk(x, mood))) bad(mood === 'okayu' ? 'mood-okayu' : 'swap-mood', scene, it.slot, r, `気分(${mood})に合わない ${r.type}/${r.family}/${r.min}分`);
      });
    }));
  }
  // 3b) あと1品の候補（いまの主菜に合う副菜・汁もの）
  for (const mood of moods) for (const c of [3, 5]) for (let k = 0; k < Math.max(1, runs >> 1); k++){
    reseed(s0++); setCount(c); session.mood = mood; session.rejected.clear(); newMenu();
    const m = session.menu, main = m.items[0] && m.items[0].r; if (!main) continue;
    const ids = m.items.filter(x => x.r).map(x => x.r.id); menuUsed = new Set(ids);
    const scene = `あと1品 気分=${mood} 品数=${c} #${k}`; stat.swaps++;
    oneSuggest(main, []).forEach(r => {
      const sl = r.type === '汁物' ? '汁物' : '副菜';
      if (r.main || !['副菜', '汁物'].includes(r.type)) bad('one-kind', scene, sl, r, r.type);
      if (ids.includes(r.id)) bad('dup', scene, sl, r, '献立にある料理');
      if (isAvoided(r) || S.hidden.includes(r.id)) bad('avoid', scene, sl, r);
      if (breakfastMeal(r)) bad('breakfast', scene, sl, r);
      if (sl === '汁物' && (soupyMain(main) || mood === 'bento')) bad(mood === 'bento' ? 'mood-bento' : 'soupy-soup', scene, sl, r, '主菜: ' + main.name);
      if (sl === '汁物' && sweetSoup(r)) bad('sweet-soup', scene, sl, r);
      if (mood === 'quick' && r.min > 20 && hasCand(sl, x => x.min <= 20)) bad('mood-quick', scene, sl, r, r.min + '分');
      if (mood === 'okayu' && !okayuSoftOk(r) && hasCand(sl, okayuSoftOk)) bad('mood-okayu-side', scene, sl, r, r.method + '/' + r.min + '分');
      const GM = {'和': ['和'], '洋': ['洋'], '中': ['中'], asia: ['韓', 'エスニック', '中']}[mood];
      if (GM && !GM.includes(r.genre) && hasCand(sl, x => GM.includes(x.genre))) bad('mood-genre-side', scene, sl, r, r.genre);
    });
  }
  S.fridge = [];
  session.mood = 'all';
  // 4) 1週間プラン（副菜・汁ものも）
  S.settings.weekSides = true;
  const nMain = poolFor('主菜').filter(r => r.main && !isAvoided(r)).length;
  for (let k = 0; k < runs; k++){
    reseed(s0++); S.week = null; makeWeek(); ensureWeekExtras(); stat.weeks++;
    const days = (S.week && S.week.days) || [], scene = `1週間プラン #${k}`;
    days.forEach(x => {
      const r = byId(x.id); if (!r) return;
      if (!r.main) bad('week-main', scene, '主菜', r, r.type);
      if (breakfastMeal(r)) bad('breakfast', scene, '主菜', r, x.d);
      if (LIGHT_MEALS.has(r.id)) bad('light-main', scene, '主菜', r, x.d);
      if (isOkayu(r)) bad('okayu-off', scene, '主菜', r, x.d);
      if (EVENT_RICE.has(r.id)) bad('event-main', scene, '主菜', r, x.d);
      if (!inSeason(r, x.d)) bad('season', scene, '主菜', r, x.d);
      if (isAvoided(r)) bad('avoid', scene, '主菜', r, x.d);
      const e = x.extra || {};
      const sd = byId(e.side), sp = byId(e.soup);
      if (sd && sd.type !== '副菜') bad('week-extra', scene, '副菜', sd, sd.type);
      if (sp && sp.type !== '汁物') bad('week-extra', scene, '汁物', sp, sp.type);
      if (sp && soupyMain(r)) bad('soupy-soup', scene, '汁物', sp, '主菜: ' + r.name);
      if (sp && sweetSoup(sp)) bad('sweet-soup', scene, '汁物', sp);
      [sd, sp].forEach(y => { if (y && breakfastMeal(y)) bad('breakfast', scene, '副菜/汁物', y, x.d); });
    });
    const ids = days.map(x => x.id);
    if (nMain >= 7 && new Set(ids).size !== ids.length) bad('week-dup', scene, '主菜', null, ids.join(','));
    const nonBowl = poolFor('主菜').filter(r => r.main && !weekBowl(r) && !isAvoided(r)).length;
    if (nonBowl >= 4 && days.filter(x => weekBowl(byId(x.id))).length > 3) bad('week-bowl', scene, '主菜', null, ids.join(','));
  }
  // 4b) 気分を選んだ日に1週間プランを作る（プランは今日の気分に左右されない）・プランのある日に気分を選んで開く（プランの主菜で気分を破らない）
  for (const mood of moods){
    for (let k = 0; k < runs; k++){
    reseed(s0++); session.mood = mood; S.week = null; makeWeek(); ensureWeekExtras(); stat.weeks++;
    const scene = `1週間プラン（気分=${mood}の日に作る）`;
    ((S.week && S.week.days) || []).forEach(x => {
      const r = byId(x.id); if (!r) return;
      if (breakfastMeal(r)) bad('breakfast', scene, '主菜', r, x.d);
      if (LIGHT_MEALS.has(r.id)) bad('light-main', scene, '主菜', r, x.d);
      if (isOkayu(r)) bad('okayu-off', scene, '主菜', r, x.d);
      if (EVENT_RICE.has(r.id)) bad('event-main', scene, '主菜', r, x.d);
      const sd = byId((x.extra || {}).side); if (sd && sd.type !== '副菜') bad('week-extra', scene, '副菜', sd, sd.type);
    });
    }
    S.day[TODAY] = {state: 'draft', items: [], mood}; session.moodDay = null; session.menu = null; S.draft = null; setCount(4);
    try { ensureMenu(); } catch (e) {}
    if (session.menu) checkMenu(`プランのある日に開く 気分=${mood}`);
    delete S.day[TODAY]; session.mood = 'all';
  }
  S.week = null; S.settings.weekSides = false;
  // 5) 明日の献立
  const td = addDays(TODAY, 1);
  for (const mood of MOODS.map(x => x.k)) for (let k = 0; k < Math.max(1, runs >> 1); k++){   // 明日からにできる気分は、その国の気分の一覧にあるものだけ
    reseed(s0++); setCount(4); session.mood = 'all'; session.rejected.clear(); newMenu();
    if (S.day && S.day[td]) delete S.day[td];
    dayObj(td).mood = mood;
    const keep = session.menu, its = tomorrowDraft(); stat.tomorrow++;
    const today = keep.items.filter(x => x.r).map(x => x.r.id);   // 明日の案は、今日の献立と同じ料理を避けて作る（その分の候補は数えない）
    session.mood = mood; session.menu = {n: its.length, items: its.map(x => ({slot: x.slot, r: byId(x.id)}))};
    checkMenu(`明日の献立 気分=${mood} #${k}`, today);
    session.mood = 'all'; session.menu = keep; delete S.day[td];
  }
  // 6) アレルギー・苦手（外したはずの物が出ない）
  const profiles = [{allergens: ['egg', 'milk', 'wheat']}, {allergens: ['shrimp', 'crab', 'fish']}, {avoid: ['@fish']}, {allergens: ['soy', 'sesame'], avoid: ['豚肉']}];
  for (const pf of profiles){
    S.settings.allergens = pf.allergens || []; S.settings.avoid = pf.avoid || [];
    for (const mood of moods) for (const c of [3, 5]) { reseed(s0++); setCount(c); session.mood = mood; session.rejected.clear(); newMenu(); checkMenu(`アレルギー/苦手=${JSON.stringify(pf)} 気分=${mood} 品数=${c}`); }
    const sp = stapleSpot(); if (sp && stapleBlocked(currentStapleOpt())) bad('avoid', 'アレルギー 主食', 'ご飯', {id: sp.id, name: sp.name});
  }
  S.settings.allergens = []; S.settings.avoid = [];
  session.mood = 'all'; setCount(4);
  return {out, stat};
};

(async () => {
  const b = await chromium.launch(LAUNCH);
  const all = [], stats = {}, errs = [];
  for (const cc of CCS){
    const ctx = await b.newContext({viewport: {width: 390, height: 900}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('category-audit', cc)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-26', settings: {country: cc, dishCount: 4}})); } }, [cc]);
    await p.goto(BASE); await ready(p);
    await p.waitForFunction(() => typeof session !== 'undefined' && !!session.menu, null, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { window.hasPro = () => true; });
    let r;
    try { r = await p.evaluate(page_audit, {runs: RUNS, seed: seedFor('category-audit-run', cc)}); }
    catch (e) { errs.push(cc + ': ' + e.message.split('\n')[0]); r = {out: [], stat: {}}; }
    all.push(...r.out); stats[cc] = r.stat;
    const n = r.out.length;
    console.log(`${cc}: 献立${r.stat.menus || 0} かえる${r.stat.swaps || 0} 1週間${r.stat.weeks || 0} 明日${r.stat.tomorrow || 0} → 仲間はずれ ${n}`);
    await ctx.close();
  }
  await b.close();
  // まとめ（決まりごと × 料理 で数える）
  const byRule = {};
  all.forEach(v => { const k = v.rule; (byRule[k] = byRule[k] || new Map()); const key = v.cc + ' ' + v.slot + ' ' + v.id; const e = byRule[k].get(key) || {n: 0, v}; e.n++; byRule[k].set(key, e); });
  console.log('\n=== 仲間はずれ（決まりごとごと） ===');
  for (const [rule, m] of Object.entries(byRule)){
    console.log(`[${rule}] ${RULES[rule] || ''}: ${m.size} 種類（${[...m.values()].reduce((a, e) => a + e.n, 0)} 件）`);
    [...m.values()].slice(0, 12).forEach(e => console.log(`   ${e.v.cc} ${e.v.slot} ${e.v.id} 「${e.v.name}」 ${e.v.detail} ×${e.n}  例: ${e.v.scene}`));
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({rules: RULES, stats, items: all}, null, 1));
  if (errs.length) console.log('ページのエラー:', errs.slice(0, 5));
  console.log(all.length || errs.length ? `NG 仲間はずれ ${all.length} 件（${Object.keys(byRule).length} 種類の決まり） SEED=${SEED}` : `OK 仲間はずれ 0 件（${CCS.length}か国） SEED=${SEED}`);
  if (all.length || errs.length) process.exitCode = 1;
})();
