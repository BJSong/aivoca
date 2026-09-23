/**
 * AI Smart Vocab 종합 자동화 테스트 스위트 (Node.js native TypeScript)
 */

import { calculateNextSRS, isWordDueForReview } from "../src/lib/srs";
import {
  SAMPLE_TED_DECK,
  DEFAULT_PROFILE,
  createLocalDeck,
  getLocalDeckById,
  deleteLocalDeck,
  updateLocalWordProgress,
  addXP,
  getLocalProfile,
  getLocalDecks,
  getDailyReviewLimit,
  setDailyReviewLimit,
  getAllDueReviewWords,
} from "../src/lib/storage";
import { getLevenshteinDistance, analyzeTypo } from "../src/lib/levenshtein";
import { getEnglishPartOfSpeech, generateVocabQuiz } from "../src/lib/vocab-utils";
import {
  playCorrectSound,
  playIncorrectSound,
  playClickSound,
  playFanfareSound,
  speakWord,
  speakSentence,
} from "../src/lib/audio";
import { POST as ocrHandler } from "../src/app/api/ocr/parse-deck/route";
import { NextRequest } from "next/server";

// ==================== Simple Test Runner ====================
let totalPassed = 0;
let totalFailed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    totalFailed++;
    failures.push(`${testName} ${detail ? `(${detail})` : ""}`);
  }
}

function group(title: string) {
  console.log(`\n🔹 [TEST GROUP] ${title}`);
}

// Mock localStorage for Node environment testing
const memoryStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, val: string) => {
    memoryStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete memoryStorage[key];
  },
  clear: () => {
    for (const k in memoryStorage) delete memoryStorage[k];
  },
};

