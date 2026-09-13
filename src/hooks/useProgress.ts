import { useCallback, useEffect, useState } from "react";

const MASTERED_KEY = "hanziflow:mastered";
const STREAK_KEY = "hanziflow:streak";

export interface StreakData {
  count: number;
  /** ISO date (yyyy-mm-dd) of last day the streak was extended */
  lastDate: string;
}

export interface UseProgress {
  /** set of mastered characters (quiz passed correctly twice) */
  mastered: ReadonlySet<string>;
  masteredCount: number;
  isMastered: (char: string) => boolean;
  markMastered: (char: string) => void;
  unmarkMastered: (char: string) => void;
  streak: StreakData;
  /** true when the streak was already extended today */
  streakExtendedToday: boolean;
  /** record today's activity; extends the streak once per day */
  touchStreak: () => void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readMastered(): Set<string> {
  try {
    const raw = localStorage.getItem(MASTERED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((c) => typeof c === "string") : []);
  } catch {
    return new Set();
  }
}

function readStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) {
      const s = JSON.parse(raw) as StreakData;
      if (typeof s.count === "number" && typeof s.lastDate === "string") return s;
    }
  } catch {
    /* ignore */
  }
  return { count: 0, lastDate: "" };
}

/** localStorage-backed mastered-character set + daily streak. */
export function useProgress(): UseProgress {
  const [mastered, setMastered] = useState<Set<string>>(readMastered);
  const [streak, setStreak] = useState<StreakData>(readStreak);

  useEffect(() => {
    try {
      localStorage.setItem(MASTERED_KEY, JSON.stringify([...mastered]));
    } catch {
      /* ignore */
    }
  }, [mastered]);

  useEffect(() => {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    } catch {
      /* ignore */
    }
  }, [streak]);

  const isMastered = useCallback((char: string) => mastered.has(char), [mastered]);

  const markMastered = useCallback((char: string) => {
    setMastered((prev) => {
      if (prev.has(char)) return prev;
      const next = new Set(prev);
      next.add(char);
      return next;
    });
  }, []);

  const unmarkMastered = useCallback((char: string) => {
    setMastered((prev) => {
      if (!prev.has(char)) return prev;
      const next = new Set(prev);
      next.delete(char);
      return next;
    });
  }, []);

  const streakExtendedToday = streak.lastDate === todayISO();

  const touchStreak = useCallback(() => {
    setStreak((prev) => {
      const today = todayISO();
      if (prev.lastDate === today) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      const count = prev.lastDate === yISO ? prev.count + 1 : 1;
      return { count, lastDate: today };
    });
  }, []);

  return {
    mastered,
    masteredCount: mastered.size,
    isMastered,
    markMastered,
    unmarkMastered,
    streak,
    streakExtendedToday,
    touchStreak,
  };
}
