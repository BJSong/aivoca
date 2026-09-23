-- ==========================================================
-- AI Smart Vocab Flexible Database Schema (Supabase / PostgreSQL)
-- 다양한 출판사 및 교재 양식(발음기호, 연어, 어원, 다중예문 등) 완벽 대응
-- ==========================================================

-- 1. 프로필 및 게이미피케이션 정보
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    current_streak INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    avatar_id VARCHAR(50) DEFAULT 'runner_default',
    last_study_date DATE,
    extra_metadata JSONB DEFAULT '{}'
);

-- 2. 단어장 세트 (출판사, 교재명, 대상 학년 및 교재 특성 메타데이터 지원)
CREATE TABLE IF NOT EXISTS vocab_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- 예: "WEEK 01 | TEDTALKS WORDS"
    publisher VARCHAR(100),       -- 출판사 (예: "EBS", "능률", "TED", "천재교육" 등)
    book_name VARCHAR(100),       -- 교재명 (예: "초등 영단어 800", "TED Ed Series")
    target_grade VARCHAR(50),     -- 대상 수준 (예: "초등 4학년", "초등 5-6학년", "중등 입문")
    original_image_url TEXT,
    extra_metadata JSONB DEFAULT '{}', -- 챕터, 유닛, 페이지 번호 등 교재별 유연한 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 개별 단어 정보 (다양한 교재의 구성 요소 포용)
CREATE TABLE IF NOT EXISTS vocab_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES vocab_decks(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    part_of_speech VARCHAR(30), -- noun, adj, verb 등
    phonetic_symbol VARCHAR(100), -- 발음기호 (예: "/ˈmɑː.njə.mənt/")
    korean_definition TEXT NOT NULL, -- 초등 눈높이 한글 뜻
    english_definition TEXT,        -- 영영 풀이 (선택)
    synonyms TEXT[] DEFAULT '{}',   -- 유의어
    antonyms TEXT[] DEFAULT '{}',   -- 반의어
    collocations TEXT[] DEFAULT '{}', -- 연어 / 함께 자주 쓰이는 표현 (예: ["build a monument", "stand as a monument"])
    inflections JSONB DEFAULT '{}',  -- 어형 변화 (예: {"past": "inspired", "plural": "monuments", "adj": "monumental"})
    examples JSONB DEFAULT '[]',     -- 다중 예문 배열 [{"sentence": "...", "translation": "..."}]
    example_sentence TEXT,          -- 기본 대표 예문
    ted_context TEXT,               -- 교재 또는 스토리 문맥
    order_index INT DEFAULT 0,
    extra_metadata JSONB DEFAULT '{}' -- 어원(etymology), 난이도 레벨(CEFR), 문법 팁 등 교재별 특수 필드
);

-- 4. 사용자별 SRS 학습 진행 상태 (SM-2 알고리즘 파라미터)
CREATE TABLE IF NOT EXISTS user_word_progress (
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

-- PostgreSQL GIN 인덱스 생성 (JSONB 필드 고속 검색 및 필터링 지원)
CREATE INDEX IF NOT EXISTS idx_vocab_decks_extra_metadata ON vocab_decks USING gin (extra_metadata);
CREATE INDEX IF NOT EXISTS idx_vocab_items_extra_metadata ON vocab_items USING gin (extra_metadata);
CREATE INDEX IF NOT EXISTS idx_vocab_items_examples ON vocab_items USING gin (examples);

-- RLS (Row Level Security) 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (자신의 데이터만 읽고 쓰기)
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own decks" ON vocab_decks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own vocab items" ON vocab_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vocab_decks 
            WHERE vocab_decks.id = vocab_items.deck_id 
            AND vocab_decks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own progress" ON user_word_progress
    FOR ALL USING (auth.uid() = user_id);
