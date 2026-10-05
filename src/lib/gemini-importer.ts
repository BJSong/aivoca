import { OCRParseResult } from "@/types/vocab";

/**
 * 제미나이(Gemini) 어플/웹 채팅창에 교재 사진과 함께 입력하는 단어 추출 전용 프롬프트
 */
export const GEMINI_EXTRACTION_PROMPT = `[역할 정의]
너는 초·중등 전문 영어 교육 AI이자 어휘 데이터베이스 전문가야.
첨부된 교재 사진에서 모든 학습 대상 단어(Vocabulary Words)를 빠짐없이 인식(OCR)하고 분석해 줘.

[데이터 추출 및 처리 지침]
1. 첨부된 이미지에 등장하는 모든 핵심 영단어를 하나도 빠뜨리지 말고 순서대로 추출해.
2. 품사(part_of_speech)는 반드시 다음 소문자 영어로만 지정해:
   - "noun", "verb", "adjective", "adverb", "preposition" 중 하나.
3. 각 단어마다 다음 항목들을 정확하게 채워줘:
   - word: 단어 원형 (소문자)
   - part_of_speech: 영어 품사 ("noun", "verb", "adjective", "adverb" 등)
   - phonetic_symbol: 국제음성기호(IPA) 발음 (예: "/wɔːrn/")
   - korean_definition: 학생 눈높이에 맞춘 명확하고 간결한 한국어 뜻 (예: "경고하다, 주의를 주다")
   - english_definition: 쉬운 영문 뜻풀이
   - synonyms: 동의어/유의어 1~3개 배열 (없으면 [])
   - antonyms: 반의어 1~3개 배열 (없으면 [])
   - collocations: 자주 함께 쓰이는 연어/표현 2~3개 배열 (예: ["warn people", "strongly warn"])
   - example_sentence: 단어 활용 자연스러운 영문 예문 1문장
   - ted_context: 교재 사진 본문에서 해당 단어가 쓰인 실제 문장 또는 문맥 (사진에 문장이 있다면 그대로 인용, 없으면 예문과 동일하게 작성)
   - extra_metadata: { "page": 페이지번호, "category": "TEDTALKS" 또는 "NOVEL" 등 }

4. 단어장 메타데이터:
   - deck_title: 교재 상단에 표기된 주차 또는 단원명 (예: "9주차 단어장", "Unit 08 VOCA" 등)
   - publisher: 출판사 또는 주차 정보 (예: "9주차", "능률", "EBS" 등)
   - book_name: 책 이름 또는 챕터명
   - target_grade: 권장 학년 (예: "초등 5~6학년")

[출력 형식 제한]
- 어떠한 서론이나 인사말, 설명도 하지 마.
- 오직 유효한 순수 JSON 문자열만 출력해. (반드시 유효한 JSON 형식이어야 함)

[JSON 스키마 예시]
{
  "deck_title": "9주차 단어장",
  "publisher": "9주차",
  "book_name": "TEDTALKS & NOVEL",
  "target_grade": "초등 5~6학년",
  "words": [
    {
      "word": "warn",
      "part_of_speech": "verb",
      "phonetic_symbol": "/wɔːrn/",
      "english_definition": "to make someone realize a possible danger or problem",
      "korean_definition": "경고하다, 주의를 주다",
      "synonyms": ["alert"],
      "antonyms": [],
      "collocations": ["warn people", "strongly warn"],
      "example_sentence": "Doctors often warn people that smoking is bad for health.",
      "ted_context": "Scientists have long warned us that it can lead to dangerous consequences."
    }
  ]
}`;

/**
 * 제미나이 채팅창에서 복사한 텍스트(마크다운 코드블록, 부가 텍스트 등 포함)를
 * 안전하게 정제하여 OCRParseResult 객체로 파싱합니다.
 */
