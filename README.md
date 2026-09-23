# AI Smart Vocab (초등 4~6학년 맞춤형 영단어 웹앱)

> **교재 사진 한 장으로 완성하는 나만의 AI 단어장 & 인지과학 스마트 암기 훈련**

`ai.md` 명세서를 완벽히 충족하여 제작된 **AI Smart Vocab**은 교재 사진 촬영 한 번으로 주차별 단어장을 자동 생성하고, 초등 4~6학년(만 10~12세)의 인지·발달 특성에 맞춘 게이미피케이션 인터랙션과 인지과학 기법(간격 반복, 능동적 인출, 힌트 페이딩)을 통해 학생들이 스스로 끝까지 완주할 수 있도록 돕는 웹 애플리케이션입니다.

---

## 🌟 주요 핵심 기능

### 1. 📸 교재 사진 자동 분석 (Google Gemini 1.5 Flash Vision AI)
* **모바일 후면 카메라 기본 연동** (`capture="environment"`).
* **HTML Canvas 기반 1600px 클라이언트 리사이징**으로 Vercel 페이로드 한도(4.5MB) 완벽 대응.
* 학생 필기·낙서·체크표시 자동 무시 및 인쇄 단어, 품사, 영어 뜻, **초등 맞춤 친근한 한글 뜻**, 유의어, 반의어, TED 문맥 예문 자동 추출.
* 책 읽는 귀여운 AI 로봇 애니메이션으로 대기 지루함 해소 및 파싱 후 자유로운 단어 편집/추가/삭제 기능.

### 2. 🧠 인지과학 암기 기법 구현
* **SM-2 간격 반복 시스템 (SRS)**:
  * 망각곡선 주기(1일 -> 3일 -> 6일 -> 난이도 가중치 반영)에 따른 일일 복습 퀘스트 자동 큐잉.
* **3단계 점진적 힌트 페이딩 (Active Recall & Fading)**:
  * **1단계 (눈과 귀로 익히기)**: 전체 스펠링 가이드 + 원어민 발음 2회 자동 재생 + 따라쓰기.
  * **2단계 (글자 힌트 보고 맞히기)**: 앞뒤 글자만 노출 (`m _ _ _ _ _ n t`), 한글 뜻과 예문을 보고 빈칸 완성.
  * **3단계 (완전 블라인드 도전)**: 스펠링 100% 가리고 한글/영영 뜻만 보고 순수 인출 타이핑.
* **정교화 부호화 (Elaborative Encoding) 미니게임**:
  * **유의어/반의어 짝맞추기 카드 게임**: 터치로 카드를 연결하는 시각적 매칭 게임.
  * **TED 스토리 문맥 빈칸 퀴즈**: 실제 교재 문맥 속에서 단어의 쓰임새 정복.

### 3. 🎮 초등 고학년 맞춤 UI/UX & 게이미피케이션
* **하이브리드 입력기**: 긴 영단어 타자가 서툰 학생을 위한 **알파벳 블록 터치 스크램블러** + 데스크톱 물리 키보드 동시 지원.
* **청각적 피드백**: Web Audio API 기반 무지연 사운드 효과음 (정답 챠링, 오답 부드러운 우당탕, 레벨업 팡파르).
* **발음 탐험**: Web Speech API 기반 일반(1.0x 토끼 🐰) 및 느린(0.8x 달팽이 🐌) 발음 속도 토글.
* **게이미피케이션**: 달리기 캐릭터 러너 진행률 바(🏃‍♂️💨), 연속 출석 불꽃 스트릭(🔥), 누적 XP 및 레벨업 시스템, 축하 폭죽(Canvas-Confetti).

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 사용 기술 |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router, TypeScript) |
| **Styling & UI** | Tailwind CSS + Framer Motion + Canvas-Confetti |
| **Icons** | Lucide React |
| **Database** | Supabase (PostgreSQL / RLS) + Dual-mode LocalStorage Fallback |
| **AI Vision** | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| **Audio / TTS** | Web Audio API (합성 효과음) + Web Speech API (영어 발음) |
| **Hosting Target** | Vercel (`*.vercel.app`) |

---

## 🚀 빠른 시작 가이드 (Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (`.env.local`)
`.env.example`을 참고하여 프로젝트 루트에 `.env.local` 파일을 생성할 수 있습니다.
```env
# Google Gemini 1.5 Flash API Key (교재 이미지 Vision 분석용)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (선택 사항: 미설정 시 로컬스토리지 듀얼 모드로 즉시 동작)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **💡 데모 모드 지원**: `GEMINI_API_KEY`나 Supabase 키가 없어도, 앱은 내장된 "WEEK 01 | TEDTALKS WORDS" 샘플 단어장과 Mock OCR 엔진을 통해 모든 기능(학습, 퀴즈, 미니게임, 통계)을 즉시 체험할 수 있습니다.

### 3. 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 4. 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```

---

## 📂 프로젝트 구조

```
aivoca/
├── supabase/
│   └── schema.sql                  # Supabase PostgreSQL DDL (RLS 정책 포함)
├── src/
│   ├── app/
│   │   ├── api/ocr/parse-deck/     # Gemini 1.5 Flash 교재 파싱 API Route
│   │   ├── decks/
│   │   │   ├── new/                # 교재 사진 촬영/업로드 & AI 파싱 화면
│   │   │   └── [id]/               # 단어장 상세 및 단어 목록 화면
│   │   ├── study/
│   │   │   └── [id]/               # 3단계 능동적 인출 훈련 룸
│   │   ├── review/                 # SM-2 망각곡선 일일 복습 퀘스트 룸
│   │   ├── layout.tsx              # 전역 레이아웃 및 뷰포트 설정
│   │   ├── page.tsx                # 홈 대시보드 (스트릭, 퀘스트, 단어장 목록)
│   │   └── globals.css             # 터치 친화적 UI, 키프레임 애니메이션
│   ├── components/
│   │   ├── common/
│   │   │   ├── Confetti.tsx        # Canvas-Confetti 축하 이펙트
│   │   │   └── ProgressBar.tsx     # 러너 캐릭터 게이미피케이션 게이지
│   │   ├── layout/
│   │   │   └── Navbar.tsx          # 캐릭터/스트릭/XP 헤더
│   │   └── study/
│   │   │   ├── MatchingGame.tsx    # 유의어/반의어 짝맞추기 카드 게임
│   │   │   ├── ScrambleKeyboard.tsx# 터치 알파벳 블록 & 키보드 하이브리드 입력기
│   │   │   ├── SoundExplorer.tsx   # 토끼(1.0x)/달팽이(0.8x) 발음 컨트롤러
│   │   │   ├── StoryBlankGame.tsx  # TED 문맥 빈칸 완성 퀴즈
│   │   │   └── ThreeStepRecall.tsx # 3단계 점진적 힌트 페이딩 카드
│   ├── lib/
│   │   ├── audio.ts                # Web Audio 효과음 & Web Speech TTS 엔진
│   │   ├── srs.ts                  # SM-2 망각곡선 간격 반복 알고리즘
│   │   └── storage.ts              # Supabase & LocalStorage 듀얼 데이터 레이어
│   └── types/
│       └── vocab.ts                # 단어장, SRS, 게이미피케이션 타입 정의
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── ai.md                           # 원본 개발 명세서
```
