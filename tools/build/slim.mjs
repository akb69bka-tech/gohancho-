#!/usr/bin/env node
// 公開用に、ご飯帖のファイルを軽くする（コメント・行頭の字下げ・空行を取る）。中身（動き）は変えない
//   node tools/build/slim.mjs <出力先> [--src gohancho] [--link-assets]
//   ・index.html の <script>（src なし）と <style>、HTML のコメント、i18n/*.js・packs/**/*.js のコメントと行頭の字下げ・空行を取る
//   ・文字列・テンプレート文字列・正規表現の中は1文字も変えない（TypeScript の構文木で場所を調べる）
//   ・取ったあとの JS を構文木で読み直し、字句（キーワード・名前・文字列・記号）の並びが元と同じかを確かめる。違えば止まる（終了コード 1）
//   ・--link-assets: 絵などの大きなファイルは写さずにリンクを張る（テスト用。公開ではふつうに写す）
// 第49回 R184: 遅い回線ではじめて開いたとき、本体（index.html 2.37MB。うちコメントが約 0.5MB）を読むのに時間がかかっていた
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
function loadTs(){ for (const t of [process.env.TS_DIR, 'typescript']){ if (!t) continue; try{ return require(t); }catch(e){} } return require(execSync('npm root -g').toString().trim() + '/typescript'); }
const ts = loadTs();

