"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, RotateCcw, Clock, Zap, ArrowLeft, Volume2, CheckCircle2 } from "lucide-react";
import { VocabItem } from "@/types/vocab";
import {
  playComboSound,
  playIncorrectSound,
  playClickSound,
  playFanfareSound,
  speakWord,
} from "@/lib/audio";
import Confetti from "@/components/common/Confetti";

interface SpeedMatchGameProps {
  words: VocabItem[];
  onComplete: (stats: { timeSpentSec: number; totalPairs: number; mistakes: number }) => void;
  onExit?: () => void;
  targetCount?: number;
}

interface ItemChip {
  id: string; // word.id
  text: string;
  wordId: string;
}

export default function SpeedMatchGame({
  words,
  onComplete,
  onExit,
  targetCount = 10,
}: SpeedMatchGameProps) {
  // 1. 학습할 단어 풀 (최대 targetCount개, 기본 10단어)
  const pool = useMemo(() => {
    const list = [...words].sort(() => Math.random() - 0.5);
    return list.slice(0, Math.min(targetCount, list.length));
  }, [words, targetCount]);

  const totalPairs = pool.length;

  // 2. 큐 및 활성 단어 상태 관리
  // activeWordIds: 현재 화면에 표시되는 단어 ID 세트 (최대 5개)
  // queuedWords: 아직 화면에 등장하지 않은 대기 단어 배열
  const [activeWords, setActiveWords] = useState<VocabItem[]>([]);
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

  // 선택 상태
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [wrongSelection, setWrongSelection] = useState<{ wordId?: string; defId?: string } | null>(null);

  // 게임 통계
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 초기화: 첫 5개 단어를 active로, 나머지를 queue로 설정
  useEffect(() => {
    if (pool.length === 0) return;
    const initialActive = pool.slice(0, Math.min(5, pool.length));
    const initialQueue = pool.slice(5);

    setActiveWords(initialActive);
    setQueue(initialQueue);
    setMatchedIds(new Set());
    setSelectedWordId(null);
    setSelectedDefId(null);
    setWrongSelection(null);
    setCombo(0);
    setMaxCombo(0);
    setMistakes(0);
    setIsFinished(false);

    const start = Date.now();
    setStartTime(start);

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pool]);

  // 활성 단어 목록으로부터 좌측(영어) / 우측(한글) 칩 목록 구성
  // 순서가 매번 바뀌어 어지럽지 않도록 각 칩의 고유 키를 보존하며 안정적으로 셔플
  const [leftOrder, setLeftOrder] = useState<string[]>([]);
  const [rightOrder, setRightOrder] = useState<string[]>([]);

  useEffect(() => {
    // 새로 들어온 activeWords를 바탕으로 좌우 셔플 목록 갱신
    const activeIds = activeWords.map((w) => w.id);
    
    setLeftOrder((prev) => {
      // 기존 순서 유지하면서 새 단어는 랜덤 위치에 삽입
      const remaining = prev.filter((id) => activeIds.includes(id));
      const newItems = activeIds.filter((id) => !remaining.includes(id));
      return [...remaining, ...newItems.sort(() => Math.random() - 0.5)];
    });

    setRightOrder((prev) => {
      const remaining = prev.filter((id) => activeIds.includes(id));
      const newItems = activeIds.filter((id) => !remaining.includes(id));
      return [...remaining, ...newItems.sort(() => Math.random() - 0.5)];
    });
  }, [activeWords]);

  // 매칭 판정 로직
  const checkMatch = (wordId: string, defId: string) => {
    if (wordId === defId) {
      // 🎉 정답 매칭!
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      playComboSound(newCombo);

      // 단어 발음
      const matchedItem = pool.find((w) => w.id === wordId);
      if (matchedItem) {
        speakWord(matchedItem.word, 1.1);
      }

      setMatchedIds((prev) => {
        const next = new Set(prev);
        next.add(wordId);
        return next;
      });
      setSelectedWordId(null);
      setSelectedDefId(null);

      // 화면에서 맞춘 단어를 제거하고, 큐에 대기 중인 단어가 있으면 보충
      setTimeout(() => {
        setActiveWords((prevActive) => {
          const nextActive = prevActive.filter((w) => w.id !== wordId);
          if (queue.length > 0) {
            const [nextWord, ...restQueue] = queue;
            setQueue(restQueue);
            return [...nextActive, nextWord];
          }
          return nextActive;
        });

        // 모든 단어를 다 맞췄는지 검사
        if (matchedIds.size + 1 >= totalPairs) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsFinished(true);
          playFanfareSound();
        }
      }, 300);
    } else {
      // ❌ 오답
      playIncorrectSound();
      setCombo(0);
      setMistakes((m) => m + 1);
      setWrongSelection({ wordId, defId });

      setTimeout(() => {
        setSelectedWordId(null);
        setSelectedDefId(null);
        setWrongSelection(null);
      }, 500);
    }
  };

  // 좌측 영단어 클릭
  const handleSelectWord = (id: string) => {
    if (wrongSelection || matchedIds.has(id)) return;
    playClickSound();

    if (selectedWordId === id) {
      setSelectedWordId(null);
      return;
    }

    setSelectedWordId(id);
    if (selectedDefId) {
      checkMatch(id, selectedDefId);
    }
  };

  // 우측 한글 뜻 클릭
  const handleSelectDef = (id: string) => {
    if (wrongSelection || matchedIds.has(id)) return;
    playClickSound();

    if (selectedDefId === id) {
      setSelectedDefId(null);
      return;
    }

    setSelectedDefId(id);
    if (selectedWordId) {
      checkMatch(selectedWordId, id);
    }
  };

  // 진행률 (0 ~ 100%)
  const progressPercent = totalPairs > 0 ? (matchedIds.size / totalPairs) * 100 : 0;
  const timeFormatted = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {isFinished && <Confetti />}

      {/* 헤더 바: 뒤로가기, 타이머, 콤보, 진행률 */}
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
                <span className="text-sm sm:text-base font-black text-brand-700">스피드 10 매칭</span>
                <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-bold">
                  5+5 릴레이
                </span>
              </div>
              <div className="text-xs text-slate-400 font-semibold">
                영단어와 한글 뜻을 빠르게 연결하세요!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 콤보 배지 */}
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl font-black text-xs sm:text-sm transition-all ${
              combo >= 3
                ? "bg-amber-100 text-amber-700 border border-amber-300 scale-105 shadow-sm"
                : "bg-slate-100 text-slate-600"
            }`}>
              <Zap className={`w-4 h-4 ${combo >= 3 ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-400"}`} />
              <span>{combo} 콤보</span>
            </div>

            {/* 스톱워치 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-2xl font-mono font-bold text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{timeFormatted}s</span>
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mt-1.5 px-1">
          <span>진행: {matchedIds.size} / {totalPairs} 단어</span>
          <span>남은 대기: {queue.length}개</span>
        </div>
      </div>

      {/* 2열 릴레이 카드 인터페이스 (좌: 영어 5개 / 우: 한글 5개) */}
      <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
        {/* 좌측 열: 영단어 */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="text-center text-xs font-black text-brand-600 uppercase tracking-wider py-1">
            English Word
          </div>
          <AnimatePresence>
            {leftOrder.map((id) => {
              const wordItem = pool.find((w) => w.id === id);
              if (!wordItem) return null;

              const isMatched = matchedIds.has(id);
              const isSelected = selectedWordId === id;
              const isWrong = wrongSelection?.wordId === id;

              if (isMatched) {
                return (
                  <motion.div
                    key={`word-${id}-matched`}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="h-14 sm:h-16 rounded-2xl border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center pointer-events-none"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </motion.div>
                );
              }

              return (
                <motion.button
                  key={`word-${id}`}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: isWrong ? [0, -6, 6, -6, 6, 0] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleSelectWord(id)}
                  className={`btn-touch min-h-[56px] sm:min-h-[64px] px-3 sm:px-4 py-2 rounded-2xl font-black text-base sm:text-lg border-2 text-left flex items-center justify-between transition-all select-none ${
                    isWrong
                      ? "bg-red-50 border-red-400 text-red-600 shadow-playful"
                      : isSelected
                      ? "bg-brand-500 border-brand-600 text-white shadow-playful-brand scale-[1.02]"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-playful"
                  }`}
                >
                  <span className="truncate">{wordItem.word}</span>
                  <Volume2
                    className={`w-4 h-4 flex-shrink-0 ml-1.5 transition ${
                      isSelected ? "text-brand-100" : "text-slate-300 hover:text-brand-500"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(wordItem.word, 1.0);
                    }}
                  />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 우측 열: 한글 뜻 */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="text-center text-xs font-black text-emerald-600 uppercase tracking-wider py-1">
            Korean Meaning
          </div>
          <AnimatePresence>
            {rightOrder.map((id) => {
              const wordItem = pool.find((w) => w.id === id);
              if (!wordItem) return null;

              const isMatched = matchedIds.has(id);
              const isSelected = selectedDefId === id;
              const isWrong = wrongSelection?.defId === id;

              if (isMatched) {
                return (
                  <motion.div
                    key={`def-${id}-matched`}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="h-14 sm:h-16 rounded-2xl border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center pointer-events-none"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </motion.div>
                );
              }

              return (
                <motion.button
                  key={`def-${id}`}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: isWrong ? [0, -6, 6, -6, 6, 0] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleSelectDef(id)}
                  className={`btn-touch min-h-[56px] sm:min-h-[64px] px-3 sm:px-4 py-2 rounded-2xl font-bold text-sm sm:text-base border-2 text-left flex items-center justify-between transition-all select-none ${
                    isWrong
                      ? "bg-red-50 border-red-400 text-red-600 shadow-playful"
                      : isSelected
                      ? "bg-emerald-500 border-emerald-600 text-white shadow-playful-emerald scale-[1.02]"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-playful"
                  }`}
                >
                  <span className="line-clamp-2">{wordItem.korean_definition}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 완료 모달 */}
      <AnimatePresence>
        {isFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-chunky max-w-md w-full bg-white border-4 border-amber-400 p-6 sm:p-8 text-center shadow-2xl space-y-5"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-playful-sunny animate-bounce">
                🏆
              </div>

              <div>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  스피드 10 매칭 클리어!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
                  번개 같은 암기 완성! ⚡
                </h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  총 {totalPairs}개 단어의 의미를 정확하게 연결했습니다.
                </p>
              </div>

              {/* 기록 요약 */}
              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-xs font-bold text-slate-400">완주 시간</div>
                  <div className="text-lg sm:text-xl font-black text-brand-600 font-mono mt-0.5">
                    {timeFormatted}s
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400">최대 콤보</div>
                  <div className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">
                    {maxCombo}연속
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400">오답 횟수</div>
                  <div className={`text-lg sm:text-xl font-black mt-0.5 ${mistakes === 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {mistakes === 0 ? "0회(퍼펙트!)" : `${mistakes}회`}
                  </div>
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // 다시하기
                    const initialActive = pool.slice(0, Math.min(5, pool.length));
                    const initialQueue = pool.slice(5);
                    setActiveWords(initialActive);
                    setQueue(initialQueue);
                    setMatchedIds(new Set());
                    setSelectedWordId(null);
                    setSelectedDefId(null);
                    setWrongSelection(null);
                    setCombo(0);
                    setMaxCombo(0);
                    setMistakes(0);
                    setIsFinished(false);
                    const start = Date.now();
                    setStartTime(start);
                    timerRef.current = setInterval(() => {
                      setElapsedMs(Date.now() - start);
                    }, 100);
                  }}
                  className="flex-1 btn-touch py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 도전</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onComplete({
                      timeSpentSec: parseFloat(timeFormatted),
                      totalPairs,
                      mistakes,
                    });
                  }}
                  className="flex-1 btn-touch py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-black rounded-2xl shadow-playful-brand flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  <span>완료 & 보상</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
