#!/usr/bin/env python3
"""험쮜 메이커 빌드: 빌드 코드를 새로 매기고 오프라인용 sw.js를 다시 만든다.

게임 파일(index.html, assets/, fonts/, 아이콘)을 고친 뒤 이 스크립트를 한 번 돌리고 올리면 된다.
  python3 tools/build.py
- 빌드 코드 = 날짜 + 파일 해시 6자리 (예: 2026.10.09-a1b2c3). 게임 타이틀·메뉴 화면 아래에 보인다.
- sw.js에 파일별 내용 지문을 적어서, 폰은 다음 온라인 실행 때 바뀐 파일만 새로 받는다(보관함은 버전이 바뀌어도 유지).
- 남자/여자 험쮜 그림은 플레이어의 험쮜 성별에 맞는 쪽만 받는다.
"""
import hashlib, json, os, re, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
STATIC = ['manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']
files = STATIC + sorted('fonts/' + f for f in os.listdir('fonts')) + sorted('assets/' + f for f in os.listdir('assets'))
html = open('index.html', encoding='utf-8').read()
# 빌드 코드 자체는 해시에서 뺀다 (같은 내용이면 같은 코드)
body = re.sub(r"const BUILD='[^']*'", "const BUILD=''", html)
body = re.sub(r'\?v=[0-9a-f]+"', '?v="', body)
h = hashlib.sha256(body.encode())
for f in files:
    h.update(f.encode()); h.update(open(f, 'rb').read())
code = datetime.date.today().strftime('%Y.%m.%d') + '-' + h.hexdigest()[:6]
old = re.search(r"const BUILD='([^']*)'", html)
if old and old.group(1).endswith(code[-6:]):
    code = old.group(1)  # 내용이 그대로면 날짜도 그대로
html = re.sub(r"const BUILD='[^']*'", f"const BUILD='{code}'", html)
# 아이콘·매니페스트 주소에도 빌드 코드를 붙여서 아이폰이 예전 아이콘을 다시 쓰지 않게 한다
html = re.sub(r'(apple-touch-icon\.png|icon-192\.png|manifest\.json)\?v=[^"]*', lambda m: m.group(1) + '?v=' + code[-6:], html)
open('index.html', 'w', encoding='utf-8').write(html)
# 파일마다 내용 지문을 매겨서, 폰은 업데이트 때 지문이 바뀐 파일만 새로 받는다
def kind(f):
    stem, ext = os.path.splitext(f)
    if stem.endswith('_w'): return 'w'                       # 여자 험쮜 그림
    if os.path.exists(stem + '_w' + ext): return 'b'          # 그 짝인 기본 그림
    return ''
fp = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()[:10]
assets = [['./', code, ''], ['index.html', code, '']] + [[f, fp(f), kind(f)] for f in files]
sw = open('tools/sw.template.js', encoding='utf-8').read()
sw = sw.replace('__CACHE__', 'humzzwi-' + code).replace('__ASSETS__', json.dumps(assets, ensure_ascii=False, separators=(',', ':')))
open('sw.js', 'w', encoding='utf-8').write(sw)
print('빌드', code, '· 오프라인 파일', len(assets), '개')
