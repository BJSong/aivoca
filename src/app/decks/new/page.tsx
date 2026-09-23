"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Building,
  GraduationCap,
} from "lucide-react";
import { createLocalDeck } from "@/lib/storage";
import { OCRParseResult, VocabItem } from "@/types/vocab";

export default function NewDeckPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "AI 로봇이 교재를 꼼꼼히 읽고 있어요..."
  );
  const [parsedData, setParsedData] = useState<OCRParseResult | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // 1. 클라이언트 측 HTML Canvas 기반 이미지 1600px 리사이징
  const resizeImageToMax1600 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas 2D Context 생성 실패"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          resolve(resizedBase64);
        };
        img.onerror = () => reject(new Error("이미지 로드 실패"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setErrorNotice(null);
      setLoadingMessage("이미지를 초고화질로 최적화하는 중...");

      const resizedBase64 = await resizeImageToMax1600(file);
      setImagePreview(resizedBase64);

      setLoadingMessage(
        "AI 로봇이 책을 읽으며 단어, 발음기호, 연어, 예문을 분석하고 있어요 🤖📖"
      );

      const res = await fetch("/api/ocr/parse-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: resizedBase64,
          mimeType: "image/jpeg",
          fileName: file.name,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "단어 분석에 실패했습니다.");
      }

      setParsedData(json.data);
      if (json.notice) {
        setErrorNotice(json.notice);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorNotice(
        err instanceof Error ? err.message : "이미지 분석 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 교재 헤더 정보 편집 핸들러
  const handleDeckFieldChange = (
    field: "deck_title" | "publisher" | "book_name" | "target_grade",
    val: string
  ) => {
    if (!parsedData) return;
    setParsedData({ ...parsedData, [field]: val });
  };

  // 단어 필드 편집 핸들러
  const handleWordFieldChange = (
    index: number,
    field:
      | "word"
      | "korean_definition"
      | "phonetic_symbol"
      | "english_definition"
      | "example_sentence",
    val: string
  ) => {
    if (!parsedData) return;
    const nextWords = [...parsedData.words];
    nextWords[index] = { ...nextWords[index], [field]: val };
    setParsedData({ ...parsedData, words: nextWords });
  };

  const handleCollocationsChange = (index: number, val: string) => {
    if (!parsedData) return;
    const nextWords = [...parsedData.words];
    const splitted = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    nextWords[index] = { ...nextWords[index], collocations: splitted };
    setParsedData({ ...parsedData, words: nextWords });
  };

  const handleDeleteWord = (index: number) => {
    if (!parsedData) return;
    const nextWords = parsedData.words.filter((_, i) => i !== index);
    setParsedData({ ...parsedData, words: nextWords });
  };

  const handleAddEmptyWord = () => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      words: [
        ...parsedData.words,
        {
          word: "newword",
          part_of_speech: "noun",
          phonetic_symbol: "/.../",
          english_definition: "definition here",
          korean_definition: "새 단어 뜻",
          synonyms: [],
          antonyms: [],
          collocations: [],
          example_sentence: "Example sentence goes here.",
          ted_context: "",
        },
      ],
    });
  };

  const handleSaveDeck = () => {
    if (!parsedData || parsedData.words.length === 0) {
      alert("단어가 최소 1개 이상 있어야 합니다.");
      return;
    }

    const wordsToSave = parsedData.words.map((w) => ({
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

    const saved = createLocalDeck(
      parsedData.deck_title || "새 단어장",
      wordsToSave,
      {
        originalImageUrl: imagePreview || undefined,
        publisher: parsedData.publisher || undefined,
        book_name: parsedData.book_name || undefined,
        target_grade: parsedData.target_grade || undefined,
        extra_metadata: parsedData.extra_metadata,
      }
    );

    router.push(`/study/${saved.id}`);
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
            교재 사진으로 단어장 만들기 📸
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            다양한 출판사의 교재도 AI가 발음기호, 연어, 뜻을 완벽히 인식합니다.
          </p>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-sm font-medium flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">안내: </span>
            {errorNotice}
          </div>
        </div>
      )}

      {/* 업로드 대기 영역 */}
      {!parsedData && !isLoading && (
        <div className="card-chunky text-center border-2 border-dashed border-brand-300 hover:border-brand-500 bg-white p-8 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center text-4xl shadow-inner mb-4">
            📸
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
            교재 사진을 찍거나 올려주세요
          </h3>
          <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto mb-6">
            모바일에서는 후면 카메라가 바로 열립니다. 발음기호나 연어가 포함된 교재도 자동으로 분석됩니다!
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-touch bg-brand-500 hover:bg-brand-600 text-white rounded-2xl shadow-playful-brand font-black text-lg"
            >
              <Camera className="w-6 h-6" />
              <span>사진 촬영 / 사진 선택</span>
            </button>
          </div>
        </div>
      )}

      {/* AI 로딩 애니메이션 */}
      {isLoading && (
        <div className="card-chunky text-center py-16 bg-white border-brand-200">
          <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🤖</div>
            <div className="absolute -bottom-2 text-4xl">📖</div>
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2 animate-pulse">
            AI 로봇이 교재를 분석 중입니다!
          </h3>
          <p className="text-sm sm:text-base font-semibold text-brand-600">
            {loadingMessage}
          </p>
          <div className="w-48 h-2 bg-slate-100 rounded-full mx-auto mt-6 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* 파싱 결과 검토 및 편집 폼 (교재 메타데이터 & 유연한 단어 필드) */}
      {parsedData && !isLoading && (
        <div className="space-y-6">
          <div className="card-chunky bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 분석 완료 (총 {parsedData.words.length}단어)
              </span>
              <button
                type="button"
                onClick={() => {
                  setParsedData(null);
                  setImagePreview(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                다른 사진으로 다시 찍기
              </button>
            </div>

            {/* 단어장 제목 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                단어장 제목
              </label>
              <input
                type="text"
                value={parsedData.deck_title}
                onChange={(e) => handleDeckFieldChange("deck_title", e.target.value)}
                className="w-full text-xl font-black text-slate-900 border-2 border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* 교재 및 출판사 확장 필드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Building className="w-3 h-3" /> 출판사
                </label>
                <input
                  type="text"
                  placeholder="예: 능률, EBS, TED"
                  value={parsedData.publisher || ""}
                  onChange={(e) => handleDeckFieldChange("publisher", e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 border-b border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> 교재명
                </label>
                <input
                  type="text"
                  placeholder="예: 초등 필수 800"
                  value={parsedData.book_name || ""}
                  onChange={(e) => handleDeckFieldChange("book_name", e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 border-b border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> 대상 학년
                </label>
                <input
                  type="text"
                  placeholder="예: 초등 5학년"
                  value={parsedData.target_grade || ""}
                  onChange={(e) => handleDeckFieldChange("target_grade", e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 border-b border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 단어별 편집 카드 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-black text-lg text-slate-800">
                추출된 단어 목록
              </h4>
              <button
                type="button"
                onClick={handleAddEmptyWord}
                className="btn-touch min-h-[38px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>단어 직접 추가</span>
              </button>
            </div>

            {parsedData.words.map((item, idx) => (
              <div
                key={`word-item-${idx}`}
                className="card-chunky bg-white p-4 sm:p-5 border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-400">
                        영단어
                      </label>
                      <input
                        type="text"
                        value={item.word}
                        onChange={(e) =>
                          handleWordFieldChange(idx, "word", e.target.value)
                        }
                        className="w-full font-black text-lg text-brand-700 border-b-2 border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400">
                        발음기호 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="/.../"
                        value={item.phonetic_symbol || ""}
                        onChange={(e) =>
                          handleWordFieldChange(idx, "phonetic_symbol", e.target.value)
                        }
                        className="w-full text-sm font-semibold text-slate-500 border-b border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400">
                        한글 뜻 (초등 맞춤)
                      </label>
                      <input
                        type="text"
                        value={item.korean_definition}
                        onChange={(e) =>
                          handleWordFieldChange(
                            idx,
                            "korean_definition",
                            e.target.value
                          )
                        }
                        className="w-full font-black text-lg text-slate-900 border-b-2 border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteWord(idx)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    title="단어 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 연어 표현 입력 (쉼표로 구분) */}
                <div>
                  <label className="text-xs font-bold text-slate-400">
                    연어/짝단어 표현 (쉼표로 구분, 예: build a monument, historic monument)
                  </label>
                  <input
                    type="text"
                    value={item.collocations?.join(", ") || ""}
                    onChange={(e) => handleCollocationsChange(idx, e.target.value)}
                    className="w-full text-xs font-semibold text-amber-900 border-b border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400">
                    대표 예문
                  </label>
                  <input
                    type="text"
                    value={item.example_sentence || ""}
                    onChange={(e) =>
                      handleWordFieldChange(idx, "example_sentence", e.target.value)
                    }
                    className="w-full text-sm font-medium text-slate-600 border-b border-slate-200 focus:border-brand-500 py-1 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-4 z-20">
            <button
              type="button"
              onClick={handleSaveDeck}
              className="w-full btn-touch min-h-[56px] bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white rounded-2xl font-black text-xl shadow-playful-brand"
            >
              <CheckCircle className="w-6 h-6 text-sunny-300" />
              <span>단어장 저장 및 학습 시작하기! 🚀</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
