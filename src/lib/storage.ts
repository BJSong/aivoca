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
  if (!storage) return [SAMPLE_TED_DECK];
  try {
    const raw = storage.getItem(STORAGE_KEYS.DECKS);
    if (!raw) {
      storage.setItem(STORAGE_KEYS.DECKS, JSON.stringify([SAMPLE_TED_DECK]));
      return [SAMPLE_TED_DECK];
    }
    const decks: DeckWithItems[] = JSON.parse(raw);
    return decks.length > 0 ? decks : [SAMPLE_TED_DECK];
  } catch {
    return [SAMPLE_TED_DECK];
  }
}

export function saveLocalDecks(decks: DeckWithItems[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (err) {
    console.error("Failed to save decks:", err);
  }
}

export function getLocalDeckById(id: string): DeckWithItems | null {
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
