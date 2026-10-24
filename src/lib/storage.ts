import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  DeckWithItems,
  UserProfile,
  UserWordProgress,
  VocabDeck,
  VocabItem,
  WordWithProgress,
} from "../types/vocab";
import { calculateNextSRS, isWordDueForReview } from "./srs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Initial sample deck demonstrating flexible textbook fields (phonetic symbols, collocations, extra metadata)
export const SAMPLE_TED_DECK: DeckWithItems = {
  id: "deck-sample-week-01",
  title: "WEEK 01 | TEDTALKS WORDS",
  publisher: "TED-Ed Series",
  book_name: "Global Explorers Vocab",
  target_grade: "초등 5~6학년",
  created_at: new Date().toISOString(),
  items_count: 5,
  mastered_count: 0,
  extra_metadata: {
    unit: "Unit 01",
    theme: "Architecture & Human Expression",
    curriculum: "인지과학 심화 과정",
  },
  items: [
    {
      id: "word-1-monument",
      deck_id: "deck-sample-week-01",
      word: "monument",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈmɑː.njə.mənt/",
      english_definition:
        "a structure or building built to honor a special person or event",
      korean_definition: "기념비, 기념물",
      synonyms: ["memorial", "shrine"],
      antonyms: [],
      collocations: ["historic monument", "build a monument", "stand as a monument"],
      example_sentence:
        "The city built a marble monument to remember the soldiers who fought in the war.",
      ted_context: "A Monument for the Anxious and the Hopeful.",
      order_index: 0,
      extra_metadata: {
        etymology: "라틴어 monere(기억하게 하다, 경고하다)에서 유래",
        cefr_level: "B1",
      },
    },
    {
      id: "word-2-anxious",
      deck_id: "deck-sample-week-01",
      word: "anxious",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈæŋk.ʃəs/",
      english_definition:
        "feeling worried, nervous, or afraid about something uncertain",
      korean_definition: "불안한, 걱정스러운",
      synonyms: ["worried", "nervous"],
      antonyms: ["calm", "confident"],
      collocations: ["feel anxious about", "anxious moments", "deeply anxious"],
      example_sentence:
        "He felt anxious before stepping on stage to give his first big speech.",
      ted_context: "Sharing our anxious thoughts helps us realize we are not alone.",
      order_index: 1,
      extra_metadata: {
        grammar_tip: "전치사 about이나 for와 함께 자주 쓰여요.",
        cefr_level: "A2",
      },
    },
    {
      id: "word-3-collaborate",
      deck_id: "deck-sample-week-01",
      word: "collaborate",
      part_of_speech: "verb",
      phonetic_symbol: "/kəˈlæb.ə.reɪt/",
      english_definition:
        "to work together with others to create or achieve something",
      korean_definition: "협력하다, 함께 일하다",
      synonyms: ["cooperate", "partner"],
      antonyms: ["compete", "oppose"],
      collocations: ["collaborate on a project", "collaborate with peers"],
      example_sentence:
        "Students collaborate on a science project to build a clean energy model.",
      ted_context: "Artists collaborate across continents to create inspiring murals.",
      order_index: 2,
      extra_metadata: {
        root: "col-(함께) + labor(일하다)",
        cefr_level: "B1",
      },
    },
    {
      id: "word-4-innovative",
      deck_id: "deck-sample-week-01",
      word: "innovative",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈɪn.ə.veɪ.tɪv/",
      english_definition:
        "using new, creative methods or ideas that are very effective",
      korean_definition: "혁신적인, 창의적인",
      synonyms: ["creative", "inventive"],
      antonyms: ["traditional", "outdated"],
      collocations: ["innovative ideas", "innovative technology"],
      example_sentence:
        "The young inventor came up with an innovative way to collect ocean plastic.",
      ted_context: "An innovative design opens up completely new ways to communicate.",
      order_index: 3,
      extra_metadata: {
        root: "in-(안에) + nov-(새로운: novel)",
        cefr_level: "B2",
      },
    },
    {
      id: "word-5-inspire",
      deck_id: "deck-sample-week-01",
      word: "inspire",
      part_of_speech: "verb",
      phonetic_symbol: "/ɪnˈspaɪər/",
      english_definition:
        "to make someone feel excited and eager to do something good or creative",
      korean_definition: "영감을 주다, 고무시키다",
      synonyms: ["motivate", "encourage"],
      antonyms: ["discourage", "dissuade"],
      collocations: ["inspire confidence", "inspire future generations"],
      example_sentence:
        "Her brave journey continues to inspire thousands of young students.",
      ted_context: "The speaker's message inspired global communities to act.",
      order_index: 4,
      extra_metadata: {
        root: "in-(안에) + spire(숨을 불어넣다)",
        cefr_level: "B1",
      },
    },
  ],
};

