import { useSyncExternalStore } from "react";

/**
 * App-wide settings store ("hanziflow-settings" localStorage key, versioned schema).
 * Also owns theme application (adds/removes `dark` on <html>) and capture of the
 * PWA `beforeinstallprompt` event, since those need a single app-wide home and
 * the shared shell files are outside this page's scope.
 */

export type ThemeChoice = "light" | "dark" | "auto";
export type DefaultLevel = "all" | 1 | 2;
export type StrokeSpeed = 0.5 | 1 | 2;

export interface AppSettings {
  version: 1;
  /** pre-filters random pool, picker, daily character */
  defaultLevel: DefaultLevel;
  /** stroke animation speed multiplier */
  strokeSpeed: StrokeSpeed;
  /** auto-hint after 3 quiz mistakes */
  quizHints: boolean;
  /** speech rate 0.6–1.0 (default 0.85) */
  speechRate: number;
  /** speechSynthesis voiceURI of the chosen Chinese voice (null = auto) */
  voiceURI: string | null;
  /** auto-play stroke animation when a character loads */
  autoplayStrokes: boolean;
  theme: ThemeChoice;
  /** show tian-zi-ge guide grid on practice canvases */
  showGrid: boolean;
}

const STORAGE_KEY = "hanziflow-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  defaultLevel: "all",
  strokeSpeed: 1,
  quizHints: true,
  speechRate: 0.85,
  voiceURI: null,
  autoplayStrokes: true,
  theme: "light",
  showGrid: true,
};

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings> | null;
      if (parsed && parsed.version === 1) {
        return { ...DEFAULT_SETTINGS, ...parsed, version: 1 };
      }
    }
  } catch {
    /* private mode / corrupt data — fall through to defaults */
  }
  return { ...DEFAULT_SETTINGS };
}

let settings: AppSettings = typeof window === "undefined" ? { ...DEFAULT_SETTINGS } : load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getSettings(): AppSettings {
  return settings;
}

export function updateSettings(patch: Partial<Omit<AppSettings, "version">>): void {
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  if (patch.theme !== undefined) applyTheme(settings.theme);
  emit();
}

function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Live app settings; updates re-render subscribers. */
export function useAppSettings(): AppSettings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}

/* ---------------------------------- theme --------------------------------- */

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Apply/remove the `dark` class on documentElement for a theme choice. */
export function applyTheme(choice: ThemeChoice): void {
  if (typeof document === "undefined") return;
  const dark = choice === "dark" || (choice === "auto" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

/* ------------------------------ install prompt ----------------------------- */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallState {
  /** beforeinstallprompt captured — programmatic install is possible */
  canInstall: boolean;
  /** already running as an installed PWA */
  installed: boolean;
  /** iOS Safari — no programmatic install, show instructions instead */
  isIOS: boolean;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const installListeners = new Set<() => void>();
let installStateSnapshot: InstallState = { canInstall: false, installed: false, isIOS: false };

function computeInstallState(): InstallState {
  return { canInstall: deferredPrompt !== null, installed, isIOS: detectIOS() };
}

function refreshInstallState(): void {
  installStateSnapshot = computeInstallState();
  installListeners.forEach((l) => l());
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function subscribeInstall(listener: () => void): () => void {
  installListeners.add(listener);
  return () => {
    installListeners.delete(listener);
  };
}

function getInstallState(): InstallState {
  return installStateSnapshot;
}

/** Live install capability state (beforeinstallprompt / appinstalled / iOS). */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribeInstall, getInstallState, getInstallState);
}

/** Trigger the captured install prompt. Returns the user's choice, or null. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | null> {
  if (!deferredPrompt) return null;
  const evt = deferredPrompt;
  deferredPrompt = null;
  refreshInstallState();
  await evt.prompt();
  const choice = await evt.userChoice;
  return choice.outcome;
}

/* ---------------------------- module side effects -------------------------- */

if (typeof window !== "undefined") {
  // Apply the saved theme as early as this module is loaded.
  applyTheme(settings.theme);
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemTheme = () => {
      if (settings.theme === "auto") applyTheme("auto");
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onSystemTheme);
  } catch {
    /* older engines — ignore */
  }

  installed =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  installStateSnapshot = computeInstallState();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    refreshInstallState();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    refreshInstallState();
  });
}
