import { useSyncExternalStore } from "react";
import { getSettings } from "./settings";

/**
 * Speech helpers that honor the user's saved voice + speech-rate settings.
 * The shared useSpeech hook always auto-picks a voice; these helpers let the
 * Settings voice picker (and word audio) use the explicitly chosen zh voice.
 */

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
const voiceListeners = new Set<() => void>();

function refreshVoices(): void {
  if (!supported()) {
    cachedVoices = [];
    return;
  }
  cachedVoices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("zh"));
  voiceListeners.forEach((l) => l());
}

if (supported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

function subscribeVoices(listener: () => void): () => void {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
}

function getChineseVoices(): SpeechSynthesisVoice[] {
  return cachedVoices;
}

/** All installed voices whose lang starts with zh (live via voiceschanged). */
export function useChineseVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, getChineseVoices, getChineseVoices);
}

export interface SpeakOptions {
  /** explicit voice override (e.g. preview buttons in the voice picker) */
  voice?: SpeechSynthesisVoice | null;
  /** rate override; defaults to the saved setting */
  rate?: number;
}

/**
 * Speak Chinese text using the saved voice + rate settings (or overrides).
 * Falls back to the engine's default zh voice when none is chosen.
 */
export function speakChinese(text: string, opts: SpeakOptions = {}): void {
  if (!supported()) return;
  const { speechRate, voiceURI } = getSettings();
  const rate = Math.min(1.5, Math.max(0.5, opts.rate ?? speechRate));
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = rate;
  let voice = opts.voice ?? null;
  if (!voice && voiceURI) {
    voice = cachedVoices.find((v) => v.voiceURI === voiceURI) ?? null;
  }
  if (!voice) {
    voice =
      cachedVoices.find((v) => v.lang.toLowerCase().includes("cn")) ??
      cachedVoices.find((v) => v.lang.toLowerCase().includes("cmn")) ??
      cachedVoices[0] ??
      null;
  }
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function cancelSpeech(): void {
  if (!supported()) return;
  window.speechSynthesis.cancel();
}
