"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Sparkles, HelpCircle } from "lucide-react";
import { VocabItem } from "@/types/vocab";
import { playCorrectSound, playIncorrectSound } from "@/lib/audio";

interface StoryBlankGameProps {
  wordItem: VocabItem;
  otherWords: VocabItem[];
  onComplete: () => void;
}

export default function StoryBlankGame({
  wordItem,
  otherWords,
  onComplete,
}: StoryBlankGameProps) {
  const sentence =
    wordItem.example_sentence ||
    wordItem.ted_context ||
    `We can see the ${wordItem.word} standing tall.`;

  // 단어를 빈칸으로 치환
  const regex = new RegExp(`\\b${wordItem.word}\\b`, "gi");
  const sentenceWithBlank = sentence.replace(regex, " [ _______ ] ");

  // 보기 구성 (정답 단어 + 다른 단어 2~3개)
  const [options] = useState(() => {
    const distractors = otherWords
      .filter((w) => w.word !== wordItem.word)
      .slice(0, 3)
      .map((w) => w.word);

    const all = [wordItem.word, ...distractors];
    return all.sort(() => Math.random() - 0.5);
  });

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = (option: string) => {
    if (isCorrect) return;

    setSelectedWord(option);
    if (option.toLowerCase() === wordItem.word.toLowerCase()) {
      setIsCorrect(true);
      playCorrectSound();
      setTimeout(() => {
        onComplete();
      }, 1400);
    } else {
      setIsCorrect(false);
      playIncorrectSound();
      setTimeout(() => {
        setSelectedWord(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  return (
    <div className="card-chunky max-w-2xl mx-auto border-brand-200 bg-white">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-brand-700 px-4 py-1.5 rounded-full font-black text-sm mb-2 shadow-sm">
          <BookOpen className="w-4 h-4 text-brand-600" />
          <span>스토리 맥락 빈칸 완성 퀴즈</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
          교재 문맥 속 빈칸 채우기 📖
        </h3>
        <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1">
          문장의 빈칸에 들어갈 가장 알맞은 단어를 골라보세요!
        </p>
      </div>

      {/* 스토리 문장 카드 */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 mb-6 shadow-inner text-center">
        <p className="text-xl sm:text-2xl font-black text-slate-800 leading-relaxed">
          &ldquo;{sentenceWithBlank}&rdquo;
        </p>
        <div className="mt-3 text-sm font-bold text-brand-600">
          힌트: {wordItem.korean_definition}
        </div>
      </div>

      {/* 보기 버튼들 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
        {options.map((option, idx) => {
          const isThisSelected = selectedWord === option;

          return (
            <motion.button
              key={`${option}-${idx}`}
              type="button"
              disabled={isCorrect === true}
              onClick={() => handleSelect(option)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className={`btn-touch min-h-[60px] text-xl font-black rounded-2xl border-2 transition-all ${
                isThisSelected && isCorrect === true
                  ? "bg-emerald-500 border-emerald-600 text-white shadow-playful-mint"
                  : isThisSelected && isCorrect === false
                  ? "bg-rose-500 border-rose-600 text-white animate-shake"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-playful"
              }`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      {isCorrect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-emerald-100 border-2 border-emerald-400 text-emerald-900 rounded-2xl text-center font-black flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <span>정확한 맥락이에요! 문장 기억력이 쑥쑥 올랐어요! 🚀</span>
        </motion.div>
      )}
    </div>
  );
}
