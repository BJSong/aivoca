"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speakWord } from "@/lib/audio";

interface SoundExplorerProps {
  word: string;
  autoPlay?: boolean;
}

export default function SoundExplorer({ word }: SoundExplorerProps) {
  const [speed, setSpeed] = useState<0.8 | 1.0>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (forcedSpeed?: 0.8 | 1.0) => {
    const playSpeed = forcedSpeed ?? speed;
    setIsPlaying(true);
    speakWord(word, playSpeed, () => {
      setIsPlaying(false);
    });
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {/* 큰 발음 듣기 버튼 (48px 이상 터치 타깃) */}
      <button
        type="button"
        onClick={() => handlePlay()}
        className={`btn-touch min-h-[52px] px-6 rounded-2xl font-black text-lg transition-all shadow-playful-brand ${
          isPlaying
            ? "bg-brand-600 text-white scale-95"
            : "bg-brand-500 hover:bg-brand-600 text-white"
        }`}
        title="발음 듣기"
      >
        <Volume2
          className={`w-6 h-6 ${isPlaying ? "animate-pulse scale-110" : ""}`}
        />
        <span>발음 듣기</span>
      </button>

      {/* 속도 토글 버튼 (토끼 1.0x / 달팽이 0.8x) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setSpeed(1.0);
            handlePlay(1.0);
          }}
          className={`px-3 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1 ${
            speed === 1.0
              ? "bg-white text-brand-700 shadow-sm scale-105"
              : "text-slate-500 hover:text-slate-700"
          }`}
          title="보통 속도 (1.0x)"
        >
          <span>🐰</span>
          <span>1.0x</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSpeed(0.8);
            handlePlay(0.8);
          }}
          className={`px-3 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1 ${
            speed === 0.8
              ? "bg-white text-orange-600 shadow-sm scale-105"
              : "text-slate-500 hover:text-slate-700"
          }`}
          title="느린 속도 (0.8x)"
        >
          <span>🐌</span>
          <span>0.8x</span>
        </button>
      </div>
    </div>
  );
}
