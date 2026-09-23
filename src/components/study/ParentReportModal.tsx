"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Share2, Check, X, Heart, Sparkles, Copy } from "lucide-react";
import { VocabItem, UserProfile } from "@/types/vocab";

interface ParentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  earnedXP: number;
  completedWords: VocabItem[];
}

export default function ParentReportModal({
  isOpen,
  onClose,
  profile,
  earnedXP,
  completedWords,
}: ParentReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const nickname = profile?.nickname || "스마트 러너";
  const streak = profile?.current_streak || 1;

  const handleCopy = async () => {
    const wordSummary = completedWords
      .slice(0, 5)
      .map((w) => `• ${w.word} (${w.korean_definition})`)
      .join("\n");

    const message = `[AI Smart Vocab] 오늘의 단어 마스터 성적표 🏆\n\n` +
      `대견한 우리 ${nickname}이가 오늘 영어단어를 끝까지 스스로 완주했어요!\n\n` +
      `🔥 연속 학습: ${streak}일째\n` +
      `⚡ 오늘 획득 경험치: +${earnedXP} XP\n` +
      `📚 완벽 정복한 단어:\n${wordSummary}\n\n` +
      `오늘도 한 걸음 성장한 ${nickname}이에게 따뜻한 칭찬과 응원을 보내주세요! 🥰👏`;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-chunky max-w-lg w-full bg-white border-4 border-sunny-400 p-6 sm:p-7 relative shadow-2xl space-y-5"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 헤더 */}
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-sunny-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-playful-sunny animate-bounce">
              💌
            </div>
            <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full uppercase">
              학부모 칭찬 공유 카드
            </span>
            <h3 className="text-2xl font-black text-slate-800">
              엄마, 아빠! 저 오늘 완주했어요! 🎉
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              아이가 이룬 멋진 학습 성취를 카카오톡이나 문자로 자랑해 보세요.
            </p>
          </div>

          {/* 성취 요약 카드 */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <span className="text-sm font-bold text-slate-600">학습 학생</span>
              <span className="font-black text-slate-900">{nickname}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2.5">
              <span className="text-sm font-bold text-slate-600 flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                연속 출석
              </span>
              <span className="font-black text-orange-600">{streak}일 연속 달성!</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2.5">
              <span className="text-sm font-bold text-slate-600 flex items-center gap-1">
                <Trophy className="w-4 h-4 text-sunny-500 fill-sunny-400" />
                획득 경험치
              </span>
              <span className="font-black text-brand-600">+{earnedXP} XP</span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1.5">
                정복한 단어 ({completedWords.length}개)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {completedWords.map((w) => (
                  <span
                    key={w.id}
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-2 py-1 rounded-lg"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 공유 버튼 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full btn-touch min-h-[50px] rounded-2xl font-black text-base transition-all shadow-md flex items-center justify-center gap-2 ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-sunny-400 hover:bg-sunny-500 text-slate-900 shadow-playful-sunny"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>칭찬 문구가 복사되었습니다! (카톡에 붙여넣기)</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>칭찬 메시지 복사하기 (카카오톡/문자)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm font-bold"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
