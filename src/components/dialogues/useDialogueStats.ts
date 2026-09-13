import { useCallback, useState } from "react";

const KEY = "hanziflow:dialogue-stats";

export interface DialogueStat {
  /** epoch ms of the most recent line playback */
  listenedAt?: number;
  /** epoch ms when play-all last completed */
  completedAt?: number;
}

export type DialogueStats = Record<string, DialogueStat>;

function readStats(): DialogueStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DialogueStats;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStats(stats: DialogueStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* private mode — ignore */
  }
}

/** localStorage-backed per-dialogue listen/completion stats. */
export function useDialogueStats() {
  const [stats, setStats] = useState<DialogueStats>(readStats);

  const update = useCallback((id: string, patch: Partial<DialogueStat>) => {
    setStats((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      writeStats(next);
      return next;
    });
  }, []);

  const markListened = useCallback((id: string) => update(id, { listenedAt: Date.now() }), [update]);
  const markCompleted = useCallback(
    (id: string) => update(id, { listenedAt: Date.now(), completedAt: Date.now() }),
    [update]
  );

  return { stats, markListened, markCompleted };
}

/** Compact relative time: "just now", "3h ago", "2d ago". */
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
