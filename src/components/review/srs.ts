/**
 * SM-2-lite spaced-repetition scheduler for the flashcard Review deck.
 * Persisted in localStorage under its own namespace key `hanziflow:review`.
 */

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  /** leitner box 1–5 */
  box: 1 | 2 | 3 | 4 | 5;
  /** epoch ms when the card is next due */
  due: number;
  reps: number;
  lapses: number;
}

export type Deck = Record<string, CardState>;

export interface DeckStats {
  /** words with any SRS state */
  learned: number;
  /** words never seen */
  fresh: number;
  /** due right now */
  due: number;
  /** next due timestamp across the deck (null when nothing scheduled) */
  nextDue: number | null;
  totalReps: number;
  totalLapses: number;
}

const STORAGE_KEY = "hanziflow:review";

const MINUTE = 60_000;
const DAY = 86_400_000;

/** "Good" interval in days indexed by resulting box (1–5). */
const GOOD_DAYS = [0, 1, 2, 4, 7, 15] as const;

const clampBox = (n: number): CardState["box"] =>
  Math.min(5, Math.max(1, Math.round(n))) as CardState["box"];

function readDeck(): Deck {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<CardState>>;
    const deck: Deck = {};
    for (const [id, s] of Object.entries(parsed)) {
      if (s && typeof s.due === "number" && typeof s.box === "number") {
        deck[id] = {
          box: clampBox(s.box),
          due: s.due,
          reps: typeof s.reps === "number" ? s.reps : 0,
          lapses: typeof s.lapses === "number" ? s.lapses : 0,
        };
      }
    }
    return deck;
  } catch {
    return {};
  }
}

function writeDeck(deck: Deck): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
  } catch {
    /* private mode — ignore */
  }
}

/** Current state of a word, or undefined when never reviewed. */
export function getCardState(id: string): CardState | undefined {
  return readDeck()[id];
}

/** Ids of all cards due at `now`, soonest first. */
export function dueWords(now = Date.now()): string[] {
  const deck = readDeck();
  return Object.entries(deck)
    .filter(([, s]) => s.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

/** Apply a grade to a word; persists and returns the new state. */
export function gradeWord(id: string, grade: Grade, now = Date.now()): CardState {
  const deck = readDeck();
  const prev: CardState = deck[id] ?? { box: 1, due: now, reps: 0, lapses: 0 };
  let box = prev.box;
  let due = now;
  let lapses = prev.lapses;

  switch (grade) {
    case "again":
      box = 1;
      due = now + 10 * MINUTE;
      lapses += 1;
      break;
    case "hard":
      box = clampBox(box - 1);
      due = now + DAY;
      break;
    case "good":
      box = clampBox(box + 1);
      due = now + GOOD_DAYS[box] * DAY;
      break;
    case "easy":
      box = clampBox(box + 1);
      due = now + Math.round(GOOD_DAYS[box] * 2.5) * DAY;
      break;
  }

  const next: CardState = { box, due, reps: prev.reps + 1, lapses };
  deck[id] = next;
  writeDeck(deck);
  return next;
}

/**
 * Human-readable interval a grade would schedule from a given state
 * (used under the grade buttons, e.g. "10m", "1d", "4d", "10d").
 */
export function intervalLabel(state: CardState | undefined, grade: Grade): string {
  const box = state?.box ?? 1;
  switch (grade) {
    case "again":
      return "10m";
    case "hard":
      return "1d";
    case "good":
      return `${GOOD_DAYS[clampBox(box + 1)]}d`;
    case "easy":
      return `${Math.round(GOOD_DAYS[clampBox(box + 1)] * 2.5)}d`;
  }
}

/** Deck-wide stats for the completion / empty screens. */
export function deckStats(poolSize: number, now = Date.now()): DeckStats {
  const deck = readDeck();
  const states = Object.values(deck);
  const dues = states.map((s) => s.due).filter((d) => d > now);
  return {
    learned: states.length,
    fresh: Math.max(0, poolSize - states.length),
    due: states.filter((s) => s.due <= now).length,
    nextDue: dues.length > 0 ? Math.min(...dues) : null,
    totalReps: states.reduce((n, s) => n + s.reps, 0),
    totalLapses: states.reduce((n, s) => n + s.lapses, 0),
  };
}

/**
 * "Study ahead" pool: fresh words (no SRS state) ordered HSK-1 → HSK-2,
 * prioritizing words whose characters the user has practiced/mastered.
 */
export function studyAheadPool(
  allWords: { word: string }[],
  mastered: ReadonlySet<string>
): string[] {
  const deck = readDeck();
  const fresh = allWords.map((w) => w.word).filter((w) => !(w in deck));
  const scored = fresh.map((w) => ({
    w,
    score: [...w].reduce((n, ch) => n + (mastered.has(ch) ? 1 : 0), 0),
  }));
  // stable sort: higher mastered-char overlap first, original HSK order preserved otherwise
  return scored
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((s) => s.w);
}
