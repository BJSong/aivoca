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
export const WEEK8_TEXTBOOK_DECK: DeckWithItems = {
  id: "deck-week8",
  title: "8주차 단어장",
  publisher: "8주차",
  book_name: "TEDTALKS, NOVEL & SPEECH (pp.64-68)",
  target_grade: "초등 5~6학년",
  created_at: new Date().toISOString(),
  items_count: 20,
  mastered_count: 0,
  extra_metadata: {
    week: "8주차",
    theme: "Vision & Adventure & Inspiration",
    pages: "64-68",
    ted_pages: "64-65",
    novel_pages: "66-67",
    speech_pages: "68",
  },
  items: [
    {
      id: "word-w8-01-vision",
      deck_id: "deck-week8",
      word: "vision",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈvɪʒ.ən/",
      english_definition: "a mental image of something",
      korean_definition: "비전, 미래상, 마음속에 그리는 모습",
      synonyms: ["idea"],
      antonyms: [],
      collocations: ["clear vision", "future vision", "trust one's vision"],
      example_sentence:
        "The architect had a clear vision of what the building should look like.",
      ted_context:
        "I wish that I had trusted my own vision and my own sensibility more.",
      order_index: 0,
      extra_metadata: { textbook_page: 64, category: "TEDTALKS" },
    },
    {
      id: "word-w8-02-sensibility",
      deck_id: "deck-week8",
      word: "sensibility",
      part_of_speech: "noun",
      phonetic_symbol: "/ˌsen.səˈbɪl.ə.t̬i/",
      english_definition:
        "an understanding of, or ability to judge, what is good or valuable",
      korean_definition: "감성, 감수성, 분별력",
      synonyms: ["taste"],
      antonyms: [],
      collocations: [
        "artistic sensibility",
        "moral sensibility",
        "own sensibility",
      ],
      example_sentence:
        "The designer's artistic sensibility was evident in every dress she made.",
      ted_context:
        "I wish that I had trusted my own vision and my own sensibility more.",
      order_index: 1,
      extra_metadata: { textbook_page: 64, category: "TEDTALKS" },
    },
    {
      id: "word-w8-03-honor",
      deck_id: "deck-week8",
      word: "honor",
      part_of_speech: "verb",
      phonetic_symbol: "/ˈɑː.nɚ/",
      english_definition: "to show great respect for someone or something",
      korean_definition: "존중하다, 경의를 표하다",
      synonyms: ["praise"],
      antonyms: ["disrespect"],
      collocations: ["honor a promise", "honor traditions", "great honor"],
      example_sentence:
        "It is important to honor your promises to your friends.",
      ted_context:
        "... I think that it just took me a while to understand that my perspective was important enough. I wish I had honored that perspective.",
      order_index: 2,
      extra_metadata: { textbook_page: 64, category: "TEDTALKS" },
    },
    {
      id: "word-w8-04-perspective",
      deck_id: "deck-week8",
      word: "perspective",
      part_of_speech: "noun",
      phonetic_symbol: "/pɚˈspek.tɪv/",
      english_definition: "a particular way of considering something",
      korean_definition: "관점, 시각",
      synonyms: ["viewpoint"],
      antonyms: [],
      collocations: [
        "broader perspective",
        "different perspective",
        "from my perspective",
      ],
      example_sentence:
        "Traveling gives you a broader perspective on the world and others around you.",
      ted_context:
        "I wish I had honored the perspectives of people who look like me, of other women, of other women of color who are trying to do this work...",
      order_index: 3,
      extra_metadata: { textbook_page: 64, category: "TEDTALKS" },
    },
    {
      id: "word-w8-05-entrust",
      deck_id: "deck-week8",
      word: "entrust",
      part_of_speech: "verb",
      phonetic_symbol: "/ɪnˈtrʌst/",
      english_definition:
        "to give someone responsibility for something or someone",
      korean_definition: "(책임·일을) 맡기다, 위탁하다",
      synonyms: ["assign"],
      antonyms: ["withhold"],
      collocations: [
        "entrust to someone",
        "entrust with responsibility",
      ],
      example_sentence:
        "I entrust my dog to my neighbor whenever I go on vacation.",
      ted_context:
        "... but I think that being welcomed into those spaces and being entrusted with other people's stories is the greatest privilege.",
      order_index: 4,
      extra_metadata: { textbook_page: 65, category: "TEDTALKS" },
    },
    {
      id: "word-w8-06-privilege",
      deck_id: "deck-week8",
      word: "privilege",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈprɪv.əl.ɪdʒ/",
      english_definition:
        "an advantage that only one person or group of people has",
      korean_definition: "특권, 특별한 기회",
      synonyms: ["benefit"],
      antonyms: ["disadvantage"],
      collocations: [
        "greatest privilege",
        "special privilege",
        "have the privilege",
      ],
      example_sentence:
        "Melissa had the privilege of studying abroad for a year.",
      ted_context:
        "... but I think that being welcomed into those spaces and being entrusted with other people's stories is the greatest privilege.",
      order_index: 5,
      extra_metadata: { textbook_page: 65, category: "TEDTALKS" },
    },
    {
      id: "word-w8-07-deviate-from",
      deck_id: "deck-week8",
      word: "deviate from",
      part_of_speech: "verb",
      phonetic_symbol: "/ˈdiː.vi.eɪt frəm/",
      english_definition:
        "to do something that is different from the usual or common way of behaving",
      korean_definition: "~에서 벗어나다, 이탈하다",
      synonyms: ["stray from"],
      antonyms: ["follow"],
      collocations: [
        "deviate from the path",
        "deviate from the norm",
        "deviate from the plan",
      ],
      example_sentence:
        "The pilot had to deviate from the flight path to avoid the storm.",
      ted_context:
        "... trying to honor that with a truthful image, a truthful story, and making sure that I don't deviate from knowing that.",
      order_index: 6,
      extra_metadata: { textbook_page: 65, category: "TEDTALKS" },
    },
    {
      id: "word-w8-08-collaboration",
      deck_id: "deck-week8",
      word: "collaboration",
      part_of_speech: "noun",
      phonetic_symbol: "/kəˌlæb.əˈreɪ.ʃən/",
      english_definition:
        "working together with others to create or achieve something",
      korean_definition: "협력, 공동 작업",
      synonyms: ["partnership"],
      antonyms: [],
      collocations: [
        "successful collaboration",
        "close collaboration",
        "in collaboration with",
      ],
      example_sentence:
        "The project was a successful collaboration between the two universities.",
      ted_context:
        "Making sure that when I take pictures now, I make sure it's a collaboration between myself and the person in front of me.",
      order_index: 7,
      extra_metadata: { textbook_page: 65, category: "TEDTALKS" },
    },
    {
      id: "word-w8-09-primly",
      deck_id: "deck-week8",
      word: "primly",
      part_of_speech: "adverb",
      phonetic_symbol: "/ˈprɪm.li/",
      english_definition: "in a proper, neat, or formal way",
      korean_definition: "새침하게, 얌전빼며, 단정하게",
      synonyms: ["correctly"],
      antonyms: ["casually"],
      collocations: ["sit primly", "say primly", "smile primly"],
      example_sentence:
        "Joanna sat primly in her chair, following her lessons on table manners.",
      ted_context:
        `"You're a slitherer, that's all you are! You just slither along!" "I glide," said the Earthworm primly.`,
      order_index: 8,
      extra_metadata: { textbook_page: 66, category: "NOVEL" },
    },
    {
      id: "word-w8-10-hysterics",
      deck_id: "deck-week8",
      word: "hysterics",
      part_of_speech: "noun",
      phonetic_symbol: "/hɪˈster.ɪks/",
      english_definition:
        "a state of uncontrolled laughter, cry, or other extreme emotion",
      korean_definition: "발작적 웃음[울음], 히스테리",
      synonyms: ["frenzy"],
      antonyms: ["collectedness"],
      collocations: [
        "go into hysterics",
        "dissolve into hysterics",
        "in hysterics",
      ],
      example_sentence:
        "The whole classroom dissolved into hysterics when the teacher burped.",
      ted_context:
        `This sent the Centipede into hysterics. "Pulling his leg!" he cried, wriggling with glee and pointing at the Earthworm.`,
      order_index: 9,
      extra_metadata: { textbook_page: 66, category: "NOVEL" },
    },
    {
      id: "word-w8-11-desolate",
      deck_id: "deck-week8",
      word: "desolate",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈdes.ə.lət/",
      english_definition:
        "empty and without people or anything pleasant",
      korean_definition: "황량한, 적막한",
      synonyms: ["deserted"],
      antonyms: ["lively"],
      collocations: [
        "desolate landscape",
        "desolate place",
        "desolate wasteland",
      ],
      example_sentence:
        "This used to be a lively town, but it is a desolate wasteland now.",
      ted_context:
        `"Who lives in the desolate snow / And whenever he catches a cold (which he dreads)..."`,
      order_index: 10,
      extra_metadata: { textbook_page: 66, category: "NOVEL" },
    },
    {
      id: "word-w8-12-insidiously",
      deck_id: "deck-week8",
      word: "insidiously",
      part_of_speech: "adverb",
      phonetic_symbol: "/ɪnˈsɪd.i.əs.li/",
      english_definition:
        "in a way that gradually and secretly causes harm",
      korean_definition: "은밀하게, 서서히 퍼져 해를 끼치며",
      synonyms: ["slyly"],
      antonyms: ["honestly"],
      collocations: [
        "spread insidiously",
        "creep insidiously",
        "insidiously harmful",
      ],
      example_sentence:
        "COVID-19 spread insidiously through the community and infected everyone.",
      ted_context:
        "One second later... slowly, insidiously, oh most gently, the great peach started to lean forward and steal into motion.",
      order_index: 11,
      extra_metadata: { textbook_page: 66, category: "NOVEL" },
    },
    {
      id: "word-w8-13-bungalow",
      deck_id: "deck-week8",
      word: "bungalow",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈbʌŋ.ɡə.loʊ/",
      english_definition: "a small house, usually with one level",
      korean_definition: "방갈로 (단층 주택)",
      synonyms: ["cottage"],
      antonyms: [],
      collocations: [
        "cozy bungalow",
        "beach bungalow",
        "single-story bungalow",
      ],
      example_sentence:
        "The couple's cozy bungalow by the beach was the perfect vacation spot.",
      ted_context:
        "Cowsheds, stables, pigsties, barns, bungalows, hayricks, anything that got in its way went toppling over...",
      order_index: 12,
      extra_metadata: { textbook_page: 67, category: "NOVEL" },
    },
    {
      id: "word-w8-14-serenely",
      deck_id: "deck-week8",
      word: "serenely",
      part_of_speech: "adverb",
      phonetic_symbol: "/səˈriːn.li/",
      english_definition: "in a calm and untroubled manner",
      korean_definition: "평온하게, 차분하게",
      synonyms: ["peacefully"],
      antonyms: ["chaotically"],
      collocations: ["float serenely", "smile serenely", "sit serenely"],
      example_sentence:
        "I sat serenely by the warm fireplace, reading my favorite book.",
      ted_context:
        "But a few seconds later, up it came again, and this time, up it stayed, floating serenely upon the surface of the water.",
      order_index: 13,
      extra_metadata: { textbook_page: 67, category: "NOVEL" },
    },
    {
      id: "word-w8-15-coil",
      deck_id: "deck-week8",
      word: "coil",
      part_of_speech: "verb",
      phonetic_symbol: "/kɔɪl/",
      english_definition:
        "to wind into loops around someone or something",
      korean_definition: "돌돌 말다, 휘감다",
      synonyms: ["twist"],
      antonyms: ["untwist"],
      collocations: ["coil around", "coil itself", "tightly coiled"],
      example_sentence:
        "The snake coiled itself around the tree branch, waiting for prey.",
      ted_context:
        "... coiled himself around James's body in a panic and refused to unwind.",
      order_index: 14,
      extra_metadata: { textbook_page: 67, category: "NOVEL" },
    },
    {
      id: "word-w8-16-amidst",
      deck_id: "deck-week8",
      word: "amidst",
      part_of_speech: "preposition",
      phonetic_symbol: "/əˈmɪdst/",
      english_definition: "in the middle of",
      korean_definition: "~의 한가운데에, ~속에",
      synonyms: ["among"],
      antonyms: [],
      collocations: [
        "amidst the chaos",
        "amidst excitement",
        "amidst difficulties",
      ],
      example_sentence:
        "Amidst the chaos of the city, we found a quiet park to relax in.",
      ted_context:
        "Amidst mounting excitement and shouts... the whole company climbed up the ladder one by one...",
      order_index: 15,
      extra_metadata: { textbook_page: 67, category: "NOVEL" },
    },
    {
      id: "word-w8-17-improve",
      deck_id: "deck-week8",
      word: "improve",
      part_of_speech: "verb",
      phonetic_symbol: "/ɪmˈpruːv/",
      english_definition: "to get better",
      korean_definition: "향상시키다, 개선되다",
      synonyms: ["develop"],
      antonyms: ["worsen"],
      collocations: [
        "improve skills",
        "improve performance",
        "dramatically improve",
      ],
      example_sentence:
        "Practicing every day will help you improve your guitar skills.",
      ted_context:
        "Instead of using their knowledge for themselves, they are helping someone else improve.",
      order_index: 16,
      extra_metadata: { textbook_page: 68, category: "SPEECH" },
    },
    {
      id: "word-w8-18-legacy",
      deck_id: "deck-week8",
      word: "legacy",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈleɡ.ə.si/",
      english_definition:
        "something left behind from the past or from someone's life or actions",
      korean_definition: "유산, 남겨진 것",
      synonyms: ["memory"],
      antonyms: [],
      collocations: [
        "leave a legacy",
        "lasting legacy",
        "legacy of kindness",
      ],
      example_sentence:
        "The famous teacher left a legacy of kindness at the school.",
      ted_context:
        "The best kind of success leaves a legacy, not just a trophy.",
      order_index: 17,
      extra_metadata: { textbook_page: 68, category: "SPEECH" },
    },
    {
      id: "word-w8-19-supportive",
      deck_id: "deck-week8",
      word: "supportive",
      part_of_speech: "adjective",
      phonetic_symbol: "/səˈpɔːr.t̬ɪv/",
      english_definition:
        "showing agreement and giving encouragement",
      korean_definition: "지지하는, 응원하는, 힘을 주는",
      synonyms: ["helpful"],
      antonyms: ["unsupportive"],
      collocations: [
        "supportive of",
        "supportive family",
        "mutually supportive",
      ],
      example_sentence:
        "My parents are very supportive of my dream to become a dancer.",
      ted_context:
        "In conclusion, the true measure of success is about doing our best, growing through challenges, and being supportive of others.",
      order_index: 18,
      extra_metadata: { textbook_page: 68, category: "SPEECH" },
    },
    {
      id: "word-w8-20-challenge",
      deck_id: "deck-week8",
      word: "challenge",
      part_of_speech: "verb",
      phonetic_symbol: "/ˈtʃæl.ɪndʒ/",
      english_definition:
        "to urge someone to do something difficult",
      korean_definition: "도전하게 하다, 이의를 제기하다",
      synonyms: ["encourage"],
      antonyms: ["discourage"],
      collocations: [
        "challenge someone to",
        "face a challenge",
        "challenge yourself",
      ],
      example_sentence:
        "I challenged my friend to race me to the end of the street on our bikes.",
      ted_context:
        `Next time, I challenge you to ask yourself, "Did I try my best? Did I grow? Did I help someone?"`,
      order_index: 19,
      extra_metadata: { textbook_page: 68, category: "SPEECH" },
    },
  ],
};

