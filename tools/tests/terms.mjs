// 料理用語の解説（index.html の TERM_RE / termFind）のテスト。node tools/tests/terms.mjs
// 誤って拾わないこと（medium-low heat の low heat・弱めの中火・パイナップル）と、各言語の代表的な言い方を拾うことを確かめる
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "../../gohancho/index.html"), "utf8");
const src = html.slice(html.indexOf("const TW = "), html.indexOf("const TERM_DEF = {"));
const make = LANG => new Function("LANG", src + ";return termFind;")(LANG);
const ids = (lang, text, ui = lang) => make(ui)(text, lang).map(h => h.id).join(",");
const T = [
  ["en", "Simmer over medium-low heat for 10 minutes.", "simmer"], ["en", "Cook over low heat, then high heat.", "heat_low,heat_high"],
  ["en", "Mince the garlic, add a slurry and skim the scum.", "mince,slurry,skim,skim"], ["en", "Use a drop lid. Cook pasta al dente.", "droplid,aldente"],
  ["en", "Parboil for 3 minutes (mincemeat is not a term).", "blanch"],
  ["ja", "弱めの中火で5分。強火にして、弱火で煮る。", "heat_high,heat_low"], ["ja", "アクを取り、落としぶたをしてふつふつ煮る。", "skim,droplid,simmer"],
  ["ja", "半月切りにして下ゆでする。", "ja_hangetsu,blanch"],
  ["de", "Bei mittlerer Hitze köcheln lassen und abschäumen.", "heat_med,simmer,skim"], ["es", "A fuego medio-alto 5 minutos; luego a fuego bajo.", "heat_low"],
  ["fr", "À feu moyen-vif, puis à feu doux. Écumez.", "heat_low,skim"], ["it", "Cuoci a fuoco medio-basso, poi a fuoco alto.", "heat_high"],
  ["ko", "중약불에서 끓이고 센 불로 올린다. 다진 마늘.", "heat_high,mince"], ["zh-Hans", "中小火煮开，转大火，撇去浮沫。", "heat_high,skim"],
  ["th", "ใส่สับปะรด ใช้ไฟกลาง แล้วสับกระเทียม", "heat_med,mince"], ["tr", "Orta-yüksek ateşte pişirin, sonra kısık ateşte.", "heat_low"],
  ["vi", "Lửa vừa lớn 2 phút, chuyển lửa nhỏ. Vớt bọt.", "heat_low,skim"], ["hi", "धीमी आँच पर पकाएँ।", "heat_low"], ["ar", "على نار هادئة.", "heat_low"],
];
let ok = 0, bad = 0;
for (const [lang, text, want] of T) { const got = ids(lang, text); if (got === want) ok++; else { bad++; console.log("NG", lang, text, "→", got, "(want", want + ")"); } }
// ja_ の用語は日本語の画面でだけ出す
if (ids("ja", "乱切りにする。", "en") !== "" || ids("ja", "乱切りにする。", "ja") !== "ja_ranngiri") { bad++; console.log("NG ja_ gate"); } else ok++;
// 知らない言語・空の文は何も出さない（落ちない）
if (ids("xx", "low heat") !== "" || ids("en", "") !== "") { bad++; console.log("NG unknown"); } else ok++;
console.log(bad ? `FAIL ${bad}` : `OK ${ok}`); process.exit(bad ? 1 : 0);
