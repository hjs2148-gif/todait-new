# 캔버스 보드 생성기

캔버스 "Todait 앱 화면"(https://claude.ai/artifact/F8DaWbVPUv47c9k7iyXNk9)의 새 계획 관련 보드를 만드는 스크립트. 앱 코드가 아니고 시안용이다. 결정 내용은 `design/DECISIONS.md` 11번.

| 파일 | 만드는 것 |
|---|---|
| `np.mjs` | '새 계획 개편' 페이지 (`NP*` 보드: 간단하게·자세히·목차·붙여넣기·과목·가능 시간·필요할 때 제안) |
| `head.mjs` + `wz-a.mjs` + `wz-b.mjs` | '안내형 계획 만들기' 페이지 (`WZ*` 보드). 세 파일을 이어 붙여 `wz.mjs`로 실행 |
| `static.cjs` | 보드 스크립트를 실행하지 않고 팔레트만 채운 정적 HTML (`static/np.html` 라이트, `static/npd.html` 다크) |
| `serve.cjs` | 정적 HTML을 5299 포트로 띄우는 작은 서버 (`../static` 폴더) |

## 쓰는 법

1. 작업 폴더 `<root>`를 정하고, 캔버스의 `project/canvas.json`을 Artifact read로 `<root>/np/project/canvas.json`에 받는다. 생성기가 이 파일을 고쳐 쓴다.
2. 생성기를 `<root>/gen/`에 둔다 (`static.cjs`·`serve.cjs`는 `<root>/gen` 기준으로 `../np`, `../static`을 쓴다).
3. 실행:
   - `node gen/np.mjs np`
   - `cat gen/head.mjs gen/wz-a.mjs gen/wz-b.mjs > gen/wz.mjs && node gen/wz.mjs np`
   - 확인용: `node gen/static.cjs WZType,WZName,...` (보드 이름을 쉼표로)
4. 캔버스에 게시: Artifact publish, `root` = `<root>/np`, `file_path` = `canvas.json`, `files` = 바뀐 `project/*.dc.html`.

보드 코드(캔버스 안의 스크립트)는 실행하지 않는다. 확인은 정적 HTML로만 한다.
