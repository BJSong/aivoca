"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Plus,
  BookOpen,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Volume2,
} from "lucide-react";
import { DeckWithItems, VocabItem, PartOfSpeech } from "@/types/vocab";
import { updateLocalDeck } from "@/lib/storage";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";
import { speakSentence } from "@/lib/audio";

interface DeckEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: DeckWithItems;
  onSuccess: (updatedDeck: DeckWithItems) => void;
}

export default function DeckEditModal({
  isOpen,
  onClose,
  deck,
  onSuccess,
}: DeckEditModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "words">("info");

  // 단어장 메타데이터 상태
  const [title, setTitle] = useState(deck.title);
  const [publisher, setPublisher] = useState(deck.publisher || "");
  const [bookName, setBookName] = useState(deck.book_name || "");
  const [targetGrade, setTargetGrade] = useState(deck.target_grade || "");

  // 단어 목록 상태
  const [items, setItems] = useState<VocabItem[]>([...deck.items]);

  // 새 단어 추가 입력 상태
  const [newWord, setNewWord] = useState("");
  const [newPos, setNewPos] = useState<PartOfSpeech>("noun");
  const [newKorean, setNewKorean] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newExample, setNewExample] = useState("");

  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleUpdateWordField = (
    idx: number,
    field: keyof VocabItem,
    value: string
  ) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const handleDeleteWord = (idx: number) => {
    const wordToDelete = items[idx];
    if (confirm(`'${wordToDelete.word}' 단어를 삭제하시겠습니까?`)) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleAddSingleWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) {
      alert("단어 철자를 입력해 주세요.");
      return;
    }
    if (!newKorean.trim()) {
      alert("한국어 뜻을 입력해 주세요.");
      return;
    }

    const newItem: VocabItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      deck_id: deck.id,
      word: newWord.trim(),
      part_of_speech: newPos,
      korean_definition: newKorean.trim(),
      phonetic_symbol: newPhonetic.trim() || undefined,
      example_sentence: newExample.trim() || `I practiced the word ${newWord.trim()}.`,
      synonyms: [],
      antonyms: [],
      collocations: [],
      order_index: items.length,
    };

    setItems([...items, newItem]);
    setNewWord("");
    setNewKorean("");
    setNewPhonetic("");
    setNewExample("");
  };

  const handleSaveAll = () => {
    if (!title.trim()) {
      alert("단어장 제목을 입력해 주세요.");
      return;
    }

    const updated = updateLocalDeck(deck.id, {
      title: title.trim(),
      publisher: publisher.trim() || undefined,
      book_name: bookName.trim() || undefined,
      target_grade: targetGrade.trim() || undefined,
      items,
      items_count: items.length,
    });

    if (updated) {
      setIsSaved(true);
      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card-chunky max-w-2xl w-full bg-white border-2 border-slate-300 p-5 sm:p-6 shadow-2xl space-y-4 my-8"
      >
        {/* 모달 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
              단어장 편집
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              단어장 정보 및 단어 편집 ✏️
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`btn-touch px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all ${
              activeTab === "info"
                ? "bg-brand-500 text-white shadow-playful-brand"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>기본 정보 수정</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("words")}
            className={`btn-touch px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all ${
              activeTab === "words"
                ? "bg-brand-500 text-white shadow-playful-brand"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>단어 목록 편집 ({items.length}개)</span>
          </button>
        </div>

        {/* 탭 1: 단어장 기본 정보 */}
        {activeTab === "info" && (
          <div className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                단어장 제목 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 8주차 단어장"
                className="w-full px-3.5 py-2.5 border-2 border-slate-200 focus:border-brand-400 rounded-xl text-sm font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  출판사 / 주차
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="예: 8주차, 능률, EBS"
                  className="w-full px-3 py-2 border-2 border-slate-200 focus:border-brand-400 rounded-xl text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  교재명 / 범위
                </label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="예: TEDTALKS (pp.64-68)"
                  className="w-full px-3 py-2 border-2 border-slate-200 focus:border-brand-400 rounded-xl text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  대상 학년
                </label>
                <input
                  type="text"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  placeholder="예: 초등 5~6학년"
                  className="w-full px-3 py-2 border-2 border-slate-200 focus:border-brand-400 rounded-xl text-sm font-bold outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 단어 목록 편집 */}
        {activeTab === "words" && (
          <div className="space-y-4 py-1">
            {/* 단어 추가 폼 */}
            <form
              onSubmit={handleAddSingleWord}
              className="p-3.5 bg-brand-50/50 rounded-2xl border-2 border-brand-200 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs font-bold text-brand-900">
                <span className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> 새 단어 추가
                </span>
                <span className="text-slate-400">철자와 뜻을 입력하세요</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="단어 (예: innovate)"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-brand-500 bg-white"
                />
                <select
                  value={newPos}
                  onChange={(e) => setNewPos(e.target.value as PartOfSpeech)}
                  className="px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-bold outline-none bg-white"
                >
                  <option value="noun">명사 (noun)</option>
                  <option value="verb">동사 (verb)</option>
                  <option value="adjective">형용사 (adjective)</option>
                  <option value="adverb">부사 (adverb)</option>
                  <option value="preposition">전치사 (preposition)</option>
                </select>
                <input
                  type="text"
                  placeholder="한국어 뜻 (예: 혁신하다)"
                  value={newKorean}
                  onChange={(e) => setNewKorean(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-brand-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="발음기호 (선택: /ˈɪn.ə.veɪt/)"
                  value={newPhonetic}
                  onChange={(e) => setNewPhonetic(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-brand-500 bg-white"
                />
                <input
                  type="text"
                  placeholder="예문 (선택: We must innovate.)"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-brand-500 bg-white"
                />
              </div>

              <button
                type="submit"
                className="btn-touch w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>단어 추가하기</span>
              </button>
            </form>

            {/* 기존 단어 리스트 */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {items.map((item, idx) => {
                const pos = getEnglishPartOfSpeech(item.part_of_speech);
                return (
                  <div key={item.id} className="p-3 bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 w-5">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.word}
                        onChange={(e) =>
                          handleUpdateWordField(idx, "word", e.target.value)
                        }
                        className="font-black text-sm text-slate-800 border-b border-slate-200 focus:border-brand-400 outline-none w-32"
                      />
                      <select
                        value={item.part_of_speech}
                        onChange={(e) =>
                          handleUpdateWordField(
                            idx,
                            "part_of_speech",
                            e.target.value as PartOfSpeech
                          )
                        }
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${pos.badgeClass}`}
                      >
                        <option value="noun">noun</option>
                        <option value="verb">verb</option>
                        <option value="adjective">adjective</option>
                        <option value="adverb">adverb</option>
                        <option value="preposition">preposition</option>
                      </select>
                      <input
                        type="text"
                        value={item.korean_definition}
                        onChange={(e) =>
                          handleUpdateWordField(
                            idx,
                            "korean_definition",
                            e.target.value
                          )
                        }
                        placeholder="한국어 뜻"
                        className="flex-1 min-w-0 text-xs font-bold text-slate-700 border-b border-slate-200 focus:border-brand-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteWord(idx)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-lg"
                        title="단어 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <input
                        type="text"
                        value={item.phonetic_symbol || ""}
                        onChange={(e) =>
                          handleUpdateWordField(
                            idx,
                            "phonetic_symbol",
                            e.target.value
                          )
                        }
                        placeholder="발음기호 (선택)"
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={item.example_sentence || ""}
                          onChange={(e) =>
                            handleUpdateWordField(
                              idx,
                              "example_sentence",
                              e.target.value
                            )
                          }
                          placeholder="예문 (선택)"
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none"
                        />
                        {item.example_sentence && (
                          <button
                            type="button"
                            onClick={() => speakSentence(item.example_sentence || "")}
                            title="예문 미리듣기"
                            className="p-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 저장 피드백 */}
        {isSaved && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-800 text-sm font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>단어장 변경사항이 성공적으로 저장되었습니다!</span>
          </div>
        )}

        {/* 하단 저장 버튼 */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-touch py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex-2 btn-touch py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-white font-black rounded-2xl shadow-playful-emerald text-sm sm:text-base flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>수정사항 저장하기 ({items.length}단어)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
