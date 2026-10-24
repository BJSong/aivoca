"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Shuffle,
  CheckCircle2,
  BookOpen,
  Zap,
  Target,
  FileText,
  Layers,
} from "lucide-react";

interface CombinedTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CombinedTestModal({
  isOpen,
  onClose,
}: CombinedTestModalProps) {
  const router = useRouter();

  // 선택된 주차 (기본값: 1~10주차 전체)
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);

  // 출제 문항 수 (기본: 20문항, 0이면 전체)
  const [questionCount, setQuestionCount] = useState<number>(20);

  // 학습 모드
  const [selectedMode, setSelectedMode] = useState<string>("three-step");

  if (!isOpen) return null;

  // 주차별 단어 수 맵 (6주차 12단어, 나머지 각 20단어)
  const getWeekWordCount = (w: number) => (w === 6 ? 12 : 20);
  const totalSelectedWords = selectedWeeks.reduce(
    (sum, w) => sum + getWeekWordCount(w),
    0
  );

  const toggleWeek = (w: number) => {
    if (selectedWeeks.includes(w)) {
      if (selectedWeeks.length > 1) {
        setSelectedWeeks(selectedWeeks.filter((x) => x !== w));
      }
    } else {
      setSelectedWeeks([...selectedWeeks, w].sort((a, b) => a - b));
    }
  };

  const handlePreset = (type: "all" | "first_half" | "second_half") => {
    if (type === "all") {
      setSelectedWeeks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    } else if (type === "first_half") {
      setSelectedWeeks([1, 2, 3, 4, 5]);
    } else {
      setSelectedWeeks([6, 7, 8, 9, 10]);
    }
  };

  const handleStart = () => {
    // 덱 ID 결정
    let targetDeckId = "deck-combined-all";
    if (selectedWeeks.length < 10) {
      targetDeckId = `deck-combined-weeks-${selectedWeeks.join("-")}`;
    }

    const queryParams = new URLSearchParams();
    queryParams.set("mode", selectedMode);
    queryParams.set("shuffle", "true");
    if (questionCount > 0 && questionCount < totalSelectedWords) {
      queryParams.set("limit", questionCount.toString());
    }

    router.push(`/study/${targetDeckId}?${queryParams.toString()}`);
    onClose();
  };

  const MODES = [
    {
      id: "three-step",
      name: "3단계 능동적 인출",
      desc: "객관식 → 힌트 페이딩 → 100% 블라인드 타이핑",
      icon: Target,
      badge: "추천",
    },
    {
      id: "speed-match",
      name: "스피드 매칭",
      desc: "빠르게 떨어지는 단어 뜻 낚아채기",
      icon: Zap,
      badge: "집중력",
    },
    {
      id: "word-bank-cloze",
      name: "문맥 빈칸 채우기",
      desc: "교재 예문 속 빈칸에 들어갈 단어 추론",
      icon: FileText,
      badge: "문해력",
    },
    {
      id: "spelling-sniper",
      name: "스펠링 스나이퍼",
      desc: "헷갈리는 철자 함정 피하고 정답 저격",
      icon: Sparkles,
      badge: "철자 완성",
    },
    {
      id: "matching",
      name: "카드 짝맞추기",
      desc: "단어와 영문 정의/동의어 카드 연결",
      icon: Layers,
      badge: "어휘력",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="card-chunky bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-brand-200 text-brand-600 flex items-center justify-center text-2xl shadow-inner">
            🎯
          </div>
          <div>
            <span className="bg-sunny-400 text-slate-900 text-xs font-black px-2.5 py-0.5 rounded-full">
              모의고사 설정
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">
              1~10주차 통합 셔플 테스트
            </h3>
          </div>
        </div>

        {/* 1. 주차 선택 프리셋 */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <span>시험 범위 선택</span>
              <span className="text-xs font-semibold text-brand-600">
                (선택: {totalSelectedWords}단어)
              </span>
            </label>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handlePreset("all")}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${
                  selectedWeeks.length === 10
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => handlePreset("first_half")}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${
                  selectedWeeks.length === 5 && selectedWeeks[0] === 1
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                1~5주차
              </button>
              <button
                type="button"
                onClick={() => handlePreset("second_half")}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${
                  selectedWeeks.length === 5 && selectedWeeks[0] === 6
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                6~10주차
              </button>
            </div>
          </div>

          {/* 주차 그리드 칩 */}
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => {
              const isSelected = selectedWeeks.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWeek(w)}
                  className={`py-2 px-1 rounded-xl text-xs font-black border-2 transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-brand-50 border-brand-500 text-brand-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <span>{w}주차</span>
                  <span className="text-[10px] font-normal opacity-75">
                    {getWeekWordCount(w)}단어
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 문항 수 선택 */}
        <div className="space-y-2 mb-5">
          <label className="text-sm font-black text-slate-700 flex items-center gap-1.5">
            <Shuffle className="w-4 h-4 text-sunny-500" />
            <span>출제 문항 수 (랜덤 셔플)</span>
          </label>

          <div className="grid grid-cols-4 gap-2">
            {[
              { count: 10, label: "10문제" },
              { count: 20, label: "20문제" },
              { count: 30, label: "30문제" },
              { count: 0, label: `전체 (${totalSelectedWords})` },
            ].map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setQuestionCount(opt.count)}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-all ${
                  questionCount === opt.count
                    ? "bg-sunny-50 border-sunny-400 text-slate-900 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 테스트 모드 선택 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-black text-slate-700">
            훈련 방식 선택
          </label>

          <div className="space-y-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  className={`w-full p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-brand-50/80 border-brand-500 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-brand-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-800">
                          {m.name}
                        </span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                            isSelected
                              ? "bg-brand-200 text-brand-900"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 시작 버튼 */}
        <button
          type="button"
          onClick={handleStart}
          className="btn-touch w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-2xl shadow-playful-brand flex items-center justify-center gap-2"
        >
          <Shuffle className="w-5 h-5" />
          <span>
            {questionCount === 0 ? totalSelectedWords : Math.min(questionCount, totalSelectedWords)}문제 셔플 모의고사 시작!
          </span>
        </button>
      </div>
    </div>
  );
}
