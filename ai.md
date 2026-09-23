# AI 기반 스마트 영단어 암기 웹 애플리케이션 개발 명세서 (PRD & System Spec)

## 1. 프로젝트 개요
* **서비스명**: AI Smart Vocab (초등 4~6학년 맞춤형)
* **목표**: 교재 사진 촬영 한 번으로 주차별 단어장을 자동 생성하고, 초등 고학년의 인지·발달 특성에 맞춘 게이미피케이션 인터랙션과 인지과학 기법(간격 반복, 능동적 인출, 힌트 페이딩)을 통해 스스로 끝까지 완주할 수 있는 학습 웹앱 구축.
* **주요 타깃 사용자**: 초등학생 4~6학년 (만 10~12세), 태블릿 및 모바일 기기 사용자
* **배포 타깃**: Vercel (`*.vercel.app`)

---

## 2. 타깃 기술 스택 (Tech Stack)

| 계층 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router, TypeScript) | Vercel 최적화, Server Actions 및 API Routes 활용 |
| **Styling & UI** | Tailwind CSS + Shadcn/ui + Framer Motion + Canvas-Confetti | 쫀득하고 직관적인 애니메이션, 축하 이펙트, 큰 터치 타깃 |
| **Icons** | Lucide React | 시각적 직관성이 높은 아이콘 셋 |
| **State / DB** | Supabase (PostgreSQL) | Auth, Storage(사진 원본), RDBMS(단어, 퀘스트, 연속 출석) |
| **AI Vision** | Google Gemini 1.5 Flash (또는 GPT-4o-mini) | 교재 이미지에서 단어 구조 파싱 (Structured JSON) |
| **TTS (Audio)** | Web Speech API (`window.speechSynthesis`) | 영어 발음 자동 재생 (속도 조절 0.8x~1.0x 지원) |
| **Hosting** | Vercel | GitHub 연동 자동 CI/CD 및 Edge/Serverless 환경 |

---

## 3. 초등 4~6학년 맞춤형 UI/UX 설계 원칙

### 3.1. 시각 및 인터랙션 디자인 (Visual & Interaction)
1. **큰 터치 타깃과 명확한 대비**:
   * 최소 버튼 및 탭 영역 48px 이상 유지 (모바일/태블릿 터치 실수 방지).
   * 텍스트 폰트 크기 기본 18px 이상, 단어 헤드라인 28~36px로 시원하게 배치.
   * 부드러우면서도 활기찬 컬러 팔레트 (따뜻한 인디고, 옐로우/오렌지 포인트).
2. **청각적·시각적 즉각 피드백**:
   * 정답 입력 시 기분 좋은 챠링 사운드(오디오 효과음) + 가벼운 햅틱 진동 + 화면 통통 튀는 애니메이션(Framer Motion spring).
   * 오답 시 부드러운 흔들림(Shake) 효과 및 오타 글자만 빨간색 하이라이트 (좌절감 방지).
   * 세션 완료 시 축하 폭죽(Canvas-Confetti) 팝업.

### 3.2. 입력 방식 최적화 (Typing & Interaction Resilience)
1. **타자 피로도 완화 (온스크린 힌트/스크램블 지원)**:
   * 긴 영단어 타이핑이 서툰 학생을 위해 키보드 입력 외에도 알파벳 블록 클릭(Scramble Letter Blocks) 모드 병행 지원.
2. **느린 발음 듣기 버튼**:
   * 일반 속도(1.0x) 외에 0.8x 느린 속도 듣기(달팽이/토끼 토글 아이콘) 기본 제공.
3. **영한/영영 쉬운 설명 병기**:
   * 초등 수준에 맞게 복잡한 영영 풀이 옆에 직관적인 한글 뜻을 우선 툴팁 또는 배지로 제공.

### 3.3. 동기부여 및 게이미피케이션 (Gamification)
1. **스트릭(연속 학습일수) & 캐릭터 게이지**:
   * 하루 단어 학습 완료 시 불꽃(🔥) 스트릭 카운트 증가.
   * 복습 완료 시 경험치(XP) 및 캐릭터 레벨업 연출.
2. **마이크로 스텝 진행률 (XP Progress Bar)**:
   * "10단어 중 3번째 단어 진행 중!" 대신 게이미피케이션 게이지 바 및 귀여운 러너 아이콘 전진.

---

## 4. 인지과학 암기 기법 구현 명세

### 4.1. 망각곡선 간격 반복 (Spaced Repetition System, SRS)
* **알고리즘**: SM-2 변형 알고리즘
* **학습 카드 파라미터**:
  * `repetition_count`: 연속 정답 횟수
  * `ease_factor`: 단어별 난이도 가중치 (기본값 2.5)
  * `interval_days`: 다음 복습까지 걸리는 일수
  * `next_review_at`: 다음 복습 예정 일시
* **간격 계산 규칙**:
  * 1회 성공: 1일 후 / 2회 성공: 3일 후 / 3회 성공: 6일 후
  * 오답 발생 시: `repetition_count = 0`, `interval_days = 1`로 리셋

