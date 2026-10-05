"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Volume2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { VocabItem } from "@/types/vocab";
import {
  generateSpellingTrap,
  SpellingTrapChallenge,
} from "@/lib/spelling-traps";
import {
  playCorrectSound,
  playIncorrectSound,
  playClickSound,
  playFanfareSound,
  speakWord,
} from "@/lib/audio";
import Confetti from "@/components/common/Confetti";

interface SpellingSniperProps {
  words: VocabItem[];
  onComplete: () => void;
  onExit?: () => void;
  targetCount?: number;
}

export default function SpellingSniper({
  words,
  onComplete,
  onExit,
  targetCount = 10,
}: SpellingSniperProps) {
  // 1. 도전 과제 세트 생성 (최대 targetCount개)
  const trapList = useMemo<SpellingTrapChallenge[]>(() => {
    const list = [...words].sort(() => Math.random() - 0.5);
    const selected = list.slice(0, Math.min(targetCount, list.length));
    return selected.map((w) => generateSpellingTrap(w));
  }, [words, targetCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentTrap = trapList[currentIndex];
  const currentWordItem = useMemo(() => {
    if (!currentTrap) return null;
    return words.find((w) => w.word.toLowerCase() === currentTrap.word.toLowerCase());
  }, [currentTrap, words]);

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentTrap) return;
    playClickSound();

    setSelectedOption(option);
    setIsAnswered(true);

    if (option.toLowerCase() === currentTrap.correctChunk.toLowerCase()) {
      // 정답!
      setIsCorrect(true);
      playCorrectSound();
      speakWord(currentTrap.word, 1.0);

      setTimeout(() => {
        if (currentIndex + 1 < trapList.length) {
          setCurrentIndex((idx) => idx + 1);
          setSelectedOption(null);
          setIsAnswered(false);
          setIsCorrect(null);
        } else {
          setIsFinished(true);
          playFanfareSound();
        }
      }, 1400);
    } else {
      // 오답
      setIsCorrect(false);
      setMistakeCount((c) => c + 1);
      playIncorrectSound();

      setTimeout(() => {
        setIsAnswered(false);
        setSelectedOption(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  const progressPercent =
    trapList.length > 0 ? ((currentIndex + (isFinished ? 1 : 0)) / trapList.length) * 100 : 0;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {isFinished && <Confetti />}

      {/* 상단 헤더 */}
      <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-card border border-slate-100 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
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
                <span className="text-sm sm:text-base font-black text-rose-600">
                  스펠링 스나이퍼
                </span>
                <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold">
                  혼동 철자 저격
                </span>
              </div>
              <div className="text-xs text-slate-400 font-semibold">
                헷갈리기 쉬운 철자 함정을 정확하게 조준하세요!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm">
            <Crosshair className="w-4 h-4 text-rose-500" />
            <span>
              {Math.min(currentIndex + 1, trapList.length)} / {trapList.length}
            </span>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* 퀴즈 본문 카드 */}
      {!isFinished && currentTrap && (
        <motion.div
          key={`quiz-${currentTrap.id}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-card flex flex-col items-center text-center space-y-6"
        >
          {/* 단어 뜻 & 힌트 */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">어휘 의미</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800">
              {currentWordItem?.korean_definition || "올바른 철자를 완성하세요"}
            </div>
            {currentWordItem?.phonetic_symbol && (
              <div className="text-xs font-semibold text-slate-400 font-mono">
                {currentWordItem.phonetic_symbol}
              </div>
            )}
          </div>

          {/* 발음 듣기 버튼 */}
          <button
            type="button"
            onClick={() => speakWord(currentTrap.word, 1.0)}
            className="btn-touch px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-bold rounded-2xl flex items-center gap-2 border border-brand-200 transition"
          >
            <Volume2 className="w-4 h-4 text-brand-600" />
            <span>발음 들어보기</span>
          </button>

          {/* 타겟 단어 스펠링 슬롯 */}
          <div className="flex items-center justify-center gap-1 font-mono text-3xl sm:text-4xl font-black text-slate-800 py-3 px-6 bg-slate-50 rounded-2xl border-2 border-slate-200 tracking-wider">
            <span>{currentTrap.prefix}</span>

            {/* 빈칸 구간 */}
            <motion.span
              animate={
                isCorrect === false
                  ? { x: [-8, 8, -8, 8, 0] }
                  : isCorrect === true
                  ? { scale: [1, 1.15, 1] }
                  : {}
              }
              className={`inline-flex items-center justify-center min-w-[50px] px-2.5 py-0.5 rounded-xl border-2 mx-1 transition-all ${
                isCorrect === true
                  ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                  : isCorrect === false
                  ? "bg-rose-100 border-rose-500 text-rose-800"
                  : "bg-white border-dashed border-rose-400 text-rose-500 animate-pulse"
              }`}
            >
              {selectedOption || "?"}
            </motion.span>

            <span>{currentTrap.suffix}</span>
          </div>

          {/* 함정 설명 팁 */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{currentTrap.trapDescription}</span>
          </div>

          {/* 선택지 버튼들 (2~3개) */}
          <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 pt-2">
            {currentTrap.options.map((option) => {
              const isSelected = selectedOption === option;

              return (
                <button
                  key={`opt-${option}`}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`btn-touch min-h-[60px] sm:min-h-[70px] rounded-2xl font-black text-2xl sm:text-3xl border-2 flex items-center justify-center transition-all select-none font-mono ${
                    isSelected
                      ? isCorrect
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-playful-emerald scale-105"
                        : "bg-rose-500 border-rose-600 text-white shadow-playful"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-playful"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 완료 화면 */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-chunky max-w-md w-full bg-white border-4 border-rose-400 p-6 sm:p-8 text-center shadow-2xl space-y-5"
          >
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto shadow-playful animate-bounce">
              🎯
            </div>

            <div>
              <span className="text-xs font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                스펠링 스나이퍼 명중!
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
                철자 함정 격파 완료!
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                총 {trapList.length}개 단어의 헷갈리는 스펠링을 완벽하게 저격했습니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <div>
                <div className="text-xs font-bold text-slate-400">정답 단어</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">
                  {trapList.length}개
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400">오답 횟수</div>
                <div
                  className={`text-xl font-black mt-0.5 ${
                    mistakeCount === 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {mistakeCount === 0 ? "0회 (원샷원킬!)" : `${mistakeCount}회`}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsAnswered(false);
                  setIsCorrect(null);
                  setMistakeCount(0);
                  setIsFinished(false);
                }}
                className="flex-1 btn-touch py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>다시 저격</span>
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="flex-1 btn-touch py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 text-white font-black rounded-2xl shadow-playful flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>완료 & 보상</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
