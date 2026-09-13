import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Play,
  Layers,
  PenLine,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Dices,
  Lightbulb,
  Volume2,
  BadgeCheck,
} from "lucide-react";
import PracticeCanvas from "@/components/practice/PracticeCanvas";
import type { PracticeCanvasHandle, PracticeMode, CanvasLoadState } from "@/components/practice/PracticeCanvas";
import { usePracticeStats } from "@/components/practice/usePracticeStats";
import CharPickerSheet from "@/components/CharPickerSheet";
import FactCard from "@/components/FactCard";
import TianGrid from "@/components/TianGrid";
import Toast from "@/components/Toast";
import Chip from "@/components/Chip";
import type { LevelFilter } from "@/components/Chip";
import { characters, getCharacter, getWordsForChar, getFactForChar } from "@/data";
import type { Word } from "@/data";
import { usePinyin } from "@/hooks/usePinyin";
import { useProgress } from "@/hooks/useProgress";
import { useSpeech } from "@/hooks/useSpeech";
import { getSettings } from "@/components/settings/settings";
import DrillCompleteCard from "@/components/drills/DrillCompleteCard";
import DrillStageTransition from "@/components/drills/DrillStageTransition";
import { getDialogue, getDrillChars, getNextDrillDialogue, shuffleDrillChars } from "@/components/drills/drill";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const SPEEDS = [0.5, 1, 2] as const;

const MODES: Array<{ id: PracticeMode; label: string; icon: typeof Play }> = [
  { id: "animate", label: "Animate", icon: Play },
  { id: "step", label: "Step", icon: Layers },
  { id: "quiz", label: "Quiz", icon: PenLine },
];

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const helperContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const helperItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

interface QuizState {
  done: number;
  mistakes: number;
  complete: boolean;
}

interface Ghost {
  char: string;
  key: number;
}

interface DrillState {
  id: string;
  title: string;
  titleZh: string;
  /** stage-1 guided order (dialogue order) */
  chars: string[];
  /** stage-2 test order (shuffled when the test starts) */
  testChars: string[];
  /** 1 = guided (outline + grid), 2 = test (no outline) */
  stage: 1 | 2;
  index: number;
  /** stage 1 finished — interstitial "Take the test?" card is showing */
  awaitingTest: boolean;
  complete: boolean;
}

function poolFor(filter: LevelFilter) {
  return characters.filter((c) => filter === "all" || c.level === filter);
}

/** small animated sound-wave bars shown while a compound word is being spoken */
function SpeakingBars() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          className="h-3 w-[2.5px] rounded-full bg-wash-blue"
          style={{ transformOrigin: "bottom" }}
        />
      ))}
    </span>
  );
}

