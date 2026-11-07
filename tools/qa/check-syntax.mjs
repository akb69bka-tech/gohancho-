// JS の構文チェック: gohancho/ の *.js と index.html などの <script>、tools/ の *.js *.cjs *.mjs
//   node tools/qa/check-syntax.mjs     エラーがあれば終了コード 1
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKIP = new Set(['node_modules', '.git']);
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const errs = []; let n = 0;
const rel = f => path.relative(ROOT, f);
const compile = (code, file) => { n++; try { new vm.Script(`(async function(){${code}\n})`, { filename: file }); } catch (e) { errs.push(`${rel(file)}: ${e.message}`); } };
for (const f of [...walk(path.join(ROOT, 'gohancho')), ...walk(path.join(ROOT, 'tools'))]) {
  const ext = path.extname(f);
  if (ext === '.js' || ext === '.cjs') {
    let code = fs.readFileSync(f, 'utf8'); if (code.startsWith('#!')) code = '//' + code;
    compile(code, f);
  } else if (ext === '.mjs') {
    n++;
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) errs.push(`${rel(f)}: ${(r.stderr || '').split('\n').slice(0, 4).join(' | ')}`);
  } else if (ext === '.html' && f.startsWith(path.join(ROOT, 'gohancho'))) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/.test(m[1]) || /type\s*=\s*["'](?!text\/javascript)/i.test(m[1]) || !m[2].trim()) continue;
      compile(m[2], f + '#script');
    }
  }
}
if (errs.length) { errs.forEach(e => console.log('ERROR ' + e)); process.exit(1); }
console.log(`syntax ok: ${n} 件`);