// 8주차 교재 단어장: TEDTALKS (pp. 64-65) & NOVEL (pp. 66-67) & SPEECH (p. 68) 통합 (총 20단어)

import {
  WEEK1_TEXTBOOK_DECK,
  WEEK2_TEXTBOOK_DECK,
  WEEK3_TEXTBOOK_DECK,
  WEEK4_TEXTBOOK_DECK,
  WEEK5_TEXTBOOK_DECK,
  WEEK6_TEXTBOOK_DECK,
  WEEK7_TEXTBOOK_DECK,
  WEEK8_TEXTBOOK_DECK,
  WEEK9_TEXTBOOK_DECK,
  WEEK10_TEXTBOOK_DECK,
  ALL_TEXTBOOK_DECKS,
  getCombinedWeeksDeck,
} from "./textbook-decks";

export {
  WEEK1_TEXTBOOK_DECK,
  WEEK2_TEXTBOOK_DECK,
  WEEK3_TEXTBOOK_DECK,
  WEEK4_TEXTBOOK_DECK,
  WEEK5_TEXTBOOK_DECK,
  WEEK6_TEXTBOOK_DECK,
  WEEK7_TEXTBOOK_DECK,
  WEEK8_TEXTBOOK_DECK,
  WEEK9_TEXTBOOK_DECK,
  WEEK10_TEXTBOOK_DECK,
  ALL_TEXTBOOK_DECKS,
  getCombinedWeeksDeck,
};

// 하위 호환성용 별칭
export const TEXTBOOK_TED_DECK: DeckWithItems = {
  ...WEEK9_TEXTBOOK_DECK,
  id: "deck-tedtalks-p74-75",
  title: "TEDTALKS WORDS (pp. 74-75)",
  items_count: 8,
  items: WEEK9_TEXTBOOK_DECK.items.slice(0, 8),
};

export const TEXTBOOK_NOVEL_DECK: DeckWithItems = {
  ...WEEK9_TEXTBOOK_DECK,
  id: "deck-novel-p76-77",
  title: "NOVEL WORDS (pp. 76-77)",
  items_count: 8,
  items: WEEK9_TEXTBOOK_DECK.items.slice(8, 16),
};

export const INITIAL_DEFAULT_DECKS: DeckWithItems[] = [
  WEEK1_TEXTBOOK_DECK,
  WEEK2_TEXTBOOK_DECK,
  WEEK3_TEXTBOOK_DECK,
  WEEK4_TEXTBOOK_DECK,
  WEEK5_TEXTBOOK_DECK,
  WEEK6_TEXTBOOK_DECK,
  WEEK7_TEXTBOOK_DECK,
  WEEK8_TEXTBOOK_DECK,
  WEEK9_TEXTBOOK_DECK,
  WEEK10_TEXTBOOK_DECK,
  SAMPLE_TED_DECK,
];

const STORAGE_KEYS = {
  PROFILE: "ai_smart_vocab_profile",
  DECKS: "ai_smart_vocab_decks",
  PROGRESS: "ai_smart_vocab_progress",
};

