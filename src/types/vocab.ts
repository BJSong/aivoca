export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "idiom"
  | string;

export interface VocabExample {
  sentence: string;
  translation?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  current_streak: number;
  total_xp: number;
  avatar_id: string;
  last_study_date: string | null;
  daily_review_limit?: number; // 하루 최대 복습 목표량 (기본 10)
  extra_metadata?: Record<string, unknown>;
}

export interface VocabDeck {
  id: string;
  user_id?: string;
  title: string;
  publisher?: string; // e.g. "EBS", "능률", "천재교육", "TED"
  book_name?: string; // e.g. "초등 필수 영단어 800"
  target_grade?: string; // e.g. "초등 4학년", "초등 5-6학년"
  original_image_url?: string;
  created_at: string;
  items_count?: number;
  mastered_count?: number;
  extra_metadata?: Record<string, unknown>; // chapter, unit, page, theme etc.
}

export interface VocabItem {
  id: string;
  deck_id: string;
  word: string;
  part_of_speech: PartOfSpeech;
  phonetic_symbol?: string; // 발음기호 e.g. "/ˈmɑː.njə.mənt/"
  korean_definition: string;
  english_definition?: string;
  synonyms: string[];
  antonyms: string[];
  collocations?: string[]; // 연어 표현 e.g. ["build a monument", "historical monument"]
  inflections?: Record<string, string>; // e.g. { plural: "monuments", adj: "monumental" }
  examples?: VocabExample[]; // 다중 예문 지원
  example_sentence: string;
  ted_context?: string; // 교재 문맥 또는 메모
  order_index: number;
  extra_metadata?: Record<string, unknown>; // 어원(etymology), CEFR 레벨, 문법 팁 등 교재별 특수 데이터
}

export interface UserWordProgress {
  id: string;
  user_id: string;
  item_id: string;
  repetition_count: number;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at?: string;
  is_mastered: boolean;
}

export interface DeckWithItems extends VocabDeck {
  items: VocabItem[];
}

export interface WordWithProgress extends VocabItem {
  progress?: UserWordProgress;
}

export interface OCRParseResult {
  deck_title: string;
  publisher?: string;
  book_name?: string;
  target_grade?: string;
  extra_metadata?: Record<string, unknown>;
  words: {
    word: string;
    part_of_speech: string;
    phonetic_symbol?: string;
    english_definition?: string;
    korean_definition: string;
    synonyms?: string[];
    antonyms?: string[];
    collocations?: string[];
    examples?: VocabExample[];
    example_sentence?: string;
    ted_context?: string;
    extra_metadata?: Record<string, unknown>;
  }[];
}
