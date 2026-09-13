import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brush, ChevronLeft, Play, SearchX, Volume2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { dialogues, getCharacter, getFactForChar, words, type DialogueLineData } from "@/data";
import StrokeCanvas from "@/components/StrokeCanvas";
import FactCard from "@/components/FactCard";
import TianGrid from "@/components/TianGrid";
import { usePinyin } from "@/hooks/usePinyin";
import { useProgress } from "@/hooks/useProgress";
import { useAppSettings } from "@/components/settings/settings";
import { speakChinese } from "@/components/settings/speech";
import { hanziCharsOf, wordStatus, type WordStatus } from "@/components/words/wordUtils";

const STATUS_CHIP: Record<WordStatus, { label: string; cls: string }> = {
  mastered: { label: "Mastered", cls: "bg-jade/10 text-jade" },
  learning: { label: "Learning", cls: "bg-gold/10 text-gold" },
  new: { label: "New", cls: "bg-grid-line/40 text-ink-soft" },
};

const sectionVariants = {
  hidden: { y: 16, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: 0.15 + i * 0.06,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

interface ExampleLine {
  dialogueId: string;
  dialogueTitle: string;
  line: DialogueLineData;
}

export default function WordDetail() {
  const { char: wordParam } = useParams<{ char: string }>();
  const navigate = useNavigate();
  const word = useMemo(() => words.find((w) => w.word === wordParam), [wordParam]);
  const { showPinyin } = usePinyin();
  const { mastered } = useProgress();
  const settings = useAppSettings();

  const chars = useMemo(() => (word ? hanziCharsOf(word.word) : []), [word]);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const activeChar = selectedChar ?? chars[0] ?? "";

  const examples = useMemo<ExampleLine[]>(() => {
    if (!word) return [];
    const found: ExampleLine[] = [];
    for (const d of dialogues) {
      for (const line of d.lines) {
        if (line.zh.includes(word.word)) {
          found.push({ dialogueId: d.id, dialogueTitle: d.title, line });
          if (found.length >= 3) return found;
        }
      }
    }
    return found;
  }, [word]);

  const charFacts = useMemo(
    () =>
      chars
        .map((c) => getFactForChar(c))
        .filter((f): f is NonNullable<typeof f> => f !== undefined),
    [chars]
  );

  if (!word) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 pt-5">
        <span className="relative h-24 w-24 overflow-hidden rounded-2xl border border-grid-line/60">
          <TianGrid className="absolute inset-0 h-full w-full" />
          <span className="absolute inset-0 flex items-center justify-center font-brush text-5xl text-ink-faint">
            ？
          </span>
        </span>
        <p className="flex items-center gap-2 text-[15px] font-bold text-ink-soft">
          <SearchX size={18} />
          Word not found in the HSK 1–2 list
        </p>
        <Link
          to="/words"
          className="flex h-11 items-center rounded-[14px] bg-vermilion px-6 text-[14px] font-extrabold text-paper-raised"
        >
          Back to Words
        </Link>
      </div>
    );
  }

  const status = wordStatus(word.word, mastered);
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/words");
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Back */}
      <button
        type="button"
        onClick={goBack}
        className="flex h-9 items-center gap-1 rounded-full border border-grid-line/70 bg-paper-raised pl-2 pr-3.5 text-[13px] font-bold text-ink-soft shadow-soft transition-all active:scale-95"
      >
        <ChevronLeft size={16} />
        Words
      </button>

      {/* Section 1 — Word hero */}
      <motion.section
        variants={sectionVariants}
        custom={0}
        initial="hidden"
        animate="show"
        className="relative flex flex-col items-center rounded-[20px] bg-paper-raised px-6 py-7 text-center shadow-soft"
      >
        <button
          type="button"
          aria-label={`Speak ${word.word}`}
          onClick={() => speakChinese(word.word)}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-wash-blue/10 text-wash-blue transition-transform active:scale-95"
        >
          <Volume2 size={20} />
        </button>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="font-cjk text-[56px] leading-none text-ink"
        >
          {word.word}
        </motion.span>
        {showPinyin && (
          <span className="mt-2 text-[18px] italic text-wash-blue">{word.pinyin}</span>
        )}
        <span className="mt-1.5 text-[18px] font-bold text-ink">{word.gloss}</span>
        <div className="mt-3 flex items-center gap-2">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`rounded-full px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.04em] ${
              word.level === 1 ? "bg-jade/10 text-jade" : "bg-gold/10 text-gold"
            }`}
          >
            HSK-{word.level}
          </motion.span>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className={`rounded-full px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.04em] ${STATUS_CHIP[status].cls}`}
          >
            {STATUS_CHIP[status].label}
          </motion.span>
        </div>
      </motion.section>

      {/* Section 2 — Per-character breakdown */}
      {chars.length > 1 && (
        <motion.section variants={sectionVariants} custom={1} initial="hidden" animate="show">
          <h2 className="mb-2 px-1 font-display text-[16px] font-semibold text-ink">
            Character by character
          </h2>
          <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
            {chars.map((c, i) => {
              const info = getCharacter(c);
              const selected = c === activeChar;
              return (
                <button
                  key={`${c}-${i}`}
                  type="button"
                  onClick={() => setSelectedChar(c)}
                  className="relative flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl bg-paper-raised px-2 py-3 shadow-soft"
                >
                  {selected && (
                    <motion.span
                      layoutId="char-breakdown-ring"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-vermilion"
                    />
                  )}
                  <span className="relative h-12 w-12 overflow-hidden rounded-lg border border-grid-line/60 bg-paper">
                    <TianGrid className="absolute inset-0 h-full w-full" strokeWidth={1} />
                    <span className="absolute inset-0 flex items-center justify-center font-cjk text-[28px] leading-none text-ink">
                      {c}
                    </span>
                  </span>
                  {showPinyin && info && (
                    <span className="text-[12px] italic leading-none text-wash-blue">{info.pinyin}</span>
                  )}
                  <span className="w-full truncate text-center text-[11px] font-bold text-ink-soft">
                    {info?.gloss ?? "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Section 3 — Stroke animation mini-player */}
      <motion.section
        variants={sectionVariants}
        custom={chars.length > 1 ? 2 : 1}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center"
      >
        <h2 className="mb-2 self-start px-1 font-display text-[16px] font-semibold text-ink">
          Stroke order — {activeChar}
        </h2>
        <div className="relative">
          <StrokeCanvas
            key={`${activeChar}-${replayKey}`}
            char={activeChar}
            mode="animate"
            speed={settings.strokeSpeed}
            size={180}
            className="rounded-2xl"
          />
          <button
            type="button"
            aria-label="Replay stroke animation"
            onClick={() => setReplayKey((k) => k + 1)}
            className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-grid-line bg-paper text-ink-faint transition-colors active:text-vermilion"
          >
            <Play size={16} />
          </button>
        </div>
        <motion.div
          initial={{ boxShadow: "0 0 0 0 rgba(200,68,44,0)" }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(200,68,44,0)",
              "0 0 16px 2px rgba(200,68,44,0.25)",
              "0 0 0 0 rgba(200,68,44,0)",
            ],
          }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-4 w-full rounded-[14px]"
        >
          <Link
            to={`/practice?char=${encodeURIComponent(activeChar)}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[15px] font-extrabold text-paper-raised transition-transform active:scale-[0.98]"
          >
            <Brush size={18} />
            Practice this
          </Link>
        </motion.div>
      </motion.section>

      {/* Section 4 — Origin & Culture */}
      {charFacts.length > 0 && (
        <motion.section
          variants={sectionVariants}
          custom={chars.length > 1 ? 3 : 2}
          initial="hidden"
          animate="show"
        >
          <h2 className="mb-2 px-1 font-display text-[16px] font-semibold text-ink">
            Origin &amp; Culture
          </h2>
          <div className="space-y-2.5">
            {charFacts.map((fact) => (
              <FactCard key={fact.char} fact={fact} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Section 5 — Example sentences */}
      {examples.length > 0 && (
        <motion.section
          variants={sectionVariants}
          custom={chars.length > 1 ? 4 : 3}
          initial="hidden"
          animate="show"
        >
          <h2 className="mb-2 px-1 font-display text-[16px] font-semibold text-ink">
            Example sentences
          </h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2, once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-2.5"
          >
            {examples.map((ex, i) => (
              <motion.div
                key={`${ex.dialogueId}-${i}`}
                variants={{
                  hidden: { y: 12, opacity: 0 },
                  show: { y: 0, opacity: 1, transition: { duration: 0.3 } },
                }}
                className="rounded-2xl bg-paper-raised p-4 shadow-soft"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {showPinyin && (
                      <p className="text-[13px] italic leading-snug text-wash-blue">{ex.line.pinyin}</p>
                    )}
                    <p className="font-cjk text-[18px] leading-snug text-ink">{ex.line.zh}</p>
                    <p className="mt-1 text-[13px] leading-snug text-ink-soft">{ex.line.en}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Speak sentence"
                    onClick={() => speakChinese(ex.line.zh)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wash-blue/10 text-wash-blue transition-transform active:scale-95"
                  >
                    <Volume2 size={17} />
                  </button>
                </div>
                <Link
                  to={`/dialogues/${ex.dialogueId}`}
                  className="mt-2.5 inline-flex items-center rounded-full bg-vermilion/10 px-2.5 py-1 text-[11px] font-extrabold text-vermilion transition-transform active:scale-95"
                >
                  From Dialogue · {ex.dialogueTitle}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}
    </div>
  );
}