export const DEFAULT_PROFILE: UserProfile = {
  id: "user-default",
  nickname: "스마트 러너",
  current_streak: 3,
  total_xp: 320,
  avatar_id: "runner_default",
  last_study_date: new Date().toISOString().split("T")[0],
  daily_review_limit: 10,
};

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

export function getLocalProfile(): UserProfile {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_PROFILE };
  try {
    const raw = storage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return { ...DEFAULT_PROFILE };
    }
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save profile:", err);
  }
}

export function addXP(amount: number): UserProfile {
  const profile = getLocalProfile();
  profile.total_xp += amount;
  saveLocalProfile(profile);
  return profile;
}

export function recordStudyActivity(): UserProfile {
  const profile = getLocalProfile();
  const today = new Date().toISOString().split("T")[0];

  if (profile.last_study_date !== today) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (profile.last_study_date === yesterday) {
      profile.current_streak += 1;
    } else if (!profile.last_study_date) {
      profile.current_streak = 1;
    } else {
      profile.current_streak = 1;
    }
    profile.last_study_date = today;
    saveLocalProfile(profile);
  }
  return profile;
}

export function getLocalDecks(): DeckWithItems[] {
  const storage = getStorage();
  if (!storage) return INITIAL_DEFAULT_DECKS;
  try {
    const raw = storage.getItem(STORAGE_KEYS.DECKS);
    if (!raw) {
      storage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(INITIAL_DEFAULT_DECKS));
      return INITIAL_DEFAULT_DECKS;
    }
    let decks: DeckWithItems[] = JSON.parse(raw);
    let changed = false;

    // 이전 분리된 임시 단어장(deck-tedtalks-p74-75, deck-novel-p76-77)을 9주차 통합 단어장으로 자동 정리
    const oldSplitIds = ["deck-tedtalks-p74-75", "deck-novel-p76-77"];
    if (decks.some((d) => oldSplitIds.includes(d.id))) {
      decks = decks.filter((d) => !oldSplitIds.includes(d.id));
      changed = true;
    }

    // 기본 교재 단어장 최신 데이터 동기화 (기존 8주차에 중복된 monument/anxious 제거 및 9주차 20단어 반영)
    const textbookMap = new Map(ALL_TEXTBOOK_DECKS.map((d) => [d.id, d]));
    decks = decks.map((deck) => {
      if (textbookMap.has(deck.id)) {
        const canonical = textbookMap.get(deck.id)!;
        if (
          deck.items.length !== canonical.items.length ||
          (deck.id === "deck-week8" && deck.items.some((i) => i.word === "monument"))
        ) {
          changed = true;
          return {
            ...canonical,
            mastered_count: deck.mastered_count ?? 0,
          };
        }
      }
      return deck;
    });

    // 누락된 기본 교재 단어장 추가
    INITIAL_DEFAULT_DECKS.forEach((initDeck) => {
      if (!decks.some((d) => d.id === initDeck.id)) {
        decks.push(initDeck);
        changed = true;
      }
    });

    // 주차별 정렬 (1주차, 2주차, ..., 10주차 우선, 그 외 단어장은 뒤로)
    decks.sort((a, b) => {
      const aMatch = a.id.match(/^deck-week(\d+)$/);
      const bMatch = b.id.match(/^deck-week(\d+)$/);
      if (aMatch && bMatch) {
        return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
      }
      if (aMatch) return -1;
      if (bMatch) return 1;
      return 0;
    });

    if (changed) {
      storage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    }
    return decks.length > 0 ? decks : INITIAL_DEFAULT_DECKS;
  } catch {
    return INITIAL_DEFAULT_DECKS;
  }
}

export function saveLocalDecks(decks: DeckWithItems[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("aivoca_decks_updated"));
    }
  } catch (err) {
    console.error("Failed to save decks:", err);
  }
}

