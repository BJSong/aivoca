"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import SpeedMatchGame from "@/components/study/SpeedMatchGame";
import WordBankCloze from "@/components/study/WordBankCloze";
import SpellingSniper from "@/components/study/SpellingSniper";
import Confetti from "@/components/common/Confetti";
import ParentReportModal from "@/components/study/ParentReportModal";
import { playFanfareSound } from "@/lib/audio";

function StudyContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = params.id as string;
  const mode = searchParams.get("mode") || "three-step";

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
    addXP(30);
    setEarnedXP((prev) => prev + 30);
    setPhase("story");
  };

  const handleStoryComplete = () => {
    addXP(20);
    setEarnedXP((prev) => prev + 20);
    recordStudyActivity();
    setPhase("completed");
    playFanfareSound();
  };

  // 특화 모드 완료 처리 (스피드 매칭, 문맥 빈칸, 스펠링 스나이퍼)
  const handleSpecialModeComplete = (modeName: string, xpBonus: number = 50) => {
    addXP(xpBonus);
    setEarnedXP((prev) => prev + xpBonus);
    recordStudyActivity();
    router.push(`/decks/${deckId}`);
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

  // 1. [신규 특화 모드 1] 스피드 10 매칭 (5+5 릴레이)
  if (mode === "speed-match") {
    return (
      <div className="py-2">
        <SpeedMatchGame
          words={deck.items}
          onComplete={(stats) => {
            handleSpecialModeComplete("스피드 10 매칭", 50);
          }}
          onExit={() => router.push(`/decks/${deckId}`)}
        />
      </div>
    );
  }

  // 2. [신규 특화 모드 2] 5문장 문맥 빈칸 챌린지 (Word Bank)
  if (mode === "word-bank") {
    return (
      <div className="py-2">
        <WordBankCloze
          words={deck.items}
          onComplete={() => {
            handleSpecialModeComplete("문맥 빈칸 챌린지", 50);
          }}
          onExit={() => router.push(`/decks/${deckId}`)}
        />
      </div>
    );
  }

  // 3. [신규 특화 모드 3] 스펠링 스나이퍼 (혼동 철자 저격)
  if (mode === "spelling-sniper") {
    return (
      <div className="py-2">
        <SpellingSniper
          words={deck.items}
          onComplete={() => {
            handleSpecialModeComplete("스펠링 스나이퍼", 50);
          }}
          onExit={() => router.push(`/decks/${deckId}`)}
        />
      </div>
    );
  }

  // 4. [기본 모드] 3단계 능동적 인출 훈련 파이프라인
  const currentWord = deck.items[currentIndex];

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 및 프로그레스 바 */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (confirm("학습을 중단하고 단어장으로 돌아가시겠어요?")) {
              router.push(`/decks/${deckId}`);
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
              <span className="block text-xs font-bold text-indigo-400">학습한 단어</span>
              <span className="text-2xl font-black text-indigo-700">
                {deck.items.length}단어
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
              <span className="block text-xs font-bold text-amber-400">획득 경험치</span>
              <span className="text-2xl font-black text-amber-600">
                +{earnedXP} XP
              </span>
            </div>
          </div>

          {/* 학부모 칭찬 공유 버튼 */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="w-full max-w-xs mx-auto btn-touch py-3 bg-sunny-100 hover:bg-sunny-200 border-2 border-sunny-400 text-amber-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-playful-sunny"
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>부모님께 칭찬 카드 보내기 💌</span>
          </button>

          {/* 복귀 버튼들 */}
          <div className="flex gap-3 max-w-xs mx-auto pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setSubStep(1);
                setPhase("recall");
              }}
              className="flex-1 btn-touch py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>다시 학습</span>
            </button>
            <Link
              href={`/decks/${deck.id}`}
              className="flex-1 btn-touch py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-sm shadow-playful-brand flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>단어장으로</span>
            </Link>
          </div>
        </div>
      )}

      {/* 학부모 칭찬 카드 모달 */}
      {isReportOpen && profile && (
        <ParentReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          profile={profile}
          earnedXP={earnedXP}
          completedWords={deck.items}
        />
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="card-chunky text-center py-16 text-slate-400 font-bold">
          학습 모드를 준비하고 있습니다...
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  );
}
