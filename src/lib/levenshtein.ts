/**
 * Levenshtein Distance (편집 거리) 기반 오탈자 관용 판정 알고리즘
 * 초등학생이 1글자 실수(누락, 치환, 추가) 시 좌절하지 않도록 따뜻한 격려 힌트를 제공
 */

export function getLevenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 삭제
          dp[i][j - 1] + 1,     // 삽입
          dp[i - 1][j - 1] + 1  // 교체
        );
      }
    }
  }

  return dp[m][n];
}

export interface TypoAnalysisResult {
  isMatch: boolean;
  isAlmost: boolean;
  distance: number;
  message: string;
}

/**
 * 사용자 입력과 목표 단어를 비교하여 완전 일치, 1글자 오타(거의 맞음), 오답을 분석
 */
export function analyzeTypo(input: string, target: string): TypoAnalysisResult {
  const cleanInput = input.toLowerCase().trim();
  const cleanTarget = target.toLowerCase().trim();

  if (cleanInput === cleanTarget) {
    return {
      isMatch: true,
      isAlmost: false,
      distance: 0,
      message: "정답입니다! 완벽해요! 🎉",
    };
  }

  const distance = getLevenshteinDistance(cleanInput, cleanTarget);

  // 4글자 이상 단어에서 1글자 오타인 경우 "거의 맞았어요!" 인정
  if (distance === 1 && cleanTarget.length >= 4) {
    let hint = "거의 맞았어요! 1글자만 다듬어 볼까요? ✨";

    // 누락된 글자 힌트 감지
    if (cleanInput.length < cleanTarget.length) {
      hint = "거의 다 왔어요! 글자가 1개 빠진 것 같아요. 💡";
    } else if (cleanInput.length > cleanTarget.length) {
      hint = "거의 맞았어요! 필요 없는 글자가 1개 들어갔어요. 💡";
    } else {
      hint = "거의 맞았어요! 딱 1글자만 달라요, 한번 찾아볼까요? 🔍";
    }

    return {
      isMatch: false,
      isAlmost: true,
      distance,
      message: hint,
    };
  }

  return {
    isMatch: false,
    isAlmost: false,
    distance,
    message: "철자를 다시 한번 확인해 볼까요? 힘내요! 💪",
  };
}
