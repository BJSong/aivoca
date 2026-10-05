"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Flame,
  Trophy,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RotateCw,
  Plus,
  Trash2,
  Building,
  GraduationCap,
  Target,
} from "lucide-react";
import DailyGoalModal from "@/components/common/DailyGoalModal";
import {
  getLocalDecks,
  getLocalProfile,
  getAllDueReviewWords,
  deleteLocalDeck,
} from "@/lib/storage";
import { DeckWithItems, UserProfile, WordWithProgress } from "@/types/vocab";

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [decks, setDecks] = useState<DeckWithItems[]>([]);
  const [dueWords, setDueWords] = useState<WordWithProgress[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const loadData = () => {
    setProfile(getLocalProfile());
    setDecks(getLocalDecks());
    setDueWords(getAllDueReviewWords());
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleDeleteDeck = (deckId: string, title: string) => {
    if (confirm(`'${title}' 단어장을 정말 삭제하시겠어요?`)) {
      deleteLocalDeck(deckId);
      loadData();
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-4xl text-brand-500">⏳</div>
      </div>
    );
  }

  const level = profile ? Math.floor(profile.total_xp / 100) + 1 : 1;
  const currentLevelXP = (profile?.total_xp ?? 0) % 100;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. 상단 프로필 & 게이미피케이션 대시보드 카드 */}
      <section className="card-chunky bg-gradient-to-br from-brand-500 via-indigo-600 to-brand-700 text-white border-0 shadow-xl overflow-hidden relative">
        <div className="absolute right-3 -bottom-4 opacity-15 text-8xl sm:text-9xl select-none pointer-events-none">
          🏃‍♂️
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-4xl shadow-inner">
              🏃‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black">
                  {profile?.nickname || "스마트 러너"}
                </h1>
                <span className="bg-sunny-400 text-slate-900 text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-sm">
                  Lv.{level}
                </span>
              </div>
              <p className="text-sm font-medium text-brand-100 mt-1">
                오늘도 꾸준히 달려서 영단어 마스터가 되어보세요!
              </p>
            </div>
          </div>

          {/* 스트릭 & XP 뱃지 */}
          <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-brand-200">연속 학습</span>
              <div className="flex items-center gap-1 text-sunny-300 font-black text-lg">
                <Flame className="w-5 h-5 fill-sunny-400 text-sunny-400" />
                <span>{profile?.current_streak ?? 1}일째</span>
              </div>
            </div>

            <div className="flex-1 sm:flex-initial bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-brand-200">누적 경험치</span>
              <div className="flex items-center gap-1 text-white font-black text-lg">
                <Trophy className="w-5 h-5 text-sunny-300 fill-sunny-400" />
                <span>{profile?.total_xp ?? 0} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 레벨업 프로그레스 */}
        <div className="mt-6 pt-4 border-t border-white/15">
          <div className="flex justify-between text-xs font-bold text-brand-100 mb-1.5">
            <span>다음 레벨(Lv.{level + 1})까지</span>
            <span>{currentLevelXP} / 100 XP</span>
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-sunny-400 rounded-full transition-all duration-500"
              style={{ width: `${currentLevelXP}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. 대형 교재 사진 촬영 CTA 버튼 */}
      <section>
        <Link
          href="/decks/new"
          className="group block w-full bg-sunny-400 hover:bg-sunny-500 active:scale-[0.99] border-4 border-sunny-500 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-playful-sunny transition-all"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-3xl shadow-md group-hover:rotate-6 transition-transform">
                📸
              </div>
              <div>
                <span className="inline-block bg-white/80 text-slate-800 text-xs sm:text-sm font-black px-3 py-0.5 rounded-full mb-1">
                  AI VISION 단어장 자동 생성
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  교재 찰칵 찍고 단어장 만들기
                </h2>
                <p className="text-sm sm:text-base font-bold text-slate-700 mt-1">
                  영어 교재 한 페이지만 촬영하면 AI가 발음·뜻·연어·문맥까지 쏙 뽑아줘요!
                </p>
              </div>
            </div>

            <div className="btn-touch min-h-[52px] bg-slate-900 group-hover:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-lg shrink-0">
              <span>단어장 만들기</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/decks/import"
          className="group mt-3 flex items-center justify-between gap-3 w-full bg-white hover:bg-brand-50 border-2 border-brand-200 rounded-2xl px-5 py-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-black text-slate-800">제미나이 앱 JSON으로 만들기</p>
              <p className="text-xs font-semibold text-slate-500">
                무료 제미나이 앱에서 추출 → 붙여넣기 (AI 비용 0원)
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* 3. 오늘의 SRS 복습 퀘스트 배너 */}
      <section className="card-chunky border-indigo-200 bg-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-brand-600 flex items-center justify-center text-2xl font-black">
              🧠
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                  오늘의 복습 퀘스트
                </h3>
                <span className="bg-brand-100 text-brand-700 text-xs font-black px-2.5 py-0.5 rounded-full">
                  SM-2 망각곡선
                </span>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(true)}
                  className="text-xs font-bold text-slate-600 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                  title="하루 복습 목표량 변경"
                >
                  <Target className="w-3.5 h-3.5 text-brand-600" />
                  <span>하루 {profile?.daily_review_limit || 10}단어 목표</span>
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                {dueWords.length > 0
                  ? `오늘 기억이 사라지기 전에 복습할 단어가 ${dueWords.length}개 있어요!`
                  : "오늘 복습할 단어를 모두 완료했어요! 대단해요!"}
              </p>
            </div>
          </div>

          <Link
            href="/review"
            className={`btn-touch min-h-[48px] rounded-2xl font-black text-base sm:text-lg shrink-0 ${
              dueWords.length > 0
                ? "bg-brand-500 hover:bg-brand-600 text-white shadow-playful-brand"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            <RotateCw className="w-5 h-5" />
            <span>
              {dueWords.length > 0 ? `복습 시작 (${dueWords.length}단어)` : "복습 완료됨"}
            </span>
          </Link>
        </div>
      </section>

      {/* 4. 내 단어장 세트 목록 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            <span>내 단어장 모음</span>
            <span className="text-sm font-bold text-slate-400">
              ({decks.length})
            </span>
          </h3>

          <Link
            href="/decks/new"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>새 단어장</span>
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="card-chunky text-center py-12 border-dashed border-2 border-slate-300">
            <p className="text-lg font-bold text-slate-500">
              아직 등록된 단어장이 없습니다.
            </p>
            <Link
              href="/decks/new"
              className="mt-4 inline-flex items-center gap-2 btn-touch bg-brand-500 text-white rounded-2xl"
            >
              <Camera className="w-5 h-5" />
              첫 교재 사진 찍기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck) => {
              const mastered = deck.mastered_count ?? 0;
              const total = deck.items?.length || deck.items_count || 1;
              const percent = Math.round((mastered / total) * 100);

              return (
                <div
                  key={deck.id}
                  className="card-chunky hover:border-brand-300 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* 교재/출판사 배지 */}
                    {(deck.publisher || deck.target_grade || deck.book_name) && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {deck.publisher && (
                          <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {deck.publisher}
                          </span>
                        )}
                        {deck.target_grade && (
                          <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-amber-600" />
                            {deck.target_grade}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-lg sm:text-xl font-black text-slate-800 line-clamp-1">
                        {deck.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteDeck(deck.id, deck.title)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="단어장 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg">
                        총 {total}단어
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        마스터: {mastered}단어 ({percent}%)
                      </span>
                    </div>

                    {/* 단어 미리보기 배지 */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {deck.items?.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className="bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-md"
                        >
                          {item.word}
                        </span>
                      ))}
                      {(deck.items?.length || 0) > 4 && (
                        <span className="text-xs font-semibold text-slate-400 py-0.5">
                          +{(deck.items?.length || 0) - 4}개 더
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-100">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="btn-touch min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl"
                    >
                      <span>단어 보기</span>
                    </Link>

                    <Link
                      href={`/study/${deck.id}`}
                      className="btn-touch min-h-[44px] bg-brand-500 hover:bg-brand-600 text-white text-sm font-black rounded-xl shadow-playful-brand"
                    >
                      <Sparkles className="w-4 h-4 text-sunny-300" />
                      <span>훈련 시작</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 하루 복습 목표량 설정 모달 */}
      <DailyGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onGoalUpdated={() => loadData()}
      />
    </div>
  );
}