// 9주차 교재 단어장: TEDTALKS (pp. 74-75) & NOVEL (pp. 76-77) 통합 (총 16단어)
export const WEEK9_TEXTBOOK_DECK: DeckWithItems = {
  id: "deck-week9",
  title: "9주차 단어장",
  publisher: "9주차",
  book_name: "TEDTALKS (pp.74-75) & NOVEL (pp.76-77)",
  target_grade: "초등 5~6학년",
  created_at: new Date().toISOString(),
  items_count: 16,
  mastered_count: 0,
  extra_metadata: {
    week: "9주차",
    theme: "Climate Change & Novel Adventure",
    pages: "74-77",
    ted_pages: "74-75",
    novel_pages: "76-77",
  },
  items: [
    {
      id: "word-w9-01-warn",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 74, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-02-consequence",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 74, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-03-impact",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 74, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-04-spot",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 74, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-05-tsunami",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 75, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-06-artificial",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 75, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-07-suitable",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 75, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-08-short-term",
      deck_id: "deck-week9",
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
      extra_metadata: { textbook_page: 75, source_page: 50, category: "TEDTALKS" },
    },
    {
      id: "word-w9-09-affectionately",
      deck_id: "deck-week9",
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
      order_index: 8,
      extra_metadata: { textbook_page: 76, source_page: 60, category: "NOVEL" },
    },
    {
      id: "word-w9-10-pickled",
      deck_id: "deck-week9",
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
      order_index: 9,
      extra_metadata: { textbook_page: 76, source_page: 64, category: "NOVEL" },
    },
    {
      id: "word-w9-11-bait",
      deck_id: "deck-week9",
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
      order_index: 10,
      extra_metadata: { textbook_page: 76, source_page: 72, category: "NOVEL" },
    },
    {
      id: "word-w9-12-tether",
      deck_id: "deck-week9",
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
      order_index: 11,
      extra_metadata: { textbook_page: 76, source_page: 78, category: "NOVEL" },
    },
    {
      id: "word-w9-13-hurl",
      deck_id: "deck-week9",
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
      order_index: 12,
      extra_metadata: { textbook_page: 77, source_page: 78, category: "NOVEL" },
    },
    {
      id: "word-w9-14-froth",
      deck_id: "deck-week9",
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
      order_index: 13,
      extra_metadata: { textbook_page: 77, source_page: 82, category: "NOVEL" },
    },
    {
      id: "word-w9-15-funnel",
      deck_id: "deck-week9",
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
      order_index: 14,
      extra_metadata: { textbook_page: 77, source_page: 82, category: "NOVEL" },
    },
    {
      id: "word-w9-16-mammoth",
      deck_id: "deck-week9",
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
      order_index: 15,
      extra_metadata: { textbook_page: 77, source_page: 85, category: "NOVEL" },
    },
  ],
};

