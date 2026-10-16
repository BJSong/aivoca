/**
 * Web Audio API 기반 효과음 생성기 & Web Speech API 발음 재생기
 * 외부 오디오 파일 다운로드 없이 브라우저 내장 API로 즉각적이고 신뢰성 높은 피드백 제공
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/** 정답 시 기분 좋은 챠링 사운드 (C5 -> E5 -> G5 -> C6) */
export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

    gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
  });
}

/** 콤보(연속 정답) 시 점진적으로 음이 올라가는 경쾌한 사운드 */
export function playComboSound(combo: number = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // 도-레-미-파-솔-라-시-도 스케일
  const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
  const noteIndex = Math.min(Math.max(combo - 1, 0), scale.length - 1);
  const baseFreq = scale[noteIndex];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.29);
}

/** 오답 시 부드러운 우당탕/흔들림 음 (낮은 톤의 부드러운 알림음) */
export function playIncorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(260, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.26);
}

/** 블록 탭 또는 가상 키보드 클릭음 */
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

/** 퀘스트 완료 / 레벨업 팡파르 */
export function playFanfareSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const chords = [
    { freqs: [523.25, 659.25], time: 0.0, dur: 0.15 },
    { freqs: [523.25, 659.25], time: 0.18, dur: 0.15 },
    { freqs: [523.25, 659.25], time: 0.36, dur: 0.15 },
    { freqs: [659.25, 783.99, 1046.5], time: 0.54, dur: 0.55 },
  ];

  chords.forEach(({ freqs, time, dur }) => {
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.05);
    });
  });
}

/**
 * 로컬 보이스 품질 점수 산출 함수 (Score Voice)
 * Natural / Enhanced / Neural 등 고품질 로컬 신경망 보이스에 높은 가중치 부여
 */
export function scoreVoice(voice: { name: string; lang: string }): number {
  const lang = voice.lang.toLowerCase();
  if (!lang.startsWith("en")) return -1;

  let score = 10;
  const name = voice.name.toLowerCase();

  // 1. 방언 선호도 (미국 영어 최우선 > 영국 영어 > 기타 영어)
  if (lang === "en-us" || lang.startsWith("en_us")) score += 15;
  else if (lang === "en-gb" || lang.startsWith("en_gb")) score += 8;
  else score += 4;

  // 2. 최신 고음질 신경망(Natural / Neural) 키워드 가중치
  if (name.includes("natural")) score += 35; // Edge Microsoft Natural 음성 등
  if (name.includes("online")) score += 20; // Edge Online Natural 음성
  if (name.includes("neural")) score += 30; // Neural 모델
  if (name.includes("enhanced") || name.includes("premium")) score += 30; // Apple Samantha Enhanced, Premium 등

  // 3. 검증된 원어민 품질 보이스명 가중치
  if (name.includes("google us english") || name.includes("google uk english")) score += 25;
  if (name.includes("siri")) score += 25;
  if (name.includes("samantha") || name.includes("ava") || name.includes("allison")) score += 20;
  if (name.includes("jenny") || name.includes("guy") || name.includes("aria")) score += 22;

  // 4. 구형/기계음 합성 엔진 감점
  if (name.includes("espeak") || name.includes("compact")) score -= 20;

  return score;
}

let cachedBestVoice: SpeechSynthesisVoice | null = null;

/**
 * 시스템에 설치된 가장 음질이 뛰어난 영어 보이스를 탐색 및 반환
 */
export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedBestVoice) return cachedBestVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  let highestScore = -1;
  let best: SpeechSynthesisVoice | null = null;

  for (const voice of voices) {
    const s = scoreVoice(voice);
    if (s > highestScore) {
      highestScore = s;
      best = voice;
    }
  }

  // 가중치 탐색 실패 시 기본 en 보이스 매핑
  if (!best) {
    best = voices.find((v) => v.lang.toLowerCase().startsWith("en")) || null;
  }

  if (best) {
    cachedBestVoice = best;
  }
  return best;
}

// 브라우저 보이스 비동기 로딩 이벤트 리스너 등록
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const handleVoicesChanged = () => {
    cachedBestVoice = null;
    getBestEnglishVoice();
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    handleVoicesChanged();
  }

  window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
}

/** 텍스트 정제 (마크다운 기호 및 특수문자 발화 방지) */
export function sanitizeSpeechText(text: string): string {
  return text
    .replace(/\[\s*_{2,}\s*\]/g, " blank ") // [ _____ ] 빈칸 표현을 'blank'로 선처리
    .replace(/_{2,}/g, " blank ") // 연속 언더스코어 빈칸 처리
    .replace(/[*~`#[\]]/g, "") // 마크다운 서식 기호 제거
    .replace(/[“”"]/g, "") // 큰따옴표 제거
    .replace(/\s+([!?,.:;])/g, "$1") // 문장 부호 앞 공백 제거
    .replace(/\s+/g, " ")
    .trim();
}

/** Web Speech API를 통한 영어 단어 음성 합성 발음 (최적화 버전) */
export function speakWord(
  text: string,
  rate: number = 0.95,
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  const cleanText = sanitizeSpeechText(text);
  if (!cleanText) {
    onEnd?.();
    return;
  }

  // 크롬 백그라운드 정지 현상 방지
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  window.speechSynthesis.cancel(); // 이전 재생 중단

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate; // 0.95 = 자연스럽고 또렷한 기본 속도
  utterance.pitch = 1.0; // 안정적인 기본 원어민 톤

  const bestVoice = getBestEnglishVoice();
  if (bestVoice) {
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang;
  } else {
    utterance.lang = "en-US";
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

/** 1단계용: 발음 2회 연속 재생 (450ms 간격) */
export function speakTwice(text: string, rate: number = 0.95) {
  speakWord(text, rate, () => {
    setTimeout(() => {
      speakWord(text, rate);
    }, 450);
  });
}

/** 예문 전체 음성 재생 (Sentence TTS) */
export function speakSentence(
  text: string,
  rate: number = 0.92,
  onEnd?: () => void
) {
  speakWord(text, rate, onEnd);
}

