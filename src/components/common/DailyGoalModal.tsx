"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, X, Check, Sparkles } from "lucide-react";
import { getDailyReviewLimit, setDailyReviewLimit } from "@/lib/storage";

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalUpdated?: (newGoal: number) => void;
}

const GOAL_OPTIONS = [
  { count: 5, label: "5단어", badge: "가볍게 시작 🌱", desc: "매일 부담 없이 3분 집중!" },
  { count: 10, label: "10단어", badge: "가장 추천 ⭐", desc: "초등 고학년에게 가장 이상적인 분량" },
  { count: 15, label: "15단어", badge: "열정 러너 🔥", desc: "영단어에 자신감이 붙었을 때" },
  { count: 20, label: "20단어", badge: "도전자 🏆", desc: "하루 15분 이상 집중 암기" },
  { count: 30, label: "30단어", badge: "단어 마스터 👑", desc: "시험 전 집중 스퍼트!" },
];

export default function DailyGoalModal({
  isOpen,
  onClose,
  onGoalUpdated,
}: DailyGoalModalProps) {
  const [currentGoal, setCurrentGoal] = useState(() => getDailyReviewLimit());

  if (!isOpen) return null;

  const handleSelectGoal = (count: number) => {
    setCurrentGoal(count);
    setDailyReviewLimit(count);
    onGoalUpdated?.(count);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-chunky max-w-md w-full bg-white border-2 border-brand-200 shadow-2xl p-6 relative space-y-5"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center mb-3">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">
              하루 복습 목표량 설정 🎯
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              단어가 많이 밀려도 오늘 정한 분량만큼만 나누어 복습해요.
            </p>
          </div>

          <div className="space-y-2.5">
            {GOAL_OPTIONS.map((opt) => {
              const isSelected = currentGoal === opt.count;

              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => handleSelectGoal(opt.count)}
                  className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                    isSelected
                      ? "bg-brand-50 border-brand-500 text-brand-900 shadow-playful-brand"
                      : "bg-slate-50 hover:bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg">{opt.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {opt.desc}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-[11px] font-semibold text-slate-400">
            💡 목표량은 언제든지 부모님이나 아이가 자유롭게 변경할 수 있습니다.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
