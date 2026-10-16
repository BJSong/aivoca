"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  PlusCircle,
  FolderPlus,
  BookOpen,
} from "lucide-react";
import {
  createLocalDeck,
  getLocalDecks,
  addWordsToLocalDeck,
} from "@/lib/storage";
import {
  GEMINI_EXTRACTION_PROMPT,
  SAMPLE_GEMINI_JSON,
  parseGeminiDeckJson,
} from "@/lib/gemini-importer";
import { getEnglishPartOfSpeech } from "@/lib/vocab-utils";
import { OCRParseResult, DeckWithItems } from "@/types/vocab";

function ImportDeckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDeckId = searchParams.get("deckId");

  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [parsed, setParsed] = useState<OCRParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 저장 대상 모드: 새 단어장("new") vs 기존 단어장에 추가("existing")
  const [saveMode, setSaveMode] = useState<"new" | "existing">(
    initialDeckId ? "existing" : "new"
  );
  const [targetDeckId, setTargetDeckId] = useState<string>(initialDeckId || "");
  const [availableDecks, setAvailableDecks] = useState<DeckWithItems[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  useEffect(() => {
    const decks = getLocalDecks();
    setAvailableDecks(decks);
    if (initialDeckId) {
      setTargetDeckId(initialDeckId);
      setSaveMode("existing");
    } else if (decks.length > 0 && !targetDeckId) {
      setTargetDeckId(decks[0].id);
    }
  }, [initialDeckId]);

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
      const result = parseGeminiDeckJson(text);
      setParsed(result);

      // 스마트 매칭: 만약 추출된 deck_title과 동일한 이름의 단어장이 있으면 자동으로 기존 단어장 추천
      const matchingDeck = availableDecks.find(
        (d) =>
          d.title.trim().toLowerCase() ===
          (result.deck_title || "").trim().toLowerCase()
      );
      if (matchingDeck && !initialDeckId) {
        setTargetDeckId(matchingDeck.id);
        setSaveMode("existing");
      }
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

    const wordsData = parsed.words.map((w) => ({
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

    if (saveMode === "existing" && targetDeckId) {
      // 기존 단어장에 추가
      const result = addWordsToLocalDeck(targetDeckId, wordsData, skipDuplicates);
      if (result) {
        alert(
          `기존 단어장 [${result.deck.title}]에 ${result.addedCount}개 단어가 성공적으로 추가되었습니다!${
            result.updatedCount > 0 ? ` (${result.updatedCount}개 갱신)` : ""
          }`
        );
        router.push(`/decks/${targetDeckId}`);
      } else {
        alert("기존 단어장을 찾을 수 없습니다.");
      }
    } else {
      // 새 단어장으로 저장
      const saved = createLocalDeck(
        parsed.deck_title?.trim() || "제미나이 추출 단어장",
        wordsData,
        {
          publisher: parsed.publisher || undefined,
          book_name: parsed.book_name || undefined,
          target_grade: parsed.target_grade || undefined,
          extra_metadata: { ...(parsed.extra_metadata || {}), source: "gemini-app-json" },
        }
      );
      alert(`새 단어장 [${saved.title}]이 생성되었습니다!`);
      router.push(`/decks/${saved.id}`);
    }
  };

  const matchingDeck = parsed
    ? availableDecks.find(
        (d) =>
          d.title.trim().toLowerCase() ===
          (parsed.deck_title || "").trim().toLowerCase()
      )
    : null;

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
            제미나이 JSON으로 단어 추가 💬
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            무료 제미나이 앱에서 추출한 JSON을 붙여넣으면 AI 비용 없이 단어장을 만들거나 기존 단어장에 추가할 수 있어요.
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
          className="w-full h-44 p-3 text-xs font-mono bg-slate-50 border-2 border-slate-200 focus:border-brand-400 rounded-xl outline-none"
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

      {/* 스마트 기존 단어장 감지 배너 */}
      {matchingDeck && saveMode !== "existing" && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div>
            <div className="font-black text-sm flex items-center gap-1.5">
              <span>💡 동일한 이름의 단어장이 이미 있습니다!</span>
            </div>
            <div className="text-xs font-semibold text-amber-800 mt-0.5">
              기존 [{matchingDeck.title}] ({matchingDeck.items.length}단어)에 새로 인식된 단어를 추가할까요?
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSaveMode("existing");
              setTargetDeckId(matchingDeck.id);
            }}
            className="btn-touch px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs sm:text-sm shrink-0 shadow-sm"
          >
            기존 단어장에 추가하기
          </button>
        </div>
      )}

      {/* STEP 3: 저장 대상 선택 및 확인 */}
      {parsed && (
        <section className="card-chunky bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-black text-slate-800">저장 방식 및 미리보기</h2>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {parsed.words.length}단어 인식됨
            </span>
          </div>

          {/* 저장 대상 모드 선택 (새 단어장 vs 기존 단어장에 추가) */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
            <span className="block text-xs font-black text-slate-700">저장 대상 선택</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                  saveMode === "new"
                    ? "bg-white border-brand-500 text-brand-800 shadow-sm"
                    : "border-slate-200 text-slate-600 bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveMode === "new"}
                  onChange={() => setSaveMode("new")}
                  className="text-brand-600"
                />
                <FolderPlus className="w-4 h-4 text-brand-600" />
                <span className="text-xs sm:text-sm font-bold">새 단어장으로 생성</span>
              </label>

              <label
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                  saveMode === "existing"
                    ? "bg-white border-brand-500 text-brand-800 shadow-sm"
                    : "border-slate-200 text-slate-600 bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveMode === "existing"}
                  onChange={() => setSaveMode("existing")}
                  className="text-brand-600"
                />
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs sm:text-sm font-bold">기존 단어장에 단어 추가</span>
              </label>
            </div>

            {/* 기존 단어장 선택 드롭다운 */}
            {saveMode === "existing" && (
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-slate-600">
                  단어를 추가할 단어장 선택:
                </label>
                <select
                  value={targetDeckId}
                  onChange={(e) => setTargetDeckId(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 focus:border-brand-400 rounded-xl text-sm font-bold bg-white outline-none"
                >
                  {availableDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.items.length}단어)
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>이미 단어장에 존재하는 단어는 중복 건너뛰기</span>
                </label>
              </div>
            )}
          </div>

          {/* 새 단어장 메타데이터 편집 (새 단어장 모드일 때만 표시) */}
          {saveMode === "new" && (
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
          )}

          {/* 단어 리스트 미리보기 */}
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl max-h-72 overflow-y-auto">
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
            className="w-full btn-touch py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-base sm:text-lg shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>
              {saveMode === "existing"
                ? `선택한 기존 단어장에 ${parsed.words.length}단어 추가하기`
                : `새 단어장으로 저장하기 (${parsed.words.length}단어)`}
            </span>
          </button>
        </section>
      )}
    </div>
  );
}

export default function ImportDeckPage() {
  return (
    <Suspense
      fallback={
        <div className="card-chunky text-center py-16 text-slate-400 font-bold">
          단어장 생성기를 불러오는 중...
        </div>
      }
    >
      <ImportDeckContent />
    </Suspense>
  );
}
