#!/usr/bin/env python3
"""험쮜 메이커 빌드: 빌드 코드를 새로 매기고 오프라인용 sw.js를 다시 만든다.

게임 파일(index.html, assets/, fonts/, 아이콘)을 고친 뒤 이 스크립트를 한 번 돌리고 올리면 된다.
  python3 tools/build.py
- 빌드 코드 = 날짜 + 파일 해시 6자리 (예: 2026.10.09-a1b2c3). 게임 타이틀·메뉴 화면 아래에 보인다.
- sw.js의 캐시 이름도 빌드 코드로 바뀌어서, 폰은 다음 온라인 실행 때 새 버전을 받아 둔다.
"""
import hashlib, json, os, re, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
STATIC = ['manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']
files = STATIC + sorted('fonts/' + f for f in os.listdir('fonts')) + sorted('assets/' + f for f in os.listdir('assets'))
html = open('index.html', encoding='utf-8').read()
# 빌드 코드 자체는 해시에서 뺀다 (같은 내용이면 같은 코드)
body = re.sub(r"const BUILD='[^']*'", "const BUILD=''", html)
h = hashlib.sha256(body.encode())
for f in files:
    h.update(f.encode()); h.update(open(f, 'rb').read())
code = datetime.date.today().strftime('%Y.%m.%d') + '-' + h.hexdigest()[:6]
old = re.search(r"const BUILD='([^']*)'", html)
if old and old.group(1).endswith(code[-6:]):
    code = old.group(1)  # 내용이 그대로면 날짜도 그대로
html = re.sub(r"const BUILD='[^']*'", f"const BUILD='{code}'", html)
open('index.html', 'w', encoding='utf-8').write(html)
assets = ['./', 'index.html'] + files
sw = open('tools/sw.template.js', encoding='utf-8').read()
sw = sw.replace('__CACHE__', 'humzzwi-' + code).replace('__ASSETS__', json.dumps(assets, ensure_ascii=False))
open('sw.js', 'w', encoding='utf-8').write(sw)
print('빌드', code, '· 오프라인 파일', len(assets), '개')
