"""metadata.md の各欄が App Store Connect の文字数上限に収まっているか確認する。
使い方: python3 check.py"""
import re, pathlib
md = pathlib.Path(__file__).with_name('metadata.md').read_text(encoding='utf-8')
def block(title):
    m = re.search(r'## ' + re.escape(title) + r'.*?\n+```\n(.*?)\n```', md, re.S)
    return m.group(1) if m else ''
def cell(label):
    m = re.search(r'\| ' + re.escape(label) + r'[^|]*\| ([^|]+) \|', md)
    return m.group(1).strip() if m else ''
checks = [
    ('名前', cell('名前'), 30),
    ('サブタイトル', cell('サブタイトル'), 30),
    ('プロモーション用テキスト', block('プロモーション用テキスト'), 170),
    ('説明', block('説明'), 4000),
    ('キーワード', block('キーワード'), 100),
    ('このバージョンの新機能', block('このバージョンの新機能'), 4000),
]
ok = True
for name, text, limit in checks:
    n = len(text)
    flag = 'OK' if 0 < n <= limit else 'NG'
    ok &= flag == 'OK'
    print(f'{flag}  {name}: {n} / {limit}')
kw = block('キーワード')
if ' ' in kw or '　' in kw:
    print('NG  キーワードに空白があります'); ok = False
print('すべて上限以内です' if ok else '上限を超えている欄があります')