// ---- JS ----
const KEEP = new Set([ts.SyntaxKind.StringLiteral, ts.SyntaxKind.NoSubstitutionTemplateLiteral, ts.SyntaxKind.TemplateHead, ts.SyntaxKind.TemplateMiddle, ts.SyntaxKind.TemplateTail, ts.SyntaxKind.RegularExpressionLiteral, ts.SyntaxKind.JsxText]);
function tokens(sf){
    const out = [];
    const walk = n => { const kids = n.getChildren(sf); if (!kids.length){ if (n.kind !== ts.SyntaxKind.EndOfFileToken || n.getFullWidth()) out.push(n); return; } kids.forEach(walk); };
    walk(sf); return out;
}
export function slimJs(code, name = 'script'){
    const sf = ts.createSourceFile(name + '.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    if (sf.parseDiagnostics && sf.parseDiagnostics.length) throw new Error(name + ': 構文の誤り（元のファイル）: ' + ts.flattenDiagnosticMessageText(sf.parseDiagnostics[0].messageText, '\n'));
    const toks = tokens(sf);
    // コメントの場所（各字句の前の空白・コメント）と、字句そのもの（文字列など、中を変えないもの）の場所
    const comments = [], keep = [];
    let eofTrivia = null;
    for (const tk of toks){
        const full = tk.getFullStart(), st = tk.getStart(sf);
        ts.forEachLeadingCommentRange(code, full, (pos, end) => { comments.push([pos, end]); });
        if (KEEP.has(tk.kind)) keep.push([st, tk.getEnd()]);
    }
    // ファイルの最後の字句のあとのコメント
    { const last = toks.length ? toks[toks.length - 1].getEnd() : 0; ts.forEachTrailingCommentRange(code, last, (pos, end) => { comments.push([pos, end]); }); }
    // 字句のない部分（コメント・空白）だけを組み立て直す
    const pieces = []; let pos = 0;
    const gapOut = (a, b) => {   // a〜b は字句と字句のあいだ（空白とコメントだけ）
        let g = code.slice(a, b), hasNl = false;
        const cs = comments.filter(c => c[0] >= a && c[1] <= b);
        let out = '', p = a;
        for (const [ca, cb] of cs){ out += code.slice(p, ca); const c = code.slice(ca, cb); if (/[\n\r\u2028\u2029]/.test(c)) out += '\n'; else out += ' '; p = cb; }
        out += code.slice(p, b);
        hasNl = /[\n\r\u2028\u2029]/.test(out);
        // 改行があれば改行1つ（ASI を保つ）、なければ空白1つ（字句をくっつけない）。両端が字句でない（ファイルの頭・終わり）は空
        if (hasNl) return '\n';
        return out.length ? ' ' : '';
    };
    // 字句のあいだの空白1つは、くっつけると別の字句になるとき（名前・数字・キーワードどうし、+ +、- -、/ のあと など）だけ残す
    const W = /[\w$\u0080-\uffff]/;
    const needSp = (a, b) => { if (!a || !b) return false; const x = a[a.length - 1], y = b[0];
        if (W.test(x) && W.test(y)) return true;
        if ((x === '+' || x === '-') && (y === x || y === '=')) return true;
        if (x === '/' || y === '/') return true;   // 割り算・正規表現・コメントの取り違えを避ける
        if (x === '.' && /\d/.test(y)) return true; if (/\d/.test(x) && y === '.') return true;
        if (x === '<' && y === '!') return true; if (x === '-' && y === '>') return true;
        return false; };
    for (let i = 0; i < toks.length; i++){
        const tk = toks[i], st = tk.getStart(sf), en = tk.getEnd();
        let g = gapOut(pos, st);
        if (g === ' ' && i > 0 && !needSp(pieces[pieces.length - 1], code.slice(st, en))) g = '';
        pieces.push(i === 0 ? '' : g);
        pieces.push(code.slice(st, en));
        pos = en;
    }
    pieces.push(gapOut(pos, code.length) === '\n' ? '\n' : '');
    // 空白1つが要らないところ（記号のまわり）は取る。字句の種類で判断（名前・数字・キーワードどうしのあいだだけ空白を残す）
    const out = []; for (let i = 0; i < pieces.length; i++) out.push(pieces[i]);
    let res = out.join('');
    verify(code, res, name);
    return res;
}
function sig(code, name){
    const sf = ts.createSourceFile(name + '.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    if (sf.parseDiagnostics && sf.parseDiagnostics.length) throw new Error(name + ': 構文の誤り（軽くしたあと）: ' + ts.flattenDiagnosticMessageText(sf.parseDiagnostics[0].messageText, '\n'));
    const parts = []; const walk = n => { const kids = n.getChildren(sf); if (!kids.length){ parts.push(n.kind + ':' + n.getText(sf)); return; } parts.push('(' + n.kind); kids.forEach(walk); parts.push(')'); }; walk(sf);
    return parts;
}
function verify(a, b, name){
    const x = sig(a, name), y = sig(b, name);
    if (x.length !== y.length) throw new Error(`${name}: 構文木の大きさが違う（${x.length} → ${y.length}）`);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) throw new Error(`${name}: 構文木が違う（${i}番目: ${x[i].slice(0, 80)} → ${y[i].slice(0, 80)}）`);
}

// ---- CSS: コメントと行頭の字下げ・空行を取る（文字列の中は変えない） ----
export function slimCss(css){
    let out = '', i = 0, q = null;
    while (i < css.length){
        const c = css[i];
        if (q){ out += c; if (c === '\\'){ out += css[i + 1] || ''; i += 2; continue; } if (c === q) q = null; i++; continue; }
        if (c === '"' || c === "'"){ q = c; out += c; i++; continue; }
        if (c === '/' && css[i + 1] === '*'){ const e = css.indexOf('*/', i + 2); i = e < 0 ? css.length : e + 2; if (!/\s$/.test(out)) out += ' '; continue; }
        out += c; i++;
    }
    return out.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

// ---- HTML ----
export function slimHtml(html, name = 'index.html'){
    let k = 0;
    return html.replace(/<!--[\s\S]*?-->|<script(\s[^>]*)?>([\s\S]*?)<\/script>|<style(\s[^>]*)?>([\s\S]*?)<\/style>/g, (m, sa, sc, ca, cs) => {
        if (m.startsWith('<!--')) return '';
        if (m.startsWith('<script')){ if (sa && /\bsrc=/.test(sa)) return m; if (sa && /type=["']?(?!text\/javascript|module)/.test(sa)) return m; return `<script${sa || ''}>${slimJs(sc, name + '#script' + (k++))}</script>`; }
        return `<style${ca || ''}>${slimCss(cs)}</style>`;
    });
}

// ---- 実行 ----
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain){
    const args = process.argv.slice(2), out = args.find(a => !a.startsWith('--')), link = args.includes('--link-assets');
    const srcI = args.indexOf('--src'), src = path.resolve(srcI >= 0 ? args[srcI + 1] : path.join(path.dirname(new URL(import.meta.url).pathname), '../../gohancho'));
    if (!out){ console.error('使い方: node tools/build/slim.mjs <出力先> [--src gohancho] [--link-assets]'); process.exit(2); }
    const dst = path.resolve(out);
    fs.rmSync(dst, { recursive: true, force: true }); fs.mkdirSync(dst, { recursive: true });
    let before = 0, after = 0;
    const slimIt = rel => /^index\.html$|^ask\.html$/.test(rel) ? 'html' : /^(i18n|packs)\/.*\.js$/.test(rel) ? 'js' : null;
    const walk = (rel) => {
        const s = path.join(src, rel), d = path.join(dst, rel), st = fs.statSync(s);
        if (st.isDirectory()){
            if (link && rel && !/^(i18n|packs)(\/|$)/.test(rel)){ fs.symlinkSync(s, d); return; }
            fs.mkdirSync(d, { recursive: true }); for (const f of fs.readdirSync(s)) walk(rel ? rel + '/' + f : f); return;
        }
        const kind = slimIt(rel);
        if (!kind){ if (link) fs.symlinkSync(s, d); else fs.copyFileSync(s, d); return; }
        const text = fs.readFileSync(s, 'utf8'), res = kind === 'html' ? slimHtml(text, rel) : slimJs(text, rel);
        fs.writeFileSync(d, res); before += Buffer.byteLength(text); after += Buffer.byteLength(res);
        if (/index\.html$/.test(rel)) console.log(`${rel}: ${Buffer.byteLength(text)} → ${Buffer.byteLength(res)} バイト`);
    };
    walk('');
    console.log(`軽くしたファイル: ${before} → ${after} バイト（${Math.round((1 - after / before) * 100)}% 減）→ ${dst}`);
}