// 10주차 교재 단어장: TEDTALKS, NOVEL, SPEECH 통합 (총 20단어)
export const WEEK10_TEXTBOOK_DECK: DeckWithItems = {
  id: "deck-week10",
  title: "WEEK 10 | VOCABULARY",
  publisher: "10주차",
  book_name: "TEDTALKS & NOVEL & SPEECH",
  target_grade: "초등 5~6학년",
  created_at: new Date().toISOString(),
  items_count: 20,
  mastered_count: 0,
  extra_metadata: {
    week: "10주차",
    theme: "TEDTalks, Novel & Speech",
  },
  items: [
    {
      id: "word-w10-01-disappear",
      deck_id: "deck-week10",
      word: "disappear",
      part_of_speech: "verb",
      phonetic_symbol: "/ˌdɪsəˈpɪr/",
      english_definition: "to stop being visible",
      korean_definition: "사라지다, 보이지 않게 되다",
      synonyms: ["vanish"],
      antonyms: ["appear"],
      collocations: ["suddenly disappear", "disappear from sight", "disappear completely"],
      example_sentence: "The magician made the rabbit disappear and shocked the audience.",
      ted_context: "Cities on the coast in China, which are home to 600 million people today, would disappear.",
      order_index: 0,
      extra_metadata: { page: 82, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-02-require",
      deck_id: "deck-week10",
      word: "require",
      part_of_speech: "verb",
      phonetic_symbol: "/rɪˈkwaɪər/",
      english_definition: "to need something or make something necessary",
      korean_definition: "필요로 하다, 요구하다",
      synonyms: ["demand", "need"],
      antonyms: [],
      collocations: ["require action", "require permission", "require special care"],
      example_sentence: "Plants require sunlight and water to grow big and strong.",
      ted_context: "It is clear that the situation requires action from the whole world.",
      order_index: 1,
      extra_metadata: { page: 82, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-03-conference",
      deck_id: "deck-week10",
      word: "conference",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈkɑːnfərəns/",
      english_definition: "an event, sometimes lasting a few days, at which there is a group of talks on a particular subject",
      korean_definition: "회의, 협의회, 학술대회",
      synonyms: ["meeting", "convention"],
      antonyms: [],
      collocations: ["climate change conference", "attend a conference", "business conference"],
      example_sentence: "The hotel has a large room used for business conferences.",
      ted_context: "At the United National Climate Change Conference 2021, the Maldivian president urged the world to act.",
      order_index: 2,
      extra_metadata: { page: 82, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-04-urge",
      deck_id: "deck-week10",
      word: "urge",
      part_of_speech: "verb",
      phonetic_symbol: "/ɝːdʒ/",
      english_definition: "to try to persuade someone to do a particular thing",
      korean_definition: "강력히 권하다, 촉구하다",
      synonyms: ["advise", "encourage", "persuade"],
      antonyms: ["discourage"],
      collocations: ["urge someone to act", "strongly urge", "urge people to be careful"],
      example_sentence: "The police urge drivers to be careful on icy roads during snowstorms.",
      ted_context: "At the United National Climate Change Conference 2021, the Maldivian president urged the world to act.",
      order_index: 3,
      extra_metadata: { page: 82, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-05-suffer",
      deck_id: "deck-week10",
      word: "suffer",
      part_of_speech: "verb",
      phonetic_symbol: "/ˈsʌfər/",
      english_definition: "to experience physical or mental pain",
      korean_definition: "고통받다, 괴로워하다",
      synonyms: ["hurt", "endure"],
      antonyms: ["enjoy"],
      collocations: ["suffer from allergies", "suffer greatly", "suffer from pain"],
      example_sentence: "Many people suffer from allergies during the spring because of the pollen.",
      ted_context: "“If we fail to make the right decisions here and now, billions more will suffer, including the entire population of the Maldives,” he said.",
      order_index: 4,
      extra_metadata: { page: 83, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-06-dramatic",
      deck_id: "deck-week10",
      word: "dramatic",
      part_of_speech: "adjective",
      phonetic_symbol: "/drəˈmætɪk/",
      english_definition: "very sudden or noticeable",
      korean_definition: "극적인, 갑작스럽고 눈에 띄는",
      synonyms: ["striking", "remarkable"],
      antonyms: ["ordinary", "undramatic"],
      collocations: ["dramatic change", "dramatic ending", "dramatic increase"],
      example_sentence: "The movie had a very dramatic ending that surprised everyone.",
      ted_context: "These predictions may seem dramatic. All of our ice is probably not going to melt, at least not soon.",
      order_index: 5,
      extra_metadata: { page: 83, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-07-ordinary",
      deck_id: "deck-week10",
      word: "ordinary",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈɔːrdəneri/",
      english_definition: "not different or special or unexpected in any way",
      korean_definition: "평범한, 보통의",
      synonyms: ["normal", "usual", "common"],
      antonyms: ["extraordinary", "special"],
      collocations: ["ordinary people", "ordinary life", "ordinary day"],
      example_sentence: "Victor looks like an ordinary man, but he is actually a spy.",
      ted_context: "Higher sea levels will have serious consequences for ordinary people.",
      order_index: 6,
      extra_metadata: { page: 83, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-08-agriculture",
      deck_id: "deck-week10",
      word: "agriculture",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈæɡrɪkʌltʃər/",
      english_definition: "the science and work of growing plants and raising animals for food",
      korean_definition: "농업, 농사",
      synonyms: ["farming", "cultivation"],
      antonyms: [],
      collocations: ["modern agriculture", "sustainable agriculture", "agricultural technology"],
      example_sentence: "Modern agriculture uses technology to increase crop production.",
      ted_context: "There will be damage to our communication, transportation, and electrical systems, as well as to fishing and agriculture.",
      order_index: 7,
      extra_metadata: { page: 83, source_page: 51, category: "TEDTALKS" },
    },
    {
      id: "word-w10-09-rambunctious",
      deck_id: "deck-week10",
      word: "rambunctious",
      part_of_speech: "adjective",
      phonetic_symbol: "/ræmˈbʌŋkʃəs/",
      english_definition: "full of energy in a cheerful and uncontrollable way",
      korean_definition: "활기차지만 소란스러운, 통제가 어려울 만큼 떠들썩한",
      synonyms: ["unruly", "rowdy", "boisterous"],
      antonyms: ["restrained", "calm"],
      collocations: ["rambunctious children", "rambunctious behavior", "rambunctious crowd"],
      example_sentence: "The rambunctious kids laughed and shouted loudly as they ran toward the park.",
      ted_context: "“Why must you always be so rude and rambunctious to everyone?”",
      order_index: 8,
      extra_metadata: { page: 84, source_page: 88, category: "NOVEL" },
    },
    {
      id: "word-w10-10-modestly",
      deck_id: "deck-week10",
      word: "modestly",
      part_of_speech: "adverb",
      phonetic_symbol: "/ˈmɑːdɪstli/",
      english_definition: "in a way that does not praise one's own abilities or possessions",
      korean_definition: "겸손하게, 자랑하지 않고",
      synonyms: ["humbly", "unpretentiously"],
      antonyms: ["proudly", "boastfully"],
      collocations: ["answer modestly", "dress modestly", "speak modestly"],
      example_sentence: "Ana answered Maria’s question modestly because she did not want to boast.",
      ted_context: "“I am told that they do,” the Ladybug answered modestly, blushing all over.",
      order_index: 9,
      extra_metadata: { page: 84, source_page: 90, category: "NOVEL" },
    },
    {
      id: "word-w10-11-saucy",
      deck_id: "deck-week10",
      word: "saucy",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈsɔːsi/",
      english_definition: "rude and showing no respect",
      korean_definition: "버릇없는, 건방진",
      synonyms: ["disrespectful", "impudent", "cheeky"],
      antonyms: ["polite", "respectful"],
      collocations: ["saucy attitude", "saucy remark", "saucy reply"],
      example_sentence: "Jill does not have many friends because people cannot stand her saucy attitude.",
      ted_context: "“They are much nicer than the Two-Spotted ones, although I myself find them a trifle too saucy for my taste.”",
      order_index: 10,
      extra_metadata: { page: 84, source_page: 91, category: "NOVEL" },
    },
    {
      id: "word-w10-12-wraithlike",
      deck_id: "deck-week10",
      word: "wraithlike",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈreɪθlaɪk/",
      english_definition: "pale and thin or weak",
      korean_definition: "유령 같은, 창백하고 가냘픈",
      synonyms: ["ghostly", "spectral"],
      antonyms: [],
      collocations: ["wraithlike figure", "wraithlike appearance", "wraithlike shadow"],
      example_sentence: "The wraithlike figure in the movie terrified us because it looked like a ghost.",
      ted_context: "… these “things” were actually living creatures—tall, wispy, wraithlike, shadowy white creatures …",
      order_index: 11,
      extra_metadata: { page: 84, source_page: 100, category: "NOVEL" },
    },
    {
      id: "word-w10-13-loathsome",
      deck_id: "deck-week10",
      word: "loathsome",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈloʊðsəm/",
      english_definition: "causing feelings of hatred or disgust",
      korean_definition: "몹시 불쾌한, 혐오스러운",
      synonyms: ["hateful", "disgusting", "repulsive"],
      antonyms: ["likeable", "pleasant"],
      collocations: ["loathsome smell", "loathsome creature", "loathsome behavior"],
      example_sentence: "The smell from the garbage was so loathsome that people started to complain.",
      ted_context: "“Now you've done it, you loathsome pest!” whispered the Earthworm to the Centipede.",
      order_index: 12,
      extra_metadata: { page: 85, source_page: 103, category: "NOVEL" },
    },
    {
      id: "word-w10-14-gaze",
      deck_id: "deck-week10",
      word: "gaze",
      part_of_speech: "verb",
      phonetic_symbol: "/ɡeɪz/",
      english_definition: "to look at something or someone for a long time, especially in surprise or admiration",
      korean_definition: "오랫동안 바라보다, 응시하다",
      synonyms: ["stare", "look"],
      antonyms: ["ignore", "glance away"],
      collocations: ["gaze at the stars", "gaze into the distance", "gaze around"],
      example_sentence: "The toddlers would often visit the aquarium and gaze at the colorful fish.",
      ted_context: "One by one, the travelers came out again onto the top of the peach and gazed carefully around.",
      order_index: 13,
      extra_metadata: { page: 85, source_page: 106, category: "NOVEL" },
    },
    {
      id: "word-w10-15-arch",
      deck_id: "deck-week10",
      word: "arch",
      part_of_speech: "noun",
      phonetic_symbol: "/ɑːrtʃ/",
      english_definition: "a structure consisting of a curved top on two supports which holds the weight of something above it",
      korean_definition: "아치, 활 모양의 구조물",
      synonyms: ["arc", "vault"],
      antonyms: [],
      collocations: ["stone arch", "arched doorway", "walk beneath an arch"],
      example_sentence: "The princess walked beneath the ornate arch that led to the castle garden.",
      ted_context: "The whole surface of the cloud was literally swarming with them . . . climbing about on that monstrous crazy arch.",
      order_index: 14,
      extra_metadata: { page: 85, source_page: 107, category: "NOVEL" },
    },
    {
      id: "word-w10-16-frenzy",
      deck_id: "deck-week10",
      word: "frenzy",
      part_of_speech: "noun",
      phonetic_symbol: "/ˈfrenzi/",
      english_definition: "a state or period of uncontrolled excitement or wild behavior",
      korean_definition: "광란, 극도의 흥분 상태",
      synonyms: ["hysteria", "madness", "wild excitement"],
      antonyms: ["order", "calm"],
      collocations: ["in a frenzy", "shopping frenzy", "frenzy of activity"],
      example_sentence: "The shoppers rushed into the store in a frenzy during the sale.",
      ted_context: "… they were splashing the paint onto the great curvy arch in a frenzy of speed …",
      order_index: 15,
      extra_metadata: { page: 85, source_page: 108, category: "NOVEL" },
    },
    {
      id: "word-w10-17-critical",
      deck_id: "deck-week10",
      word: "critical",
      part_of_speech: "adjective",
      phonetic_symbol: "/ˈkrɪtɪkəl/",
      english_definition: "of the greatest importance to the way things might happen",
      korean_definition: "매우 중요한, 결정적인",
      synonyms: ["crucial", "essential", "vital"],
      antonyms: ["unimportant", "minor"],
      collocations: ["critical choice", "critical decision", "critical moment"],
      example_sentence: "Wearing a helmet is critical when riding a bike.",
      ted_context: "Our generation stands at the brink of change, facing a critical choice for our planet's future.",
      order_index: 16,
      extra_metadata: { page: 86, source_page: 35, category: "SPEECH" },
    },
    {
      id: "word-w10-18-evolution",
      deck_id: "deck-week10",
      word: "evolution",
      part_of_speech: "noun",
      phonetic_symbol: "/ˌevəˈluːʃən/",
      english_definition: "a gradual process of change and development",
      korean_definition: "진화, 점진적인 발전과 변화",
      synonyms: ["growth", "development", "progression"],
      antonyms: [],
      collocations: ["technological evolution", "human evolution", "gradual evolution"],
      example_sentence: "The evolution of the telephone led to smaller, lighter phones.",
      ted_context: "Cleaner energy is not just a technological evolution.",
      order_index: 17,
      extra_metadata: { page: 86, source_page: 35, category: "SPEECH" },
    },
    {
      id: "word-w10-19-sustainable",
      deck_id: "deck-week10",
      word: "sustainable",
      part_of_speech: "adjective",
      phonetic_symbol: "/səˈsteɪnəbəl/",
      english_definition: "causing little or no damage to the environment and able to continue for a long time",
      korean_definition: "지속 가능한, 환경을 해치지 않고 오래 유지할 수 있는",
      synonyms: ["lasting", "eco-friendly", "renewable"],
      antonyms: ["unsustainable"],
      collocations: ["sustainable future", "sustainable energy", "sustainable development"],
      example_sentence: "Using wind power is a sustainable way to make electricity.",
      ted_context: "It is a gateway to a sustainable future that allows us to reduce, innovate, and thrive.",
      order_index: 18,
      extra_metadata: { page: 86, source_page: 35, category: "SPEECH" },
    },
    {
      id: "word-w10-20-thrive",
      deck_id: "deck-week10",
      word: "thrive",
      part_of_speech: "verb",
      phonetic_symbol: "/θraɪv/",
      english_definition: "to grow, develop, or be successful",
      korean_definition: "번창하다, 잘 자라다, 성공적으로 발전하다",
      synonyms: ["flourish", "prosper", "grow"],
      antonyms: ["struggle", "decline"],
      collocations: ["thrive in nature", "thrive in a new environment", "thrive on challenges"],
      example_sentence: "Plants will thrive if they get enough sunlight and water.",
      ted_context: "It is a gateway to a sustainable future that allows us to reduce, innovate, and thrive.",
      order_index: 19,
      extra_metadata: { page: 86, source_page: 35, category: "SPEECH" },
    },
  ],
};

// 하위 호환성 유지용 (TEDTALKS pp.74-75, NOVEL pp.76-77)
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

    INITIAL_DEFAULT_DECKS.forEach((initDeck) => {
      if (!decks.some((d) => d.id === initDeck.id)) {
        decks.unshift(initDeck);
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("aivoca_decks_updated"));
    }
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
