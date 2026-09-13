import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "hanziflow:pinyin";

interface PinyinContextValue {
  /** whether pinyin is shown globally */
  showPinyin: boolean;
  setShowPinyin: (v: boolean) => void;
  togglePinyin: () => void;
}

const PinyinContext = createContext<PinyinContextValue>({
  showPinyin: true,
  setShowPinyin: () => {},
  togglePinyin: () => {},
});

function readInitial(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function PinyinProvider({ children }: { children: ReactNode }) {
  const [showPinyin, setShowPinyinState] = useState<boolean>(readInitial);

  const setShowPinyin = (v: boolean) => {
    setShowPinyinState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* private mode — ignore */
    }
  };

  return (
    <PinyinContext.Provider
      value={{ showPinyin, setShowPinyin, togglePinyin: () => setShowPinyin(!showPinyin) }}
    >
      {children}
    </PinyinContext.Provider>
  );
}

/** Global pinyin visibility toggle, persisted in localStorage. */
export function usePinyin(): PinyinContextValue {
  return useContext(PinyinContext);
}

/** Sync pinyin collapse animation helper: returns classes for a pinyin row. */
export function pinyinCollapseClass(show: boolean): string {
  return show
    ? "opacity-100 max-h-8"
    : "opacity-0 max-h-0";
}
