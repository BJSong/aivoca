"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Sparkles, CheckCircle, Home, RotateCw, Share2 } from "lucide-react";
import {
  getLocalDeckById,
  updateLocalWordProgress,
  addXP,
  recordStudyActivity,
  getLocalProfile,
} from "@/lib/storage";
import { DeckWithItems, VocabItem, UserProfile } from "@/types/vocab";
import ProgressBar from "@/components/common/ProgressBar";
import ThreeStepRecall from "@/components/study/ThreeStepRecall";
import MatchingGame from "@/components/study/MatchingGame";
import StoryBlankGame from "@/components/study/StoryBlankGame";
import Confetti from "@/components/common/Confetti";
import ParentReportModal from "@/components/study/ParentReportModal";
import { playFanfareSound } from "@/lib/audio";

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<DeckWithItems | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<"recall" | "matching" | "story" | "completed">("recall");
  const [earnedXP, setEarnedXP] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    setProfile(getLocalProfile());
    if (!deckId) return;
    const found = getLocalDeckById(deckId);
    if (found && found.items.length > 0) {
      setDeck(found);
    }
  }, [deckId]);

  const handleWordComplete = (success: boolean) => {
    if (!deck) return;
    const currentWord = deck.items[currentIndex];

    // SRS 진행도 갱신
    updateLocalWordProgress(currentWord.id, success);

    // XP 보상 지급 (단어당 +20 XP)
    const gained = 20;
    addXP(gained);
    setEarnedXP((prev) => prev + gained);

    if (currentIndex + 1 < deck.items.length) {
      // 다음 단어로 진행
      setCurrentIndex((prev) => prev + 1);
      setSubStep(1);
    } else {
      // 모든 단어의 3단계 인출 완료 -> 정교화 부호화 짝맞추기 게임으로 진입!
      setPhase("matching");
    }
  };

  const handleMatchingComplete = () => {
    // 짝맞추기 보너스 XP (+30 XP)
    addXP(30);
    setEarnedXP((prev) => prev + 30);

    // TED 스토리 문맥 퀴즈로 진입!
    setPhase("story");
  };

  const handleStoryComplete = () => {
    // 스토리 보너스 XP (+20 XP)
    addXP(20);
    setEarnedXP((prev) => prev + 20);

    // 일일 학습 스트릭 및 활동 기록
    recordStudyActivity();

    // 최종 축하 화면
    setPhase("completed");
    playFanfareSound();
  };

  if (!deck || deck.items.length === 0) {
    return (
      <div className="card-chunky text-center py-12">
        <p className="text-slate-500 font-bold mb-4">
          학습할 단어가 없는 단어장입니다.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="btn-touch bg-brand-500 text-white rounded-2xl mx-auto"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const currentWord = deck.items[currentIndex];

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 및 프로그레스 바 */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (confirm("학습을 중단하고 홈으로 돌아가시겠어요?")) {
              router.push("/");
            }
          }}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1">
          <span className="text-xs font-black text-brand-600">
            {deck.title}
          </span>
        </div>

        <div className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
          <span>+{earnedXP} XP</span>
        </div>
      </div>

      {/* 1. 인출 훈련 단계 (Recall) */}
      {phase === "recall" && (
        <div className="space-y-6">
          <ProgressBar
            current={currentIndex + 1}
            total={deck.items.length}
            label={`${deck.title} 훈련`}
            step={subStep}
          />

          <ThreeStepRecall
            key={currentWord.id}
            wordItem={currentWord}
            otherWords={deck.items}
            onWordComplete={handleWordComplete}
            onStepChange={(st) => setSubStep(st)}
          />
        </div>
      )}

      {/* 2. 보너스 유의어/반의어 매칭 게임 (Elaborative Encoding) */}
      {phase === "matching" && (
        <div className="space-y-6">
          <MatchingGame
            words={deck.items}
            onComplete={handleMatchingComplete}
          />
        </div>
      )}

      {/* 3. TED 스토리 문맥 빈칸 완성 (Story Context) */}
      {phase === "story" && (
        <div className="space-y-6">
          <StoryBlankGame
            wordItem={deck.items[0]}
            otherWords={deck.items}
            onComplete={handleStoryComplete}
          />
        </div>
      )}

      {/* 4. 완료 축하 화면 (Celebration) */}
      {phase === "completed" && (
        <div className="card-chunky max-w-xl mx-auto text-center py-10 bg-white border-brand-200 shadow-xl space-y-6">
          <Confetti duration={3500} />

          <div className="w-24 h-24 mx-auto rounded-3xl bg-sunny-100 text-amber-600 flex items-center justify-center text-5xl shadow-playful-sunny animate-bounce">
            🏆
          </div>

          <div>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black px-4 py-1 rounded-full mb-2">
              SESSION CLEAR!
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              오늘의 단어 훈련 완주! 🎉
            </h2>
            <p className="text-base font-semibold text-slate-600 mt-2">
              3단계 인출부터 카드 짝맞추기까지 멋지게 해냈어요!
            </p>
          </div>

          {/* 획득 보상 요약 */}
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

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="btn-touch bg-sunny-400 hover:bg-sunny-500 text-slate-900 rounded-2xl font-black shadow-playful-sunny"
            >
              <Share2 className="w-5 h-5" />
              <span>엄마/아빠에게 자랑하기 💌</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setSubStep(1);
                setPhase("recall");
                setEarnedXP(0);
              }}
              className="btn-touch bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black"
            >
              <RotateCw className="w-5 h-5" />
              <span>한 번 더 복습하기</span>
            </button>

            <Link
              href="/"
              className="btn-touch bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black shadow-playful-brand"
            >
              <Home className="w-5 h-5" />
              <span>홈 대시보드</span>
            </Link>
          </div>

          {/* 학부모 칭찬 리포트 모달 */}
          <ParentReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            profile={profile}
            earnedXP={earnedXP}
            completedWords={deck.items}
          />
        </div>
      )}
    </div>
  );
}
