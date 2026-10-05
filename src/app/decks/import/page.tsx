"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  ClipboardPaste,
  FileJson,
  Sparkles,
  Trash2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { createLocalDeck } from "@/lib/storage";
import {
  GEMINI_EXTRACTION_PROMPT,
  SAMPLE_GEMINI_JSON,
  parseGeminiDeckJson,
} from "@/lib/gemini-importer";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";
import { OCRParseResult } from "@/types/vocab";

/**
 * 제미나이 앱 JSON 가져오기 페이지
 * - 서버 AI API를 호출하지 않으므로 비용 0원
 * 1) 프롬프트 복사 → 2) 제미나이 앱에 사진+프롬프트 전송 → 3) JSON 붙여넣기 → 4) 미리보기 & 저장
 */
export default function ImportDeckPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [parsed, setParsed] = useState<OCRParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GEMINI_EXTRACTION_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowPrompt(true);
      alert("자동 복사에 실패했습니다. 아래 프롬프트를 직접 선택해서 복사해 주세요.");
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawJson(text);
      tryParse(text);
    } catch {
      alert("클립보드 읽기 권한이 없습니다. 입력창에 직접 붙여넣어 주세요.");
    }
  };

  const tryParse = (text: string) => {
    setError(null);
    setParsed(null);
    if (!text.trim()) return;
    try {
      setParsed(parseGeminiDeckJson(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const updateMeta = (
    field: "deck_title" | "publisher" | "book_name" | "target_grade",
    val: string
  ) => {
    if (!parsed) return;
    setParsed({ ...parsed, [field]: val });
  };

  const updateWord = (
    idx: number,
    field: "word" | "korean_definition" | "part_of_speech",
    val: string
  ) => {
    if (!parsed) return;
    const words = [...parsed.words];
    words[idx] = { ...words[idx], [field]: val };
    setParsed({ ...parsed, words });
  };

  const deleteWord = (idx: number) => {
    if (!parsed) return;
    setParsed({ ...parsed, words: parsed.words.filter((_, i) => i !== idx) });
  };

  const handleSave = () => {
    if (!parsed || parsed.words.length === 0) {
      alert("단어가 최소 1개 이상 있어야 합니다.");
      return;
    }
    const saved = createLocalDeck(
      parsed.deck_title?.trim() || "제미나이 추출 단어장",
      parsed.words.map((w) => ({
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
      })),
      {
        publisher: parsed.publisher || undefined,
        book_name: parsed.book_name || undefined,
        target_grade: parsed.target_grade || undefined,
        extra_metadata: { ...(parsed.extra_metadata || {}), source: "gemini-app-json" },
      }
    );
    router.push(`/decks/${saved.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
            제미나이 앱으로 단어장 만들기 💬
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            무료 제미나이 앱에서 추출한 JSON을 붙여넣으면 AI 호출 비용 없이 단어장이 생성돼요.
          </p>
        </div>
      </div>

      {/* STEP 1: 프롬프트 복사 */}
      <section className="card-chunky bg-white space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-black flex items-center justify-center">
            1
          </span>
          <h2 className="text-lg font-black text-slate-800">추출 프롬프트 복사하기</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          아래 버튼으로 프롬프트를 복사한 뒤, 제미나이 앱 채팅창에 <b>교재 사진</b>과 함께 붙여넣어 보내세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="btn-touch bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black shadow-playful-brand"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? "복사 완료!" : "프롬프트 복사"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="btn-touch bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold"
          >
            {showPrompt ? "프롬프트 숨기기" : "프롬프트 내용 보기"}
          </button>
        </div>
        {showPrompt && (
          <textarea
            readOnly
            value={GEMINI_EXTRACTION_PROMPT}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full h-64 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
          />
        )}
      </section>

      {/* STEP 2: JSON 붙여넣기 */}
      <section className="card-chunky bg-white space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-black flex items-center justify-center">
            2
          </span>
          <h2 className="text-lg font-black text-slate-800">제미나이 답변(JSON) 붙여넣기</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          제미나이 답변의 코드 블록을 복사해 붙여넣으세요. <code>```json</code> 표시나 앞뒤 설명이 섞여 있어도 자동으로 정리돼요.
        </p>
        <textarea
          value={rawJson}
          onChange={(e) => {
            setRawJson(e.target.value);
            tryParse(e.target.value);
          }}
          placeholder='{ "deck_title": "10주차 단어장", "words": [ ... ] }'
          className="w-full h-48 p-3 text-xs font-mono bg-slate-50 border-2 border-slate-200 focus:border-brand-400 rounded-xl outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="btn-touch min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>클립보드에서 붙여넣기</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRawJson(SAMPLE_GEMINI_JSON);
              tryParse(SAMPLE_GEMINI_JSON);
            }}
            className="btn-touch min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
          >
            <FileJson className="w-4 h-4" />
            <span>샘플 데이터 넣어보기</span>
          </button>
          {rawJson && (
            <button
              type="button"
              onClick={() => {
                setRawJson("");
                setParsed(null);
                setError(null);
              }}
              className="btn-touch min-h-[44px] bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-bold"
            >
              지우기
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-800 text-sm font-semibold flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* STEP 3: 미리보기 & 저장 */}
      {parsed && (
        <section className="card-chunky bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-black text-slate-800">확인 후 저장</h2>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {parsed.words.length}단어 인식
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                ["deck_title", "단어장 제목"],
                ["publisher", "주차 / 출판사"],
                ["book_name", "교재명"],
                ["target_grade", "대상 학년"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
                <input
                  value={(parsed[field] as string) || ""}
                  onChange={(e) => updateMeta(field, e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 focus:border-brand-400 rounded-xl text-sm font-bold outline-none"
                />
              </div>
            ))}
          </div>

          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {parsed.words.map((w, idx) => {
              const pos = getEnglishPartOfSpeech(w.part_of_speech);
              return (
                <li key={idx} className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                    <input
                      value={w.word}
                      onChange={(e) => updateWord(idx, "word", e.target.value)}
                      className="flex-1 min-w-0 font-black text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-brand-300"
                    />
                    <select
                      value={pos.label.toLowerCase()}
                      onChange={(e) => updateWord(idx, "part_of_speech", e.target.value)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border ${pos.badgeClass}`}
                    >
                      {["noun", "verb", "adjective", "adverb", "preposition"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => deleteWord(idx)}
                      className="p-1 text-slate-300 hover:text-rose-500"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="pl-7 space-y-1">
                    <input
                      value={w.korean_definition}
                      onChange={(e) => updateWord(idx, "korean_definition", e.target.value)}
                      className="w-full text-sm font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-brand-300"
                    />
                    <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                      {w.phonetic_symbol && (
                        <span className="text-slate-500">{w.phonetic_symbol}</span>
                      )}
                      {w.synonyms?.map((s) => (
                        <span key={`s-${s}`} className="bg-sky-50 text-sky-700 px-1.5 rounded">
                          ≈ {s}
                        </span>
                      ))}
                      {w.antonyms?.map((a) => (
                        <span key={`a-${a}`} className="bg-rose-50 text-rose-700 px-1.5 rounded">
                          ↔ {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={handleSave}
            disabled={parsed.words.length === 0}
            className="w-full btn-touch bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-lg shadow-md"
          >
            <Save className="w-5 h-5" />
            <span>단어장 저장하기 ({parsed.words.length}단어)</span>
          </button>
        </section>
      )}
    </div>
  );
}
