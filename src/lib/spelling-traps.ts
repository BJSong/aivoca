/**
 * 영어 철자 혼동 지점(Crucial Ambiguity Point) 감지 및 함정 보기 생성 엔진
 * 한국인 및 초중등 학습자가 가장 빈번하게 오탈자를 내는 철자 패턴을 타겟팅
 */

export interface SpellingTrapChallenge {
  id: string;
  word: string; // 원본 단어 (e.g. "vision")
  prefix: string; // 빈칸 앞부분 (e.g. "vis")
  correctChunk: string; // 정답 철자 (e.g. "io")
  suffix: string; // 빈칸 뒷부분 (e.g. "n")
  options: string[]; // 셔플된 2~3개 선택지 (e.g. ["io", "oi"])
  trapType: "double_consonant" | "vowel_pair" | "phonetic_vowel" | "suffix" | "dynamic";
  trapDescription: string; // 팁 설명 (e.g. "모음 순서 주의 (io vs oi)")
}

interface KnownTrapRule {
  regex: RegExp;
  extract: (match: RegExpMatchArray, word: string) => {
    prefix: string;
    correctChunk: string;
    suffix: string;
    distractors: string[];
    trapType: SpellingTrapChallenge["trapType"];
    description: string;
  };
}

const KNOWN_RULES: KnownTrapRule[] = [
  // 1. 모음 순서 혼동 (io vs oi)
  {
    regex: /([\s\S]*?)(io)([\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: ["oi"],
      trapType: "vowel_pair",
      description: "모음 순서 혼동 (io vs oi)",
    }),
  },
  // 2. 모음 순서 혼동 (ei vs ie)
  {
    regex: /([\s\S]*?)(ei|ie)([\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: [m[2].toLowerCase() === "ei" ? "ie" : "ei"],
      trapType: "vowel_pair",
      description: "ei / ie 모음 철자 혼동",
    }),
  },
  // 3. 이중 자음 vs 단일 자음 (gg vs g)
  {
    regex: /([\s\S]*?)(gg)([\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: ["g"],
      trapType: "double_consonant",
      description: "단일 자음 vs 이중 자음 (g vs gg)",
    }),
  },
  // 4. 이중 자음 vs 단일 자음 (cc vs c)
  {
    regex: /([\s\S]*?)(cc)([\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: ["c"],
      trapType: "double_consonant",
      description: "단일 자음 vs 이중 자음 (c vs cc)",
    }),
  },
  // 5. 이중 자음 vs 단일 자음 (rr vs r)
  {
    regex: /([\s\S]*?)(rr)([\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: ["r"],
      trapType: "double_consonant",
      description: "단일 자음 vs 이중 자음 (r vs rr)",
    }),
  },
  // 6. 접미사 혼동 (tion vs sion)
  {
    regex: /([\s\S]*?)(tion|sion)(\b[\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: [m[2].toLowerCase() === "tion" ? "sion" : "tion"],
      trapType: "suffix",
      description: "발음 유사 접미사 (-tion vs -sion)",
    }),
  },
  // 7. 접미사 혼동 (able vs ible)
  {
    regex: /([\s\S]*?)(able|ible)(\b[\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: [m[2].toLowerCase() === "able" ? "ible" : "able"],
      trapType: "suffix",
      description: "형용사 접미사 (-able vs -ible)",
    }),
  },
  // 8. 모음 치환 혼동 (deviate -> dev[i/e]ate)
  {
    regex: /([\s\S]*?dev)(i)(ate[\s\S]*)/i,
    extract: (m) => ({
      prefix: m[1],
      correctChunk: m[2],
      suffix: m[3],
      distractors: ["e"],
      trapType: "phonetic_vowel",
      description: "유사 모음 소리 (i vs e)",
    }),
  },
  // 9. 모음 r 연쇄 혼동 (term -> t[er/ur]m)
  {
    regex: /([\s\S]*?t)(er|ur|ar)(m[\s\S]*)/i,
    extract: (m) => {
      const chunk = m[2].toLowerCase();
      const alt = chunk === "er" ? "ur" : chunk === "ur" ? "er" : "er";
      return {
        prefix: m[1],
        correctChunk: m[2],
        suffix: m[3],
        distractors: [alt],
        trapType: "phonetic_vowel",
        description: "R-동화 모음 혼동 (er vs ur)",
      };
    },
  },
];

/**
 * 단어로부터 혼동 철자 챌린지 객체 생성
 */
export function generateSpellingTrap(wordItem: { id: string; word: string }): SpellingTrapChallenge {
  const clean = wordItem.word.trim();

  // 1) 기정의된 룰 매칭 시도
  for (const rule of KNOWN_RULES) {
    const match = clean.match(rule.regex);
    if (match) {
      const parsed = rule.extract(match, clean);
      const allOptions = [parsed.correctChunk, ...parsed.distractors].sort(
        () => Math.random() - 0.5
      );
      return {
        id: `trap-${wordItem.id}`,
        word: clean,
        prefix: parsed.prefix,
        correctChunk: parsed.correctChunk,
        suffix: parsed.suffix,
        options: allOptions,
        trapType: parsed.trapType,
        trapDescription: parsed.description,
      };
    }
  }

  // 2) 룰에 걸리지 않는 일반 단어: 단어 중앙부 모음/자음 동적 타겟팅
  // 단어 길이가 3글자 이상인 경우 중간 모음(인덱스 1 ~ length - 2) 탐색
  const vowels = ["a", "e", "i", "o", "u"];
  let targetIndex = -1;

  for (let i = 1; i < clean.length - 1; i++) {
    if (vowels.includes(clean[i].toLowerCase())) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex === -1) {
    // 모음이 없으면 중앙 글자 선택
    targetIndex = Math.max(1, Math.floor(clean.length / 2));
  }

  const prefix = clean.slice(0, targetIndex);
  const correctChunk = clean[targetIndex];
  const suffix = clean.slice(targetIndex + 1);

  // 음운적으로 그럴듯한 오답 생성
  const charLower = correctChunk.toLowerCase();
  let distractor = "e";
  if (charLower === "a") distractor = "e";
  else if (charLower === "e") distractor = "i";
  else if (charLower === "i") distractor = "e";
  else if (charLower === "o") distractor = "u";
  else if (charLower === "u") distractor = "o";
  else if (charLower === "c") distractor = "s";
  else if (charLower === "s") distractor = "c";
  else distractor = charLower === "a" ? "e" : "a";

  const options = [correctChunk, distractor].sort(() => Math.random() - 0.5);

  return {
    id: `trap-${wordItem.id}`,
    word: clean,
    prefix,
    correctChunk,
    suffix,
    options,
    trapType: "dynamic",
    trapDescription: `핵심 모음 철자 주의 (${correctChunk} vs ${distractor})`,
  };
}
