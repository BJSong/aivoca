"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, Trophy, BookOpen, PlusCircle } from "lucide-react";
import { getLocalProfile } from "@/lib/storage";
import { UserProfile } from "@/types/vocab";

export default function Navbar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getLocalProfile());
    const interval = setInterval(() => {
      setProfile(getLocalProfile());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const level = profile ? Math.floor(profile.total_xp / 100) + 1 : 1;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-slate-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-playful-brand font-black text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl sm:text-2xl text-slate-800 tracking-tight flex items-center gap-1.5">
              AI Smart Vocab
              <Sparkles className="w-5 h-5 text-sunny-500 fill-sunny-400 inline" />
            </span>
            <span className="hidden sm:block text-xs font-semibold text-brand-600 -mt-1">
              초등 4~6학년 맞춤 영단어
            </span>
          </div>
        </Link>

        {/* 사용자 게이미피케이션 상태 (스트릭, XP, 레벨) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 연속 출석 스트릭 */}
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full text-orange-600 font-black text-sm sm:text-base shadow-sm">
            <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-bounce" />
            <span>{profile?.current_streak ?? 1}일</span>
          </div>

          {/* 경험치 & 레벨 */}
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full text-brand-700 font-black text-sm sm:text-base shadow-sm">
            <Trophy className="w-5 h-5 text-sunny-500 fill-sunny-400" />
            <span>Lv.{level}</span>
            <span className="text-xs font-semibold text-brand-500">
              ({profile?.total_xp ?? 0} XP)
            </span>
          </div>

          {/* 새 단어장 만들기 버튼 */}
          <Link
            href="/decks/new"
            className="hidden sm:flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-1.5 rounded-full text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>단어장 추가</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
