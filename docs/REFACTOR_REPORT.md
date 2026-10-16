# 리팩터링 결과

작업 기준일: 2026년 10월 17일(KST). 기존 기능·분석 수치·디자인 유지가 우선이며 영구 삭제와 외부 배포는 수행하지 않았습니다.

## 구조와 가독성

- 백엔드: 단일 AI 모듈을 API 라우터, 근거 계산, 문장 검증·대체 보고서, 기존 스키마·지침으로 분리했습니다. 프로그램 조회 라우터와 원본 로딩도 분리했습니다.
- `main:app`과 `from ai_router import router`는 유지했습니다. 데이터와 `.env` 위치는 `backend/app/config.py`에서 `backend` 기준으로 계산합니다.
- Python 14개 파일의 문법을 확인하고 Black으로 정리했습니다. 서비스 모듈·주요 함수에 한국어 설명과 계산 기준을 보존하는 이유를 추가했습니다.
- 프론트: App.jsx는 1,106줄에서 39줄로 줄었고, 네 페이지·차트·팝업·전략·영상·공통 UI·데이터 처리·라우팅으로 분리했습니다.
- 분리된 가장 큰 화면 파일은 Home.jsx 296줄입니다. 렌더링 코드를 재작성하지 않고 기존 함수 단위로 추출했습니다.
- CSS는 styles로 모으되 원래 선언 순서와 내용은 그대로 유지했습니다. 이전 경로는 두 줄의 호환 import로 남겼습니다. 중복처럼 보이는 CSS도 cascade 영향을 피하기 위해 제거하지 않았습니다.
- 현재 참조되지 않는 Hero 컴포넌트와 CSS는 보관했습니다. 포스터·브랜드·폰트·assets 파일 자체는 모두 기존 위치와 바이트를 유지했습니다.
- requirements.txt에 실제 import에 필요한 openai·python-dotenv를 추가하고, 개발용 요구사항과 포맷 설정을 분리했습니다.
- 기존 슬라이드·로딩 초기화 effect는 유지했습니다. 새 React lint 규칙과 충돌하는 세 위치에는 이유를 적고 해당 줄만 예외 처리했습니다. 미사용 보고서 매개변수는 제거했습니다.
- START_FRONTEND.bat의 절대 작업 경로를 배치 파일 위치 기준으로 바꿨습니다.

최종 트리는 루트 README의 구조 항목을 참고하세요.

## 검증 결과

| 검사 | 결과 |
|---|---|
| Python 문법 | 14개 파일 통과 |
| 원본과 조회 API·404 응답 비교 | 77개 일치 |
| 17개 프로그램 AI 성공·대체 보고서 모의 비교 | 34개 일치, 모델 입력과 호출 인수도 동일 |
| AI 관련 함수 AST | 18개 실행 코드 동일, docstring만 제외 |
| AI 지침·JSON 스키마 | 동일 |
| 프론트 함수 본문 AST | 43개 동일, 설명 주석만 제외 |
| 페이지·상세·영상·팝업·AI 보고서 HTML 비교 | 41개 일치 |
| CSS 원본 비교 | 3개 동일 |
| 데이터·이미지·폰트·.env 등 보호 파일 SHA-256 | 51개 동일 |
| ESLint 전체 프로젝트 검사 | 통과, .local의 원본 검증 fixture는 제외 |
| Vite 프로덕션 빌드 | 통과 |
| 실제 OpenAI 호출 | 0회 |
| Git 제외 규칙 | .env·환경·패키지·빌드·보관 자료·보류 데이터 제외, .env.example·README 포함 확인 |

브라우저에서는 홈 그래프 전환, 데이터 팝업 열기·닫기, 프로그램 검색과 상세 이동, 영상 슬라이드 전환, 트렌드 차트 표시, 포스터 로드를 직접 확인했습니다. 유튜브 임베드 플레이어 로드도 확인했으나 영상 재생은 누르지 않았습니다. AI 버튼은 누르지 않고 서버와 HTML 모의 비교로 보고서 계약을 확인했습니다.

원본 렌더링 비교에서 QuickLink의 기존 key spread 개발 경고가 확인됐습니다. 출력이 바뀌지 않도록 기존 본문을 유지했고, 빌드나 기능 오류는 아닙니다. 모든 뷰포트에서의 픽셀 비교·접근성 전수 감사·외부 유튜브 영상의 재생 가능성은 검증하지 않았습니다.

## 실행 상태

이번 수정 시작 시 8000·5173 포트는 연결 거부 상태였습니다. 기존 프로세스를 종료하지 않았습니다. 검증을 위해 수정한 FastAPI와 Vite를 해당 포트에서 실행했고 다음을 200 응답으로 확인했습니다.

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:5173/api/v1/programs`
- `http://127.0.0.1:5173/api/v1/ai/strategy-preview/MBN11`
- `http://127.0.0.1:5173/programs/MBN01.jpg`
- `http://127.0.0.1:5173/fonts/Pretendard-Regular.otf`

기존 .venv 인터프리터는 이 검증 환경에서 실행되지 않아 Codex의 Python과 .local/python-deps를 사용했습니다. 기존 .venv·.env 내용은 변경하지 않았습니다. 일반 터미널에서 재시작할 때는 README의 환경 설치·실행 방법을 사용하세요.

## GitHub·배포 상태

소스 정리와 제외 규칙은 준비됐지만 GitHub 업로드·커밋·push·Vercel·Render 배포는 하지 않았습니다. 프로젝트 루트에 Git 저장소도 만들지 않았습니다. 비밀 값은 보고서에 포함하지 않았습니다.

