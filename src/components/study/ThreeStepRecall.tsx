"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Check,
  ArrowRight,
  Layers,
  Lightbulb,
} from "lucide-react";
import { VocabItem } from "@/types/vocab";
import SoundExplorer from "./SoundExplorer";
import ScrambleKeyboard from "./ScrambleKeyboard";
import {
  playCorrectSound,
  playIncorrectSound,
  playClickSound,
  speakWord,
  speakTwice,
  speakSentence,
} from "@/lib/audio";
import { analyzeTypo } from "@/lib/levenshtein";
import {
  getEnglishPartOfSpeech,
  generateVocabQuiz,
  VocabQuizItem,
} from "@/lib/vocab-utils";

interface ThreeStepRecallProps {
  wordItem: VocabItem;
  otherWords?: VocabItem[];
  onWordComplete: (success: boolean) => void;
  onStepChange?: (step: 1 | 2 | 3) => void;
}

const FALLBACK_DISTRACTORS = [
  "행복한, 기쁜",
  "도착하다, 도달하다",
  "중요한, 의미 있는",
  "친절한, 다정한",
  "여행, 여정",
  "도전, 어려운 과제",
];

export default function ThreeStepRecall({
  wordItem,
  otherWords = [],
  onWordComplete,
  onStepChange,
}: ThreeStepRecallProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"idle" | "correct" | "almost" | "incorrect">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 무음(Silent) 모드: 학교, 도서관, 차 안 등 소리를 켤 수 없는 상황 지원
  const [isSilentMode, setIsSilentMode] = useState(false);

  // 1단계(의미 매칭): 선택지 상태
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [isSentencePlaying, setIsSentencePlaying] = useState(false);

  // 영문 품사 및 동의어/반의어 보너스 인출 퀴즈 상태
  const [bonusQuiz, setBonusQuiz] = useState<VocabQuizItem | null>(null);
  const [showBonusQuiz, setShowBonusQuiz] = useState(false);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<"idle" | "correct" | "incorrect">("idle");

  // 3단계 완료 후: 문맥 스포트라이트 오버레이
  const [showSpotlight, setShowSpotlight] = useState(false);

  const posInfo = useMemo(
    () => getEnglishPartOfSpeech(wordItem.part_of_speech),
    [wordItem.part_of_speech]
  );

  const onStepChangeRef = useRef(onStepChange);
  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  const onWordCompleteRef = useRef(onWordComplete);
  useEffect(() => {
    onWordCompleteRef.current = onWordComplete;
  }, [onWordComplete]);

  // 1단계 보기 생성 (정답 뜻 1개 + 오답 뜻 2개 셔플)
  const meaningOptions = useMemo(() => {
    const distractors = otherWords
      .filter((w) => w.word !== wordItem.word && w.korean_definition !== wordItem.korean_definition)
      .map((w) => w.korean_definition);

    const pool = [...distractors, ...FALLBACK_DISTRACTORS];
    const uniquePool = Array.from(new Set(pool)).filter(
      (d) => d !== wordItem.korean_definition
    );

    const pickedDistractors = uniquePool.slice(0, 2);
    const options = [wordItem.korean_definition, ...pickedDistractors];
    return options.sort(() => Math.random() - 0.5);
  }, [wordItem, otherWords]);

  // 새 단어 시작 시 1단계로 리셋 & 원어민 발음 자동 재생 (무음 모드가 아닐 때만)
  useEffect(() => {
    setStep(1);
    setStatus("idle");
    setErrorMessage("");
    setSelectedMeaning(null);
    setShowSpotlight(false);
    onStepChangeRef.current?.(1);

    // 보너스 어휘 퀴즈(동의어/반의어/품사) 생성
    const quiz = generateVocabQuiz(wordItem, otherWords);
    setBonusQuiz(quiz);
    setShowBonusQuiz(false);
    setQuizSelectedOption(null);
    setQuizStatus("idle");

    if (!isSilentMode) {
      const timer = setTimeout(() => {
        speakTwice(wordItem.word, 1.0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [wordItem.id, isSilentMode]);

  // 보너스 어휘(품사/동의어/반의어) 퀴즈 선택 핸들러
  const handleQuizAnswer = (option: string) => {
    if (!bonusQuiz || quizStatus !== "idle") return;

    setQuizSelectedOption(option);
    if (option === bonusQuiz.correctAnswer) {
      setQuizStatus("correct");
      if (!isSilentMode) playCorrectSound();
      setTimeout(() => {
        setShowBonusQuiz(false);
        setShowSpotlight(true);
      }, 1000);
    } else {
      setQuizStatus("incorrect");
      if (!isSilentMode) playIncorrectSound();
      setTimeout(() => {
        setShowBonusQuiz(false);
        setShowSpotlight(true);
      }, 1800);
    }
  };

  // 1단계: 한글 뜻 선택 핸들러
  const handleMeaningSelect = (option: string) => {
    if (status !== "idle") return;

    setSelectedMeaning(option);
    if (option === wordItem.korean_definition) {
      setStatus("correct");
      if (!isSilentMode) playCorrectSound();
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      setTimeout(() => {
        setStatus("idle");
        setSelectedMeaning(null);
        setStep(2);
        onStepChangeRef.current?.(2);
      }, 900);
    } else {
      setStatus("incorrect");
      if (!isSilentMode) playIncorrectSound();
      setErrorMessage("다시 한번 단어와 뜻을 잘 연결해 볼까요?");
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate([40, 40, 40]);
      }

      setTimeout(() => {
        setStatus("idle");
        setSelectedMeaning(null);
        setErrorMessage("");
      }, 1400);
    }
  };

  // 2단계 / 3단계: 스펠링 제출 핸들러 (오탈자 관용 Levenshtein Distance 적용!)
  const handleAnswerSubmit = (submitted: string) => {
    const analysis = analyzeTypo(submitted, wordItem.word);

    if (analysis.isMatch) {
      setStatus("correct");
      if (!isSilentMode) playCorrectSound();
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate(60);
      }

      setTimeout(() => {
        setStatus("idle");
        if (step === 2) {
          setStep(3);
          onStepChangeRef.current?.(3);
        } else if (step === 3) {
          // 3단계 정답 완료 시: 보너스 퀴즈가 있으면 퀴즈 표시, 없으면 스포트라이트
          if (bonusQuiz) {
            setShowBonusQuiz(true);
          } else {
            setShowSpotlight(true);
          }
        }
      }, 900);
    } else if (analysis.isAlmost) {
      // 1글자 오타인 경우: 좌절 방지를 위한 따뜻한 노란색 팁!
      setStatus("almost");
      if (!isSilentMode) playClickSound();
      setErrorMessage(analysis.message);

      setTimeout(() => {
        setStatus("idle");
      }, 2200);
    } else {
      setStatus("incorrect");
      if (!isSilentMode) playIncorrectSound();
      setErrorMessage(analysis.message);
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate([40, 40, 40]);
      }

      setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
      }, 1500);
    }
  };

  // 예문 음성 듣기
  const handlePlaySentence = () => {
    if (isSilentMode) return;
    const text = wordItem.example_sentence || wordItem.ted_context;
    if (!text) return;
    setIsSentencePlaying(true);
    speakSentence(text, 0.95, () => {
      setIsSentencePlaying(false);
    });
  };

  // 대표 예문에서 단어를 빈칸으로 치환한 문장
  const sentenceWithBlank = useMemo(() => {
    const raw =
      wordItem.example_sentence ||
      wordItem.ted_context ||
      `We can use ${wordItem.word} in our daily life.`;
    const regex = new RegExp(`\\b${wordItem.word}\\b`, "gi");
    return raw.replace(regex, " [ _______ ] ");
  }, [wordItem]);

  return (
    <div className="relative">
      <div
        className={`card-chunky max-w-2xl mx-auto shadow-lg transition-all duration-300 ${
          status === "correct"
            ? "border-emerald-400 bg-emerald-50/40 animate-success"
            : status === "almost"
            ? "border-amber-400 bg-amber-50/40"
            : status === "incorrect"
            ? "border-rose-400 bg-rose-50/40 animate-shake"
            : "border-slate-200 bg-white"
        }`}
      >
        {/* 상단 단계 인디케이터 & 무음 모드 토글 */}
        <div className="flex items-center justify-between border-b pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-brand-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
              {step}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                {step === 1 && "1단계: 소리와 의미 연결 🎧"}
                {step === 2 && "2단계: 문맥 속 예문 채우기 💡"}
                {step === 3 && "3단계: 완전 블라인드 인출 🔥"}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {step === 1 && "발음을 듣고 올바른 한글 뜻을 찾아 선택해 보세요."}
                {step === 2 && "예문 문장을 읽고 빈칸에 들어갈 단어를 완성해 보세요."}
                {step === 3 && "뜻만 보고 기억을 떠올려 스스로 스펠링을 완성해 보세요!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 무음 모드 토글 버튼 (도서관/이동 중 지원) */}
            <button
              type="button"
              onClick={() => setIsSilentMode(!isSilentMode)}
              className={`text-xs font-black px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                isSilentMode
                  ? "bg-slate-200 border-slate-300 text-slate-700"
                  : "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-100"
              }`}
              title={isSilentMode ? "무음 모드 끄기 (소리 켬)" : "도서관/무음 모드 켜기"}
            >
              {isSilentMode ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{isSilentMode ? "무음 모드" : "소리 켬"}</span>
            </button>

            {/* 영문 품사 태그 */}
            <span
              className={`border text-xs sm:text-sm px-3 py-1 rounded-full font-black shadow-sm ${posInfo.badgeClass}`}
              title={posInfo.hint}
            >
              {posInfo.fullText}
            </span>
          </div>
        </div>

        {/* ==================== 1단계: 소리와 의미 매칭 ==================== */}
        {step === 1 && (
          <div className="space-y-6 text-center py-2">
            <div>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                {isSilentMode ? "단어 철자 및 발음기호" : "원어민 발음 듣기"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-700 tracking-tight mt-2">
                {wordItem.word}
              </h2>
              {wordItem.phonetic_symbol && (
                <p className="text-base font-bold text-slate-500 mt-1">
                  {wordItem.phonetic_symbol}
                </p>
              )}
            </div>

            {/* 발음 컨트롤러 (무음 모드 아닐 때 표시) */}
            {!isSilentMode ? (
              <div className="flex justify-center">
                <SoundExplorer word={wordItem.word} />
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 bg-slate-100 py-1.5 px-4 rounded-full inline-block">
                🔇 무음 모드 진행 중 (소리 없이 발음기호와 눈으로 익혀요)
              </p>
            )}

            {/* 동의어 / 반의어 어휘 확장 칩 (원어민 발음 청취 지원) */}
            {(wordItem.synonyms?.length || wordItem.antonyms?.length) ? (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-lg mx-auto">
                {wordItem.synonyms && wordItem.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-blue-50/90 border border-blue-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-xs font-black text-blue-700">👯 Synonym:</span>
                    {wordItem.synonyms.map((syn, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => !isSilentMode && speakWord(syn)}
                        className="text-xs font-black text-blue-900 bg-white border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        title={`"${syn}" 원어민 발음 듣기`}
                      >
                        <span>{syn}</span>
                        {!isSilentMode && <Volume2 className="w-3 h-3 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                )}

                {wordItem.antonyms && wordItem.antonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-purple-50/90 border border-purple-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-xs font-black text-purple-700">↔️ Antonym:</span>
                    {wordItem.antonyms.map((ant, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => !isSilentMode && speakWord(ant)}
                        className="text-xs font-black text-purple-900 bg-white border border-purple-200 hover:bg-purple-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        title={`"${ant}" 원어민 발음 듣기`}
                      >
                        <span>{ant}</span>
                        {!isSilentMode && <Volume2 className="w-3 h-3 text-purple-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* 3지선다 한글 뜻 선택 카드들 */}
            <div className="pt-2">
              <p className="text-sm font-bold text-slate-600 mb-3">
                이 단어의 알맞은 뜻은 무엇일까요?
              </p>
              <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                {meaningOptions.map((option, idx) => {
                  const isSelected = selectedMeaning === option;
                  const isAnswer = option === wordItem.korean_definition;

                  return (
                    <motion.button
                      key={`option-${idx}`}
                      type="button"
                      disabled={status !== "idle"}
                      onClick={() => handleMeaningSelect(option)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`btn-touch min-h-[58px] p-4 rounded-2xl border-2 font-black text-lg transition-all select-none ${
                        isSelected && status === "correct"
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-playful-mint"
                          : isSelected && status === "incorrect"
                          ? "bg-rose-500 border-rose-600 text-white animate-shake"
                          : "bg-slate-50 hover:bg-white border-slate-200 hover:border-brand-400 text-slate-800 shadow-playful"
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && isAnswer && (
                        <Check className="w-5 h-5 ml-auto text-white" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2단계: 문맥 속 예문 채우기 ==================== */}
        {step === 2 && (
          <div className="space-y-5">
            {/* 문맥 예문 카드 */}
            <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 shadow-inner text-center">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-brand-700 bg-white px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5 shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                  교재 문맥 예문
                </span>

                {!isSilentMode && (
                  <button
                    type="button"
                    onClick={handlePlaySentence}
                    className={`btn-touch min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      isSentencePlaying
                        ? "bg-brand-600 text-white"
                        : "bg-white hover:bg-indigo-100 text-brand-700 border border-indigo-200 shadow-sm"
                    }`}
                    title="예문 전체 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isSentencePlaying ? "재생 중..." : "예문 듣기"}</span>
                  </button>
                )}
              </div>

              <p className="text-lg sm:text-xl font-black text-slate-800 leading-relaxed">
                &ldquo;{sentenceWithBlank}&rdquo;
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-600">
                <span className={`px-2 py-0.5 rounded-md font-black border ${posInfo.badgeClass}`}>
                  {posInfo.fullText}
                </span>
                <span>뜻: <strong className="text-brand-700 font-black">{wordItem.korean_definition}</strong></span>
                {wordItem.synonyms && wordItem.synonyms.length > 0 && (
                  <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    👯 Synonym: <strong>{wordItem.synonyms[0]}</strong>
                  </span>
                )}
                {wordItem.antonyms && wordItem.antonyms.length > 0 && (
                  <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                    ↔️ Antonym: <strong>{wordItem.antonyms[0]}</strong>
                  </span>
                )}
              </div>
            </div>

            {!isSilentMode && (
              <div className="flex justify-center pt-1">
                <SoundExplorer word={wordItem.word} />
              </div>
            )}

            <ScrambleKeyboard
              key={`${wordItem.id}-step-2`}
              targetWord={wordItem.word}
              step={2}
              onSubmit={handleAnswerSubmit}
              disabled={status !== "idle"}
            />
          </div>
        )}

        {/* ==================== 3단계: 완전 블라인드 순수 인출 ==================== */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center my-2 space-y-2">
              <span className="text-xs font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                마지막 관문: 기억 인출
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {wordItem.korean_definition}
              </div>
              {wordItem.english_definition && (
                <div className="text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-2xl max-w-md mx-auto">
                  &ldquo;{wordItem.english_definition}&rdquo;
                </div>
              )}
              {/* 영문 품사 및 동의어/반의어 연상 인출 힌트 */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-black border ${posInfo.badgeClass}`}>
                  {posInfo.fullText}
                </span>
                {wordItem.synonyms && wordItem.synonyms.length > 0 && (
                  <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-full font-bold">
                    👯 Synonym: <strong>{wordItem.synonyms.join(", ")}</strong>
                  </span>
                )}
                {wordItem.antonyms && wordItem.antonyms.length > 0 && (
                  <span className="bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                    ↔️ Antonym: <strong>{wordItem.antonyms.join(", ")}</strong>
                  </span>
                )}
              </div>
              {!isSilentMode && (
                <div className="pt-2">
                  <SoundExplorer word={wordItem.word} />
                </div>
              )}
            </div>

            <ScrambleKeyboard
              key={`${wordItem.id}-step-3`}
              targetWord={wordItem.word}
              step={3}
              onSubmit={handleAnswerSubmit}
              disabled={status !== "idle"}
            />
          </div>
        )}

        {/* 피드백 알림 오버레이 */}
        <AnimatePresence>
          {status === "correct" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-lg shadow-lg"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>훌륭해요! 정답입니다! 🎉</span>
            </motion.div>
          )}

          {/* 오탈자 관용 피드백 (Almost Correct) */}
          {status === "almost" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center gap-2 font-black text-base shadow-lg animate-pulse"
            >
              <Sparkles className="w-5 h-5 text-amber-900 fill-amber-600" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {status === "incorrect" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-rose-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-base shadow-lg"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage || "틀렸어요, 다시 시도해봐요! 💪"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== 보너스 어휘 확장 퀴즈 모달 (품사/동의어/반의어) ==================== */}
      <AnimatePresence>
        {showBonusQuiz && bonusQuiz && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="card-chunky max-w-md w-full bg-white border-4 border-indigo-400 p-6 sm:p-7 text-center shadow-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-3.5 py-1 rounded-full text-xs font-black">
                <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-400" />
                <span>{bonusQuiz.title}</span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">
                  어휘 확장 보너스 챌린지! (+5 XP)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
                  {bonusQuiz.question}
                </h3>
              </div>

              {/* 선택지 3개 */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {bonusQuiz.options.map((opt, oIdx) => {
                  const isSelected = quizSelectedOption === opt;
                  const isCorrect = opt === bonusQuiz.correctAnswer;

                  return (
                    <motion.button
                      key={oIdx}
                      type="button"
                      disabled={quizStatus !== "idle"}
                      onClick={() => handleQuizAnswer(opt)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`btn-touch min-h-[50px] p-3 rounded-2xl border-2 font-black text-base transition-all ${
                        isSelected && quizStatus === "correct"
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-playful-mint"
                          : isSelected && quizStatus === "incorrect"
                          ? "bg-rose-500 border-rose-600 text-white animate-shake"
                          : quizStatus === "incorrect" && isCorrect
                          ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-black"
                          : "bg-slate-50 hover:bg-white border-slate-200 hover:border-brand-400 text-slate-800 shadow-playful"
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && quizStatus === "correct" && (
                        <Check className="w-4 h-4 ml-auto text-white" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {quizStatus === "correct" && (
                <p className="text-sm font-black text-emerald-600 animate-bounce pt-1">
                  정답입니다! 완벽해요! 🎉
                </p>
              )}
              {quizStatus === "incorrect" && (
                <p className="text-sm font-black text-rose-600 pt-1">
                  정답은 &quot;{bonusQuiz.correctAnswer}&quot; 였어요! 함께 기억해요! 💡
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowBonusQuiz(false);
                  setShowSpotlight(true);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 underline pt-2 block mx-auto"
              >
                건너뛰고 바로 가기 ➜
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 정답 후 문맥 스포트라이트 팝업 ==================== */}
      <AnimatePresence>
        {showSpotlight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="card-chunky max-w-lg w-full bg-white border-4 border-sunny-400 p-6 sm:p-8 text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-sunny-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-playful-sunny animate-bounce">
                ⭐
              </div>

              <div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                  단어 완벽 정복!
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-brand-700 tracking-tight mt-2">
                  {wordItem.word}
                </h2>
                {wordItem.phonetic_symbol && (
                  <p className="text-sm font-semibold text-slate-400">
                    {wordItem.phonetic_symbol}
                  </p>
                )}
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {wordItem.korean_definition}
                </p>
              </div>

              {/* 영문 품사 및 동의어/반의어 한눈에 정리 */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className={`border text-xs px-3 py-1 rounded-full font-black ${posInfo.badgeClass}`}>
                  {posInfo.fullText}
                </span>

                {wordItem.synonyms && wordItem.synonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs">
                    <span className="font-bold text-blue-700">👯 Synonym:</span>
                    {wordItem.synonyms.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !isSilentMode && speakWord(s)}
                        className="font-black text-blue-900 hover:text-blue-600 flex items-center gap-0.5"
                        title={`"${s}" 발음 듣기`}
                      >
                        <span>{s}</span>
                        {!isSilentMode && <Volume2 className="w-3 h-3 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                )}

                {wordItem.antonyms && wordItem.antonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full text-xs">
                    <span className="font-bold text-purple-700">↔️ Antonym:</span>
                    {wordItem.antonyms.map((a, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !isSilentMode && speakWord(a)}
                        className="font-black text-purple-900 hover:text-purple-600 flex items-center gap-0.5"
                        title={`"${a}" 발음 듣기`}
                      >
                        <span>{a}</span>
                        {!isSilentMode && <Volume2 className="w-3 h-3 text-purple-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {wordItem.example_sentence && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-left">
                  <div className="flex items-center gap-1.5 text-xs font-black text-brand-700 mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>문맥 속에 기억하기:</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-800">
                    &ldquo;{wordItem.example_sentence}&rdquo;
                  </p>
                </div>
              )}

              {wordItem.collocations && wordItem.collocations.length > 0 && (
                <div className="text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>짝단어: </span>
                  <strong>{wordItem.collocations.join(", ")}</strong>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSpotlight(false);
                  onWordCompleteRef.current?.(true);
                }}
                className="w-full btn-touch min-h-[52px] bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg shadow-playful-brand"
              >
                <span>다음 단어로 달리기 🏃‍♂️</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
