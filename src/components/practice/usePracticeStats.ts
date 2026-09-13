import { useCallback, useEffect, useState } from "react";

const STATS_KEY = "hanziflow:practice-stats";

export interface CharStats {
  /** completed quiz count */
  count: number;
  /** fewest mistakes in a completed quiz; null = never quizzed */
  best: number | null;
  /** true when a quiz completion used the Hint button at least once */
  assisted: boolean;
  /** ISO dates (yyyy-mm-dd) with any practice activity */
  days: string[];
}

export type PracticeStatsMap = Record<string, CharStats>;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readStats(): PracticeStatsMap {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as PracticeStatsMap;
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

const EMPTY: CharStats = { count: 0, best: null, assisted: false, days: [] };

/** localStorage-backed per-character practice stats (quiz count, best result, active days). */
export function usePracticeStats() {
  const [stats, setStats] = useState<PracticeStatsMap>(readStats);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      /* private mode — ignore */
    }
  }, [stats]);

  const getStats = useCallback((char: string): CharStats => stats[char] ?? EMPTY, [stats]);

  /** record a day of activity for the character (no quiz counters) */
  const touchDay = useCallback((char: string) => {
    const today = todayISO();
    setStats((prev) => {
      const cur = prev[char] ?? EMPTY;
      if (cur.days.includes(today)) return prev;
      return { ...prev, [char]: { ...cur, days: [...cur.days.slice(-30), today] } };
    });
  }, []);

  /** record a completed quiz */
  const recordQuiz = useCallback((char: string, mistakes: number, assisted: boolean) => {
    const today = todayISO();
    setStats((prev) => {
      const cur = prev[char] ?? EMPTY;
      const best = cur.best === null ? mistakes : Math.min(cur.best, mistakes);
      const days = cur.days.includes(today) ? cur.days : [...cur.days.slice(-30), today];
      return {
        ...prev,
        [char]: { count: cur.count + 1, best, assisted: cur.assisted || assisted, days },
      };
    });
  }, []);

  /** booleans for the last 7 days (oldest → today) */
  const last7Days = useCallback(
    (char: string): boolean[] => {
      const cur = stats[char];
      const out: boolean[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        out.push(cur ? cur.days.includes(iso) : false);
      }
      return out;
    },
    [stats]
  );

  return { getStats, touchDay, recordQuiz, last7Days };
}
