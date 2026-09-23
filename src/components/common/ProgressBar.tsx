"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  step?: number; // 1 | 2 | 3 (단어 내 단계)
}

export default function ProgressBar({
  current,
  total,
  label,
  step,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / Math.max(1, total)) * 100));

  return (
    <div className="w-full bg-slate-100 rounded-3xl p-3 border-2 border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-2 px-1 text-sm sm:text-base font-extrabold text-slate-700">
        <div className="flex items-center gap-2">
          <span>{label || "학습 진행률"}</span>
          {step && (
            <span className="bg-brand-100 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-black">
              {step === 1 && "1단계: 듣고 따라쓰기 🎧"}
              {step === 2 && "2단계: 힌트 채우기 💡"}
              {step === 3 && "3단계: 블라인드 도전 🔥"}
            </span>
          )}
        </div>
        <div className="text-brand-600 font-black">
          {current} / {total} 단어
        </div>
      </div>

      {/* 게이지 트랙 */}
      <div className="relative h-6 bg-slate-200 rounded-full overflow-visible flex items-center">
        {/* 채워지는 바 */}
        <motion.div
          className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />

        {/* 귀여운 러너 캐릭터 아이콘 (진행도 위치를 따라감) */}
        <motion.div
          className="absolute -top-3.5 -ml-4 flex flex-col items-center select-none pointer-events-none"
          initial={{ left: 0 }}
          animate={{ left: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <span className="text-2xl drop-shadow-md animate-bounce">🏃‍♂️</span>
        </motion.div>

        {/* 결승점 깃발 */}
        <div className="absolute right-1 -top-3 text-xl select-none">🏁</div>
      </div>
    </div>
  );
}
