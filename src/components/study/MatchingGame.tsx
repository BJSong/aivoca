"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Trophy } from "lucide-react";
import { VocabItem } from "@/types/vocab";
import { playCorrectSound, playIncorrectSound, playClickSound } from "@/lib/audio";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";

interface MatchingGameProps {
  words: VocabItem[];
  onComplete: () => void;
}

interface MatchCard {
  id: string;
  pairId: string;
  text: string;
  type: "word" | "relation";
  relationLabel?: string; // 'Synonym 👯', 'Antonym ↔️', 'Part of Speech 🏷️', 'Meaning 📖'
  badgeClass?: string;
}

export default function MatchingGame({ words, onComplete }: MatchingGameProps) {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [wrongCardId, setWrongCardId] = useState<string | null>(null);

  useEffect(() => {
    // 3~4개 단어를 골라 짝 맞추기 카드 세트 생성
    const selectedWords = words.slice(0, 4);
    const generatedCards: MatchCard[] = [];

    // 동의어, 반의어, 품사가 골고루 분배되도록 인덱스별 매칭 유형 배분
    selectedWords.forEach((wordItem, idx) => {
      const pairId = `pair-${idx}-${wordItem.word}`;
      const posInfo = getEnglishPartOfSpeech(wordItem.part_of_speech);

      // 1) 단어 카드
      generatedCards.push({
        id: `card-w-${idx}`,
        pairId,
        text: wordItem.word,
        type: "word",
      });

      // 2) 매칭 카드: 유의어, 반의어, 영문 품사/뜻을 입체적으로 출제
      const hasSyn = wordItem.synonyms && wordItem.synonyms.length > 0;
      const hasAnt = wordItem.antonyms && wordItem.antonyms.length > 0;

      if (idx % 2 === 1 && hasAnt) {
        // 반의어 카드 출제
        generatedCards.push({
          id: `card-r-${idx}`,
          pairId,
          text: wordItem.antonyms[0],
          type: "relation",
          relationLabel: "Antonym ↔️",
          badgeClass: "text-purple-700 bg-purple-100 border-purple-200",
        });
      } else if (hasSyn) {
        // 유의어 카드 출제
        generatedCards.push({
          id: `card-r-${idx}`,
          pairId,
          text: wordItem.synonyms[0],
          type: "relation",
          relationLabel: "Synonym 👯",
          badgeClass: "text-blue-700 bg-blue-100 border-blue-200",
        });
      } else if (hasAnt) {
        // 반의어 카드 출제
        generatedCards.push({
          id: `card-r-${idx}`,
          pairId,
          text: wordItem.antonyms[0],
          type: "relation",
          relationLabel: "Antonym ↔️",
          badgeClass: "text-purple-700 bg-purple-100 border-purple-200",
        });
      } else {
        // 영문 품사 & 한글 뜻 결합 카드
        generatedCards.push({
          id: `card-r-${idx}`,
          pairId,
          text: `[${posInfo.abbr}] ${wordItem.korean_definition.split(",")[0]}`,
          type: "relation",
          relationLabel: `${posInfo.label} 🏷️`,
          badgeClass: "text-emerald-700 bg-emerald-100 border-emerald-200",
        });
      }
    });

    // 셔플
    setCards(generatedCards.sort(() => Math.random() - 0.5));
    setMatchedPairIds(new Set());
    setSelectedCard(null);
  }, [words]);

  const handleCardClick = (card: MatchCard) => {
    if (matchedPairIds.has(card.pairId) || wrongCardId) return;

    playClickSound();

    if (!selectedCard) {
      // 첫 번째 카드 선택
      setSelectedCard(card);
      return;
    }

    // 동일한 카드를 다시 누른 경우 해제
    if (selectedCard.id === card.id) {
      setSelectedCard(null);
      return;
    }

    // 같은 유형끼리는 매칭 안 됨 (word끼리 또는 relation끼리 선택 방지)
    if (selectedCard.type === card.type) {
      setSelectedCard(card);
      return;
    }

    // 정답 체크!
    if (selectedCard.pairId === card.pairId) {
      playCorrectSound();
      const nextMatched = new Set(matchedPairIds);
      nextMatched.add(card.pairId);
      setMatchedPairIds(nextMatched);
      setSelectedCard(null);

      // 모든 짝을 맞추었는지 확인
      if (nextMatched.size * 2 === cards.length) {
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    } else {
      // 오답!
      playIncorrectSound();
      setWrongCardId(card.id);
      setTimeout(() => {
        setSelectedCard(null);
        setWrongCardId(null);
      }, 700);
    }
  };

  const isAllMatched = matchedPairIds.size * 2 === cards.length && cards.length > 0;

  return (
    <div className="card-chunky max-w-2xl mx-auto border-brand-200 bg-white">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-sunny-100 text-amber-800 px-4 py-1.5 rounded-full font-black text-sm mb-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>보너스 정교화 부호화 퀘스트</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
          단어 짝맞추기 카드 게임 🎴
        </h3>
        <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1">
          영어 단어와 어울리는 짝(Synonym, Antonym 또는 뜻) 카드를 터치해 연결해보세요!
        </p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
        {cards.map((card) => {
          const isMatched = matchedPairIds.has(card.pairId);
          const isSelected = selectedCard?.id === card.id;
          const isWrong = wrongCardId === card.id || (wrongCardId && isSelected);

          return (
            <motion.button
              key={card.id}
              type="button"
              disabled={isMatched}
              onClick={() => handleCardClick(card)}
              whileHover={{ scale: isMatched ? 1 : 1.02 }}
              whileTap={{ scale: isMatched ? 1 : 0.96 }}
              className={`min-h-[85px] sm:min-h-[100px] p-4 rounded-3xl border-2 flex flex-col items-center justify-center text-center transition-all select-none ${
                isMatched
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 opacity-60 cursor-default"
                  : isWrong
                  ? "bg-rose-50 border-rose-400 text-rose-700 animate-shake"
                  : isSelected
                  ? "bg-brand-50 border-brand-500 text-brand-800 shadow-playful-brand scale-105"
                  : "bg-white border-slate-200 hover:border-brand-300 text-slate-800 shadow-playful"
              }`}
            >
              {card.relationLabel && (
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full border mb-1.5 shadow-sm ${
                    card.badgeClass || "text-brand-600 bg-brand-50 border-brand-200"
                  }`}
                >
                  {card.relationLabel}
                </span>
              )}
              <span
                className={`font-black tracking-tight ${
                  card.type === "word" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                }`}
              >
                {card.text}
              </span>
              {isMatched && (
                <span className="flex items-center gap-1 text-xs font-black text-emerald-600 mt-1">
                  <Check className="w-3.5 h-3.5" /> 짝맞춤 완료
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 성공 시 축하 메시지 */}
      <AnimatePresence>
        {isAllMatched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-sunny-100 border-2 border-sunny-400 text-amber-900 rounded-3xl text-center font-black flex items-center justify-center gap-2 text-lg shadow-md"
          >
            <Trophy className="w-6 h-6 text-sunny-500 fill-sunny-400" />
            <span>모든 단어 짝을 완벽히 맞췄어요! 참 잘했어요! 🎉</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
