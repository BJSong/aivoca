"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  RotateCw,
  Home,
  CheckCircle2,
  Brain,
  Share2,
} from "lucide-react";
import {
  getAllDueReviewWords,
  updateLocalWordProgress,
  addXP,
  recordStudyActivity,
  getLocalProfile,
} from "@/lib/storage";
import { WordWithProgress, UserProfile } from "@/types/vocab";
import ProgressBar from "@/components/common/ProgressBar";
import ThreeStepRecall from "@/components/study/ThreeStepRecall";
import MatchingGame from "@/components/study/MatchingGame";
import Confetti from "@/components/common/Confetti";
import ParentReportModal from "@/components/study/ParentReportModal";
import { playFanfareSound } from "@/lib/audio";

export default function ReviewPage() {
  const router = useRouter();
  const [dueWords, setDueWords] = useState<WordWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<"recall" | "matching" | "completed">("recall");
  const [earnedXP, setEarnedXP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    setProfile(getLocalProfile());
    const words = getAllDueReviewWords();
    setDueWords(words);
    setIsLoading(false);
  }, []);

  const handleWordComplete = (success: boolean) => {
    if (dueWords.length === 0) return;
    const currentWord = dueWords[currentIndex];

    // SRS 진행도 갱신 (SM-2 알고리즘 반영)
    updateLocalWordProgress(currentWord.id, success);

    // XP 보상 (+25 XP per review word)
    const gained = 25;
    addXP(gained);
    setEarnedXP((prev) => prev + gained);

    if (currentIndex + 1 < dueWords.length) {
      setCurrentIndex((prev) => prev + 1);
      setSubStep(1);
    } else {
      setPhase("matching");
    }
  };

  const handleMatchingComplete = () => {
    addXP(30);
    setEarnedXP((prev) => prev + 30);
    recordStudyActivity();
    setPhase("completed");
    playFanfareSound();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-4xl text-brand-500">⏳</div>
      </div>
    );
  }

  // 복습할 단어가 없는 경우
  if (dueWords.length === 0) {
    return (
      <div className="card-chunky max-w-lg mx-auto text-center py-12 bg-white space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl shadow-inner">
          ✨
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
            오늘의 복습 퀘스트 완료!
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-500 mt-2">
            SM-2 망각곡선 알고리즘에 따른 오늘자 복습 단어를 모두 정복했습니다.
            새로운 교재를 촬영하거나 내 단어장에서 자유롭게 연습해보세요!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            href="/decks/new"
            className="btn-touch bg-sunny-400 hover:bg-sunny-500 text-slate-900 font-black rounded-2xl shadow-playful-sunny"
          >
            📸 새 교재 사진 찍기
          </Link>
          <Link
            href="/"
            className="btn-touch bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-playful-brand"
          >
            <Home className="w-5 h-5" />
            홈으로 가기
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = dueWords[currentIndex];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (confirm("복습을 중단하고 홈으로 이동하시겠어요?")) {
              router.push("/");
            }
          }}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1">
          <span className="text-xs font-black text-brand-600 flex items-center justify-center gap-1">
            <Brain className="w-4 h-4" />
            SM-2 망각곡선 일일 복습 퀘스트
          </span>
        </div>

        <div className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
          <span>+{earnedXP} XP</span>
        </div>
      </div>

      {/* 1. 복습 인출 훈련 */}
      {phase === "recall" && (
        <div className="space-y-6">
          <ProgressBar
            current={currentIndex + 1}
            total={dueWords.length}
            label="오늘의 망각곡선 복습"
            step={subStep}
          />

          <ThreeStepRecall
            key={currentWord.id}
            wordItem={currentWord}
            otherWords={dueWords}
            onWordComplete={handleWordComplete}
            onStepChange={(st) => setSubStep(st)}
          />
        </div>
      )}

      {/* 2. 유의어/반의어 매칭 */}
      {phase === "matching" && (
        <div className="space-y-6">
          <MatchingGame
            words={dueWords}
            onComplete={handleMatchingComplete}
          />
        </div>
      )}

      {/* 3. 복습 미션 클리어 */}
      {phase === "completed" && (
        <div className="card-chunky max-w-xl mx-auto text-center py-10 bg-white border-brand-200 shadow-xl space-y-6">
          <Confetti duration={3500} />

          <div className="w-24 h-24 mx-auto rounded-3xl bg-sunny-100 text-amber-600 flex items-center justify-center text-5xl shadow-playful-sunny animate-bounce">
            🎉
          </div>

          <div>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-4 py-1 rounded-full mb-2">
              REVIEW COMPLETE!
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              오늘의 복습 퀘스트 클리어!
            </h2>
            <p className="text-base font-semibold text-slate-600 mt-2">
              망각곡선 간격 반복을 실천하여 장기기억으로 안전하게 저장되었어요!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl">
              <span className="block text-xs font-bold text-brand-600">
                획득 경험치
              </span>
              <span className="font-black text-brand-700 text-xl">
                +{earnedXP} XP
              </span>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl">
              <span className="block text-xs font-bold text-orange-600">
                연속 출석
              </span>
              <span className="font-black text-orange-600 text-xl">
                🔥 스트릭 유지
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="btn-touch bg-sunny-400 hover:bg-sunny-500 text-slate-900 rounded-2xl font-black shadow-playful-sunny"
            >
              <Share2 className="w-5 h-5" />
              <span>엄마/아빠에게 자랑하기 💌</span>
            </button>

            <Link
              href="/"
              className="btn-touch bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black shadow-playful-brand"
            >
              <Home className="w-5 h-5" />
              <span>홈 대시보드로 이동</span>
            </Link>
          </div>

          {/* 학부모 칭찬 리포트 모달 */}
          <ParentReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            profile={profile}
            earnedXP={earnedXP}
            completedWords={dueWords}
          />
        </div>
      )}
    </div>
  );
}