export function parseGeminiDeckJson(rawInput: string): OCRParseResult {
  if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
    throw new Error("입력된 데이터가 비어 있습니다. 제미나이의 JSON 출력을 붙여넣어 주세요.");
  }

  let text = rawInput.trim();

  // 1. 마크다운 코드 블록 제거 (```json ... ``` or ``` ...)
  if (text.includes("```")) {
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeMatch && codeMatch[1]) {
      text = codeMatch[1].trim();
    } else {
      text = text.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    }
  }

  // 2. JSON 객체/배열 시작/끝 탐색 (앞뒤 잡음 텍스트 제거)
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");

  let jsonStr = text;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = text.substring(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    const lastBracket = text.lastIndexOf("]");
    if (lastBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = text.substring(firstBracket, lastBracket + 1);
    }
  }

  // 3. 파싱 시도
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(
      `JSON 파싱에 실패했습니다. 유효한 JSON 형식인지 확인해 주세요. (에러: ${
        err instanceof Error ? err.message : String(err)
      })`
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("올바른 JSON 객체나 배열 형태가 아닙니다.");
  }

  // 4. 배열만 단독으로 들어온 경우 감싸기 처리
  let wordsArray: Record<string, unknown>[] = [];
  let deckTitle = "제미나이 추출 단어장";
  let publisher: string | undefined = undefined;
  let bookName: string | undefined = undefined;
  let targetGrade: string | undefined = "초등 5~6학년";
  let extraMetadata: Record<string, unknown> | undefined = undefined;

  if (Array.isArray(parsed)) {
    wordsArray = parsed as Record<string, unknown>[];
  } else {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.deck_title === "string" && obj.deck_title) {
      deckTitle = obj.deck_title;
    }
    if (typeof obj.publisher === "string") publisher = obj.publisher;
    if (typeof obj.book_name === "string") bookName = obj.book_name;
    if (typeof obj.target_grade === "string") targetGrade = obj.target_grade;
    if (typeof obj.extra_metadata === "object" && obj.extra_metadata !== null) {
      extraMetadata = obj.extra_metadata as Record<string, unknown>;
    }

    if (Array.isArray(obj.words)) {
      wordsArray = obj.words as Record<string, unknown>[];
    } else if (Array.isArray(obj.items)) {
      wordsArray = obj.items as Record<string, unknown>[];
    } else if (Array.isArray(obj.vocabulary)) {
      wordsArray = obj.vocabulary as Record<string, unknown>[];
    }
  }

  if (!Array.isArray(wordsArray) || wordsArray.length === 0) {
    throw new Error("단어 목록(words)을 찾을 수 없거나 단어가 0개입니다.");
  }

  // 5. 각 단어 정규화 및 유효성 검사
  const normalizedWords = wordsArray.map((item, idx) => {
    const word = String(item.word || "").trim();
    if (!word) {
      throw new Error(`${idx + 1}번째 항목에 word(단어) 값이 없습니다.`);
    }

    // 품사 영어 표준화
    let pos = String(item.part_of_speech || item.pos || "noun").toLowerCase().trim();
    if (pos.includes("명사") || pos === "n" || pos === "n.") pos = "noun";
    else if (pos.includes("동사") || pos === "v" || pos === "v.") pos = "verb";
    else if (pos.includes("형용사") || pos === "adj" || pos === "adj.") pos = "adjective";
    else if (pos.includes("부사") || pos === "adv" || pos === "adv.") pos = "adverb";
    else if (pos.includes("전치사") || pos === "prep" || pos === "prep.") pos = "preposition";

    const koreanDef = String(
      item.korean_definition || item.meaning || item.definition || item.korean || ""
    ).trim();

    const englishDef = item.english_definition
      ? String(item.english_definition).trim()
      : undefined;

    const phonetic = item.phonetic_symbol || item.pronunciation
      ? String(item.phonetic_symbol || item.pronunciation).trim()
      : undefined;

    const synonyms = Array.isArray(item.synonyms)
      ? item.synonyms.map(String).filter(Boolean)
      : [];

    const antonyms = Array.isArray(item.antonyms)
      ? item.antonyms.map(String).filter(Boolean)
      : [];

    const collocations = Array.isArray(item.collocations)
      ? item.collocations.map(String).filter(Boolean)
      : [];

    const exampleSentence = String(
      item.example_sentence || item.example || `I learned the word ${word} today.`
    ).trim();

    const tedContext = item.ted_context ? String(item.ted_context).trim() : undefined;

    return {
      word,
      part_of_speech: pos,
      phonetic_symbol: phonetic,
      english_definition: englishDef,
      korean_definition: koreanDef || `${word}의 뜻`,
      synonyms,
      antonyms,
      collocations,
      example_sentence: exampleSentence,
      ted_context: tedContext,
      extra_metadata: (item.extra_metadata as Record<string, unknown>) || undefined,
    };
  });

  return {
    deck_title: deckTitle,
    publisher,
    book_name: bookName,
    target_grade: targetGrade,
    extra_metadata: extraMetadata,
    words: normalizedWords,
  };
}

/**
 * 테스트 및 데모용 샘플 제미나이 JSON 문자열
 */
export const SAMPLE_GEMINI_JSON = `{
  "deck_title": "10주차 단어장",
  "publisher": "10주차 (Week 10)",
  "book_name": "Reading & Novel Mastery",
  "target_grade": "초등 5~6학년",
  "words": [
    {
      "word": "curious",
      "part_of_speech": "adjective",
      "phonetic_symbol": "/ˈkjʊr.i.əs/",
      "english_definition": "interested in learning about people or things around you",
      "korean_definition": "호기심이 많은, 궁금한",
      "synonyms": ["inquisitive", "interested"],
      "antonyms": ["indifferent", "uninterested"],
      "collocations": ["curious mind", "curious about", "stay curious"],
      "example_sentence": "Children are naturally curious about the world.",
      "ted_context": "The young scientist had a curious mind and questioned everything."
    },
    {
      "word": "investigate",
      "part_of_speech": "verb",
      "phonetic_symbol": "/ɪnˈves.tə.ɡeɪt/",
      "english_definition": "to examine a problem carefully to discover the truth",
      "korean_definition": "조사하다, 수사하다",
      "synonyms": ["examine", "explore"],
      "antonyms": ["ignore", "neglect"],
      "collocations": ["investigate the cause", "investigate thoroughly"],
      "example_sentence": "Detectives investigated the mysterious footprint.",
      "ted_context": "Researchers began to investigate the impact of ocean temperatures."
    }
  ]
}`;
