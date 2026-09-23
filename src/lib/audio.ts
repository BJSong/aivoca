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

/** Web Speech API를 통한 영어 단어 음성 합성 발음 */
export function speakWord(
  text: string,
  rate: number = 1.0,
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel(); // 이전 재생 중단

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate; // 1.0 = 보통, 0.8 = 느린 달팽이 속도
  utterance.pitch = 1.05; // 초등학생에게 친근한 약간 밝은 톤

  // 사용 가능한 영어 보이스 탐색
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Natural"))
  ) || voices.find((v) => v.lang.startsWith("en"));

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/** 1단계용: 발음 2회 연속 재생 (500ms 간격) */
export function speakTwice(text: string, rate: number = 1.0) {
  speakWord(text, rate, () => {
    setTimeout(() => {
      speakWord(text, rate);
    }, 450);
  });
}

/** 예문 전체 음성 재생 (Sentence TTS) */
export function speakSentence(
  text: string,
  rate: number = 0.95,
  onEnd?: () => void
) {
  speakWord(text, rate, onEnd);
}

