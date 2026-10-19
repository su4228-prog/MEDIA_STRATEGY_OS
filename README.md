# 📺 MEDIA STRATEGY OS

**방송 화제성을 읽고, 근거로 전략을 설계하는 AI 콘텐츠 전략 대시보드**

네이버 검색 흐름 · RACOI 온라인 반응 · 유튜브 영상 후보를 한 화면에서 비교하고, **Python이 계산한 수치만 근거로** 프로그램별 콘텐츠 전략 검토안을 생성합니다. 지표마다 비교 범위와 검증 수준을 함께 표기해, 데이터 확인에서 전략 검토까지 이어지는 과정을 돕습니다.

링크: https://media-strategy-os.vercel.app/

<p align="center">
  <img src="./docs/readme/demo/demo.gif" alt="배포 사이트 기능 시연 — 홈, 데이터 팝업, 화제성 분석, 프로그램 검색, 상세 리포트, AI 전략 리포트" width="100%" />
</p>
<p align="center"><sub>▶ 배포 사이트 기능 시연 (87초) · 홈 → 데이터 팝업 → 화제성 분석 → 프로그램 검색 → 상세 리포트 → AI 전략 리포트 · 고화질 영상: <a href="./docs/readme/demo/demo.mp4">demo.mp4</a> · AI 생성 대기 시간은 편집했습니다</sub></p>

