import { UserWordProgress } from "../types/vocab";

/**
 * SuperMemo SM-2 변형 간격 반복(SRS) 계산 함수
 * - 1회 성공: 1일 후
 * - 2회 성공: 3일 후
 * - 3회 성공: 6일 후 (그 이후는 interval * ease_factor)
 * - 오답 시: repetition_count = 0, interval_days = 1 로 리셋
 */
export function calculateNextSRS(
  prevProgress: Partial<UserWordProgress> | null | undefined,
  isCorrect: boolean,
  quality: number = 4 // 1~5 점 (기본 4: 보통의 정답)
): {
  repetition_count: number;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  is_mastered: boolean;
  last_reviewed_at: string;
} {
  const currentRep = prevProgress?.repetition_count ?? 0;
  const currentEase = prevProgress?.ease_factor ?? 2.5;
  const currentInterval = prevProgress?.interval_days ?? 0;
  const now = new Date();

  if (!isCorrect) {
    // 오답 발생 시 리셋
    const nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const newEase = Math.max(1.3, currentEase - 0.2);

    return {
      repetition_count: 0,
      ease_factor: Number(newEase.toFixed(2)),
      interval_days: 1,
      next_review_at: nextDate.toISOString(),
      is_mastered: false,
      last_reviewed_at: now.toISOString(),
    };
  }

  // 정답인 경우
  const nextRep = currentRep + 1;
  let nextInterval = 1;

  if (nextRep === 1) {
    nextInterval = 1;
  } else if (nextRep === 2) {
    nextInterval = 3;
  } else if (nextRep === 3) {
    nextInterval = 6;
  } else {
    nextInterval = Math.max(1, Math.round(currentInterval * currentEase));
  }

  // SM-2 Ease Factor 조정 공식 (초등학생용 4~5 평가 반영)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEase = Math.max(
    1.3,
    currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    repetition_count: nextRep,
    ease_factor: Number(newEase.toFixed(2)),
    interval_days: nextInterval,
    next_review_at: nextReviewDate.toISOString(),
    is_mastered: nextRep >= 3,
    last_reviewed_at: now.toISOString(),
  };
}

/**
 * 단어가 복습 대상인지 판별 (현재 시각이 next_review_at 이후인지)
 */
export function isWordDueForReview(progress?: UserWordProgress | null): boolean {
  if (!progress) return true; // 아직 한 번도 학습하지 않은 경우
  const nextDate = new Date(progress.next_review_at);
  return new Date() >= nextDate;
}
