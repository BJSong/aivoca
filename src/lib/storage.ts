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

// 1. 교재 사진 기반 단어장: TEDTALKS WORDS (pp. 74-75)
export const TEXTBOOK_TED_DECK: DeckWithItems = {
  id: "deck-tedtalks-p74-75",
  title: "TEDTALKS WORDS (pp. 74-75)",
  publisher: "TED-Ed Series",
  book_name: "Reading for Real World",
  target_grade: "초등 5~6학년",
  created_at: new Date().toISOString(),
  items_count: 8,
  mastered_count: 0,
  extra_metadata: {
    unit: "Unit 08",
    theme: "Climate Change & Oceans (기후 변화와 해양)",
    pages: "74-75",
  },
  items: [
    {
      id: "word-ted-01-warn",
      deck_id: "deck-tedtalks-p74-75",
      word: "warn",
      part_of_speech: "verb",
      phonetic_symbol: "/wɔːrn/",
      english_definition:
        "to make someone realize a possible danger or problem, especially one in the future",
      korean_definition: "경고하다, 주의를 주다",
      synonyms: ["alert"],
      antonyms: [],
      collocations: ["warn people", "warn against", "strongly warn"],
      example_sentence:
        "Doctors often warn people that smoking is very bad for your health.",
      ted_context:
        "Climate change is not a new topic, and scientists have long warned us that it can lead to dangerous consequences.",
      order_index: 0,
      extra_metadata: { textbook_page: 74, source_page: 50 },
    },
    {
      id: "word-ted-02-consequence",
      deck_id: "deck-tedtalks-p74-75",
      word: "consequence",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈkɑːn.sə.kwəns/",
      english_definition:
        "a result of a particular action or situation, often one that is bad or not convenient",
      korean_definition: "결과, 영향",
      synonyms: ["outcome", "result"],
      antonyms: ["cause"],
      collocations: [
        "dangerous consequences",
        "face consequences",
        "direct consequence",
      ],
      example_sentence:
        "The environmental consequence of an oil spill is devastating to animals.",
      ted_context:
        "Climate change is not a new topic, and scientists have long warned us that it can lead to dangerous consequences.",
      order_index: 1,
      extra_metadata: { textbook_page: 74, source_page: 50 },
    },
    {
      id: "word-ted-03-impact",
      deck_id: "deck-tedtalks-p74-75",
      word: "impact",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈɪm.pækt/",
      english_definition:
        "a powerful effect that something, especially something new, has on a situation or person",
      korean_definition: "영향, 충격",
      synonyms: ["influence", "effect"],
      antonyms: [],
      collocations: ["huge impact", "impact of climate change", "positive impact"],
      example_sentence:
        "The internet has had a huge impact on how we communicate.",
      ted_context:
        "Maybe it seems as if most of the impact of climate change is in the future, so it's easier to worry about it later.",
      order_index: 2,
      extra_metadata: { textbook_page: 74, source_page: 50 },
    },
    {
      id: "word-ted-04-spot",
      deck_id: "deck-tedtalks-p74-75",
      word: "spot",
      part_of_speech: "noun",
      phonetic_symbol: "/spɑːt/",
      english_definition: "a particular place",
      korean_definition: "장소, 지점",
      synonyms: ["location", "place"],
      antonyms: [],
      collocations: ["popular spot", "quiet spot", "favorite spot"],
      example_sentence:
        "Henry found a quiet spot in the library to study for his English test.",
      ted_context:
        "The Maldives is in the warm waters of the Indian Ocean and is a very popular spot for tourists.",
      order_index: 3,
      extra_metadata: { textbook_page: 74, source_page: 50 },
    },
    {
      id: "word-ted-05-tsunami",
      deck_id: "deck-tedtalks-p74-75",
      word: "tsunami",
      part_of_speech: "noun",
      phonetic_symbol: "/tsuːˈnɑː.mi/",
      english_definition:
        "an extremely large wave usually caused by an underwater earthquake",
      korean_definition: "쓰나미, 지진 해일",
      synonyms: ["tidal wave"],
      antonyms: [],
      collocations: ["tsunami warning", "approaching tsunami", "coastal tsunami"],
      example_sentence:
        "Warning sirens alerted the coast that a tsunami was approaching.",
      ted_context:
        "The wall did give the city some protection from a tsunami in 2004. Although there was still a lot of flooding, the impact would have been much worse without it.",
      order_index: 4,
      extra_metadata: { textbook_page: 75, source_page: 50 },
    },
    {
      id: "word-ted-06-artificial",
      deck_id: "deck-tedtalks-p74-75",
      word: "artificial",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˌɑːr.t̬əˈfɪʃ.əl/",
      english_definition:
        "made by people, often as a copy of something natural",
      korean_definition: "인공의, 인조의",
      synonyms: ["fake", "synthetic"],
      antonyms: ["natural", "real"],
      collocations: [
        "artificial island",
        "artificial light",
        "artificial intelligence",
      ],
      example_sentence:
        "The flowers on the table were artificial but looked very real.",
      ted_context:
        "In addition to the wall around Malé, the government took another step: building an artificial island about 2m above sea level.",
      order_index: 5,
      extra_metadata: { textbook_page: 75, source_page: 50 },
    },
    {
      id: "word-ted-07-suitable",
      deck_id: "deck-tedtalks-p74-75",
      word: "suitable",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈsuː.t̬ə.bəl/",
      english_definition: "acceptable or right for someone or something",
      korean_definition: "적합한, 알맞은",
      synonyms: ["appropriate", "proper"],
      antonyms: ["unsuitable", "inappropriate"],
      collocations: ["suitable dress", "suitable for children", "suitable measures"],
      example_sentence:
        "Lucy looked for a suitable dress to wear to the wedding.",
      ted_context:
        "Now, these measures may be suitable in the short term, but what would happen if all the world's ice melted?",
      order_index: 6,
      extra_metadata: { textbook_page: 75, source_page: 50 },
    },
    {
      id: "word-ted-08-short-term",
      deck_id: "deck-tedtalks-p74-75",
      word: "short term",
      part_of_speech: "noun",
      phonetic_symbol: "/ˌʃɔːrt ˈtɝːm/",
      english_definition: "a short period of time",
      korean_definition: "단기, 단기간",
      synonyms: ["temporary period"],
      antonyms: ["long term"],
      collocations: ["in the short term", "short term goal", "short term effects"],
      example_sentence:
        "Buying cheap shoes saves money in the short term but costs more later.",
      ted_context:
        "Now, these measures may be suitable in the short term, but what would happen if all the world's ice melted?",
      order_index: 7,
      extra_metadata: { textbook_page: 75, source_page: 50 },
    },
  ],
};