[![Live Demo](https://img.shields.io/badge/Live_Demo-media--strategy--os.vercel.app-f06a28?style=flat-square)](https://media-strategy-os.vercel.app/)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11+-009688?style=flat-square&logo=fastapi&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-Responses_API-412991?style=flat-square&logo=openai&logoColor=white)

> 📑 슬라이드(16:9)로 보기: 아래 [슬라이드 펼쳐보기](#-슬라이드-펼쳐보기)에서 19장을 이미지로 볼 수 있고, [`docs/readme/README.html`](./docs/readme/README.html)은 이미지가 모두 포함된 단일 HTML 파일이라 내려받아 브라우저에서 바로 열 수 있습니다.

| 분석 프로그램 | 유튜브 영상 후보 | 10월 2주차 RACOI 댓글 | 분석 기간 |
|:---:|:---:|:---:|:---:|
| **17개** | **303건** | **20,817건** | **2026.09.28 – 10.11** (2주) |

---

## 📌 목차

1. [개요](#-개요)
2. [기획 배경](#-기획-배경)
3. [기술 스택과 배포 구조](#-기술-스택과-배포-구조)
4. [주요 기능](#-주요-기능)
5. [AI 생성 파이프라인](#-ai-생성-파이프라인)
6. [데이터 해석 원칙](#-데이터-해석-원칙)
7. [기술적 의사결정](#-기술적-의사결정)
8. [프로젝트 구조와 데이터 모델](#-프로젝트-구조와-데이터-모델)
9. [실행 방법](#-실행-방법)
10. [검증 결과](#-검증-결과)
11. [회고와 향후 계획](#-회고와-향후-계획)
12. [슬라이드 펼쳐보기](#-슬라이드-펼쳐보기)

---

## 🗂 개요

| 항목 | 내용 |
|---|---|
| **목표** | 방송 프로그램의 검색 관심 · 온라인 반응 · 유튜브 운영 데이터를 한 흐름으로 정리해, 데이터 확인에서 전략 검토까지 걸리는 시간을 줄입니다. |
| **원칙** | 수치는 과장하지 않고, 지표마다 비교 범위와 검증 수준을 함께 표기합니다. |
| **분석 대상** | MBN 17개 프로그램 · 영상 후보 303건 · 방송 회차 20개 · 분석 확정 영상 129건 |
| **분석 기간** | 2026.09.28 – 10.11 (10월 1주차 W40 vs 10월 2주차 W41) |
| **개발** | su4228-prog — 기획 · 데이터 정리 · 프론트엔드 · 백엔드 · AI · 배포 |
| **실행 환경** | 웹 서비스 [media-strategy-os.vercel.app](https://media-strategy-os.vercel.app/) (Vercel + Render) · 로컬 `http://127.0.0.1:5173` |

---

## 🎯 기획 배경

방송 콘텐츠 전략을 세울 때 반복해서 부딪힌 세 가지 문제를 정의하고, 각각에 대응하는 기능을 설계했습니다.

| # | 문제 | 자주 겪은 상황 | 해결 |
|:---:|---|---|---|
| 01 | **지표가 매체별로 흩어져 있다** | 네이버 데이터랩(검색지수), RACOI(게시글·댓글·조회수), YouTube(업로드 목록)를 따로 확인 | **프로그램 단위 통합 리포트** — 세 매체를 같은 주차 기준으로 한 화면에 배치 |
| 02 | **숫자의 의미가 쉽게 왜곡된다** | 검색지수를 인기 순위로 비교, 미공개 시청률을 0%로 집계, 영상 후보를 공식 업로드 수로 오인 | **지표별 해석 규칙과 데이터 설명 팝업** — 비교 범위·검증 수준을 화면에 함께 표기 |
| 03 | **AI 전략 문장은 근거가 불분명하다** | 근거에 없는 수치, 상관을 인과처럼 서술, 누구나 버튼을 눌러 비용 발생 | **계산은 Python, 문장만 AI** — 응답 검증 · 대체 보고서 · 일일 사용량 제한 |

---

## 🛠 기술 스택과 배포 구조

| 구분 | 기술 |
|---|---|
| **Frontend** | React 19, Vite 8, JavaScript, CSS, SVG 차트 직접 구현, 해시 라우팅, ESLint |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, python-dotenv, 버전 관리되는 로컬 JSON 5종 |
| **AI** | OpenAI Responses API, JSON Schema strict 출력, 기본 모델 `gpt-5-mini`, `store=False` |
| **Infra** | Vercel(정적 호스팅) · Render(API 서버) · Upstash Redis REST(일일 한도 저장) |

```text
브라우저 ──▶ Vercel (React 정적 파일)
              │  /api/* 만 외부 rewrite
              ▼
           Render (FastAPI) ──▶ 로컬 JSON 5종 (프로그램·영상·회차·출처·필드 사전)
              │             ──▶ Upstash Redis (일일 한도 · 중복 잠금)
              └─────────────▶ OpenAI (버튼을 누를 때만 호출)
```

**주요 API**

| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | 헬스 체크 |
| GET | `/api/v1/programs` · `/api/v1/programs/{id}` | 프로그램 목록 · 상세 |
| GET | `/api/v1/programs/{id}/videos` · `/episodes` | 관련 영상 후보 · 방송 회차 |
| GET | `/api/v1/meta` | 집계 개수 · 원본 출처 정보 |
| GET | `/api/v1/ai/status` | 설정 여부·진단 버전·현재 일일 한도 (외부 호출 없음) |
| GET | `/api/v1/ai/strategy-preview/{id}` | 근거 미리보기 (외부 호출 없음, 무료) |
| POST | `/api/v1/ai/strategy/{id}` | AI 전략 리포트 생성 (유료, 일일 한도 적용) |

---

## ✨ 주요 기능

### 1. 홈 — 주간 검색 변화를 한눈에

첫 화면에서 검색 관심이 크게 오른 프로그램과 사이트 전체 규모를 바로 확인합니다.

- **프로그램별 검색 변화 슬라이드**: 상승률 상위 8개 프로그램을 넘기며 1주차 → 2주차 검색지수 비교 (예: 나의 해방일지 33.4 → 57.1, **+71.2%**)
- **전체 규모 요약**: 분석 프로그램 17 · 관련 영상 303 · 분석 확정 영상 129
- **해석 범위 명시**: “같은 프로그램의 동일 검색어 변화만 비교”라는 문구를 카드 하단에 고정

<p align="center">
  <img src="./docs/readme/img/home_about.jpg" alt="플랫폼 핵심 안내" width="48%" />
  <img src="./docs/readme/img/home_ranking.jpg" alt="검색 관심도가 높아진 프로그램" width="48%" />
</p>

#### 데이터 설명 팝업

홈의 “어떤 데이터를 활용했나요?” 카드에서 매체별 팝업을 열어 비교 기준과 상위 프로그램을 확인합니다. 확인되지 않은 시청률은 0으로 바꾸지 않고 비워 둡니다.

<p align="center">
  <img src="./docs/readme/img/modal_naver.jpg" alt="네이버 검색 데이터 팝업" width="48%" />
  <img src="./docs/readme/img/modal_racoi.jpg" alt="RACOI 공개 반응 데이터 팝업" width="48%" />
</p>

---

### 2. 화제성 분석 대시보드

검색 변화 · RACOI 온라인 반응 · 유튜브 공급량과 콘텐츠 구성을 한 페이지에서 프로그램끼리 나란히 비교합니다. 1주차는 회색, 2주차는 주황색으로 일관되게 구분합니다.

<p align="center">
  <img src="./docs/readme/img/trends.jpg" alt="화제성 분석 대시보드 상단" width="95%" />
</p>
<p align="center">
  <img src="./docs/readme/img/trends_racoi.jpg" alt="RACOI 반응 규모와 유튜브 공급량" width="48%" />
  <img src="./docs/readme/img/trends_mix.jpg" alt="유튜브 콘텐츠 구성과 해석 기준" width="48%" />
</p>

---

### 3. 프로그램 목록

17개 프로그램을 포스터 카드로 나열하고, 프로그램명·장르 검색과 정렬로 원하는 리포트를 찾습니다. 카드마다 장르 · 검색 변화율 · 관련 영상 수 · RACOI 게시글 수를 표시합니다.

<p align="center">
  <img src="./docs/readme/img/list_grid.jpg" alt="프로그램 목록" width="95%" />
</p>

---

### 4. 프로그램 상세 리포트

한 프로그램의 데이터를 “먼저 확인할 데이터” 순서로 배치합니다. 네이버 검색지수 비교 → 유튜브 공급량 비교 → 콘텐츠 구성(클립·무대·예고) → RACOI 반응 → 최신 관련 유튜브 영상(3개씩 슬라이드) 순입니다.

<p align="center">
  <img src="./docs/readme/img/detail.jpg" alt="프로그램 상세 상단" width="95%" />
</p>
<p align="center">
  <img src="./docs/readme/img/detail_mix.jpg" alt="콘텐츠 구성과 RACOI 반응" width="48%" />
  <img src="./docs/readme/img/detail_videos.jpg" alt="최신 관련 유튜브 영상" width="48%" />
</p>

---

### 5. AI 전략 리포트

상세 페이지의 **“AI 전략 리포트 확인하기”** 버튼을 누르면 서버가 근거를 계산하고, 모델은 그 근거만으로 보고서를 작성합니다. 아래는 2026.10.17 배포 사이트에서 **전설의 사내**로 실제 생성한 결과입니다.

> **“무대 중심 클립 비중 확대에 따른 유튜브 관심선 순환 전략”**
> 검색 관심은 안정적(+1.3%)인 반면, 유튜브 관련 영상 후보는 50 → 56건으로 늘었고 그중 음악 무대 비중이 52.0% → 58.9%로 증가했다는 근거를 짚었습니다.

<p align="center">
  <img src="./docs/readme/img/ai_loading.jpg" alt="AI 리포트 생성 중" width="48%" />
  <img src="./docs/readme/img/ai_report_intro.jpg" alt="AI 리포트 헤드라인과 데이터 비교" width="48%" />
</p>
<p align="center">
  <img src="./docs/readme/img/ai_opportunities.jpg" alt="데이터에서 찾은 전략적 기회" width="48%" />
  <img src="./docs/readme/img/ai_experiment.jpg" alt="콘텐츠 실험과 최종 제안" width="48%" />
</p>

| 리포트 구성 | 내용 (실제 생성 예시) |
|---|---|
| 헤드라인 · 인사이트 | 검색 관심 안정 속 음악 무대 중심으로 영상 공급이 재편되는 현상 |
| 주요 데이터 비교 | 검색 관심지수 35.67 → 36.14 · 영상 후보 50 → 56건 · 무대 영상 26 → 33건 (서버 계산값 그대로) |
| 전략적 기회 | ① 무대 하이라이트 전용 쇼트 시리즈화 ② 토픽 연결형 예고·해시태그 캠페인으로 검색 유지 강화 |
| 콘텐츠 실험 | 무대 하이라이트 쇼트 두 가지 방식 노출 실험 — 실행 방법 · 성과 측정 · 판단 기준 |
| 최종 제안 · 처리 기준 | 무대 하이라이트 형식 표준화 후 점진 확대, 결과는 인과로 단정하지 않음 |

---

### 6. 첫 방문 데이터 연결 안정화

Render 무료 서버가 절전에서 복구되는 동안 빈 데이터나 잘못된 프로그램 오류를 표시하지 않고, 초기 로딩 안내를 보여 줍니다. 6초 이상 지연되거나 재시도를 시작하면 연결 지연 안내로 바뀌며, 최종 실패 시 **다시 불러오기** 버튼으로 수동 재요청할 수 있습니다.

- 자동 재시도는 무료 `GET /api/v1/programs`에만 적용합니다. 네트워크 오류·타임아웃·HTTP 408/425/429·5xx는 재시도하고, 404 등 명확한 요청 오류는 즉시 중단합니다.
- 요청당 최대 **18초**, 전체 최대 **110초**, 최대 **8회**입니다. 대기 간격은 **2 → 4 → 8 → 16 → 24 → 24 → 24초**이며 남은 전체 시간에 따라 일찍 종료될 수 있습니다.
- 성공하면 즉시 종료하고 목록을 교체해 중복 표시를 막습니다. 성공한 목록은 해시 경로 이동에도 재사용하며, 로딩 중 경로 변경·컴포넌트 해제 시 요청과 대기를 취소합니다.
- 프로그램 상세 화면은 관련 영상 API를 추가 조회합니다. 회차 조회 API는 백엔드에서 제공하지만 현재 상세 화면이 별도로 호출하지는 않습니다.
- **유료 AI 보고서 POST에는 자동 재시도를 적용하지 않습니다.** 이번 연결 안정화 작업은 기존 디자인·분석 데이터·AI 보고서 내용을 변경하지 않았습니다.

---

## 🤖 AI 생성 파이프라인

```text
① 근거 계산         ② 사용량 예약          ③ 구조화 생성          ④ 응답 검증              ⑤ 보고서 반환
build_evidence() → Redis Lua 원자 처리 → JSON Schema strict → 근거에 없는 수치 검사 → openai_validated
주차 비교표          개인 10회·전체 30회/일   근거만 입력            실패 시 재호출 없이      또는 verified_evidence_fallback
제목 단서·주의 사항  최대 120초 중복 잠금    store=False           대체 보고서              + STRATEGY_REVIEW_ONLY
```

| 보호 장치 | 내용 |
|---|---|
| **일일 한도** | 접속 환경(IP 해시)별 10회 · 사이트 전체 30회, UTC 자정 기준 초기화. 2026.10.19에 개인 한도만 3회에서 10회로 상향 |
| **중복 잠금** | 같은 접속 환경(IP 해시)·같은 프로그램의 동시 요청을 차단. 최대 120초이며 요청 종료 시 자신의 잠금을 해제 |
| **개인정보** | IP 원문은 저장하지 않고 `MSOS_RATE_LIMIT_SALT`로 HMAC-SHA256 해시만 보관 |
| **보수적 차감** | 예약에 성공하면 이후 API 오류가 나도 횟수를 돌려주지 않음 (비용이 이미 발생했을 수 있음) |
| **장애 시 차단** | Redis 설정이 없거나 통신이 실패하면 유료 호출을 진행하지 않고 503 반환 |
| **스위치** | `MSOS_ENABLE_AI=true`일 때만 생성 허용, 그 외에는 무료 미리보기만 동작 |

---

## 🧭 데이터 해석 원칙

지표의 범위를 넘는 해석을 막기 위해 같은 규칙을 **화면 문구 · 근거 계산 · AI 지침**에 똑같이 적용했습니다.

| 원칙 | 할 수 있는 말 ✅ | 할 수 없는 말 ❌ |
|---|---|---|
| 검색지수는 주차 간 흐름 | “전설의 사내 검색 관심이 1.3% 늘었다” | “전설의 사내가 나의 해방일지보다 인기 있다” |
| 유튜브 유형은 후보 분류 | “관련 영상 후보 중 무대 유형이 늘었다” | “공식 채널이 무대 영상을 33개 올렸다” |
| 방송일 대조 ≠ 소속 확정 | “방송일과 제목 날짜가 맞는 후보가 있다” | “이 영상은 해당 회차 영상이다” |
| 잠정값과 공개값 분리 | “2주차 공개 기준 댓글 15,413건” | “댓글이 전주 대비 N% 증가했다” |
| 미확인 시청률은 `null` | “시청률은 확인되지 않았다” | “시청률 0%로 가장 낮다” |
| 전략은 검토안 | “무대 영상 증가와 함께 나타난 변화” | “무대 영상 때문에 반응이 늘었다” |

출처와 필드 정의는 `backend/data/provenance_v1.json`, `backend/data/field_dictionary_v1.json`에 기록되어 있습니다.

---

## 💡 기술적 의사결정

| 항목 | 채택 | 검토 대안 | 이유 |
|---|---|---|---|
| **AI 역할 분리** | Python 계산 + LLM 문장 | LLM에 원본 전체 전달 | 수치는 코드로 확정하고 모델에는 근거만 전달해, 존재하지 않는 수치·인과 주장을 줄이고 응답을 수치 대조로 검증할 수 있게 했습니다. |
| **출력 형식** | JSON Schema strict | 자유 텍스트 파싱 | 보고서 필드가 항상 같은 구조로 와서 프론트 렌더링과 품질 검증 로직을 단순하게 유지합니다. |
| **검증 실패 처리** | 근거 기반 대체 보고서 | 자동 재호출 | 형식·품질 규칙에 걸려도 비용이 드는 재요청을 하지 않고, 이미 계산된 근거로 보고서를 구성합니다. |
| **비용 보호** | Upstash Redis + Lua | 서버 메모리 카운터 | Render가 재시작해도 횟수가 유지되고, 확인→차감→잠금을 원자적으로 처리해 동시 요청에도 한도를 넘지 않습니다. |
| **배포** | Vercel + Render 분리 | 단일 서버 배포 | 정적 파일은 CDN에서, API 키는 서버 환경 변수에만 둡니다. `/api/*` rewrite로 같은 출처처럼 호출합니다. |
| **데이터 저장** | 버전 붙은 로컬 JSON | DB 구축 | 2주 스냅샷 분석이라 쓰기 요구가 없고, `_v1` 파일과 출처·필드 사전을 함께 관리하면 충분합니다. |
| **차트** | SVG 직접 구현 | 차트 라이브러리 | 2주 비교 중심의 단순한 차트라 의존성 없이 브랜드 디자인을 그대로 맞출 수 있었습니다. |
| **초기 데이터 연결** | 제한된 GET 재시도 + 로딩 안내 | 첫 실패 즉시 오류 / 무제한 재시도 | 절전 복구를 최대 110초 동안 기다리되 요청 수를 제한하고, 유료 AI POST는 재시도 대상에서 제외합니다. |

---

## 📂 프로젝트 구조와 데이터 모델

```text
backend/
  main.py                   # uvicorn main:app 진입점
  ai_router.py              # 기존 router import 호환
  app/
    config.py               # backend 기준 데이터·환경 변수 경로
    routers/                # programs.py(조회), ai.py(미리보기·전략 생성)
    services/
      strategy_evidence.py  # 근거 계산
      strategy_report.py    # 응답 검증·대체 보고서
      ai_rate_limit.py      # Redis 일일 한도·중복 잠금
      program_data.py       # 원본 로딩
    schemas/strategy.py     # JSON 스키마·AI 지침
  data/                     # *_v1.json 5종
  requirements.txt · requirements-dev.txt · .env.example
frontend/
  src/
    App.jsx                 # 데이터 상태·해시 경로에 따라 화면 연결
    pages/                  # Home, TrendPage, ProgramList, ProgramDetail
    components/             # Charts, Strategy, VideosSection, DataModal, Common
      ProgramLoadState.jsx  # 초기·지연·실패 안내와 수동 재요청
    hooks/
      useRoute.js           # 기존 해시 라우팅
      usePrograms.js        # 로딩 상태·성공 데이터 재사용·요청 정리
    utils/
      programData.js        # 표시·정렬·계산 기준
      loadPrograms.js       # 무료 프로그램 GET 전용 제한 재시도
    styles/                 # 원래 선언 순서를 유지한 CSS
    programImages.js        # 프로그램 ID ↔ 포스터 매핑
  public/                   # programs(포스터), fonts, brand
  vercel.json               # /api rewrite
  tests/loadPrograms.test.js # 네트워크·타임아웃·취소·복구 모의 검사
deploy/vercel.example.json  # rewrite 예시
scripts/                    # 리팩터링 전후 회귀 검증
docs/
  readme/                   # 슬라이드형 README(HTML)와 화면 캡처
  DATA_PUBLICATION.md       # 공개 데이터 검토
  REFACTOR_REPORT.md        # 리팩터링 결과
```

| 파일 | 내용 | 규모 |
|---|---|---:|
| `programs_v1.json` | 프로그램별 검색 · 영상 · 판단 기준 통합 레코드 | 17 |
| `videos_v1.json` | 영상 후보 · 실험적 유형 · 방송일 대조 등급 | 303 |
| `episodes_v1.json` | 공식 방송 회차 · 업로드 시점 분포 | 20 |
| `provenance_v1.json` | 데이터 출처와 수집 상태 | — |
| `field_dictionary_v1.json` | 필드 정의와 해석 주의 | — |

```jsonc
// programs_v1.json 레코드 구조 (요약)
{
  "program_id": "MBN11",
  "program_name": "전설의 사내",
  "decision": { "category", "priority", "interpretation", "execution_allowed", "causal_claim_allowed" },
  "naver":    { "w40_index_mean", "w41_index_mean", "w40_to_w41_change_pct", "comparison_scope" },
  "youtube":  { "w40_owner_candidates", "w41_owner_candidates", "type_mix", "official_date_crossmatched_count" }
}
```

---

## 🚀 실행 방법

Python 3.11 이상과 Node.js 22.12 이상(또는 24 계열)이 필요합니다. 터미널 두 개에서 백엔드와 프론트엔드를 각각 실행합니다.

### 1) 백엔드 — PowerShell

```powershell
git clone https://github.com/su4228-prog/MEDIA_STRATEGY_OS.git
cd MEDIA_STRATEGY_OS/backend
py -3 -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
# .env가 없는 새 설치에서만 예시를 복사합니다. 기존 .env를 덮어쓰지 마세요.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
./.venv/Scripts/python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

서버를 실행하는 작업 디렉터리는 `backend`입니다. 기존 `.venv`가 다른 PC의 Python을 참조한다면 기존 폴더를 보관하고 새 환경을 만드세요.

### 2) 프론트엔드 — 새 터미널

```powershell
cd MEDIA_STRATEGY_OS/frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

브라우저에서 `http://127.0.0.1:5173/`을 엽니다. Vite 개발 프록시가 `/api`를 로컬 8000 포트로 전달하며, 프로그램 상세 주소는 `/#/program/MBN01` 형식입니다.

### 3) 동작 확인

```powershell
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:5173/api/v1/programs
curl http://127.0.0.1:5173/api/v1/ai/strategy-preview/MBN11   # 무료 미리보기, 외부 호출 없음
```

### 환경 변수 (`backend/.env` 또는 Render)

`backend/.env.example`에는 변수 이름만 들어 있습니다. 실제 키는 `backend/.env` 또는 Render 서버 환경 변수에만 설정하고, 프론트엔드에는 넣지 마세요.

| 변수 | 용도 |
|---|---|
| `OPENAI_API_KEY` | AI 보고서 생성에 필요한 서버 API 키 |
| `OPENAI_MODEL` | 사용할 모델 ID. 변수가 없으면 `gpt-5-mini` (빈 값으로 두지 말고 값을 넣거나 변수를 제거) |
| `MSOS_ENABLE_AI` | `true`일 때만 유료 생성 허용. 없거나 `false`면 무료 미리보기만 동작 |
| `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN` | 일일 한도와 중복 잠금 저장소. 없으면 AI 생성을 막음 |
| `MSOS_RATE_LIMIT_SALT` | IP 해시용 비밀 값(24자 이상) |

### 배포

| 대상 | 설정 |
|---|---|
| **Render** | Root `backend` · Build `pip install -r requirements.txt` · Start `uvicorn main:app --host 0.0.0.0 --port $PORT` · Health `/health` |
| **Vercel** | Root `frontend` · Framework Vite · Build `npm run build` · Output `dist` · `frontend/vercel.json`의 rewrite 대상을 실제 Render HTTPS 주소로 지정 |

해시 라우팅을 쓰므로 페이지용 catch-all rewrite는 필요하지 않습니다. `/api`를 `index.html`로 보내지 마세요. 데이터 · 포스터 · 폰트 · 브랜드 이미지의 공개 권한 검토 기준은 [공개 데이터 검토](docs/DATA_PUBLICATION.md)를 참고하세요.

---

## ✅ 검증 결과

### 리팩터링 당시 기록 — 2026.10.17

1,106줄이던 `App.jsx`를 페이지·컴포넌트 단위로 분리(당시 39줄)하면서, 화면과 응답이 바뀌지 않았는지 원본과 비교했습니다. 아래 수치는 **당시 소스에 대한 검증 기록**이며 이후 변경된 코드가 원본과 완전히 동일하다는 의미는 아닙니다.

| 검사 | 결과 |
|---|---|
| Python 문법 | 14개 파일 통과 |
| 조회 API · 404 응답 원본 비교 | 77개 일치 |
| 17개 프로그램 AI 성공·대체 보고서 모의 비교 | 34개 일치 (모델 입력·호출 인수 동일) |
| AI 함수 AST · 지침 · JSON 스키마 | 18개 실행 코드 동일 |
| 프론트 함수 본문 AST | 43개 동일 |
| 페이지·상세·팝업·AI 보고서 HTML 비교 | 41개 일치 |
| 데이터·이미지·폰트 SHA-256 | 51개 동일 |
| ESLint · Vite 프로덕션 빌드 | 통과 |
| 리팩터링 자동 검증 중 실제 OpenAI 호출 | 0회 (모의 처리) |

### 초기 데이터 연결 개선 — 2026.10.18

데이터 조회를 `usePrograms` 훅으로 옮긴 현재 `App.jsx`는 **29줄**입니다.

| 검사 | 결과 |
|---|---|
| 무료 조회 재시도 모의 검사 | **19개 통과** — 정상 응답, 일시 오류 복구, 404 즉시 중단, 타임아웃, 종료 후 수동 재요청, 요청·대기 취소, 전체 시간 한도 |
| ESLint · Vite 프로덕션 빌드 | 통과 |
| 브라우저 모의 상황 | 초기·지연·오류 안내, 수동 복구, 경로 이동 시 진행 요청 취소 확인 |
| 기존 Vercel 자동 배포 | `f111c2d` 커밋의 배포 성공 확인 |
| 프로덕션 연결 | 프로그램 API 17개, Render `/health` 정상. 프로그램 목록·상세·포스터 표시 확인 |
| 이번 연결 검증 중 실제 OpenAI 호출 | **0회**. AI 생성 POST 코드는 변경하지 않음 |

```powershell
cd frontend
node --test tests/loadPrograms.test.js
npm run lint
npm run build
```

- 브라우저에서 홈 그래프 전환, 데이터 팝업, 프로그램 검색 → 상세 이동, 영상 슬라이드, 트렌드 차트, 포스터 로드를 확인했고, 2026.10.17 배포 사이트에서 AI 리포트 생성이 검증을 통과해 표시되는 것을 확인했습니다.
- **검증하지 않은 범위**: 모든 뷰포트의 픽셀 비교, 접근성 전수 감사, 외부 유튜브 영상의 실제 재생 가능성.
- `scripts/verify_frontend.mjs`, `scripts/verify_backend.py`는 리팩터링 당시의 원본 동등성 검사입니다. 로컬 보관본(`.local/refactor-original`)이 필요하고 이후 의도적인 기능 변경으로 완전 일치 조건이 달라졌으므로, 현재 코드의 일반 회귀 검사로 사용하지 않습니다. 과거 기록은 [리팩터링 보고서](docs/REFACTOR_REPORT.md)를 참고하세요.
- Render를 강제로 절전시키지는 않았습니다. 실패·타임아웃은 모의 응답으로 확인했고 실제 사이트에서는 연결과 데이터 표시를 확인했습니다.

### AI 일일 한도 조정 — 2026.10.19

접속 환경별 한도를 **3회에서 10회**로 늘렸습니다. 사이트 전체 **30회**, UTC 자정 초기화, 기존 카운터 키, 최대 120초 중복 잠금, 장애 시 유료 호출 차단은 유지합니다. 이미 사용한 횟수를 초기화하지 않으며, 오류가 난 예약도 되돌리지 않습니다.

외부 Redis·OpenAI를 호출하지 않는 모의 검사 **6개**로 새 한도 전달, 10번째 허용·11번째 차단, 기존 사용량 재사용, 전체 한도·중복 잠금·Redis 장애 차단, 차단된 요청의 OpenAI 호출 방지와 무료 상태 응답을 확인했습니다.

```powershell
cd backend
./.venv/Scripts/python.exe -m unittest discover -s tests -v
```

무료 `GET /api/v1/ai/status`의 `daily_limits`는 `per_client: 10`, `site_total: 30`을 반환합니다. 유료 보고서를 생성하지 않고도 현재 배포된 한도를 확인할 수 있습니다.

---

## 📈 회고와 향후 계획

**잘한 점 (Keep)**
- **근거와 생성의 분리** — 수치를 코드가 확정하니 AI 응답을 검증할 기준이 생겼습니다.
- **공개 배포 전 비용 보호** — 인증 없이 열려 있던 유료 API에 일일 한도와 중복 잠금을 추가했습니다.
- **동작을 지킨 리팩터링** — 원본 비교로 기능 · 수치 · 디자인을 유지했습니다.
- **한계를 드러내는 화면** — 검증 수준과 해석 범위를 숨기지 않고 표기했습니다.
- **첫 방문 연결 안정화** — 절전 복구 동안 로딩 상태를 안내하고 무료 조회만 제한적으로 재시도합니다.

**아쉬운 점 (Problem)**
- 분석 기간이 2주라 추세보다는 변화 방향만 말할 수 있습니다.
- 데이터가 수동 스냅샷이라 갱신하려면 JSON을 다시 만들어 배포해야 합니다.
- IP 기반 한도는 공용 네트워크에서 여러 사용자가 나눠 쓰게 됩니다.
- 영상 유형·소속 분류는 후보 단계라 사람이 다시 확인해야 합니다.

**다음 단계 (Try)**
1. **자동 수집 파이프라인** — 주 단위 데이터 갱신과 분석 기간 확장
2. **사용자 인증** — 계정 단위 사용량 관리와 리포트 저장
3. **전략 실험 추적** — 제안한 실험의 실제 결과를 기록 · 비교
4. **접근성 점검** — 차트 대체 텍스트, 키보드 탐색 보완
5. **공개 권한 정리** — 데이터 · 포스터 · 폰트 사용 범위 확정

---

## 📊 슬라이드 펼쳐보기

프로젝트 전체 내용을 16:9 슬라이드 19장으로 정리했습니다. 원본은 [`docs/readme/README.html`](./docs/readme/README.html)이며, 아래 이미지는 같은 슬라이드를 1600×900으로 내보낸 것입니다.

<details open>
<summary><b>📂 슬라이드 펼쳐보기 (총 19장)</b></summary>
<br />

<p align="center">
  <img src="./docs/readme/slides/01.png" alt="Slide 01 · 표지" width="95%" /><br /><sub>01 · 표지</sub><br /><br />
  <img src="./docs/readme/slides/02.png" alt="Slide 02 · 목차와 프로젝트 개요" width="95%" /><br /><sub>02 · 목차와 프로젝트 개요</sub><br /><br />
  <img src="./docs/readme/slides/03.png" alt="Slide 03 · 기획 배경" width="95%" /><br /><sub>03 · 기획 배경</sub><br /><br />
  <img src="./docs/readme/slides/04.png" alt="Slide 04 · 기술 스택과 배포 구조" width="95%" /><br /><sub>04 · 기술 스택과 배포 구조</sub><br /><br />
  <img src="./docs/readme/slides/05.png" alt="Slide 05 · 홈 · 주간 검색 변화" width="95%" /><br /><sub>05 · 홈 · 주간 검색 변화</sub><br /><br />
  <img src="./docs/readme/slides/06.png" alt="Slide 06 · 데이터 설명 팝업" width="95%" /><br /><sub>06 · 데이터 설명 팝업</sub><br /><br />
  <img src="./docs/readme/slides/07.png" alt="Slide 07 · 주목 프로그램 · 검색 관심 순위" width="95%" /><br /><sub>07 · 주목 프로그램 · 검색 관심 순위</sub><br /><br />
  <img src="./docs/readme/slides/08.png" alt="Slide 08 · 화제성 분석 대시보드" width="95%" /><br /><sub>08 · 화제성 분석 대시보드</sub><br /><br />
  <img src="./docs/readme/slides/09.png" alt="Slide 09 · 프로그램 목록" width="95%" /><br /><sub>09 · 프로그램 목록</sub><br /><br />
  <img src="./docs/readme/slides/10.png" alt="Slide 10 · 프로그램 상세 리포트" width="95%" /><br /><sub>10 · 프로그램 상세 리포트</sub><br /><br />
  <img src="./docs/readme/slides/11.png" alt="Slide 11 · AI 전략 리포트 생성" width="95%" /><br /><sub>11 · AI 전략 리포트 생성</sub><br /><br />
  <img src="./docs/readme/slides/12.png" alt="Slide 12 · 전략 기회와 콘텐츠 실험" width="95%" /><br /><sub>12 · 전략 기회와 콘텐츠 실험</sub><br /><br />
  <img src="./docs/readme/slides/13.png" alt="Slide 13 · AI 생성 파이프라인" width="95%" /><br /><sub>13 · AI 생성 파이프라인</sub><br /><br />
  <img src="./docs/readme/slides/14.png" alt="Slide 14 · 데이터 해석 원칙" width="95%" /><br /><sub>14 · 데이터 해석 원칙</sub><br /><br />
  <img src="./docs/readme/slides/15.png" alt="Slide 15 · 기술적 의사결정" width="95%" /><br /><sub>15 · 기술적 의사결정</sub><br /><br />
  <img src="./docs/readme/slides/16.png" alt="Slide 16 · 프로젝트 구조와 데이터 모델" width="95%" /><br /><sub>16 · 프로젝트 구조와 데이터 모델</sub><br /><br />
  <img src="./docs/readme/slides/17.png" alt="Slide 17 · 실행 방법" width="95%" /><br /><sub>17 · 실행 방법</sub><br /><br />
  <img src="./docs/readme/slides/18.png" alt="Slide 18 · 검증 결과" width="95%" /><br /><sub>18 · 검증 결과</sub><br /><br />
  <img src="./docs/readme/slides/19.png" alt="Slide 19 · 회고와 향후 계획" width="95%" /><br /><sub>19 · 회고와 향후 계획</sub><br /><br />
</p>

</details>

---

<sub>MEDIA STRATEGY OS · su4228-prog · 분석 기간 2026.09.28 – 10.11</sub>
