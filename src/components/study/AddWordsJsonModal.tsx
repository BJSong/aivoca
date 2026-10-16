"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ClipboardPaste,
  FileJson,
  Sparkles,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { DeckWithItems, OCRParseResult } from "@/types/vocab";
import {
  parseGeminiDeckJson,
  GEMINI_EXTRACTION_PROMPT,
  SAMPLE_GEMINI_JSON,
} from "@/lib/gemini-importer";
import { addWordsToLocalDeck } from "@/lib/storage";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";

interface AddWordsJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: DeckWithItems;
  onSuccess: (updatedDeck: DeckWithItems) => void;
}

export default function AddWordsJsonModal({
  isOpen,
  onClose,
  deck,
  onSuccess,
}: AddWordsJsonModalProps) {
  const [rawJson, setRawJson] = useState("");
  const [parsed, setParsed] = useState<OCRParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [promptCopied, setPromptCopied] = useState(false);
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingWordSet = new Set(
    deck.items.map((item) => item.word.toLowerCase().trim())
  );

  const tryParse = (text: string) => {
    setError(null);
    setParsed(null);
    setIsSuccessMessage(null);
    if (!text.trim()) return;
    try {
      setParsed(parseGeminiDeckJson(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawJson(text);
      tryParse(text);
    } catch {
      alert("클립보드 접근 권한이 없습니다. 입력창에 직접 붙여넣어 주세요.");
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GEMINI_EXTRACTION_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const handleAddWords = () => {
    if (!parsed || parsed.words.length === 0) return;

    const wordsToAdd = parsed.words.map((w) => ({
      word: w.word,
      part_of_speech: w.part_of_speech,
      phonetic_symbol: w.phonetic_symbol || undefined,
      english_definition: w.english_definition || undefined,
      korean_definition: w.korean_definition,
      synonyms: w.synonyms || [],
      antonyms: w.antonyms || [],
      collocations: w.collocations || [],
      example_sentence: w.example_sentence || "",
      ted_context: w.ted_context || undefined,
      extra_metadata: w.extra_metadata || undefined,
    }));

    const result = addWordsToLocalDeck(deck.id, wordsToAdd, skipDuplicates);
    if (result) {
      setIsSuccessMessage(
        `🎉 ${result.addedCount}개 단어가 추가되었습니다!${
          result.updatedCount > 0 ? ` (${result.updatedCount}개 단어 정보 갱신)` : ""
        }`
      );
      setTimeout(() => {
        onSuccess(result.deck);
        onClose();
      }, 1000);
    } else {
      setError("단어장에 단어를 추가하는 중 오류가 발생했습니다.");
    }
  };

  // 신규 vs 중복 집계
  const duplicateCount =
    parsed?.words.filter((w) => existingWordSet.has(w.word.toLowerCase().trim()))
      .length || 0;
  const newCount = (parsed?.words.length || 0) - duplicateCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card-chunky max-w-xl w-full bg-white border-2 border-brand-300 p-5 sm:p-6 shadow-2xl space-y-4 my-8"
      >
        {/* 모달 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                JSON 단어 추가
              </span>
              <span className="text-xs font-bold text-slate-400">
                기존 단어: {deck.items.length}개
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              [{deck.title}]에 단어 추가하기 ➕
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

        {/* 상단 팁: 프롬프트 복사 버튼 */}
        <div className="flex items-center justify-between p-3 bg-brand-50/70 rounded-2xl border border-brand-200 text-xs">
          <span className="font-bold text-brand-900">
            💡 제미나이 앱에서 사진과 함께 보낼 프롬프트가 필요하신가요?
          </span>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="btn-touch shrink-0 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
          >
            {promptCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{promptCopied ? "복사됨!" : "프롬프트 복사"}</span>
          </button>
        </div>

        {/* JSON 입력창 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600">
            제미나이 답변 JSON 붙여넣기
          </label>
          <textarea
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              tryParse(e.target.value);
            }}
            placeholder='{ "words": [ { "word": "example", "part_of_speech": "noun", "korean_definition": "예시" } ] }'
            className="w-full h-36 p-3 text-xs font-mono bg-slate-50 border-2 border-slate-200 focus:border-brand-400 rounded-xl outline-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="btn-touch min-h-[38px] px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>클립보드에서 붙여넣기</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRawJson(SAMPLE_GEMINI_JSON);
                tryParse(SAMPLE_GEMINI_JSON);
              }}
              className="btn-touch min-h-[38px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>샘플 넣기</span>
            </button>
            {rawJson && (
              <button
                type="button"
                onClick={() => {
                  setRawJson("");
                  setParsed(null);
                  setError(null);
                }}
                className="btn-touch min-h-[38px] px-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold"
              >
                지우기
              </button>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 성공 메시지 */}
        {isSuccessMessage && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-800 text-sm font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{isSuccessMessage}</span>
          </div>
        )}

        {/* 파싱된 단어 미리보기 & 중복 체크 */}
        {parsed && parsed.words.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1 text-brand-700">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                인식된 단어 총 {parsed.words.length}개
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-black">신규: {newCount}개</span>
                {duplicateCount > 0 && (
                  <span className="text-amber-700 font-black">중복: {duplicateCount}개</span>
                )}
              </div>
            </div>

            {duplicateCount > 0 && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded text-brand-600"
                />
                <span>이미 단어장에 있는 단어({duplicateCount}개)는 건너뛰기 (비체크 시 뜻/예문 갱신)</span>
              </label>
            )}

            {/* 단어 미리보기 리스트 */}
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {parsed.words.map((w, idx) => {
                const isDup = existingWordSet.has(w.word.toLowerCase().trim());
                const pos = getEnglishPartOfSpeech(w.part_of_speech);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 flex items-center justify-between text-xs ${
                      isDup ? "bg-amber-50/40" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-slate-400 w-4">{idx + 1}</span>
                      <span className="font-black text-slate-800 truncate">{w.word}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${pos.badgeClass}`}>
                        {pos.label}
                      </span>
                      <span className="text-slate-500 truncate max-w-[150px]">
                        {w.korean_definition}
                      </span>
                    </div>
                    {isDup ? (
                      <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        기존 보유
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        신규
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 최종 추가 실행 버튼 */}
            <button
              type="button"
              onClick={handleAddWords}
              disabled={newCount === 0 && skipDuplicates}
              className="w-full btn-touch py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-playful-brand flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>
                {skipDuplicates
                  ? `신규 ${newCount}개 단어 단어장에 추가하기`
                  : `총 ${parsed.words.length}개 단어 추가 및 갱신하기`}
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
