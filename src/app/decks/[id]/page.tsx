"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Volume2,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  Layers,
  Lightbulb,
  GraduationCap,
  Building,
  Eye,
  EyeOff,
  Zap,
  Crosshair,
} from "lucide-react";
import { getDeckWordsWithProgress, getLocalDeckById } from "@/lib/storage";
import { DeckWithItems, WordWithProgress } from "@/types/vocab";
import { speakWord } from "@/lib/audio";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<DeckWithItems | null>(null);
  const [wordsWithProgress, setWordsWithProgress] = useState<WordWithProgress[]>([]);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isBlindMode, setIsBlindMode] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    const foundDeck = getLocalDeckById(deckId);
    if (foundDeck) {
      setDeck(foundDeck);
      setWordsWithProgress(getDeckWordsWithProgress(deckId));
    }
  }, [deckId]);

  const handleSpeak = (word: string) => {
    setPlayingWord(word);
    speakWord(word, 1.0, () => {
      setPlayingWord(null);
    });
  };

  if (!deck) {
    return (
      <div className="card-chunky text-center py-12">
        <p className="text-slate-500 font-bold mb-4">
          단어장을 찾을 수 없습니다.
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

  const masteredCount = wordsWithProgress.filter((w) => w.progress?.is_mastered).length;

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Link
          href={`/study/${deck.id}`}
          className="btn-touch min-h-[46px] bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-sm sm:text-base shadow-playful-brand"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>단어 훈련 시작</span>
        </Link>
      </div>

      {/* 교재 및 단어장 정보 카드 (확장된 메타데이터 표시) */}
      <div className="card-chunky bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {/* 교재 및 출판사 배지 */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {deck.publisher && (
                <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {deck.publisher}
                </span>
              )}
              {deck.book_name && (
                <span className="text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                  📖 {deck.book_name}
                </span>
              )}
              {deck.target_grade && (
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  {deck.target_grade}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
              {deck.title}
            </h1>

            {/* 교재별 추가 메타데이터 (유닛, 테마 등) */}
            {deck.extra_metadata && Object.keys(deck.extra_metadata).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold text-slate-500">
                {Object.entries(deck.extra_metadata).map(([key, val]) => (
                  <span
                    key={key}
                    className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                  >
                    {key === "unit" ? "📍 " : key === "theme" ? "💡 주제: " : `${key}: `}
                    {String(val)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center">
              <span className="block text-xs font-bold text-slate-400">총 단어</span>
              <span className="font-black text-slate-700 text-lg">
                {wordsWithProgress.length}
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center">
              <span className="block text-xs font-bold text-emerald-600">
                마스터
              </span>
              <span className="font-black text-emerald-700 text-lg">
                {masteredCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 맞춤 학습 훈련 모드 4종 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-lg text-slate-800">
            맞춤 훈련 모드 🎯
          </h3>
          <span className="text-xs font-bold text-slate-400">
            원하는 방식으로 집중 암기하세요
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. 3단계 능동적 인출 */}
          <Link
            href={`/study/${deck.id}?mode=three-step`}
            className="btn-touch p-4 bg-white hover:bg-brand-50/50 border-2 border-slate-200 hover:border-brand-400 rounded-2xl shadow-card transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                🚀
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span>3단계 인출 훈련</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-md font-bold">
                    기본 코스
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">
                  눈과 귀 ➔ 페이딩 ➔ 완전 인출
                </div>
              </div>
            </div>
            <Play className="w-4 h-4 text-slate-300 group-hover:text-brand-500 fill-current transition-colors" />
          </Link>

          {/* 2. 스피드 10 매칭 (5+5 릴레이) */}
          <Link
            href={`/study/${deck.id}?mode=speed-match`}
            className="btn-touch p-4 bg-white hover:bg-amber-50/50 border-2 border-slate-200 hover:border-amber-400 rounded-2xl shadow-card transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span>스피드 10 매칭</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold">
                    5+5 릴레이
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">
                  10단어 영-한 의미 고속 연결 콤보
                </div>
              </div>
            </div>
            <Zap className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </Link>

          {/* 3. 문맥 빈칸 챌린지 (Word Bank) */}
          <Link
            href={`/study/${deck.id}?mode=word-bank`}
            className="btn-touch p-4 bg-white hover:bg-emerald-50/50 border-2 border-slate-200 hover:border-emerald-400 rounded-2xl shadow-card transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                📖
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span>문맥 빈칸 챌린지</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold">
                    Word Bank
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">
                  5개 문장 속 빈칸 채우기 & 품사 힌트
                </div>
              </div>
            </div>
            <BookOpen className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </Link>

          {/* 4. 스펠링 스나이퍼 */}
          <Link
            href={`/study/${deck.id}?mode=spelling-sniper`}
            className="btn-touch p-4 bg-white hover:bg-rose-50/50 border-2 border-slate-200 hover:border-rose-400 rounded-2xl shadow-card transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span>스펠링 스나이퍼</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold">
                    철자 저격
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">
                  헷갈리는 철자 구간 집중 타격
                </div>
              </div>
            </div>
            <Crosshair className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* 단어 목록 (발음기호, 연어, 어원 등 유연한 렌더링) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-lg text-slate-800">
            수록 단어 목록 ({wordsWithProgress.length})
          </h3>

          <button
            type="button"
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={`btn-touch text-xs font-black px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              isBlindMode
                ? "bg-amber-100 border-amber-300 text-amber-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isBlindMode ? (
              <EyeOff className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>{isBlindMode ? "암기 테스트 모드 (뜻/어휘 가림)" : "암기 테스트 모드 켜기"}</span>
          </button>
        </div>

        {wordsWithProgress.map((item, idx) => {
          const isMastered = item.progress?.is_mastered;
          const repCount = item.progress?.repetition_count ?? 0;
          const posInfo = getEnglishPartOfSpeech(item.part_of_speech);

          return (
            <div
              key={item.id || idx}
              className="card-chunky bg-white p-4 sm:p-5 flex flex-col justify-between gap-3 border-slate-200 hover:border-brand-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.word)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      playingWord === item.word
                        ? "bg-brand-600 text-white scale-95"
                        : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                    }`}
                    title="원어민 발음 듣기"
                  >
                    <Volume2
                      className={`w-5 h-5 ${
                        playingWord === item.word ? "animate-pulse" : ""
                      }`}
                    />
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        {item.word}
                      </span>
                      {/* 발음기호 */}
                      {item.phonetic_symbol && (
                        <span className="text-sm font-semibold text-slate-400">
                          {item.phonetic_symbol}
                        </span>
                      )}
                      {/* 영어 품사 뱃지 */}
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md border ${posInfo.badgeClass}`}
                        title={posInfo.hint}
                      >
                        {posInfo.fullText}
                      </span>
                    </div>

                    {/* 한글 뜻 및 영어 뜻 (암기 모드 지원) */}
                    <div
                      className={
                        isBlindMode
                          ? "filter blur-sm select-none hover:filter-none transition-all cursor-pointer"
                          : ""
                      }
                      title={isBlindMode ? "마우스를 올리거나 터치하면 뜻이 보여요" : ""}
                    >
                      <p className="text-base font-bold text-slate-800 mt-1">
                        {item.korean_definition}
                      </p>

                      {item.english_definition && (
                        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                          {item.english_definition}
                        </p>
                      )}
                    </div>

                    {/* 동의어 / 반의어 목록 */}
                    {(item.synonyms?.length || item.antonyms?.length) ? (
                      <div
                        className={`flex flex-wrap items-center gap-2 pt-2 ${
                          isBlindMode
                            ? "filter blur-sm select-none hover:filter-none transition-all"
                            : ""
                        }`}
                      >
                        {item.synonyms && item.synonyms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-xl text-xs">
                            <span className="font-bold text-blue-700">👯 Synonym:</span>
                            {item.synonyms.map((syn, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleSpeak(syn)}
                                className="font-black text-blue-900 hover:text-blue-600 bg-white border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 active:scale-95 shadow-2xs"
                                title={`"${syn}" 발음 듣기`}
                              >
                                <span>{syn}</span>
                                <Volume2 className="w-3 h-3 text-blue-500" />
                              </button>
                            ))}
                          </div>
                        )}

                        {item.antonyms && item.antonyms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 bg-purple-50/80 border border-purple-200 px-2.5 py-1 rounded-xl text-xs">
                            <span className="font-bold text-purple-700">↔️ Antonym:</span>
                            {item.antonyms.map((ant, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleSpeak(ant)}
                                className="font-black text-purple-900 hover:text-purple-600 bg-white border border-purple-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 active:scale-95 shadow-2xs"
                                title={`"${ant}" 발음 듣기`}
                              >
                                <span>{ant}</span>
                                <Volume2 className="w-3 h-3 text-purple-500" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* SRS 마스터 상태 */}
                <div className="shrink-0">
                  {isMastered ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      마스터 ⭐
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {repCount > 0 ? `${repCount}회 정답` : "미학습"}
                    </span>
                  )}
                </div>
              </div>

              {/* 연어(collocation) 및 부가 정보 표시 */}
              {((item.collocations && item.collocations.length > 0) ||
                item.example_sentence ||
                (item.extra_metadata && Object.keys(item.extra_metadata).length > 0)) && (
                <div className="mt-2 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  {item.example_sentence && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-700">
                      <span className="font-bold text-brand-600">예문: </span>
                      <span>{item.example_sentence}</span>
                    </div>
                  )}

                  {item.collocations && item.collocations.length > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50/70 p-2 rounded-xl">
                      <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold shrink-0">연어(짝단어):</span>
                      <div className="flex flex-wrap gap-1">
                        {item.collocations.map((col, cIdx) => (
                          <span
                            key={cIdx}
                            className="bg-white border border-amber-300 px-1.5 py-0.5 rounded font-medium"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.extra_metadata && Object.keys(item.extra_metadata).length > 0 && (
                    <div className="flex items-center gap-2 text-slate-500 pl-1">
                      <Lightbulb className="w-3.5 h-3.5 text-sunny-500 shrink-0" />
                      {Object.entries(item.extra_metadata).map(([k, v]) => (
                        <span key={k}>
                          <strong className="text-slate-600">
                            {k === "root" || k === "etymology" ? "어원" : k}:
                          </strong>{" "}
                          {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