### 4.2. 점진적 힌트 페이딩 (Active Recall & Fading)
단어 1개당 3회 연속 타이핑/블록 완성을 수행하되 점진적으로 인출 강도 상승:
1. **1회차 (눈과 귀로 익히기)**: 스펠링 전체 노출 + 원어민 발음 2회 자동 재생 + 따라 타이핑.
2. **2회차 (글자 힌트 보고 맞히기)**: 앞뒤 글자만 노출 (`m _ _ _ _ _ n t`), 뜻과 예문을 보고 빈칸 완성.
3. **3회차 (완전 블라인드 도전)**: 스펠링을 100% 가리고 한글/영영 뜻만 보고 순수 인출 타이핑.

### 4.3. 정교화 부호화 (Elaborative Encoding)
* **유의어/반의어 짝 맞추기 카드 게임**: 터치로 카드를 연결하는 미니 매칭 게임.
* **스토리 빈칸 채우기**: 교재에 나온 TED 예문의 빈칸에 단어 끼워 넣기.

---

## 5. 데이터베이스 스키마 설계 (Supabase / PostgreSQL)

```sql
-- 1. 프로필 및 게이미피케이션 정보
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    current_streak INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    avatar_id VARCHAR(50) DEFAULT 'runner_default',
    last_study_date DATE
);

-- 2. 단어장 세트 (예: Week 01)
CREATE TABLE vocab_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL, -- 예: "Week 01 - TED TALKS"
    original_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 개별 단어 정보
CREATE TABLE vocab_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES vocab_decks(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    part_of_speech VARCHAR(30), -- noun, adj, verb 등
    english_definition TEXT,
    korean_definition TEXT,
    synonyms TEXT[], -- ['memorial']
    antonyms TEXT[], -- ['pessimistic']
    example_sentence TEXT,
    ted_context TEXT,
    order_index INT DEFAULT 0
);

-- 4. 사용자별 SRS 학습 진행 상태
CREATE TABLE user_word_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES vocab_items(id) ON DELETE CASCADE,
    repetition_count INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    is_mastered BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);
```

---

## 6. Vision AI 파싱 파이프라인 (Serverless API)

### 6.1. API 엔드포인트: `/api/ocr/parse-deck`
* **입력**: 이미지 Base64 또는 FormData
* **출력 (초등학생을 위한 한글 뜻 자동 보강 포함)**:

```json
{
  "deck_title": "WEEK 01 | TEDTALKS WORDS",
  "words": [
    {
      "word": "monument",
      "part_of_speech": "noun",
      "english_definition": "a structure or building built to honor a special person or event",
      "korean_definition": "기념비, 기념물",
      "synonyms": ["memorial"],
      "antonyms": [],
      "example_sentence": "The city built a marble monument to remember the soldiers who fought in the war.",
      "ted_context": "A Monument for the Anxious and the Hopeful."
    }
  ]
}
```

### 6.2. 프롬프트 지침 (System Instruction)
```text
You are an expert OCR engine for an elementary school vocabulary learning service.
Examine the textbook page image and extract all printed vocabulary items into JSON.
Strict Rules:
1. Ignore handwritten pencil notes, scribbles, and checkmarks made by the student.
2. Accurately extract: word, part_of_speech, english_definition, synonyms, antonyms, and example sentences.
3. Automatically provide an accurate, friendly 'korean_definition' suitable for 4th-6th grade elementary students.
```

---

## 7. 화면 및 사용자 경험 (UX Flow)

```
[홈 대시보드] ──(오늘의 미션 & 스트릭 확인)
     │
     ├── [사진 찍어 올리기] ──> [재미있는 로딩 애니메이션] ──> [단어 카드 확인] ──> [새 단어 학습 시작]
     │
     └── [오늘의 복습 퀘스트] (SRS 만료 단어)
           ├── 1. 소리 탐험: 발음 듣기 (1.0x / 0.8x)
           ├── 2. 3단 인출 챌린지: 따라쓰기 → 힌트 채우기 → 블라인드 타이핑
           ├── 3. 카드 짝맞추기 미니게임: 유의어/반의어 연결
           └── 4. 미션 클리어: 폭죽 애니메이션 + XP 및 연속 출석 갱신
```

1. **홈 화면 (`/`)**:
   * 캐릭터 아바타, 연속 출석일수(🔥), 오늘 정복할 단어 수가 큰 카드로 노출.
   * 커다란 카메라 버튼: "📸 교재 찰칵 찍고 단어장 만들기".
2. **촬영 및 로딩 화면 (`/decks/new`)**:
   * 모바일 후면 카메라 기본 실행 (`capture="environment"`).
   * 사진 분석 중 AI 로봇 캐릭터가 책을 읽는 Lottie/CSS 애니메이션 노출 (대기 지루함 해소).
3. **단어 훈련 룸 (`/study/[deckId]`)**:
   * 상단에 프로그레스 바(진행 게이지)와 스피커 버튼.
   * 중앙에 큼직한 인풋 창과 가상 알파벳 블록(터치 입력 겸용).
   * 정답 입력 즉시 초록색 펄스와 성공 효과음.

---

## 8. Vercel 배포 및 환경 설정

### 8.1. 환경 변수 (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 8.2. 배포 최적화
* Next.js Route Segment Config: OCR API 라우트에 `export const maxDuration = 30;` 설정.
* 클라이언트 단에서 이미지 업로드 전 HTML Canvas 기반 가로 1600px 리사이징 (Vercel 4.5MB Payload 초과 방지).