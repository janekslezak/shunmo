import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Brush, Check, ChevronRight, Home as HomeIcon, Layers, Sparkles, Volume2 } from "lucide-react";
import { words, dialogues } from "@/data";
import type { Word } from "@/data";
import { Chip } from "@/components/Chip";
import type { LevelFilter } from "@/components/Chip";
import TianGrid from "@/components/TianGrid";
import RadicalConfetti from "@/components/practice/RadicalConfetti";
import { useProgress } from "@/hooks/useProgress";
import { useSpeech } from "@/hooks/useSpeech";
import { useAppSettings } from "@/components/settings/settings";
import {
  deckStatsFor,
  dueWordsIn,
  gradeWord,
  getCardState,
  intervalLabel,
  studyAheadPool,
} from "@/components/review/srs";
import type { Grade } from "@/components/review/srs";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const SESSION_SIZE = 20;

const GRADES: Array<{ grade: Grade; label: string; cls: string }> = [
  { grade: "again", label: "Again", cls: "bg-error/10 text-error" },
  { grade: "hard", label: "Hard", cls: "bg-gold/10 text-gold" },
  { grade: "good", label: "Good", cls: "bg-jade/10 text-jade" },
  { grade: "easy", label: "Easy", cls: "bg-wash-blue/10 text-wash-blue" },
];

const wordById = new Map(words.map((w) => [w.word, w]));

/** Front-face sizing for multi-character words: one TianGrid cell per character, keyed by Math.min(count, 4). */
const MULTI_CELL_SIZE: Record<number, string> = {
  2: "h-[132px] w-[132px]",
  3: "h-[96px] w-[96px]",
  4: "h-[76px] w-[76px]",
};
const MULTI_CELL_FONT: Record<number, string> = {
  2: "text-[96px]",
  3: "text-[72px]",
  4: "text-[56px]",
};

interface DialogueHit {
  dialogueId: string;
  zh: string;
  pinyin: string;
  en: string;
}

/** First dialogue line containing the word, if any. */
function findDialogueLine(word: string): DialogueHit | null {
  for (const d of dialogues) {
    for (const l of d.lines) {
      if (l.zh.includes(word)) return { dialogueId: d.id, zh: l.zh, pinyin: l.pinyin, en: l.en };
    }
  }
  return null;
}