데이터·포스터·폰트·브랜드의 공개 권한과 메타데이터 개인정보 검토는 별도로 필요합니다. 확인 전에는 .gitignore에서 제외하며, 새 clone만으로 현재 서비스가 실행되지 않는다는 점을 README에 명시했습니다. 로컬 파일과 기능은 그대로 유지됩니다. 실제 공개 배포에는 승인된 데이터 공급, Render 실제 주소, Vercel rewrite 설정이 필요합니다. 예시는 deploy/vercel.example.json에 있으며 예약 도메인을 사용합니다.

현재 유료 생성 엔드포인트는 사용자 인증·사용자별 한도 없이 전역 환경 변수로 활성화됩니다. 기존 동작을 유지했으며, 공개 환경에서는 접근 통제 전까지 비활성화하도록 안내했습니다.

## 보관한 파일과 폴더

40개 항목(하위 파일 포함 60개)을 .local/archive로 이동했습니다. 원본 데이터·이미지는 이동하지 않았고, 모든 보관 자료는 GitHub에서 제외됩니다. 프로젝트 밖 이동은 수행하지 않았습니다.

| 원래 경로 | 보관 경로 |
|---|---|
| `backend/ai_router_backup.py` | `.local/archive/backend/ai_router_backup.py` |
| `backend/ai_router_before_quality.py` | `.local/archive/backend/ai_router_before_quality.py` |
| `backend/ai_router_original.py` | `.local/archive/backend/ai_router_original.py` |
| `backend/ai_router_previous.py` | `.local/archive/backend/ai_router_previous.py` |
| `backend/MILESTONE_AI_DIAGNOSTICS.md` | `.local/archive/backend/MILESTONE_AI_DIAGNOSTICS.md` |
| `backend/MILESTONE_AI_QUALITY.html` | `.local/archive/backend/MILESTONE_AI_QUALITY.html` |
| `backend/MILESTONE_BACKEND_STAGE2.html` | `.local/archive/backend/MILESTONE_BACKEND_STAGE2.html` |
| `backend/QA_RESULT.json` | `.local/archive/backend/QA_RESULT.json` |
| `backend/README_설치방법.txt` | `.local/archive/backend/README_설치방법.txt` |
| `backend/README_적용방법.txt` | `.local/archive/backend/README_적용방법.txt` |
| `backend/README_START.txt` | `.local/archive/backend/README_START.txt` |
| `backend/README.txt` | `.local/archive/backend/README.txt` |
| `backend/TEST_NOTES.md` | `.local/archive/backend/TEST_NOTES.md` |
| `CHECK_BACKEND_PREVIEW.bat` | `.local/archive/CHECK_BACKEND_PREVIEW.bat` |
| `CHECK_FRONTEND.bat` | `.local/archive/CHECK_FRONTEND.bat` |
| `frontend/_backup_before_v7_20261016_232420` | `.local/archive/frontend/_backup_before_v7_20261016_232420` |
| `frontend/_backup_before_v7_20261016_232727` | `.local/archive/frontend/_backup_before_v7_20261016_232727` |
| `frontend/_backup_before_v7_20261016_235442` | `.local/archive/frontend/_backup_before_v7_20261016_235442` |
| `frontend/_BACKUP_BEFORE_V8_20261017_000717_752` | `.local/archive/frontend/_BACKUP_BEFORE_V8_20261017_000717_752` |
| `frontend/_BACKUP_BEFORE_V9_20261017_003649_708` | `.local/archive/frontend/_BACKUP_BEFORE_V9_20261017_003649_708` |
| `frontend/INSTALL.bat` | `.local/archive/frontend/INSTALL.bat` |
| `frontend/install.ps1` | `.local/archive/frontend/install.ps1` |
| `frontend/MILESTONE_STAGE3.html` | `.local/archive/frontend/MILESTONE_STAGE3.html` |
| `frontend/README_먼저읽기.txt` | `.local/archive/frontend/README_먼저읽기.txt` |
| `frontend/README_적용방법.txt` | `.local/archive/frontend/README_적용방법.txt` |
| `frontend/README_FIRST.txt` | `.local/archive/frontend/README_FIRST.txt` |
| `frontend/README_START.txt` | `.local/archive/frontend/README_START.txt` |
| `frontend/README.md` | `.local/archive/frontend/README.md` |
| `frontend/src/components/Hero.css` | `.local/archive/frontend/src/components/Hero.css` |
| `frontend/src/components/Hero.jsx` | `.local/archive/frontend/src/components/Hero.jsx` |
| `frontend/V9_MANIFEST.json` | `.local/archive/frontend/V9_MANIFEST.json` |
| `frontend/VERIFY_SITE.bat` | `.local/archive/frontend/VERIFY_SITE.bat` |
| `frontend/verify_site.ps1` | `.local/archive/frontend/verify_site.ps1` |
| `INSTALL_BACKEND.bat` | `.local/archive/INSTALL_BACKEND.bat` |
| `INSTALL_FRONTEND.bat` | `.local/archive/INSTALL_FRONTEND.bat` |
| `install.ps1` | `.local/archive/install.ps1` |
| `README_FIRST.txt` | `.local/archive/README_FIRST.txt` |
| `README.txt` | `.local/archive/README.txt` |
| `sha256_backend.txt` | `.local/archive/sha256_backend.txt` |
| `sha256_frontend.txt` | `.local/archive/sha256_frontend.txt` |

원본 비교용 보관본과 이동 기록은 `.local/README.md`, `.local/archive-manifest.json`에서 확인할 수 있습니다. 검증 스크립트는 이 보관본이 있는 로컬에서 전후 비교를 재현하기 위한 것이며 새 clone용 독립 테스트 묶음은 아닙니다.
