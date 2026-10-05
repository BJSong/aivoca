"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  Lightbulb,
  Volume2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { VocabItem } from "@/types/vocab";
import {
  playCorrectSound,
  playIncorrectSound,
  playClickSound,
  playFanfareSound,
  speakSentence,
  speakWord,
} from "@/lib/audio";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";
import Confetti from "@/components/common/Confetti";

interface WordBankClozeProps {
  words: VocabItem[];
  onComplete: () => void;
  onExit?: () => void;
  targetCount?: number; // 기본 5문장
}

interface SentenceItem {
  id: string; // wordItem.id
  word: string;
  wordItem: VocabItem;
  sentence: string; // 원문
  sentencePrefix: string; // 빈칸 앞부분
  sentenceSuffix: string; // 빈칸 뒷부분
  grammarClue: string; // 품사/문법 힌트
  koreanHint: string; // 뜻 힌트
}

export default function WordBankCloze({
  words,
  onComplete,
  onExit,
  targetCount = 5,
}: WordBankClozeProps) {
  // 1. 유효한 예문이 있는 5개 단어 선별
  const challengeItems = useMemo<SentenceItem[]>(() => {
    // 예문이 있는 단어 우선 선별
    const withExamples = words.filter((w) => !!(w.example_sentence || w.ted_context));
    const fallbackList = withExamples.length >= targetCount ? withExamples : words;

    const selected = [...fallbackList]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(targetCount, fallbackList.length));

    return selected.map((w) => {
      const sentence =
        w.example_sentence ||
        w.ted_context ||
        `The student learned how to use the word ${w.word} properly.`;

      // 단어를 빈칸으로 분리
      const escaped = w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      const match = sentence.match(regex);

      let prefix = "";
      let suffix = "";

      if (match && match.index !== undefined) {
        prefix = sentence.slice(0, match.index);
        suffix = sentence.slice(match.index + match[0].length);
      } else {
        // 단어 형태가 굴절되어 정확히 매칭되지 않는 경우 문장 첫 부분/끝 부분 처리
        prefix = sentence.replace(new RegExp(escaped, "i"), " ___ ");
        const parts = prefix.split(" ___ ");
        prefix = parts[0] || "";
        suffix = parts[1] || "";
      }

      const pos = getEnglishPartOfSpeech(w.part_of_speech);
      const grammarClue = `${pos.fullText} 자리`;

      return {
        id: w.id,
        word: w.word,
        wordItem: w,
        sentence,
        sentencePrefix: prefix,
        sentenceSuffix: suffix,
        grammarClue,
        koreanHint: w.korean_definition,
      };
    });
  }, [words, targetCount]);

  // 단어 은행 칩 목록 (단어 5개 셔플)
  const bankWords = useMemo(() => {
    return [...challengeItems].sort(() => Math.random() - 0.5).map((item) => ({
      id: item.id,
      word: item.word,
    }));
  }, [challengeItems]);

  // 상태 관리
  // sentenceAssignments: sentenceId -> assignedWordId (단어 배치 현황)
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  // 현재 선택된 단어 칩 (단어 은행에서 선택 후 문장 빈칸 클릭 지원)
  const [selectedBankWordId, setSelectedBankWordId] = useState<string | null>(null);
  // 문법/품사 힌트 노출 토글
  const [showGrammarClue, setShowGrammarClue] = useState(false);
  // 채점 결과 상태: null(미채점), { [sentenceId]: boolean }
  const [evaluation, setEvaluation] = useState<Record<string, boolean> | null>(null);
  const [isAllCorrect, setIsAllCorrect] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // 이미 배치된 단어 ID 목록
  const assignedWordIds = useMemo(() => {
    return new Set(Object.values(assignments));
  }, [assignments]);

  // 단어 은행 칩 클릭 핸들러
  const handleBankChipClick = (wordId: string) => {
    if (isAllCorrect) return;
    playClickSound();

    if (assignedWordIds.has(wordId)) {
      // 이미 배치된 단어 칩을 누르면 배치를 해제하여 단어 은행으로 복귀
      const targetSentenceId = Object.keys(assignments).find(
        (sId) => assignments[sId] === wordId
      );
      if (targetSentenceId) {
        setAssignments((prev) => {
          const next = { ...prev };
          delete next[targetSentenceId];
          return next;
        });
        setEvaluation(null);
      }
      setSelectedBankWordId(null);
      return;
    }

    if (selectedBankWordId === wordId) {
      setSelectedBankWordId(null);
    } else {
      setSelectedBankWordId(wordId);
    }
  };

  // 문장 빈칸 클릭 핸들러
  const handleBlankClick = (sentenceId: string) => {
    if (isAllCorrect) return;
    playClickSound();

    // 1) 이미 빈칸에 단어가 들어가 있다면 클릭 시 단어 은행으로 복귀
    if (assignments[sentenceId]) {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[sentenceId];
        return next;
      });
      setEvaluation(null);
      return;
    }

    // 2) 현재 선택된 단어 칩이 있다면 해당 빈칸에 배치
    if (selectedBankWordId) {
      setAssignments((prev) => ({
        ...prev,
        [sentenceId]: selectedBankWordId,
      }));
      setSelectedBankWordId(null);
      setEvaluation(null);
    }
  };

  // 일괄 채점
  const handleCheckAnswers = () => {
    playClickSound();
    const result: Record<string, boolean> = {};
    let correctCount = 0;

    challengeItems.forEach((item) => {
      const assignedId = assignments[item.id];
      const isCorrect = assignedId === item.id;
      result[item.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setEvaluation(result);
    setAttemptCount((prev) => prev + 1);

    if (correctCount === challengeItems.length) {
      // 전부 정답! 🎉
      setIsAllCorrect(true);
      playCorrectSound();
      playFanfareSound();
    } else {
      // 오답 발생: 틀린 배치는 1초 후 자동으로 단어 은행으로 복구하여 재도전 유도
      playIncorrectSound();
      setTimeout(() => {
        setAssignments((prev) => {
          const next = { ...prev };
          challengeItems.forEach((item) => {
            if (!result[item.id]) {
              delete next[item.id];
            }
          });
          return next;
        });
      }, 1200);
    }
  };

  // 모든 빈칸이 채워졌는지 여부
  const isReadyToCheck =
    challengeItems.length > 0 &&
    challengeItems.every((item) => !!assignments[item.id]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {isAllCorrect && <Confetti />}

      {/* 헤더 바 */}
      <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-card border border-slate-100 mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="btn-touch p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
                title="나가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-brand-700">
                  문맥 빈칸 챌린지
                </span>
                <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-bold">
                  5단어 Word Bank
                </span>
              </div>
              <div className="text-xs text-slate-400 font-semibold">
                단어 은행의 칩을 알맞은 문장 빈칸에 넣어보세요!
              </div>
            </div>
          </div>

          {/* 문법/품사 힌트 토글 버튼 */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowGrammarClue(!showGrammarClue);
            }}
            className={`btn-touch px-3 py-1.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              showGrammarClue
                ? "bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Lightbulb className={`w-4 h-4 ${showGrammarClue ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
            <span>{showGrammarClue ? "힌트 켜짐" : "문법 힌트"}</span>
          </button>
        </div>
      </div>

      {/* 상단: 단어 은행 (Word Bank) */}
      <div className="w-full bg-slate-50 border-2 border-brand-200 rounded-3xl p-4 sm:p-5 mb-6 shadow-inner">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-brand-700">
            <BookOpen className="w-4 h-4 text-brand-500" />
            <span>단어 은행 (Word Bank)</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {assignedWordIds.size} / {challengeItems.length}개 배치됨
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {bankWords.map((chip) => {
            const isAssigned = assignedWordIds.has(chip.id);
            const isSelected = selectedBankWordId === chip.id;

            return (
              <motion.button
                key={`bank-${chip.id}`}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBankChipClick(chip.id)}
                className={`btn-touch px-4 py-2.5 rounded-2xl font-black text-sm sm:text-base border-2 transition-all select-none shadow-sm ${
                  isAssigned
                    ? "bg-slate-200 border-slate-300 text-slate-400 line-through opacity-50 cursor-pointer"
                    : isSelected
                    ? "bg-sunny-300 border-sunny-500 text-slate-900 shadow-playful-sunny scale-105 ring-2 ring-sunny-400"
                    : "bg-white hover:bg-sunny-50 border-slate-200 text-slate-800 shadow-playful"
                }`}
              >
                {chip.word}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 중앙: 5개 문장 카드 리스트 */}
      <div className="w-full flex flex-col gap-3.5 mb-6">
        {challengeItems.map((item, index) => {
          const assignedId = assignments[item.id];
          const assignedWord = assignedId
            ? bankWords.find((b) => b.id === assignedId)?.word
            : null;

          const isEvaluated = evaluation !== null;
          const isCorrect = isEvaluated && evaluation[item.id];
          const isWrong = isEvaluated && evaluation[item.id] === false;

          return (
            <motion.div
              key={`sentence-${item.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-card ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-50/40"
                  : isWrong
                  ? "border-rose-400 bg-rose-50/40"
                  : "border-slate-200"
              }`}
            >
              {/* 문장 헤더: 번호 및 힌트 태그 */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-black flex items-center justify-center">
                  {index + 1}
                </span>

                <div className="flex items-center gap-2">
                  {showGrammarClue && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-600" />
                      <span>{item.grammarClue}</span>
                      <span className="text-slate-400">({item.koreanHint})</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => speakSentence(item.sentence)}
                    className="p-1 text-slate-400 hover:text-brand-500 rounded-lg transition"
                    title="문장 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 예문 문장 본문 및 빈칸 슬롯 */}
              <div className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
                <span>{item.sentencePrefix}</span>

                {/* 빈칸 버튼 */}
                <button
                  type="button"
                  onClick={() => handleBlankClick(item.id)}
                  className={`inline-flex items-center justify-center mx-1.5 px-3 py-1 rounded-xl min-w-[100px] border-2 font-black transition-all ${
                    assignedWord
                      ? isCorrect
                        ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                        : isWrong
                        ? "bg-rose-100 border-rose-500 text-rose-800 animate-shake"
                        : "bg-brand-50 border-brand-400 text-brand-800 shadow-sm"
                      : selectedBankWordId
                      ? "bg-sunny-100 border-dashed border-sunny-400 text-sunny-700 animate-pulse"
                      : "bg-slate-100 border-dashed border-slate-300 text-slate-400"
                  }`}
                >
                  {assignedWord || "[ 빈칸 터치 ]"}
                </button>

                <span>{item.sentenceSuffix}</span>
              </div>

              {/* 채점 피드백 안내 문구 */}
              {isCorrect && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200 text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>완벽한 문맥 매칭입니다!</span>
                </div>
              )}
              {isWrong && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 text-xs sm:text-sm font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>문맥이 맞지 않습니다. 잠시 후 단어가 반환됩니다.</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 하단 채점 & 액션 버튼 바 */}
      <div className="w-full flex gap-3">
        {!isAllCorrect ? (
          <button
            type="button"
            disabled={!isReadyToCheck}
            onClick={handleCheckAnswers}
            className={`w-full btn-touch py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all select-none ${
              isReadyToCheck
                ? "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-playful-brand cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300"
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>
              {isReadyToCheck
                ? "5문장 채점하기"
                : `빈칸을 모두 채워주세요 (${Object.keys(assignments).length}/5)`}
            </span>
          </button>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex gap-3"
          >
            <button
              type="button"
              onClick={() => {
                // 재도전
                setAssignments({});
                setSelectedBankWordId(null);
                setEvaluation(null);
                setIsAllCorrect(false);
              }}
              className="flex-1 btn-touch py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 풀기</span>
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 btn-touch py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-white font-black rounded-2xl shadow-playful-emerald flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>챌린지 완주 & 보상</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