function formatNextDue(ts: number, now: number): string {
  const mins = Math.round((ts - now) / 60000);
  if (mins < 60) return `in ${Math.max(1, mins)} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

export default function Review() {
  const reduced = useReducedMotion();
  const { mastered } = useProgress();
  const { speak, supported } = useSpeech();
  const { speechRate } = useAppSettings();

  // bump to re-read localStorage-backed deck after each grade
  const [version, setVersion] = useState(0);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [session, setSession] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });

  const poolWords = useMemo(() => words.filter((w) => level === "all" || w.level === level), [level]);
  const poolIds = useMemo(() => poolWords.map((w) => w.word), [poolWords]);
  const stats = useMemo(() => deckStatsFor(poolIds), [version, poolIds]);
  const due = useMemo(() => dueWordsIn(poolIds), [version, poolIds]);

  const startDueSession = useCallback(() => {
    const ids = dueWordsIn(poolIds).slice(0, SESSION_SIZE);
    if (ids.length === 0) return;
    setSession(ids);
    setIndex(0);
    setFlipped(false);
    setCounts({ again: 0, hard: 0, good: 0, easy: 0 });
  }, [poolIds]);

  const startAheadSession = useCallback(() => {
    const ids = studyAheadPool(poolWords, mastered).slice(0, SESSION_SIZE);
    if (ids.length === 0) return;
    setSession(ids);
    setIndex(0);
    setFlipped(false);
    setCounts({ again: 0, hard: 0, good: 0, easy: 0 });
  }, [poolWords, mastered]);

  const current: Word | null =
    session && index < session.length ? (wordById.get(session[index]) ?? null) : null;
  const example = current ? findDialogueLine(current.word) : null;

  const grade = (g: Grade) => {
    if (!current || !session) return;
    gradeWord(current.word, g);
    setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
    setVersion((v) => v + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  /* ------------------------------ completion ----------------------------- */
  if (session && index >= session.length) {
    const gradedTotal = counts.again + counts.hard + counts.good + counts.easy;
    const s = deckStatsFor(poolIds);
    const freshCount = s.fresh;
    return (
      <div className="pt-8">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative overflow-hidden rounded-[20px] bg-paper-raised p-6 text-center shadow-soft"
        >
          {!reduced && <RadicalConfetti />}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-jade/10"
          >
            <Check size={32} className="text-jade" strokeWidth={2.5} />
          </motion.span>
          <h2 className="mt-4 font-display text-[24px] font-semibold text-ink">
            Session complete
          </h2>
          <p className="mt-1 font-brush text-[20px] text-jade">温故而知新</p>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {GRADES.map(({ grade: g, label, cls }) => (
              <div key={g} className={`rounded-2xl px-2 py-3 ${cls}`}>
                <p className="font-display text-[22px] font-bold">{counts[g]}</p>
                <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[13px] text-ink-soft">
            {gradedTotal} cards reviewed
            {s.nextDue !== null
              ? ` — next card due ${formatNextDue(s.nextDue, Date.now())}.`
              : "."}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {freshCount > 0 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={startAheadSession}
                className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[16px] font-extrabold text-paper-raised shadow-soft"
              >
                <Sparkles size={18} />
                Study ahead
              </motion.button>
            ) : null}
            <Link
              to="/"
              className="flex h-14 items-center justify-center gap-2 rounded-[14px] border border-ink/15 text-[16px] font-extrabold text-ink"
            >
              <HomeIcon size={18} />
              Back home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ------------------------------ intro state ---------------------------- */
  if (!session) {
    const allLearned = stats.fresh === 0;
    const nothingDue = due.length === 0;

    return (
      <div className="pt-8">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative overflow-hidden rounded-[20px] bg-paper-raised p-6 text-center shadow-soft"
        >
          <TianGrid className="pointer-events-none absolute inset-0 m-auto h-48 w-48 opacity-40" strokeWidth={0.8} />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
              <Layers size={30} className="text-gold" />
            </span>
            <h2 className="mt-4 font-display text-[24px] font-semibold text-ink">
              Flashcard review
            </h2>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Chip label="Both levels" selected={level === "all"} onClick={() => setLevel("all")} />
              <Chip label="HSK-1" tone="jade" selected={level === 1} onClick={() => setLevel(1)} />
              <Chip label="HSK-2" tone="gold" selected={level === 2} onClick={() => setLevel(2)} />
            </div>

            {!nothingDue ? (
              <>
                <p className="mt-2 text-[15px] text-ink-soft">
                  <span className="font-extrabold text-vermilion">{due.length}</span>{" "}
                  {due.length === 1 ? "card is" : "cards are"} due for review.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={startDueSession}
                  className="mt-6 flex h-14 w-full items-center justify-center rounded-[14px] bg-vermilion text-[16px] font-extrabold text-paper-raised shadow-soft"
                >
                  Start review ({Math.min(due.length, SESSION_SIZE)} cards)
                </motion.button>
              </>
            ) : allLearned ? (
              <>
                <p className="mt-2 font-brush text-[22px] text-jade">全部学完了！</p>
                <p className="mt-1 text-[15px] text-ink-soft">
                  All {poolIds.length} words{level === "all" ? "" : ` in HSK-${level}`} are in
                  your deck and nothing is due right now.
                  {stats.nextDue !== null
                    ? ` Next card ${formatNextDue(stats.nextDue, Date.now())}.`
                    : ""}
                </p>
                <Link
                  to="/"
                  className="mt-6 flex h-14 w-full items-center justify-center rounded-[14px] bg-vermilion text-[16px] font-extrabold text-paper-raised shadow-soft"
                >
                  Back home
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-[15px] text-ink-soft">
                  Nothing due right now — study ahead with new words.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={startAheadSession}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[16px] font-extrabold text-paper-raised shadow-soft"
                >
                  <Sparkles size={18} />
                  Study ahead ({Math.min(stats.fresh, SESSION_SIZE)} new)
                </motion.button>
              </>
            )}

            {!nothingDue && stats.fresh > 0 && (
              <button
                type="button"
                onClick={startAheadSession}
                className="mt-3 text-[13px] font-bold text-wash-blue"
              >
                Or study ahead with new words
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ------------------------------ card state ----------------------------- */
  if (!current) return null;
  const state = getCardState(current.word);
  const chars = Array.from(current.word);
  const charCount = chars.length;
  const multiCell = MULTI_CELL_SIZE[Math.min(charCount, 4)] ?? "h-[64px] w-[64px]";
  const multiFont = MULTI_CELL_FONT[Math.min(charCount, 4)] ?? "text-[48px]";

  return (
    <div className="pt-6">
      {/* progress */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full rounded-full bg-vermilion"
            animate={{ width: `${(index / session.length) * 100}%` }}
            transition={{ duration: 0.3, ease: EASE }}
          />
        </div>
        <span className="text-[13px] font-extrabold tabular-nums text-ink-soft">
          {index + 1} / {session.length}
        </span>
      </div>

      {/* card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.word}
          initial={{ x: reduced ? 0 : 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: reduced ? 0 : -40, opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="mt-5"
        >
          <div className="[perspective:1200px]">
            <motion.div
              onClick={() => setFlipped((f) => !f)}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative h-[380px] w-full cursor-pointer [transform-style:preserve-3d]"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
              aria-label={flipped ? "Card back (answer)" : "Card front — tap to flip"}
            >
              {/* front */}
              <div className="absolute inset-0 overflow-hidden rounded-[20px] bg-paper-raised shadow-soft [backface-visibility:hidden]">
                {charCount === 1 && (
                  <TianGrid className="absolute inset-0 m-auto h-[280px] w-[280px] opacity-60" strokeWidth={0.9} />
                )}
                <div className="relative flex h-full flex-col items-center justify-center">
                  {charCount === 1 ? (
                    <span className="font-cjk text-[120px] leading-none text-ink">
                      {current.word}
                    </span>
                  ) : (
                    <div
                      className={`flex max-w-full items-center justify-center gap-2 ${
                        charCount > 4 ? "flex-wrap" : ""
                      }`}
                    >
                      {chars.map((ch, i) => (
                        <div
                          key={`${ch}-${i}`}
                          className={`relative flex aspect-square items-center justify-center font-cjk leading-none text-ink ${multiCell} ${multiFont}`}
                        >
                          <TianGrid className="absolute inset-0 h-full w-full opacity-60" strokeWidth={0.9} />
                          {ch}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(current.word, speechRate);
                    }}
                    disabled={!supported}
                    aria-label={`Listen to ${current.word}`}
                    className="mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-wash-blue/10 text-wash-blue transition-transform active:scale-90 disabled:opacity-40"
                  >
                    <Volume2 size={20} />
                  </button>
                  <span className="absolute bottom-4 text-[12px] font-semibold text-ink-faint">
                    Tap to reveal
                  </span>
                </div>
              </div>

              {/* back */}
              <div className="absolute inset-0 overflow-hidden rounded-[20px] bg-paper-raised shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      current.level === 1 ? "bg-jade/10 text-jade" : "bg-gold/10 text-gold"
                    }`}
                  >
                    HSK {current.level}
                  </span>
                  {/* back = answer: pinyin always shown, regardless of global toggle */}
                  <p className="text-[17px] font-semibold italic text-wash-blue">{current.pinyin}</p>
                  <p
                    className={`whitespace-nowrap font-cjk leading-tight text-ink ${
                      charCount >= 4 ? "text-[34px]" : "text-[44px]"
                    }`}
                  >
                    {current.word}
                  </p>
                  <p className="text-[16px] font-bold text-ink">{current.gloss}</p>

                  {example && (
                    <div className="mt-2 w-full rounded-2xl bg-paper px-4 py-3 text-left">
                      <p className="font-cjk text-[15px] text-ink">{example.zh}</p>
                      <p className="text-[12px] italic text-wash-blue">{example.pinyin}</p>
                      <Link
                        to={`/dialogues/${example.dialogueId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-vermilion"
                      >
                        From dialogue
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  )}

                  <Link
                    to={`/practice?char=${encodeURIComponent(current.word[0])}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-jade"
                  >
                    <Brush size={14} />
                    Practice writing
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* grade buttons */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        {GRADES.map(({ grade: g, label, cls }) => (
          <motion.button
            key={g}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => flipped && grade(g)}
            disabled={!flipped}
            className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl py-2 ${cls} ${
              flipped ? "" : "opacity-35"
            }`}
          >
            <span className="text-[14px] font-extrabold">{label}</span>
            <span className="text-[11px] font-semibold opacity-80">{intervalLabel(state, g)}</span>
          </motion.button>
        ))}
      </div>
      {!flipped && (
        <p className="mt-2 text-center text-[12px] text-ink-faint">
          Flip the card to grade yourself
        </p>
      )}
    </div>
  );
}
