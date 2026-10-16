# MEDIA STRATEGY OS

방송 프로그램의 네이버 검색 흐름, RACOI 온라인 반응, 유튜브 영상 후보를 함께 살펴보고 프로그램별 콘텐츠 전략 검토안을 만드는 대시보드입니다. 서로 다른 매체의 지표와 검증 수준을 구분해, 데이터 확인에서 전략 검토로 이어지는 과정을 지원합니다.

## 주요 기능

- 17개 프로그램의 목록·검색·정렬 및 상세 분석
- 두 주차 검색지수·영상 후보 수·콘텐츠 유형 구성 비교
- RACOI 게시글·댓글·영상 조회수 표시와 데이터 설명 팝업
- 관련 유튜브 영상 슬라이드와 프로그램 포스터
- Python에서 관측 수치를 계산한 뒤, 수동 요청에 한해 OpenAI로 전략 문장 생성
- 모델 응답 검증과 근거 기반 대체 보고서, 유료 호출 없는 전략 미리보기

프론트엔드는 React 19·Vite 8·JavaScript·CSS, 백엔드는 Python·FastAPI·OpenAI SDK를 사용합니다. 현재 데이터 저장소는 로컬 JSON이며, 실시간 수집기나 데이터베이스는 포함하지 않습니다.

## 구조

```text
backend/
  main.py                   # uvicorn main:app 진입점
  ai_router.py              # 기존 router import 호환
  app/
    config.py               # backend 기준 데이터·환경 변수 경로
    routers/                # 프로그램 조회, AI API
    services/               # 원본 로딩, 근거 계산, 보고서 검증
    schemas/strategy.py     # 기존 JSON 스키마·분석 지침
  data/                     # 실행에 필요한 JSON 5개, 로컬 보존
  requirements.txt
  requirements-dev.txt
  .env.example
frontend/
  src/
    App.jsx                 # 데이터 로딩·해시 라우팅
    pages/                  # 홈, 트렌드, 목록, 상세
    components/             # 공통 UI, 차트, 팝업, 전략, 영상
    hooks/useRoute.js
    utils/programData.js    # 기존 표시·정렬·계산 기준
    styles/                 # 원래 선언 순서를 유지한 CSS
    assets/
    main.jsx
    programImages.js
  public/                   # 기존 programs·fonts·brand URL 유지
  vite.config.js
deploy/vercel.example.json  # 실제 Render 주소로 수정 후 사용하는 예시
scripts/                   # 리팩터링 전후 회귀 검증
docs/                      # 공개 전 데이터 검토·정리 결과
.local/                    # 원본 보관·과거 자료·검증 산출물, Git 제외
```

`src/App.css`, `index.css`, `fonts.css`는 기존 경로 호환용 import입니다. 실제 스타일은 `src/styles`에서 관리합니다.

## 데이터와 분석 기준

현재 분석 기간은 2026년 9월 28일~10월 11일입니다. `programs_v1.json`의 17개 프로그램, `videos_v1.json`의 영상 후보 303개, `episodes_v1.json`의 방송 회차 20개를 사용합니다. 출처와 필드 정의는 `provenance_v1.json`, `field_dictionary_v1.json`에 기록돼 있습니다. 출처에 기재된 과거 CSV 원본은 이 프로젝트에 포함돼 있지 않습니다.

- 검색지수는 동일 프로그램·동일 검색어의 주차 간 흐름으로 해석합니다. 프로그램 간 절대 인기 비교에 사용하지 않습니다.
- 유튜브 소속·유형은 후보 분류이며 전체 업로드 수나 성과를 의미하지 않습니다.
- 방송일 대조는 영상 내용이나 프로그램 소속을 확정하는 검증이 아닙니다.
- RACOI 전주 잠정 가공값과 다음 주 공개값은 같은 신뢰도로 취급하지 않습니다.
- 확인할 수 없는 시청률은 `null`로 유지하며 실제 0%로 해석하지 않습니다.
- 전략은 검토안입니다. 지표 간 인과관계나 실제 운영 성과를 입증하지 않습니다.

## 로컬 실행

Python 3.11 이상과 Vite 8이 지원하는 Node.js를 준비합니다. Node.js 22.12 이상 또는 24 계열을 사용할 수 있습니다. 기존 `.venv`가 다른 PC의 Python을 참조한다면 기존 폴더를 보관하고 새 환경을 만드세요.