/** Compound word chip — tap to hear it spoken. */
function CompoundChip({ word, onSpeak, active }: { word: Word; onSpeak: (w: Word) => void; active: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={() => onSpeak(word)}
      aria-label={`Listen to ${word.word} (${word.pinyin})`}
      className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 transition-colors ${
        active ? "border-wash-blue/50 bg-wash-blue/10" : "border-grid-line bg-paper hover:border-wash-blue/40"
      }`}
    >
      {active ? <SpeakingBars /> : <Volume2 size={13} className="text-wash-blue" />}
      <span className="font-cjk text-[15px] font-semibold text-ink">{word.word}</span>
      <span className="text-[11px] text-ink-faint">{word.pinyin}</span>
    </motion.button>
  );
}

export default function Practice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { showPinyin, togglePinyin } = usePinyin();
  const { isMastered, markMastered, touchStreak } = useProgress();
  const { speak, speaking } = useSpeech();
  const stats = usePracticeStats();

  const [char, setChar] = useState<string>(() =>
    getCharacter("你") ? "你" : characters[0]?.char ?? "一"
  );
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [mode, setMode] = useState<PracticeMode>("animate");
  const [step, setStep] = useState(1);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [loopOn, setLoopOn] = useState(false);
  const [gridOn, setGridOn] = useState(true);
  const [outlineOn, setOutlineOn] = useState(true);
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizState>({ done: 0, mistakes: 0, complete: false });
  const [dataStatus, setDataStatus] = useState<CanvasLoadState>("loading");
  const [liveStrokeCount, setLiveStrokeCount] = useState(0);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [slotChar, setSlotChar] = useState<string | null>(null);
  const [wiggle, setWiggle] = useState(0);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const [speakingChar, setSpeakingChar] = useState(false);

  const canvasRef = useRef<PracticeCanvasHandle>(null);
  const charRef = useRef(char);
  charRef.current = char;
  const assistedRef = useRef(false);
  const ghostKeyRef = useRef(0);
  const slotTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const drillRef = useRef<DrillState | null>(null);
  const initRef = useRef(false);

  /* query params: ?char=你 ?random=1 ?level=hsk1|hsk2 (applied once on mount) */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const lvl = searchParams.get("level");
    const filter: LevelFilter = lvl === "hsk1" ? 1 : lvl === "hsk2" ? 2 : "all";
    if (filter !== "all") setLevelFilter(filter);
    const pool = poolFor(filter);
    const q = searchParams.get("char");
    if (q && getCharacter(q)) {
      charRef.current = q;
      setChar(q);
      stats.touchDay(q);
    } else if (searchParams.get("random") === "1" && pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)].char;
      charRef.current = pick;
      setChar(pick);
      stats.touchDay(pick);
    } else {
      stats.touchDay(charRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* slot-machine / drill-advance timer cleanup */
  useEffect(
    () => () => {
      if (slotTimerRef.current !== null) window.clearInterval(slotTimerRef.current);
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    },
    []
  );

  /* clear the speaking indicators when speech ends */
  useEffect(() => {
    if (!speaking) {
      setSpeakingWord(null);
      setSpeakingChar(false);
    }
  }, [speaking]);

  /* ?dialogue=<id> — enter (or switch) dialogue drill mode */
  const dialogueParam = searchParams.get("dialogue");
  useEffect(() => {
    if (!dialogueParam) return;
    const d = getDialogue(dialogueParam);
    if (!d || drillRef.current?.id === d.id) return;
    const chars = getDrillChars(d);
    if (chars.length === 0) return;
    const next: DrillState = {
      id: d.id,
      title: d.title,
      titleZh: d.titleZh,
      chars,
      testChars: chars,
      stage: 1,
      index: 0,
      awaitingTest: false,
      complete: false,
    };
    drillRef.current = next;
    setDrill(next);
    /* drill stage 1 = guided: quiz with outline + grid visible */
    setMode("quiz");
    setGridOn(true);
    setOutlineOn(true);
    ghostKeyRef.current += 1;
    setGhost({ char: charRef.current, key: ghostKeyRef.current });
    charRef.current = chars[0];
    setChar(chars[0]);
    setStep(1);
    setQuiz({ done: 0, mistakes: 0, complete: false });
    assistedRef.current = false;
    setDataStatus("loading");
    stats.touchDay(chars[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogueParam]);

  const pool = useMemo(() => poolFor(levelFilter), [levelFilter]);
  const info = getCharacter(char);
  const totalStrokes = info?.strokeCount ?? liveStrokeCount;
  const fact = getFactForChar(char);
  const compounds = useMemo(
    () => getWordsForChar(char).filter((w) => w.word !== char && w.word.length <= 4).slice(0, 3),
    [char]
  );
  const charStats = stats.getStats(char);
  const week = stats.last7Days(char);
  const mastered = isMastered(char);

  const changeChar = (next: string) => {
    if (!next || next === charRef.current) return;
    ghostKeyRef.current += 1;
    setGhost({ char: charRef.current, key: ghostKeyRef.current });
    charRef.current = next;
    setChar(next);
    setStep(1);
    setQuiz({ done: 0, mistakes: 0, complete: false });
    assistedRef.current = false;
    setDataStatus("loading");
    stats.touchDay(next);
  };

  const goPrev = () => {
    if (pool.length === 0) return;
    const i = Math.max(0, pool.findIndex((c) => c.char === charRef.current));
    changeChar(pool[(i - 1 + pool.length) % pool.length].char);
  };

  const goNext = () => {
    if (pool.length === 0) return;
    const i = Math.max(0, pool.findIndex((c) => c.char === charRef.current));
    changeChar(pool[(i + 1) % pool.length].char);
  };

  /** random with slot-machine quick cycle (3 flashes, 80ms each, then settle) */
  const runRandom = (source?: typeof characters) => {
    const base = source ?? pool;
    const list = base.length > 1 ? base.filter((c) => c.char !== charRef.current) : base;
    if (list.length === 0) return;
    setWiggle((w) => w + 1);
    const final = list[Math.floor(Math.random() * list.length)].char;
    if (reducedMotion || list.length === 1) {
      changeChar(final);
      return;
    }
    let n = 0;
    setSlotChar(list[Math.floor(Math.random() * list.length)].char);
    if (slotTimerRef.current !== null) window.clearInterval(slotTimerRef.current);
    slotTimerRef.current = window.setInterval(() => {
      n += 1;
      if (n >= 3) {
        if (slotTimerRef.current !== null) window.clearInterval(slotTimerRef.current);
        slotTimerRef.current = null;
        setSlotChar(null);
        changeChar(final);
      } else {
        setSlotChar(list[Math.floor(Math.random() * list.length)].char);
      }
    }, 80);
  };

  const changeFilter = (f: LevelFilter) => {
    setLevelFilter(f);
    const next = poolFor(f);
    if (!next.some((c) => c.char === charRef.current) && next.length > 0) {
      changeChar(next[0].char);
    }
  };

  const onQuizComplete = (mistakes: number) => {
    const c = charRef.current;
    setQuiz((q) => ({ ...q, complete: true, done: totalStrokes }));
    stats.recordQuiz(c, mistakes, assistedRef.current);

    const d = drillRef.current;
    if (d) {
      /* two-stage drill: stage 1 (guided) records practice stats only; stage 2
         (test, outline hidden) masters the character. Auto-advance after a
         brief jade flash. */
      if (d.stage === 2) markMastered(c);
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(
        () => {
          advanceTimerRef.current = null;
          const cur = drillRef.current;
          if (!cur || cur.complete || cur.awaitingTest) return;
          const seq = cur.stage === 1 ? cur.chars : cur.testChars;
          const nextIndex = cur.index + 1;
          if (nextIndex >= seq.length) {
            if (cur.stage === 1) {
              /* guided round done — show the "Take the test?" interstitial */
              const wait: DrillState = { ...cur, awaitingTest: true };
              drillRef.current = wait;
              setDrill(wait);
            } else {
              const fin: DrillState = { ...cur, complete: true };
              drillRef.current = fin;
              setDrill(fin);
              touchStreak();
            }
            return;
          }
          const adv: DrillState = { ...cur, index: nextIndex };
          drillRef.current = adv;
          setDrill(adv);
          changeChar(seq[nextIndex]);
        },
        reducedMotion ? 400 : 900
      );
      return;
    }

    touchStreak();
    /* mastery gating: only an outline-less + grid-less quiz counts as mastered */
    if (!outlineOn && !gridOn) {
      markMastered(c);
      setToast(`${c} mastered! +1`);
    } else {
      setToast(`Great practice! Turn off outline + grid to master ${c}`);
    }
  };

  /** move to a drill character; if it's already on canvas, just restart its quiz */
  const gotoDrillChar = (next: string) => {
    if (!next) return;
    if (next === charRef.current) {
      setStep(1);
      setQuiz({ done: 0, mistakes: 0, complete: false });
      assistedRef.current = false;
      /* restart after the outline/grid state for the new stage has applied */
      window.setTimeout(() => canvasRef.current?.restartQuiz(), 0);
      return;
    }
    changeChar(next);
  };

  /** stage transition: begin the no-outline test on a shuffled order */
  const takeTest = () => {
    const cur = drillRef.current;
    if (!cur || cur.complete || !cur.awaitingTest) return;
    const testChars = shuffleDrillChars(cur.chars);
    const next: DrillState = { ...cur, testChars, stage: 2, index: 0, awaitingTest: false };
    drillRef.current = next;
    setDrill(next);
    setOutlineOn(false);
    gotoDrillChar(testChars[0]);
  };

  /** interstitial ghost action: restart stage 1 (guided) from the top */
  const practiceAgain = () => {
    const cur = drillRef.current;
    if (!cur || cur.complete) return;
    const next: DrillState = { ...cur, stage: 1, index: 0, awaitingTest: false };
    drillRef.current = next;
    setDrill(next);
    setOutlineOn(true);
    setGridOn(true);
    gotoDrillChar(cur.chars[0]);
  };

  const onOutlineToggle = () => {
    setOutlineOn((v) => !v);
    if (mode === "quiz") {
      setQuiz({ done: 0, mistakes: 0, complete: false });
      assistedRef.current = false;
      /* restart the graded quiz after the outline change has been applied */
      window.setTimeout(() => canvasRef.current?.restartQuiz(), 0);
    }
  };

  const onHint = () => {
    if (quiz.complete) return;
    assistedRef.current = true;
    canvasRef.current?.skipStroke();
    setQuiz((q) => ({ ...q, done: Math.min(q.done + 1, totalStrokes) }));
  };

  const onRestartQuiz = () => {
    setQuiz({ done: 0, mistakes: 0, complete: false });
    assistedRef.current = false;
    canvasRef.current?.restartQuiz();
  };

  const speakCompound = (w: Word) => {
    setSpeakingWord(w.word);
    speak(w.word, getSettings().speechRate);
  };

  /** pronounce the current character (zh voice, saved rate) */
  const speakChar = () => {
    setSpeakingChar(true);
    speak(charRef.current, getSettings().speechRate);
  };

  const levelChipCls =
    info?.level === 2 ? "bg-gold/10 text-gold" : "bg-jade/10 text-jade";

  const nextDrill = drill && drill.complete ? getNextDrillDialogue(drill.id) : null;

  /** drill header progress line, e.g. "Stage 1 · Guided — 3 / 12" */
  const drillProgress = drill
    ? drill.complete
      ? `${drill.chars.length} / ${drill.chars.length} mastered`
      : drill.stage === 1
        ? `Stage 1 · Guided — ${drill.awaitingTest ? drill.chars.length : drill.index + 1} / ${drill.chars.length}`
        : `Stage 2 · Test — ${drill.index + 1} / ${drill.testChars.length}`
    : "";

  /** 44px wash-blue speaker button with animated sound-bars while speaking */
  const speakerButton = (
    <button
      type="button"
      onClick={speakChar}
      aria-label={`Listen to ${char}`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-wash-blue/40 bg-wash-blue/10 text-wash-blue transition-colors hover:border-wash-blue/70 active:scale-95"
    >
      {speaking && speakingChar ? <SpeakingBars /> : <Volume2 size={18} />}
    </button>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={pageVariants} className="space-y-4 pt-2">
      {/* ── Section 1: practice top bar (drill header while drilling) ── */}
      {drill ? (
        <motion.section variants={sectionVariants} className="flex h-12 items-center gap-2">
          <Link
            to={`/dialogues/${drill.id}`}
            aria-label={`Back to dialogue ${drill.title}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-grid-line bg-paper text-ink-soft transition-colors hover:border-vermilion/50 hover:text-vermilion active:scale-95"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[13px] font-bold text-ink">
              <span lang="zh" className="font-cjk">{drill.titleZh}</span> · {drill.title}
            </p>
            <p className="text-[12px] font-semibold text-jade">{drillProgress}</p>
          </div>
          {speakerButton}
        </motion.section>
      ) : (
        <motion.section variants={sectionVariants} className="flex h-12 items-center gap-3">
          <span
            className={`flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-extrabold uppercase tracking-[0.04em] ${levelChipCls}`}
          >
            HSK-{info?.level ?? 1}
          </span>
          <div className="relative min-w-0 flex-1 overflow-hidden text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={char}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="truncate"
              >
                {showPinyin && (
                  <span className="text-[15px] font-semibold italic text-wash-blue">{info?.pinyin ?? ""}</span>
                )}
                {showPinyin && <span className="mx-1.5 text-ink-faint">·</span>}
                <span className="text-[13px] font-semibold text-ink-faint">{info?.gloss ?? ""}</span>
              </motion.p>
            </AnimatePresence>
          </div>
          {speakerButton}
          <button
            type="button"
            onClick={togglePinyin}
            aria-pressed={showPinyin}
            aria-label="Toggle pinyin"
            className={`flex h-8 shrink-0 items-center rounded-full border px-3 text-[14px] font-extrabold transition-all active:scale-95 ${
              showPinyin
                ? "border-wash-blue bg-wash-blue text-paper-raised"
                : "border-ink-faint/50 bg-transparent text-ink-faint"
            }`}
          >
            拼
          </button>
        </motion.section>
      )}

      {/* drill explainer (shown at drill start) */}
      {drill && !drill.complete && drill.stage === 1 && !drill.awaitingTest && drill.index === 0 && !quiz.complete && (
        <motion.p
          variants={sectionVariants}
          className="rounded-2xl border border-jade/30 bg-jade/5 px-4 py-2.5 text-[13px] font-semibold text-ink-soft"
        >
          Two-stage drill — <span className="font-cjk">学习</span> first: practice each character with the
          outline and grid. Then <span className="font-cjk">测试</span>: the test hides the outline (grid
          optional) and masters each character you write.
        </motion.p>
      )}

      {/* ── Section 2: stroke canvas (swipe = prev/next, disabled in quiz) ── */}
      <motion.section variants={sectionVariants}>
        <motion.div
          drag={mode !== "quiz" && dataStatus === "ready" ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.45}
          onDragEnd={(_, dragInfo) => {
            if (dragInfo.offset.x <= -60) goNext();
            else if (dragInfo.offset.x >= 60) goPrev();
          }}
        >
          {dataStatus === "error" ? (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-3xl bg-paper-raised p-8 shadow-soft">
              <div className="relative h-24 w-24">
                <TianGrid className="h-full w-full" />
                <span className="font-brush absolute inset-0 flex items-center justify-center text-5xl text-ink-faint">
                  ？
                </span>
              </div>
              <p className="text-center text-[14px] font-semibold text-ink-soft">
                Stroke data unavailable for this character
              </p>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="h-11 rounded-2xl bg-vermilion px-6 text-[14px] font-extrabold text-paper-raised shadow-soft transition-transform active:scale-95"
              >
                Pick another
              </button>
            </div>
          ) : (
            <PracticeCanvas
              ref={canvasRef}
              char={char}
              mode={mode}
              speed={speed}
              loop={loopOn}
              step={step}
              gridOn={gridOn}
              outlineOn={outlineOn}
              reducedMotion={reducedMotion ?? false}
              /* drills lock the outline per stage (on in guided, off in test);
                 the grid toggle stays available in both stages */
              lockOutline={drill !== null}
              onGridToggle={() => setGridOn((v) => !v)}
              onOutlineToggle={onOutlineToggle}
              onLoopToggle={() => setLoopOn((v) => !v)}
              onReady={(count) => {
                setLiveStrokeCount(count);
                setDataStatus("ready");
              }}
              onError={() => setDataStatus("error")}
              onQuizProgress={(done, mistakes) =>
                setQuiz((q) => (q.complete ? q : { done, mistakes, complete: false }))
              }
              onQuizComplete={onQuizComplete}
              overlay={
                <>
                  {ghost && (
                    <motion.div
                      key={ghost.key}
                      initial={{ scale: 0.9, opacity: 0.65 }}
                      animate={{ scale: 0.94, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onAnimationComplete={() => setGhost(null)}
                      className="absolute inset-0 flex items-center justify-center rounded-3xl bg-paper-raised"
                    >
                      <span className="font-cjk text-[min(60vw,240px)] leading-none text-ink">{ghost.char}</span>
                    </motion.div>
                  )}
                  {slotChar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-paper-raised">
                      <span className="font-cjk text-[min(60vw,240px)] leading-none text-ink">{slotChar}</span>
                    </div>
                  )}
                </>
              }
            />
          )}
        </motion.div>
      </motion.section>

      {/* ── Section 3: mode segmented control (quiz-only during drills) ── */}
      {!drill && (
      <motion.section variants={sectionVariants}>
        <div
          role="tablist"
          aria-label="Practice mode"
          className="relative flex h-11 rounded-full border border-grid-line bg-paper p-1"
        >
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className="relative flex flex-1 items-center justify-center rounded-full"
            >
              {mode === id && (
                <motion.span
                  layoutId="mode-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-vermilion"
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-1.5 text-[13px] font-bold ${
                  mode === id ? "text-paper-raised" : "text-ink-soft"
                }`}
              >
                <Icon size={15} />
                {label}
              </span>
            </button>
          ))}
        </div>
      </motion.section>
      )}

      {/* ── Section 4: mode helper row ──────────────────────────────── */}
      {dataStatus === "ready" && (
        <motion.section variants={sectionVariants} className="min-h-[52px]">
          <AnimatePresence mode="wait">
            {mode === "animate" && (
              <motion.div
                key="animate"
                variants={helperContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex items-center gap-2"
              >
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={() => canvasRef.current?.replay()}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-ink/20 bg-transparent text-[14px] font-extrabold text-ink transition-colors hover:border-vermilion/50 hover:text-vermilion active:scale-95"
                >
                  <RotateCcw size={16} />
                  Replay
                </motion.button>
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={() =>
                    setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])
                  }
                  aria-label={`Animation speed ${speed}x — tap to change`}
                  className="flex h-11 items-center rounded-full border border-grid-line bg-paper px-4 text-[13px] font-bold text-ink-soft transition-colors active:scale-95"
                >
                  {speed}×
                </motion.button>
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={() => setLoopOn((v) => !v)}
                  aria-pressed={loopOn}
                  className={`flex h-11 items-center rounded-full border px-4 text-[13px] font-bold transition-all active:scale-95 ${
                    loopOn
                      ? "border-vermilion bg-vermilion text-paper-raised"
                      : "border-grid-line bg-paper text-ink-soft"
                  }`}
                >
                  Loop
                </motion.button>
              </motion.div>
            )}

            {mode === "step" && (
              <motion.div
                key="step"
                variants={helperContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex flex-col items-center gap-2.5"
              >
                <motion.div variants={helperItem} className="flex w-full items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step <= 1}
                    aria-label="Previous stroke"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-grid-line bg-paper text-ink transition-colors active:scale-95 disabled:opacity-40"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[15px] font-bold text-ink">
                    Stroke {Math.min(step, totalStrokes)} / {totalStrokes}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(totalStrokes, s + 1))}
                    disabled={step >= totalStrokes}
                    aria-label="Next stroke"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-grid-line bg-paper text-ink transition-colors active:scale-95 disabled:opacity-40"
                  >
                    <ChevronRight size={20} />
                  </button>
                </motion.div>
                <motion.div variants={helperItem} className="flex items-center gap-1.5">
                  {Array.from({ length: totalStrokes }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        i < step - 1 ? "bg-jade" : i === step - 1 ? "bg-vermilion" : "bg-grid-line"
                      }`}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {mode === "quiz" && !quiz.complete && (
              <motion.div
                key="quiz"
                variants={helperContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex items-center gap-2"
              >
                <motion.p variants={helperItem} className="min-w-0 flex-1 text-[13px] font-bold text-ink-soft">
                  Stroke {Math.min(quiz.done + 1, totalStrokes)} of {totalStrokes}
                  {quiz.mistakes > 0 && (
                    <span className="text-error">
                      {" "}
                      · {quiz.mistakes} mistake{quiz.mistakes === 1 ? "" : "s"}
                    </span>
                  )}
                  {quiz.mistakes === 0 && quiz.done === 0 && (
                    <span className="block text-[12px] font-semibold text-ink-faint">Draw the strokes in order</span>
                  )}
                  {!outlineOn && (
                    <span className="ml-2 inline-flex h-5 items-center rounded-full bg-jade/10 px-2 align-middle text-[10px] font-extrabold uppercase tracking-[0.06em] text-jade">
                      Advanced
                    </span>
                  )}
                </motion.p>
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={onHint}
                  aria-label="Hint — show the next stroke"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-grid-line bg-paper text-gold transition-colors hover:border-gold/50 active:scale-95"
                >
                  <Lightbulb size={18} />
                </motion.button>
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={onRestartQuiz}
                  className="flex h-11 items-center gap-1.5 rounded-2xl border border-ink/20 bg-transparent px-4 text-[13px] font-extrabold text-ink transition-colors hover:border-vermilion/50 hover:text-vermilion active:scale-95"
                >
                  <RotateCcw size={15} />
                  Restart
                </motion.button>
              </motion.div>
            )}

            {mode === "quiz" && quiz.complete && drill && (
              <motion.div
                key="drill-done"
                variants={helperContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex items-center gap-2"
              >
                <motion.p variants={helperItem} className="flex-1 text-[13px] font-bold text-jade">
                  <BadgeCheck size={15} className="mr-1 inline-block -mt-0.5" />
                  {drill.complete
                    ? "Guided + test complete!"
                    : drill.awaitingTest
                      ? "Guided round complete!"
                      : drill.stage === 1
                        ? "Nicely traced — next up…"
                        : "Correct — mastered! Next up…"}
                </motion.p>
              </motion.div>
            )}

            {mode === "quiz" && quiz.complete && !drill && (
              <motion.div
                key="done"
                variants={helperContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex items-center gap-2"
              >
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={goNext}
                  className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-vermilion text-[14px] font-extrabold text-paper-raised shadow-soft transition-transform active:scale-95"
                >
                  Next character
                  <ChevronRight size={17} />
                </motion.button>
                <motion.button
                  variants={helperItem}
                  type="button"
                  onClick={() => runRandom()}
                  className="flex h-12 items-center gap-1.5 rounded-2xl border border-ink/20 bg-transparent px-5 text-[14px] font-extrabold text-ink transition-colors hover:border-gold/60 hover:text-gold active:scale-95"
                >
                  <Dices size={16} />
                  Random
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* ── Section 5: character switcher row + pool filter (hidden in drills) ── */}
      {!drill && (
      <motion.section variants={sectionVariants} className="space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={pool.length < 2}
            aria-label="Previous character"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-grid-line bg-paper text-ink-soft transition-colors hover:border-vermilion/50 hover:text-vermilion active:scale-95 disabled:opacity-40"
          >
            <ChevronLeft size={20} />
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setSheetOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-vermilion text-paper-raised shadow-soft"
          >
            <LayoutGrid size={17} />
            <span className="text-[14px] font-extrabold">
              <span className="font-cjk">{char}</span> · Choose
            </span>
          </motion.button>
          <motion.button
            key={wiggle}
            type="button"
            onClick={() => runRandom()}
            animate={wiggle > 0 ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
            transition={{ duration: 0.4 }}
            aria-label="Random character"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold transition-colors active:scale-95"
          >
            <Dices size={19} />
          </motion.button>
          <button
            type="button"
            onClick={goNext}
            disabled={pool.length < 2}
            aria-label="Next character"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-grid-line bg-paper text-ink-soft transition-colors hover:border-vermilion/50 hover:text-vermilion active:scale-95 disabled:opacity-40"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Chip label="Both levels" selected={levelFilter === "all"} onClick={() => changeFilter("all")} />
          <Chip label="HSK-1" tone="jade" selected={levelFilter === 1} onClick={() => changeFilter(1)} />
          <Chip label="HSK-2" tone="gold" selected={levelFilter === 2} onClick={() => changeFilter(2)} />
        </div>
      </motion.section>
      )}

      {/* ── Stage transition: guided round done → take the test ─────── */}
      {drill?.awaitingTest && !drill.complete && (
        <motion.section variants={sectionVariants} className="pb-2">
          <DrillStageTransition
            count={drill.chars.length}
            onTakeTest={takeTest}
            onPracticeAgain={practiceAgain}
          />
        </motion.section>
      )}

      {/* ── Drill completion card ───────────────────────────────────── */}
      {drill?.complete && (
        <motion.section variants={sectionVariants} className="pb-2">
          <DrillCompleteCard
            count={drill.chars.length}
            onBackToDialogue={() => navigate(`/dialogues/${drill.id}`)}
            onNextDrill={
              nextDrill ? () => navigate(`/practice?dialogue=${encodeURIComponent(nextDrill.id)}`) : undefined
            }
          />
        </motion.section>
      )}

      {/* ── Section 7: character info panel (hidden in drills) ──────── */}
      {!drill && (
      <motion.section variants={sectionVariants} className="space-y-3 pb-2">
        {/* meaning card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-2xl bg-paper-raised p-5 shadow-soft"
        >
          <div className="flex items-start gap-4">
            <span className="font-cjk text-[48px] leading-[1.1] text-ink">{char}</span>
            <div className="min-w-0 flex-1">
              <AnimatePresence initial={false}>
                {showPinyin && (
                  <motion.span
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="block overflow-hidden text-[15px] font-semibold italic leading-6 text-wash-blue"
                  >
                    {info?.pinyin ?? ""}
                  </motion.span>
                )}
              </AnimatePresence>
              <p className="text-[16px] font-bold text-ink">{info?.gloss ?? ""}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-6 items-center rounded-full px-2.5 text-[11px] font-extrabold uppercase tracking-[0.04em] ${levelChipCls}`}
                >
                  HSK-{info?.level ?? 1}
                </span>
                {info?.radical && (
                  <span className="flex h-6 items-center rounded-full bg-ink/5 px-2.5 text-[11px] font-bold text-ink-soft">
                    Radical <span className="font-cjk ml-1">{info.radical}</span>
                  </span>
                )}
                {totalStrokes > 0 && (
                  <span className="flex h-6 items-center rounded-full bg-ink/5 px-2.5 text-[11px] font-bold text-ink-soft">
                    {totalStrokes} stroke{totalStrokes === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>
          {compounds.length > 0 && (
            <div className="mt-4 border-t border-grid-line/60 pt-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                Words with <span className="font-cjk normal-case">{char}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {compounds.map((w) => (
                  <CompoundChip
                    key={w.word}
                    word={w}
                    onSpeak={speakCompound}
                    active={speaking && speakingWord === w.word}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* origin & culture card */}
        {fact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.4, delay: 0.08, ease: EASE }}
          >
            <FactCard fact={fact} />
          </motion.div>
        )}

        {/* mastery card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.4, delay: 0.16, ease: EASE }}
          className="rounded-2xl bg-paper-raised p-5 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-[17px] font-semibold text-ink">Your mastery</h3>
            {mastered && (
              <span className="flex h-6 items-center gap-1 rounded-full bg-jade/10 px-2.5 text-[11px] font-extrabold text-jade">
                <BadgeCheck size={13} />
                Mastered
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            Practiced {charStats.count} time{charStats.count === 1 ? "" : "s"}
            {" · "}
            Quiz best:{" "}
            {charStats.best === null
              ? "not quizzed yet"
              : charStats.best === 0
                ? "no mistakes"
                : `${charStats.best} mistake${charStats.best === 1 ? "" : "s"}`}
            {charStats.best !== null && charStats.assisted && (
              <span className="text-ink-faint"> (assisted)</span>
            )}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-label="Practice activity over the last 7 days">
              {week.map((active, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${active ? "bg-jade" : "bg-grid-line"}`}
                />
              ))}
            </div>
            <span className="text-[12px] font-semibold text-ink-faint">Last 7 days</span>
          </div>
        </motion.div>
      </motion.section>
      )}

      {/* ── Section 6: character picker sheet (not available in drills) ── */}
      {!drill && (
        <CharPickerSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSelect={(c) => {
            setSheetOpen(false);
            changeChar(c);
          }}
          onRandom={(lvl) => {
            setSheetOpen(false);
            runRandom(poolFor(lvl));
          }}
          currentChar={char}
          initialFilter={levelFilter}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </motion.div>
  );
}
