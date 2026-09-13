import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeech {
  /** true when speechSynthesis exists */
  supported: boolean;
  /** true when a Chinese voice is installed */
  hasChineseVoice: boolean;
  /** currently speaking */
  speaking: boolean;
  /** speak Chinese text at rate (default 0.85) */
  speak: (text: string, rate?: number) => void;
  cancel: () => void;
}

function pickChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const zh = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("zh"));
  if (zh.length === 0) return null;
  return (
    zh.find((v) => v.lang.toLowerCase().includes("cn")) ??
    zh.find((v) => v.lang.toLowerCase().includes("cmn")) ??
    zh[0]
  );
}

/** Wrapper around window.speechSynthesis with zh voice selection. */
export function useSpeech(): UseSpeech {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [hasChineseVoice, setHasChineseVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = pickChineseVoice(window.speechSynthesis.getVoices());
      voiceRef.current = v;
      setHasChineseVoice(v !== null);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, rate = 0.85) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = Math.min(1.5, Math.max(0.5, rate));
      if (voiceRef.current) u.voice = voiceRef.current;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [supported]
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, hasChineseVoice, speaking, speak, cancel };
}