데이터·포스터·폰트·브랜드 이미지의 공개 권한이 확인되지 않아 루트 `.gitignore`에서 제외했습니다. 새로 clone한 소스만으로는 현재 서비스를 재현할 수 없습니다. 실행 전 승인된 사본을 기존 경로에 복원해야 합니다. 필요한 파일과 검토 기준은 [공개 데이터 검토](docs/DATA_PUBLICATION.md)를 참고하세요.

백엔드 — PowerShell:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# .env가 없는 새 설치에서만 예시를 복사합니다. 기존 .env를 덮어쓰지 마세요.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

기존 `.env`가 있으면 복사 단계를 건너뜁니다. 서버를 실행하는 작업 디렉터리는 `backend`입니다. 데이터와 `.env`는 코드 파일을 기준으로 찾습니다.

프론트엔드 — 별도 터미널:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

브라우저에서 `http://127.0.0.1:5173/`을 엽니다. Vite 개발 프록시가 `/api`를 로컬 8000 포트로 전달합니다. 프로그램 경로는 `/#/program/MBN01` 같은 기존 해시 주소입니다.

## 환경 변수

`backend/.env.example`에는 변수 이름과 빈 값만 포함합니다. 실제 키는 `backend/.env` 또는 Render의 서버 환경 변수에만 설정합니다.

| 변수 | 용도 |
|---|---|
| `OPENAI_API_KEY` | 수동 보고서 생성에 필요한 서버 API 키 |
| `OPENAI_MODEL` | 사용할 모델 ID. 변수 자체가 없을 때만 코드의 기본값 사용 |
| `MSOS_ENABLE_AI` | `true`일 때만 유료 전략 생성 허용. 검증 중에는 `false` 권장 |

예시의 빈 `OPENAI_MODEL`은 자동 기본값이 아닙니다. 보고서 기능을 활성화할 때 사용할 모델 ID를 입력하거나 해당 변수를 제거해야 합니다. 키를 프론트엔드 환경 변수에 넣지 마세요.

## 배포 구조

```text
브라우저 → Vercel의 React 정적 파일
         → /api/* 외부 rewrite → Render FastAPI → 로컬 JSON / OpenAI
```

- Render: Root Directory `backend`, Build Command `pip install -r requirements.txt`, Start Command `uvicorn main:app --host 0.0.0.0 --port $PORT`, Health Check `/health`.
- 배포 환경에도 승인된 JSON 5개를 `backend/data`에 제공해야 합니다. 공개 권한 확인 전에는 무조건 Git 제외 규칙을 해제하지 마세요.
- Vercel: Root Directory `frontend`, Framework Vite, Build Command `npm run build`, Output Directory `dist`.
- `deploy/vercel.example.json`의 예약 예시 주소를 실제 Render HTTPS 주소로 바꾸고 `frontend/vercel.json`으로 복사합니다. 로컬 개발 프록시는 프로덕션 빌드에 포함되지 않습니다.
- 해시 라우팅은 유지하므로 페이지용 catch-all rewrite는 필요하지 않습니다. `/api`를 `index.html`로 보내지 마세요.
- 유료 생성 API에는 현재 사용자 인증·사용자별 사용량 제한이 없습니다. 공개 배포에서는 `MSOS_ENABLE_AI=false`로 두고, 접근 통제와 비용 제한을 마련한 뒤 활성화해야 합니다.

실제 배포와 외부 연결 검증은 아직 수행하지 않았습니다. 설정 근거: [Vercel external rewrites](https://vercel.com/docs/routing/rewrites), [Render FastAPI](https://render.com/docs/deploy-fastapi).

## 검증

```powershell
cd frontend
npm run lint
npm run build
cd ..
node scripts/verify_frontend.mjs
backend\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
backend\.venv\Scripts\python.exe scripts/verify_backend.py
```

원본 비교 검사는 이 로컬 작업에서 만든 `.local/refactor-original`이 필요하므로 새 clone에서는 바로 실행할 수 없습니다. 원본 비교 자료는 GitHub에 포함하지 않습니다. 백엔드 검증은 외부 소켓 연결을 차단하고 OpenAI를 모의 처리합니다. 프론트엔드 비교는 HTML 서버 렌더링 검사이며, 브라우저의 클릭·애니메이션·외부 영상 재생 검증을 대신하지 않습니다.

검증 결과와 남은 확인 사항은 [리팩터링 보고서](docs/REFACTOR_REPORT.md)를 참고하세요.
