import { useCallback, useEffect, useRef, useState } from "react";
import type { Dialogue } from "@/data";

export const SPEEDS = [0.75, 0.85, 1] as const;

function pickZhVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const zh = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("zh"));
  if (zh.length === 0) return null;
  return (
    zh.find((v) => v.lang.toLowerCase().includes("cn")) ??
    zh.find((v) => v.lang.toLowerCase().includes("cmn")) ??
    zh[0]
  );
}

export interface UseDialoguePlayer {
  supported: boolean;
  /** true once a zh voice is installed and loaded */
  hasVoice: boolean;
  playing: boolean;
  /** index of the line currently (or most recently) played; null before first play */
  activeIndex: number | null;
  repeat: boolean;
  speed: number;
  autoAdvance: boolean;
  toggleRepeat: () => void;
  cycleSpeed: () => void;
  setAutoAdvance: (v: boolean) => void;
  /** start / resume play-all; defaults to the stored pointer (next unplayed line) */
  playAll: (from?: number) => void;
  /** pause keeping position — resume replays the current line */
  pause: () => void;
  /** stop and reset to the first line */
  stop: () => void;
}

interface PlayerCallbacks {
  /** fired whenever a line starts speaking */
  onLinePlayed?: () => void;
  /** fired when the last line finishes (also per repeat loop) */
  onCompleted?: () => void;
}

/**
 * Play-all speech engine: chains per-line zh-CN utterances with a 600ms gap,
 * repeat / speed / auto-advance controls, cancellation-safe via tokens,
 * and best-effort resume after iOS backgrounds the PWA.
 */
export function useDialoguePlayer(
  dialogue: Dialogue | undefined,
  callbacks: PlayerCallbacks = {}
): UseDialoguePlayer {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [hasVoice, setHasVoice] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [speed, setSpeed] = useState<number>(0.85);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const tokenRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const pointerRef = useRef(0);
  const playingRef = useRef(false);
  const repeatRef = useRef(repeat);
  const autoRef = useRef(autoAdvance);
  const speedRef = useRef(speed);
  const cbRef = useRef(callbacks);
  const dialogueRef = useRef(dialogue);

  repeatRef.current = repeat;
  autoRef.current = autoAdvance;
  speedRef.current = speed;
  cbRef.current = callbacks;
  dialogueRef.current = dialogue;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // load + watch system voices
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = pickZhVoice(window.speechSynthesis.getVoices());
      voiceRef.current = v;
      setHasVoice(v !== null);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  const speakAt = useCallback(
    (i: number) => {
      const d = dialogueRef.current;
      if (!supported || !d || i < 0 || i >= d.lines.length) return;
      const token = ++tokenRef.current;
      clearTimer();
      window.speechSynthesis.cancel();

      pointerRef.current = i;
      setActiveIndex(i);
      playingRef.current = true;
      setPlaying(true);
      cbRef.current.onLinePlayed?.();

      const u = new SpeechSynthesisUtterance(d.lines[i].zh);
      u.lang = "zh-CN";
      u.rate = speedRef.current;
      if (voiceRef.current) u.voice = voiceRef.current;

      u.onend = () => {
        if (tokenRef.current !== token) return;
        const isLast = i >= d.lines.length - 1;
        if (isLast) {
          cbRef.current.onCompleted?.();
          pointerRef.current = 0;
          if (repeatRef.current) {
            timerRef.current = window.setTimeout(() => {
              if (tokenRef.current === token) speakAt(0);
            }, 600);
            return;
          }
          playingRef.current = false;
          setPlaying(false);
          return;
        }
        if (autoRef.current) {
          pointerRef.current = i + 1;
          timerRef.current = window.setTimeout(() => {
            if (tokenRef.current === token) speakAt(i + 1);
          }, 600);
        } else {
          pointerRef.current = i + 1;
          playingRef.current = false;
          setPlaying(false);
        }
      };
      u.onerror = () => {
        if (tokenRef.current !== token) return;
        playingRef.current = false;
        setPlaying(false);
      };

      window.speechSynthesis.speak(u);
    },
    [supported, clearTimer]
  );

  const playAll = useCallback(
    (from?: number) => {
      const d = dialogueRef.current;
      if (!d) return;
      const start = from ?? Math.min(pointerRef.current, d.lines.length - 1);
      speakAt(start);
    },
    [speakAt]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    tokenRef.current += 1;
    clearTimer();
    window.speechSynthesis.cancel();
    playingRef.current = false;
    setPlaying(false);
  }, [supported, clearTimer]);

  const stop = useCallback(() => {
    pause();
    pointerRef.current = 0;
    setActiveIndex(null);
  }, [pause]);

  // cancel on unmount
  useEffect(
    () => () => {
      tokenRef.current += 1;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (supported) window.speechSynthesis.cancel();
    },
    [supported]
  );

  // iOS: speechSynthesis is killed when the PWA is backgrounded — resume the
  // current line when the app comes back and nothing is speaking/pending.
  useEffect(() => {
    if (!supported) return;
    const onVis = () => {
      if (document.hidden) return;
      if (!playingRef.current || timerRef.current !== null) return;
      const s = window.speechSynthesis;
      if (s.speaking || s.pending) return;
      speakAt(pointerRef.current);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [supported, speakAt]);

  const toggleRepeat = useCallback(() => setRepeat((v) => !v), []);
  const cycleSpeed = useCallback(
    () => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]),
    []
  );

  return {
    supported,
    hasVoice,
    playing,
    activeIndex,
    repeat,
    speed,
    autoAdvance,
    toggleRepeat,
    cycleSpeed,
    setAutoAdvance,
    playAll,
    pause,
    stop,
  };
}
