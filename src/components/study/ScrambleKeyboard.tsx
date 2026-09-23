"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Delete, RotateCcw } from "lucide-react";
import { playClickSound } from "@/lib/audio";

interface ScrambleKeyboardProps {
  targetWord: string;
  step: 1 | 2 | 3;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

interface LetterItem {
  id: string;
  char: string;
  used: boolean;
}

export default function ScrambleKeyboard({
  targetWord,
  step,
  onSubmit,
  disabled = false,
}: ScrambleKeyboardProps) {
  const cleanTarget = targetWord.toLowerCase().trim();

  // 2단계(힌트 페이딩): 앞뒤 글자만 기본 제공 ('m _ _ _ _ _ n t')
  // 첫 글자, 마지막 글자 (또는 7글자 이상일 경우 중간 힌트)
  const initialFixedIndices = useMemo(() => {
    if (step !== 2) return new Set<number>();
    const set = new Set<number>();
    if (cleanTarget.length > 0) set.add(0);
    if (cleanTarget.length > 2) set.add(cleanTarget.length - 1);
    return set;
  }, [cleanTarget, step]);

  // 스크램블 블록 구성: 채워야 할 문자들 + 약간의 알파벳 섞기
  const [blocks, setBlocks] = useState<LetterItem[]>([]);
  // 사용자가 입력한 문자 배열 (길이는 cleanTarget.length)
  const [userSlots, setUserSlots] = useState<(LetterItem | null)[]>([]);

  // 단어 또는 단계가 변경될 때 초기화
  useEffect(() => {
    const chars = cleanTarget.split("");
    const neededLetters: LetterItem[] = [];

    chars.forEach((char, idx) => {
      // 2단계에서 고정 힌트인 글자는 블록 목록에서 제외
      if (step === 2 && initialFixedIndices.has(idx)) {
        return;
      }
      neededLetters.push({
        id: `char-${idx}-${char}-${Math.random()}`,
        char,
        used: false,
      });
    });

    // 셔플 알고리즘 (Fisher-Yates)
    const shuffled = [...neededLetters].sort(() => Math.random() - 0.5);
    setBlocks(shuffled);

    // 슬롯 초기화
    const slots = chars.map((char, idx) => {
      if (step === 2 && initialFixedIndices.has(idx)) {
        return {
          id: `fixed-${idx}`,
          char,
          used: true,
        };
      }
      return null;
    });

    setUserSlots(slots);
  }, [cleanTarget, step, initialFixedIndices]);

  // 블록 클릭하여 슬롯에 채우기
  const handleBlockClick = (block: LetterItem) => {
    if (disabled || block.used) return;
    playClickSound();

    // 첫 번째 빈 슬롯 찾기
    const emptyIndex = userSlots.findIndex((s) => s === null);
    if (emptyIndex === -1) return;

    const nextSlots = [...userSlots];
    nextSlots[emptyIndex] = block;
    setUserSlots(nextSlots);

    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, used: true } : b))
    );

    // 모든 슬롯이 다 찼는지 확인 후 자동 또는 즉시 제출 가능
    const allFilled = nextSlots.every((s) => s !== null);
    if (allFilled) {
      const answer = nextSlots.map((s) => s?.char || "").join("");
      setTimeout(() => onSubmit(answer), 200);
    }
  };

  // 특정 슬롯 비우기
  const handleSlotClick = (index: number) => {
    if (disabled) return;
    if (step === 2 && initialFixedIndices.has(index)) return; // 고정 힌트는 클릭 취소 불가

    const slotItem = userSlots[index];
    if (!slotItem) return;

    playClickSound();

    const nextSlots = [...userSlots];
    nextSlots[index] = null;
    setUserSlots(nextSlots);

    // 블록 반환
    setBlocks((prev) =>
      prev.map((b) => (b.id === slotItem.id ? { ...b, used: false } : b))
    );
  };

  // 마지막 입력 문자 삭제
  const handleBackspace = () => {
    if (disabled) return;
    // 뒤에서부터 비어있지 않고 고정되지 않은 슬롯 찾기
    for (let i = userSlots.length - 1; i >= 0; i--) {
      if (userSlots[i] !== null && (!initialFixedIndices.has(i) || step !== 2)) {
        handleSlotClick(i);
        break;
      }
    }
  };

  // 전체 초기화
  const handleReset = () => {
    if (disabled) return;
    playClickSound();
    setUserSlots(
      cleanTarget.split("").map((char, idx) => {
        if (step === 2 && initialFixedIndices.has(idx)) {
          return { id: `fixed-${idx}`, char, used: true };
        }
        return null;
      })
    );
    setBlocks((prev) => prev.map((b) => ({ ...b, used: false })));
  };

  // 물리 키보드 입력 지원 (데스크톱/노트북 사용자 배려)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Backspace") {
        handleBackspace();
        return;
      }
      if (e.key === "Enter") {
        const answer = userSlots.map((s) => s?.char || "").join("");
        if (answer.length === cleanTarget.length) {
          onSubmit(answer);
        }
        return;
      }

      const pressed = e.key.toLowerCase();
      if (/^[a-z]$/.test(pressed)) {
        // 사용 가능한 블록 중 일치하는 문자 찾기
        const matchingBlock = blocks.find(
          (b) => !b.used && b.char.toLowerCase() === pressed
        );
        if (matchingBlock) {
          handleBlockClick(matchingBlock);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blocks, userSlots, disabled, cleanTarget, step]);

  const currentAnswer = userSlots.map((s) => s?.char || "").join("");
  const isComplete = userSlots.every((s) => s !== null);

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* 1단계(눈과 귀): 전체 스펠링 힌트 살짝 노출 */}
      {step === 1 && (
        <div className="text-center py-1 px-4 bg-brand-50 border border-brand-200 rounded-full text-brand-700 font-extrabold text-sm sm:text-base tracking-widest animate-pulse">
          따라 쓰기 가이드: <span className="underline">{cleanTarget.toUpperCase()}</span>
        </div>
      )}

      {/* 문자 슬롯 (정답 글자 박스들) */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-xl">
        {userSlots.map((slot, idx) => {
          const isFixed = step === 2 && initialFixedIndices.has(idx);
          const hasLetter = slot !== null;

          return (
            <button
              key={`slot-${idx}`}
              type="button"
              disabled={disabled || isFixed}
              onClick={() => handleSlotClick(idx)}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl transition-all select-none ${
                isFixed
                  ? "bg-amber-100 border-2 border-amber-400 text-amber-900 shadow-sm cursor-default"
                  : hasLetter
                  ? "bg-white border-2 border-brand-500 text-brand-800 shadow-playful-brand active:scale-95"
                  : "bg-slate-100 border-2 border-dashed border-slate-300 text-transparent"
              }`}
            >
              {slot?.char.toUpperCase() || (step === 1 ? cleanTarget[idx].toUpperCase() : "_")}
            </button>
          );
        })}
      </div>

      {/* 스크램블 알파벳 블록 버튼들 (터치로 단어 완성) */}
      <div className="w-full max-w-xl bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-inner">
        <div className="text-xs sm:text-sm font-bold text-slate-500 text-center mb-3">
          알파벳 블록을 터치하거나 키보드로 타이핑하세요!
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {blocks.map((block) => (
            <button
              key={block.id}
              type="button"
              disabled={disabled || block.used}
              onClick={() => handleBlockClick(block)}
              className={`w-12 h-13 sm:w-14 sm:h-15 rounded-2xl font-black text-xl sm:text-2xl transition-all shadow-playful select-none ${
                block.used
                  ? "opacity-20 scale-90 bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed"
                  : "bg-sunny-300 hover:bg-sunny-400 active:scale-90 border-2 border-sunny-400 text-slate-800 shadow-playful-sunny cursor-pointer"
              }`}
            >
              {block.char.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 조작 도구: 지우기, 다시하기 */}
        <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-slate-200">
          <button
            type="button"
            disabled={disabled}
            onClick={handleBackspace}
            className="btn-touch min-h-[44px] px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl"
          >
            <Delete className="w-4 h-4" />
            <span>글자 지우기</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={handleReset}
            className="btn-touch min-h-[44px] px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