// 2. 교재 사진 기반 단어장: NOVEL WORDS (pp. 76-77)
export const TEXTBOOK_NOVEL_DECK: DeckWithItems = {
  id: "deck-novel-p76-77",
  title: "NOVEL WORDS (pp. 76-77)",
  publisher: "Literature Readers",
  book_name: "James and the Giant Peach",
  target_grade: "초등 5~6학년",
  created_at: new Date().toISOString(),
  items_count: 8,
  mastered_count: 0,
  extra_metadata: {
    unit: "Chapter Words",
    theme: "Adventures of James & Friends",
    pages: "76-77",
  },
  items: [
    {
      id: "word-nov-09-affectionately",
      deck_id: "deck-novel-p76-77",
      word: "affectionately",
      part_of_speech: "adverb",
      phonetic_symbol: "/əˈfek.ʃən.ət.li/",
      english_definition: "in a way that shows liking or love",
      korean_definition: "다정하게, 애정을 담아",
      synonyms: ["lovingly", "fondly"],
      antonyms: ["cruelly", "coldly"],
      collocations: [
        "smile affectionately",
        "speak affectionately",
        "hold affectionately",
      ],
      example_sentence:
        "Lily smiled affectionately at her cat as she stroked it lovingly.",
      ted_context:
        `"My dear James," said the Old-Green-Grasshopper, laying a front leg affectionately on James's shoulder...`,
      order_index: 0,
      extra_metadata: { textbook_page: 76, source_page: 60 },
    },
    {
      id: "word-nov-10-pickled",
      deck_id: "deck-novel-p76-77",
      word: "pickled",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈpɪk.əld/",
      english_definition: "preserved with salt water or vinegar",
      korean_definition: "(소금물/식초에) 절인",
      synonyms: ["preserved"],
      antonyms: ["fresh"],
      collocations: [
        "pickled cucumbers",
        "pickled onions",
        "pickled vegetables",
      ],
      example_sentence:
        "The pickled cucumbers will add a tangy flavor to the sandwich.",
      ted_context:
        `"And pickled spines of porcupines. And then a gorgeous roast / Of dragon's flesh, well hung, not fresh..."`,
      order_index: 1,
      extra_metadata: { textbook_page: 76, source_page: 64 },
    },
    {
      id: "word-nov-11-bait",
      deck_id: "deck-novel-p76-77",
      word: "bait",
      part_of_speech: "noun",
      phonetic_symbol: "/beɪt/",
      english_definition: "food used to attract fish or other animals as prey",
      korean_definition: "미끼",
      synonyms: ["lure", "decoy"],
      antonyms: [],
      collocations: ["use as bait", "fishing bait", "swallow the bait"],
      example_sentence:
        "Sometimes, fishermen use lures as bait to catch bigger fish.",
      ted_context:
        `"Bait! What sort of bait?" "With a worm, of course. Seagulls love worms, didn't you know that?..."`,
      order_index: 2,
      extra_metadata: { textbook_page: 76, source_page: 72 },
    },
    {
      id: "word-nov-12-tether",
      deck_id: "deck-novel-p76-77",
      word: "tether",
      part_of_speech: "verb",
      phonetic_symbol: "/ˈteð.ɚ/",
      english_definition:
        "to tie something, such as an animal, to a post or other fixed place with a rope or chain",
      korean_definition: "(밧줄 등으로) 묶다, 매다",
      synonyms: ["bind", "fasten", "tie"],
      antonyms: ["unfasten", "untie", "release"],
      collocations: ["tether tightly", "tether to a post", "tether the leash"],
      example_sentence:
        "Windy tethered her dog outside and made sure that the leash was tied tightly.",
      ted_context:
        "And the seagulls kept coming, and James caught them one after the other and tethered them to the peach stem.",
      order_index: 3,
      extra_metadata: { textbook_page: 76, source_page: 78 },
    },
    {
      id: "word-nov-13-hurl",
      deck_id: "deck-novel-p76-77",
      word: "hurl",
      part_of_speech: "verb",
      phonetic_symbol: "/hɝːl/",
      english_definition:
        "to throw something with a lot of force, usually in an angry or violent way",
      korean_definition: "(힘껏/거칠게) 던지다",
      synonyms: ["fling", "throw", "pitch"],
      antonyms: ["catch", "hold"],
      collocations: ["hurl insults", "hurl stones", "hurl across the room"],
      example_sentence:
        "In a fit of fury, Colin hurled everything from his desk to the floor.",
      ted_context:
        "The sharks... were hurling themselves at the peach more furiously than ever...",
      order_index: 4,
      extra_metadata: { textbook_page: 77, source_page: 78 },
    },
    {
      id: "word-nov-14-froth",
      deck_id: "deck-novel-p76-77",
      word: "froth",
      part_of_speech: "noun",
      phonetic_symbol: "/frɑːθ/",
      english_definition:
        "a mass of small bubbles, especially on the surface of a liquid",
      korean_definition: "거품",
      synonyms: ["foam", "bubbles"],
      antonyms: [],
      collocations: ["sea froth", "creamy froth", "churn into a froth"],
      example_sentence:
        "The top of the hot chocolate was covered in froth, making it look delicious.",
      ted_context:
        `"But there were hundreds of sharks around us!" They churned the water into a froth!`,
      order_index: 5,
      extra_metadata: { textbook_page: 77, source_page: 82 },
    },
    {
      id: "word-nov-15-funnel",
      deck_id: "deck-novel-p76-77",
      word: "funnel",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈfʌn.əl/",
      english_definition:
        "a metal chimney on a ship or steam train through which smoke comes out",
      korean_definition: "(증기선·기관차의) 연돌, 굴뚝",
      synonyms: ["chimney", "smokestack"],
      antonyms: [],
      collocations: [
        "ship's funnel",
        "steam funnel",
        "smoke from the funnel",
      ],
      example_sentence:
        "Smoke came out of the ship's funnel as it glided over the ocean.",
      ted_context:
        `None of them had ever seen a ship before: "It looks like a big one." "It's got three funnels."`,
      order_index: 6,
      extra_metadata: { textbook_page: 77, source_page: 82 },
    },
    {
      id: "word-nov-16-mammoth",
      deck_id: "deck-novel-p76-77",
      word: "mammoth",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈmæm.əθ/",
      english_definition: "extremely large",
      korean_definition: "거대한, 엄청나게 큰",
      synonyms: ["enormous", "gigantic", "huge"],
      antonyms: ["tiny", "miniature", "small"],
      collocations: ["mammoth creature", "mammoth task", "mammoth size"],
      example_sentence:
        "Some dinosaurs were mammoth creatures with enormous bodies.",
      ted_context:
        `'Captain!' the First Officer said sharply. 'Captain, please!' 'And a mammoth spider!'`,
      order_index: 7,
      extra_metadata: { textbook_page: 77, source_page: 85 },
    },
  ],
};

export const INITIAL_DEFAULT_DECKS: DeckWithItems[] = [
  TEXTBOOK_TED_DECK,
  TEXTBOOK_NOVEL_DECK,
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
    const decks: DeckWithItems[] = JSON.parse(raw);
    let changed = false;
    INITIAL_DEFAULT_DECKS.forEach((initDeck) => {
      if (!decks.some((d) => d.id === initDeck.id)) {
        decks.push(initDeck);
        changed = true;
      }
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