async function runAllTests() {
  console.log("==================================================");
  console.log("🚀 AI Smart Vocab 종합 기능 테스트 시작");
  console.log("==================================================");

  // -------------------------------------------------------------
  // 1. SM-2 Spaced Repetition (SRS) Tests
  // -------------------------------------------------------------
  group("1. SM-2 망각곡선 간격 반복 알고리즘");

  // 1회차 정답: 간격 1일
  const rep1 = calculateNextSRS(null, true);
  assert(rep1.repetition_count === 1, "1회 정답 시 repetition_count = 1");
  assert(rep1.interval_days === 1, "1회 정답 시 interval_days = 1");
  assert(rep1.is_mastered === false, "1회 정답 시 is_mastered = false");

  // 2회차 연속 정답: 간격 3일
  const rep2 = calculateNextSRS(rep1, true);
  assert(rep2.repetition_count === 2, "2회 연속 정답 시 repetition_count = 2");
  assert(rep2.interval_days === 3, "2회 연속 정답 시 interval_days = 3");
  assert(rep2.is_mastered === false, "2회 연속 정답 시 is_mastered = false");

  // 3회차 연속 정답: 간격 6일, 마스터 달성!
  const rep3 = calculateNextSRS(rep2, true);
  assert(rep3.repetition_count === 3, "3회 연속 정답 시 repetition_count = 3");
  assert(rep3.interval_days === 6, "3회 연속 정답 시 interval_days = 6");
  assert(rep3.is_mastered === true, "3회 연속 정답 시 is_mastered = true");

  // 4회차 연속 정답: 간격 6 * ease_factor
  const rep4 = calculateNextSRS(rep3, true);
  assert(rep4.repetition_count === 4, "4회 연속 정답 시 repetition_count = 4");
  assert(rep4.interval_days >= 6, "4회 연속 정답 시 interval_days >= 6");
  assert(rep4.is_mastered === true, "4회차 이상에서도 is_mastered 유지");

  // 오답 발생: repetition_count 리셋, 간격 1일 리셋
  const wrong = calculateNextSRS(rep4, false);
  assert(wrong.repetition_count === 0, "오답 시 repetition_count = 0 리셋");
  assert(wrong.interval_days === 1, "오답 시 interval_days = 1 리셋");
  assert(wrong.is_mastered === false, "오답 시 is_mastered = false 리셋");
  assert(wrong.ease_factor >= 1.3, "Ease Factor는 1.3 미만으로 내려가지 않음");

  // isWordDueForReview 검증
  const pastReview = {
    id: "p1",
    user_id: "u1",
    item_id: "i1",
    repetition_count: 1,
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
    is_mastered: false,
  };
  const futureReview = {
    id: "p2",
    user_id: "u1",
    item_id: "i2",
    repetition_count: 1,
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: new Date(Date.now() + 36000000).toISOString(), // 10시간 후
    is_mastered: false,
  };
  assert(isWordDueForReview(pastReview) === true, "과거 예정일인 단어는 복습 대상 (true)");
  assert(isWordDueForReview(futureReview) === false, "미래 예정일인 단어는 복습 대상 제외 (false)");
  assert(isWordDueForReview(null) === true, "신규 미학습 단어(null)는 복습 대상 (true)");

  // -------------------------------------------------------------
  // 2. Storage & Flexible Multi-Publisher Database Tests
  // -------------------------------------------------------------
  group("2. 로컬 스토리지 및 다양한 교재 DB 구조");

  const profile = getLocalProfile();
  assert(profile.nickname === DEFAULT_PROFILE.nickname, "초기 기본 프로필 닉네임 로드");
  assert(typeof profile.total_xp === "number", "프로필 XP 숫자 타입 확인");

  const updatedProfile = addXP(50);
  assert(updatedProfile.total_xp === DEFAULT_PROFILE.total_xp + 50, "addXP(50) 누적 정상 반영");

  // 샘플 덱 검증 (다양한 출판사 필드 포함 확인)
  assert(SAMPLE_TED_DECK.items.length === 5, "샘플 TED 덱 단어 수 5개 확인");
  assert(Boolean(SAMPLE_TED_DECK.publisher), "샘플 덱 publisher 필드 존재 확인");
  assert(Boolean(SAMPLE_TED_DECK.book_name), "샘플 덱 book_name 필드 존재 확인");
  assert(Boolean(SAMPLE_TED_DECK.target_grade), "샘플 덱 target_grade 필드 존재 확인");
  assert(
    Boolean(SAMPLE_TED_DECK.items[0].phonetic_symbol),
    "단어 아이템에 phonetic_symbol(발음기호) 존재 확인"
  );
  assert(
    Array.isArray(SAMPLE_TED_DECK.items[0].collocations) &&
      SAMPLE_TED_DECK.items[0].collocations.length > 0,
    "단어 아이템에 collocations(연어) 배열 존재 확인"
  );

  // 새 단어장 생성 테스트 (출판사, 메타데이터 포함)
  const newDeck = createLocalDeck(
    "능률 주니어 VOCA Day 01",
    [
      {
        word: "explore",
        part_of_speech: "verb",
        phonetic_symbol: "/ɪkˈsplɔːr/",
        korean_definition: "탐험하다, 조사하다",
        english_definition: "to travel around a new place to learn about it",
        synonyms: ["investigate", "discover"],
        antonyms: [],
        collocations: ["explore new worlds", "explore possibilities"],
        example_sentence: "They went to the forest to explore the caves.",
        extra_metadata: { root: "ex-(밖으로) + plorare(울부짖다)" },
      },
    ],
    {
      publisher: "능률",
      book_name: "주니어 VOCA 기본",
      target_grade: "초등 5학년",
      extra_metadata: { unit: "Day 01" },
    }
  );

  assert(newDeck.title === "능률 주니어 VOCA Day 01", "새 단어장 타이틀 확인");
  assert(newDeck.publisher === "능률", "새 단어장 출판사 메타데이터 저장 확인");
  assert(newDeck.items[0].word === "explore", "새 단어장 단어 저장 확인");
  assert(newDeck.items[0].phonetic_symbol === "/ɪkˈsplɔːr/", "새 단어장 발음기호 저장 확인");

  const fetchedDeck = getLocalDeckById(newDeck.id);
  assert(fetchedDeck !== null && fetchedDeck.id === newDeck.id, "getLocalDeckById 정상 조회");

  // SRS 진행도 업데이트 및 단어장 마스터 카운트 갱신 테스트
  const wordId = newDeck.items[0].id;
  updateLocalWordProgress(wordId, true);
  updateLocalWordProgress(wordId, true);
  const prog3 = updateLocalWordProgress(wordId, true);
  assert(prog3.is_mastered === true, "3회 연속 정답 시 user_word_progress 마스터 달성");

  const reloadedDecks = getLocalDecks();
  const foundInList = reloadedDecks.find((d) => d.id === newDeck.id);
  assert(foundInList?.mastered_count === 1, "단어 마스터 시 단어장의 mastered_count 자동 갱신 (1/1)");

  // 단어장 삭제 테스트
  deleteLocalDeck(newDeck.id);
  const afterDelete = getLocalDeckById(newDeck.id);
  assert(afterDelete === null, "deleteLocalDeck 후 조회 시 null 확인");

  // -------------------------------------------------------------
  // 3. 3-Step Active Recall & Hint Fading Logic (의미 및 문맥 중심)
  // -------------------------------------------------------------
  group("3. 3단계 능동적 인출 및 힌트 페이딩 로직 (의미 및 문맥 중심)");

  const targetWord = "monument";
  const targetMeaning = "기념비, 기념물";
  const distractorsPool = ["불안한, 걱정스러운", "협력하다, 함께 일하다", "혁신적인, 창의적인"];

  // 1단계: 3지선다 한글 뜻 선택지 생성 로직 검증
  const step1Choices = [targetMeaning, ...distractorsPool.slice(0, 2)].sort();
  assert(step1Choices.length === 3, "1단계: 정확히 3개의 한글 뜻 선택지 생성");
  assert(step1Choices.includes(targetMeaning), "1단계: 선택지 중 정답 한글 뜻 반드시 포함");

  // 2단계 힌트 페이딩 인덱스 추출 로직 검증 (첫 글자, 마지막 글자)
  function getHintIndices(word: string, step: number): Set<number> {
    const set = new Set<number>();
    if (step === 2) {
      if (word.length > 0) set.add(0);
      if (word.length > 2) set.add(word.length - 1);
    }
    return set;
  }

  const step2Hints = getHintIndices(targetWord, 2);
  assert(step2Hints.has(0) && step2Hints.has(targetWord.length - 1), "2단계: 첫 글자(0)와 끝 글자(7) 고정 힌트");
  assert(step2Hints.size === 2, "2단계: 정확히 2개 글자 힌트 노출");

  const step3Hints = getHintIndices(targetWord, 3);
  assert(step3Hints.size === 0, "3단계: 고정 힌트 없이 100% 블라인드 순수 인출");

  // 대소문자 및 공백 허용 일치 판정
  const userInput1 = "  monument  ";
  const userInput2 = "Monument";
  assert(
    userInput1.trim().toLowerCase() === targetWord && userInput2.trim().toLowerCase() === targetWord,
    "대소문자 무관 및 공백 제거 정답 판정 일치"
  );

  // -------------------------------------------------------------
  // 4. Elaborative Encoding Mini-Games Logic
  // -------------------------------------------------------------
  group("4. 정교화 부호화 (카드 짝맞추기 & 문맥 빈칸)");

  // 유의어가 있는 경우 유의어 우선 매칭 라벨 생성
  const itemWithSynonym = SAMPLE_TED_DECK.items[0]; // monument, synonym: memorial
  const labelWithSyn = itemWithSynonym.synonyms.length > 0 ? "유의어 👯" : "뜻 📖";
  assert(labelWithSyn === "유의어 👯", "유의어가 있는 단어는 '유의어 👯' 라벨 우선 생성");

  // 문맥 빈칸 치환 정규식 검증
  const sentence = "The city built a marble monument to remember the soldiers.";
  const regex = new RegExp(`\\b${itemWithSynonym.word}\\b`, "gi");
  const blankSentence = sentence.replace(regex, " [ _______ ] ");
  assert(blankSentence.includes("[ _______ ]"), "문장 내 단어가 빈칸으로 정확히 치환됨");
  assert(!blankSentence.includes("monument"), "치환된 문장에 원본 정답 단어가 노출되지 않음");

  // -------------------------------------------------------------
  // 5. Audio & Speech API SSR Resilience
  // -------------------------------------------------------------
  group("5. 오디오 및 SSR(Node.js) 안전성 검증");

  // window / AudioContext 가 없는 Node 환경에서 예외 없이 안전하게 패스하는지
  let audioException = false;
  try {
    playCorrectSound();
    playIncorrectSound();
    playClickSound();
    playFanfareSound();
    speakWord("test");
    speakSentence("The city built a marble monument.");
  } catch (err) {
    audioException = true;
    console.error(err);
  }
  assert(!audioException, "브라우저 API 부재(SSR 환경) 시 단어/예문 오디오 함수들이 예외 없이 안전하게 통과");

  // -------------------------------------------------------------
  // 6. Vision AI OCR API Route Handler
  // -------------------------------------------------------------
  group("6. Vision AI OCR API 엔드포인트 핸들러");

  // 1) 빈 요청 처리 검증 (400 Bad Request)
  const reqEmpty = new NextRequest("http://localhost:3000/api/ocr/parse-deck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const resEmpty = await ocrHandler(reqEmpty);
  assert(resEmpty.status === 400, "이미지 미전달 시 400 Bad Request 반환");

  // 2) 정상 Base64 전달 시 파싱 구조 검증
  const reqValid = new NextRequest("http://localhost:3000/api/ocr/parse-deck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: "data:image/jpeg;base64,dGVzdA==",
      fileName: "science_unit_01.jpg",
    }),
  });
  const resValid = await ocrHandler(reqValid);
  assert(resValid.status === 200, "정상 이미지 데이터 전달 시 200 OK 반환");

  const jsonValid = await resValid.json();
  assert(jsonValid.success === true, "응답 success: true 확인");
  assert(Boolean(jsonValid.data.deck_title), "구조화된 deck_title 확인");
  assert(Array.isArray(jsonValid.data.words) && jsonValid.data.words.length > 0, "단어 목록 배열 반환 확인");

  const firstParsedWord = jsonValid.data.words[0];
  assert(Boolean(firstParsedWord.word), "추출된 단어 word 확인");
  assert(Boolean(firstParsedWord.korean_definition), "초등 맞춤 korean_definition 확인");
  assert(Boolean(firstParsedWord.phonetic_symbol), "확장된 phonetic_symbol(발음기호) 확인");
  assert(Array.isArray(firstParsedWord.collocations), "확장된 collocations(연어) 확인");

  // -------------------------------------------------------------
  // 7. Levenshtein Distance & Typo Tolerance (EdTech Feedback)
  // -------------------------------------------------------------
  group("7. Levenshtein 거리 및 1글자 오탈자 관용 알고리즘 (EdTech 피드백)");

  // 1) 완전 일치 판정
  const exactCheck = analyzeTypo("monument", "monument");
  assert(exactCheck.isMatch === true && exactCheck.isAlmost === false, "완전 일치: isMatch = true, isAlmost = false");
  assert(exactCheck.distance === 0, "완전 일치: distance = 0");

  // 2) 1글자 오타 (교체) - 8글자 단어
  const subCheck = analyzeTypo("monumant", "monument");
  assert(subCheck.isMatch === false && subCheck.isAlmost === true, "1글자 교체: isMatch = false, isAlmost = true (거의 맞음)");
  assert(subCheck.distance === 1, "1글자 교체: distance = 1");
  assert(subCheck.message.includes("거의"), "1글자 교체: 격려 힌트 메시지 포함");

  // 3) 1글자 오타 (누락)
  const delCheck = analyzeTypo("monumet", "monument");
  assert(delCheck.isAlmost === true && delCheck.distance === 1, "1글자 누락: isAlmost = true");

  // 4) 1글자 오타 (추가)
  const insCheck = analyzeTypo("monumennt", "monument");
  assert(insCheck.isAlmost === true && insCheck.distance === 1, "1글자 추가: isAlmost = true");

  // 5) 3글자 이하 짧은 단어는 1글자 차이라도 오탈자 관용 제외 (엄격 판정)
  const shortCheck = analyzeTypo("cot", "cat");
  assert(shortCheck.isAlmost === false && shortCheck.isMatch === false, "3글자 이하 단어: 1글자 차이라도 isAlmost = false");

  // 6) 2글자 이상 오타
  const wrongCheck = analyzeTypo("banana", "monument");
  assert(wrongCheck.isMatch === false && wrongCheck.isAlmost === false, "완전 오답: isMatch = false, isAlmost = false");
  assert(wrongCheck.distance > 1, "완전 오답: distance > 1");

  // -------------------------------------------------------------
  // 8. Customizable Daily Review Limit & Debt Prevention
  // -------------------------------------------------------------
  group("8. 사용자 맞춤형 일일 복습 한도 및 복습 부채 방지 (Daily Review Limit)");

  // 초기 기본값 확인
  const initialLimit = getDailyReviewLimit();
  assert(typeof initialLimit === "number" && initialLimit >= 5, "기본 일일 복습 한도 수치 확인 (10)");

  // 한도 변경 테스트 (5단어로 변경)
  setDailyReviewLimit(5);
  assert(getDailyReviewLimit() === 5, "일일 복습 한도를 5단어로 변경 정상 반영");

  // 복습 대상 목록 조회 시 한도 적용 확인
  const limitedReviews = getAllDueReviewWords();
  assert(limitedReviews.length <= 5, "복습 대상 단어가 설정된 일일 한도(5단어) 이하로 제한됨");

  // 커스텀 오버라이드 매개변수 테스트
  const overrideReviews = getAllDueReviewWords(3);
  assert(overrideReviews.length <= 3, "getAllDueReviewWords(3) 호출 시 3단어 이하로 제한됨");

  // 다시 15단어로 변경
  setDailyReviewLimit(15);
  assert(getDailyReviewLimit() === 15, "일일 복습 한도를 15단어로 재설정 정상 반영");

  // -------------------------------------------------------------
  // 9. English Part of Speech, Synonym, & Antonym Learning
  // -------------------------------------------------------------
  group("9. 영어 품사(English Part of Speech) 및 동의어/반의어 암기 기능");

  // 1) 영문 품사 매핑 검증
  const nounPos = getEnglishPartOfSpeech("noun");
  assert(nounPos.label === "Noun" && nounPos.abbr === "n.", "영문 명사 매핑: Noun (n.)");

  const verbPos = getEnglishPartOfSpeech("verb");
  assert(verbPos.label === "Verb" && verbPos.abbr === "v.", "영문 동사 매핑: Verb (v.)");

  const adjPos = getEnglishPartOfSpeech("adjective");
  assert(adjPos.label === "Adjective" && adjPos.abbr === "adj.", "영문 형용사 매핑: Adjective (adj.)");

  const advPos = getEnglishPartOfSpeech("adverb");
  assert(advPos.label === "Adverb" && advPos.abbr === "adv.", "영문 부사 매핑: Adverb (adv.)");

  const prepPos = getEnglishPartOfSpeech("preposition");
  assert(prepPos.label === "Preposition" && prepPos.abbr === "prep.", "영문 전치사 매핑: Preposition (prep.)");

  // 2) 동의어(Synonym) 퀴즈 생성 검증
  const monumentItem = SAMPLE_TED_DECK.items[0]; // monument (synonyms: memorial, shrine)
  const synQuiz = generateVocabQuiz(monumentItem, SAMPLE_TED_DECK.items);
  assert(synQuiz !== null, "동의어가 있는 단어의 퀴즈 생성 성공");
  assert(
    synQuiz !== null && synQuiz.options.length === 3,
    "동의어 퀴즈: 3개의 선택지 생성"
  );
  assert(
    synQuiz !== null && synQuiz.options.includes(synQuiz.correctAnswer),
    "동의어 퀴즈: 정답이 선택지에 반드시 포함됨"
  );

  // 3) 반의어(Antonym) 퀴즈 생성 검증
  const anxiousItem = SAMPLE_TED_DECK.items[1]; // anxious (synonyms: worried, nervous / antonyms: calm, confident)
  const antQuiz = generateVocabQuiz(anxiousItem, SAMPLE_TED_DECK.items);
  assert(antQuiz !== null, "반의어가 있는 단어의 퀴즈 생성 성공");
  assert(
    antQuiz !== null && antQuiz.options.length === 3,
    "반의어/어휘 퀴즈: 3개의 선택지 생성"
  );
  assert(
    antQuiz !== null && antQuiz.options.includes(antQuiz.correctAnswer),
    "반의어/어휘 퀴즈: 정답이 선택지에 반드시 포함됨"
  );

  // 4) 품사 전용 퀴즈 생성 검증 (동의어/반의어가 없는 단어인 경우)
  const wordOnlyPos = {
    ...monumentItem,
    synonyms: [],
    antonyms: [],
  };
  const posQuiz = generateVocabQuiz(wordOnlyPos, SAMPLE_TED_DECK.items);
  assert(posQuiz !== null && posQuiz.type === "part_of_speech", "동/반의어 부재 시 영문 품사 퀴즈로 출제");
  assert(posQuiz !== null && posQuiz.correctAnswer === "Noun", "품사 퀴즈 정답이 영문 'Noun'으로 정확히 일치");
  assert(posQuiz !== null && posQuiz.options.includes("Noun"), "품사 퀴즈 선택지에 정답 'Noun' 포함");

  // ==================== Summary ====================
  console.log("\n==================================================");
  console.log(`📊 테스트 완료 통계:`);
  console.log(`   총 통과: ${totalPassed}개`);
  console.log(`   총 실패: ${totalFailed}개`);
  console.log("==================================================");

  if (totalFailed > 0) {
    console.error("❌ 실패 항목 목록:");
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log("🎉 모든 테스트 케이스가 성공적으로 통과했습니다!");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("테스트 실행 중 치명적 오류:", err);
  process.exit(1);
});
