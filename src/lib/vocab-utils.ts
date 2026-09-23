/**
 * 영어 품사(Part of Speech) 및 동의어(Synonym) / 반의어(Antonym) 학습 유틸리티
 */

import { VocabItem } from "@/types/vocab";

export interface EnglishPartOfSpeechInfo {
  label: string;      // e.g. "Noun", "Verb", "Adjective"
  abbr: string;       // e.g. "n.", "v.", "adj."
  fullText: string;   // e.g. "Noun (n.)"
  color: string;      // text color
  badgeClass: string; // Tailwind CSS classes for badge
  hint: string;       // English role hint for kids (e.g. "Naming word")
}

const COMMON_POS_POOL = ["Noun", "Verb", "Adjective", "Adverb"];

/**
 * 품사 문자열을 표준 영문 품사 정보로 매핑
 */
export function getEnglishPartOfSpeech(pos?: string): EnglishPartOfSpeechInfo {
  const p = (pos || "").toLowerCase().trim();

  if (p.includes("adv") || p.includes("adverb")) {
    return {
      label: "Adverb",
      abbr: "adv.",
      fullText: "Adverb (adv.)",
      color: "text-purple-800",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
      hint: "Modifies verb/adj (how/when)",
    };
  }

  if (p.includes("noun") || p === "n" || p === "n.") {
    return {
      label: "Noun",
      abbr: "n.",
      fullText: "Noun (n.)",
      color: "text-sky-700",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
      hint: "Person, place, or thing",
    };
  }

  if (p.includes("verb") || p === "v" || p === "v.") {
    return {
      label: "Verb",
      abbr: "v.",
      fullText: "Verb (v.)",
      color: "text-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      hint: "Action or state word",
    };
  }

  if (p.includes("adj") || p.includes("adjective") || p === "a" || p === "a.") {
    return {
      label: "Adjective",
      abbr: "adj.",
      fullText: "Adjective (adj.)",
      color: "text-amber-800",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      hint: "Describing word",
    };
  }

  if (p.includes("prep") || p.includes("preposition")) {
    return {
      label: "Preposition",
      abbr: "prep.",
      fullText: "Preposition (prep.)",
      color: "text-rose-800",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      hint: "Shows relationship/position",
    };
  }

  const capitalized = p ? p.charAt(0).toUpperCase() + p.slice(1) : "Word";
  return {
    label: capitalized,
    abbr: capitalized.slice(0, 3).toLowerCase() + ".",
    fullText: `${capitalized}`,
    color: "text-slate-700",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    hint: "Part of Speech",
  };
}

export interface VocabQuizItem {
  type: "synonym" | "antonym" | "part_of_speech";
  title: string;
  badge: string;
  question: string;
  targetWord: string;
  correctAnswer: string;
  options: string[];
}

/**
 * 단어의 품사/동의어/반의어 중 학습할 퀴즈 생성
 */
export function generateVocabQuiz(
  wordItem: VocabItem,
  allWords: VocabItem[] = []
): VocabQuizItem | null {
  const hasSynonyms = Array.isArray(wordItem.synonyms) && wordItem.synonyms.length > 0;
  const hasAntonyms = Array.isArray(wordItem.antonyms) && wordItem.antonyms.length > 0;
  const posInfo = getEnglishPartOfSpeech(wordItem.part_of_speech);

  // 사용 가능한 퀴즈 후보 목록
  const candidates: Array<"synonym" | "antonym" | "part_of_speech"> = [];
  if (hasSynonyms) candidates.push("synonym");
  if (hasAntonyms) candidates.push("antonym");
  if (wordItem.part_of_speech) candidates.push("part_of_speech");

  if (candidates.length === 0) return null;

  // 동의어/반의어 우선 출제 (둘 다 있으면 랜덤 선택, 없으면 품사)
  let chosenType: "synonym" | "antonym" | "part_of_speech";
  if (hasSynonyms && hasAntonyms) {
    chosenType = Math.random() > 0.5 ? "synonym" : "antonym";
  } else if (hasSynonyms) {
    chosenType = "synonym";
  } else if (hasAntonyms) {
    chosenType = "antonym";
  } else {
    chosenType = "part_of_speech";
  }

  // 1. Synonym Quiz
  if (chosenType === "synonym" && hasSynonyms) {
    const correctAnswer = wordItem.synonyms[0];
    const distractorPool = allWords
      .flatMap((w) => [
        ...(w.synonyms || []),
        ...(w.antonyms || []),
        w.word,
      ])
      .filter((w) => w.toLowerCase() !== correctAnswer.toLowerCase() && w.toLowerCase() !== wordItem.word.toLowerCase());

    const fallbackDistractors = ["calm", "fast", "bright", "create", "helpful", "simple"];
    const uniquePool = Array.from(new Set([...distractorPool, ...fallbackDistractors])).filter(
      (w) => w.toLowerCase() !== correctAnswer.toLowerCase()
    );

    const distractors = uniquePool.slice(0, 2);
    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    return {
      type: "synonym",
      title: "Synonym Challenge 👯",
      badge: "비슷한 말(Synonym)",
      question: `Find the Synonym (similar meaning) of "${wordItem.word}":`,
      targetWord: wordItem.word,
      correctAnswer,
      options,
    };
  }

  // 2. Antonym Quiz
  if (chosenType === "antonym" && hasAntonyms) {
    const correctAnswer = wordItem.antonyms[0];
    const distractorPool = allWords
      .flatMap((w) => [
        ...(w.antonyms || []),
        ...(w.synonyms || []),
        w.word,
      ])
      .filter((w) => w.toLowerCase() !== correctAnswer.toLowerCase() && w.toLowerCase() !== wordItem.word.toLowerCase());

    const fallbackDistractors = ["traditional", "worried", "calm", "compete", "dark", "heavy"];
    const uniquePool = Array.from(new Set([...distractorPool, ...fallbackDistractors])).filter(
      (w) => w.toLowerCase() !== correctAnswer.toLowerCase()
    );

    const distractors = uniquePool.slice(0, 2);
    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    return {
      type: "antonym",
      title: "Antonym Challenge ↔️",
      badge: "반대말(Antonym)",
      question: `Find the Antonym (opposite meaning) of "${wordItem.word}":`,
      targetWord: wordItem.word,
      correctAnswer,
      options,
    };
  }

  // 3. Part of Speech Quiz (영어로 암기)
  const correctPos = posInfo.label;
  const wrongPool = COMMON_POS_POOL.filter(
    (pos) => pos.toLowerCase() !== correctPos.toLowerCase()
  );
  const options = [correctPos, ...wrongPool.slice(0, 2)].sort(() => Math.random() - 0.5);

  return {
    type: "part_of_speech",
    title: "Part of Speech Challenge 🏷️",
    badge: "영어 품사(Part of Speech)",
    question: `What is the Part of Speech of "${wordItem.word}"?`,
    targetWord: wordItem.word,
    correctAnswer: correctPos,
    options,
  };
}