export function getLocalDeckById(id: string): DeckWithItems | null {
  if (id === "deck-combined-all" || id.startsWith("deck-combined")) {
    const match = id.match(/deck-combined-weeks-([0-9-]+)/);
    const weekNumbers = match
      ? match[1].split("-").map(Number).filter(Boolean)
      : undefined;
    return getCombinedWeeksDeck({ weekNumbers, shuffle: true });
  }
  const decks = getLocalDecks();
  return decks.find((d) => d.id === id) || null;
}

export function createLocalDeck(
  title: string,
  words: Omit<VocabItem, "id" | "deck_id" | "order_index">[],
  options?: {
    originalImageUrl?: string;
    publisher?: string;
    book_name?: string;
    target_grade?: string;
    extra_metadata?: Record<string, unknown>;
  }
): DeckWithItems {
  const decks = getLocalDecks();
  const deckId = `deck-${Date.now()}`;
  const items: VocabItem[] = words.map((w, idx) => ({
    ...w,
    id: `item-${Date.now()}-${idx}`,
    deck_id: deckId,
    order_index: idx,
    synonyms: w.synonyms || [],
    antonyms: w.antonyms || [],
    collocations: w.collocations || [],
    example_sentence: w.example_sentence || "",
  }));

  const newDeck: DeckWithItems = {
    id: deckId,
    title,
    publisher: options?.publisher,
    book_name: options?.book_name,
    target_grade: options?.target_grade,
    original_image_url: options?.originalImageUrl,
    extra_metadata: options?.extra_metadata,
    created_at: new Date().toISOString(),
    items_count: items.length,
    mastered_count: 0,
    items,
  };

  decks.unshift(newDeck);
  saveLocalDecks(decks);
  return newDeck;
}

/**
 * 기존 단어장의 정보(제목, 출판사, 교재명, 학년 등) 또는 단어 목록 전체 업데이트
 */
export function updateLocalDeck(
  deckId: string,
  updates: Partial<DeckWithItems>
): DeckWithItems | null {
  const decks = getLocalDecks();
  const index = decks.findIndex((d) => d.id === deckId);
  if (index === -1) return null;

  const current = decks[index];
  const items = updates.items || current.items;

  const updatedDeck: DeckWithItems = {
    ...current,
    ...updates,
    items,
    items_count: items.length,
  };

  decks[index] = updatedDeck;
  saveLocalDecks(decks);
  return updatedDeck;
}

/**
 * 기존 단어장에 여러 단어를 일괄 추가 (JSON 임포트 또는 복수 단어 추가)
 */
export function addWordsToLocalDeck(
  deckId: string,
  newWords: Omit<VocabItem, "id" | "deck_id" | "order_index">[],
  skipDuplicates: boolean = true
): { deck: DeckWithItems; addedCount: number; updatedCount: number } | null {
  const decks = getLocalDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return null;

  let addedCount = 0;
  let updatedCount = 0;
  const existingWordMap = new Map<string, VocabItem>();
  deck.items.forEach((item) => {
    existingWordMap.set(item.word.toLowerCase().trim(), item);
  });

  const nextItems = [...deck.items];

  newWords.forEach((nw) => {
    const key = nw.word.toLowerCase().trim();
    if (!key) return;

    if (existingWordMap.has(key)) {
      if (!skipDuplicates) {
        // 기존 단어의 뜻이나 예문 보강
        const existing = existingWordMap.get(key)!;
        existing.korean_definition = nw.korean_definition || existing.korean_definition;
        existing.part_of_speech = nw.part_of_speech || existing.part_of_speech;
        if (nw.phonetic_symbol) existing.phonetic_symbol = nw.phonetic_symbol;
        if (nw.example_sentence) existing.example_sentence = nw.example_sentence;
        if (nw.synonyms && nw.synonyms.length > 0) existing.synonyms = nw.synonyms;
        if (nw.antonyms && nw.antonyms.length > 0) existing.antonyms = nw.antonyms;
        if (nw.collocations && nw.collocations.length > 0) existing.collocations = nw.collocations;
        updatedCount++;
      }
    } else {
      const newItem: VocabItem = {
        ...nw,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        deck_id: deckId,
        order_index: nextItems.length,
        synonyms: nw.synonyms || [],
        antonyms: nw.antonyms || [],
        collocations: nw.collocations || [],
        example_sentence: nw.example_sentence || "",
      };
      nextItems.push(newItem);
      existingWordMap.set(key, newItem);
      addedCount++;
    }
  });

  deck.items = nextItems;
  deck.items_count = nextItems.length;

  saveLocalDecks(decks);
  return { deck, addedCount, updatedCount };
}

/**
 * 특정 단어 수정
 */
export function updateWordInLocalDeck(
  deckId: string,
  wordId: string,
  updates: Partial<VocabItem>
): DeckWithItems | null {
  const decks = getLocalDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return null;

  const wordIndex = deck.items.findIndex((w) => w.id === wordId);
  if (wordIndex === -1) return null;

  deck.items[wordIndex] = {
    ...deck.items[wordIndex],
    ...updates,
  };

  saveLocalDecks(decks);
  return deck;
}

/**
 * 특정 단어 삭제
 */
export function deleteWordFromLocalDeck(
  deckId: string,
  wordId: string
): DeckWithItems | null {
  const decks = getLocalDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return null;

  deck.items = deck.items.filter((w) => w.id !== wordId);
  deck.items_count = deck.items.length;

  saveLocalDecks(decks);
  return deck;
}

export function deleteLocalDeck(deckId: string): void {
  const decks = getLocalDecks();
  const updated = decks.filter((d) => d.id !== deckId);
  saveLocalDecks(updated);
}

export function getLocalProgressMap(): Record<string, UserWordProgress> {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalProgressMap(map: Record<string, UserWordProgress>): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(map));
  } catch (err) {
    console.error("Failed to save progress:", err);
  }
}

export function updateLocalWordProgress(
  itemId: string,
  isCorrect: boolean,
  quality: number = 4
): UserWordProgress {
  const progressMap = getLocalProgressMap();
  const prev = progressMap[itemId];
  const next = calculateNextSRS(prev, isCorrect, quality);

  const updated: UserWordProgress = {
    id: prev?.id || `prog-${Date.now()}-${itemId}`,
    user_id: prev?.user_id || "user-default",
    item_id: itemId,
    ...next,
  };

  progressMap[itemId] = updated;
  saveLocalProgressMap(progressMap);

  const decks = getLocalDecks();
  let changed = false;
  decks.forEach((deck) => {
    const hasWord = deck.items.some((i) => i.id === itemId);
    if (hasWord) {
      deck.mastered_count = deck.items.filter(
        (i) => progressMap[i.id]?.is_mastered
      ).length;
      deck.items_count = deck.items.length;
      changed = true;
    }
  });
  if (changed) {
    saveLocalDecks(decks);
  }

  return updated;
}

export function getDeckWordsWithProgress(deckId: string): WordWithProgress[] {
  const deck = getLocalDeckById(deckId);
  if (!deck) return [];
  const progressMap = getLocalProgressMap();
  return deck.items.map((item) => ({
    ...item,
    progress: progressMap[item.id],
  }));
}

export function getDailyReviewLimit(): number {
  const profile = getLocalProfile();
  return profile.daily_review_limit || 10;
}

export function setDailyReviewLimit(limit: number): UserProfile {
  const profile = getLocalProfile();
  profile.daily_review_limit = limit;
  saveLocalProfile(profile);
  return profile;
}

export function getAllDueReviewWords(customLimit?: number): WordWithProgress[] {
  const decks = getLocalDecks();
  const progressMap = getLocalProgressMap();
  const dueWords: WordWithProgress[] = [];

  decks.forEach((deck) => {
    deck.items.forEach((item) => {
      const prog = progressMap[item.id];
      if (isWordDueForReview(prog)) {
        dueWords.push({
          ...item,
          progress: prog,
        });
      }
    });
  });

  const effectiveLimit = customLimit ?? getDailyReviewLimit();
  return dueWords.slice(0, effectiveLimit);
}
