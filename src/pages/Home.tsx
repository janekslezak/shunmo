import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import HanziWriter from "hanzi-writer";
import { Brush, Shuffle, Layers, MessagesSquare, BookOpen, ChevronRight, Play, ArrowRight, X } from "lucide-react";
import { characters, facts, getCharacter, words } from "@/data";
import type { Character, Fact } from "@/data";
import ProgressRing from "@/components/ProgressRing";
import TianGrid from "@/components/TianGrid";
import { useProgress } from "@/hooks/useProgress";
import { usePinyin } from "@/hooks/usePinyin";
import { deckStats } from "@/components/review/srs";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const MOTIVATIONS = [
  "每天一个字 — one character a day.",
  "熟能生巧 — practice makes perfect.",
  "学而时习之 — learn and review often.",
  "温故而知新 — review the old, learn the new.",
  "滴水穿石 — drips of water pierce stone.",
];

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function greeting(): { zh: string; en: string } {
  const h = new Date().getHours();
  if (h < 6) return { zh: "晚上好，", en: "Good evening" };
  if (h < 12) return { zh: "早上好，", en: "Good morning" };
  if (h < 18) return { zh: "下午好，", en: "Good afternoon" };
  return { zh: "晚上好，", en: "Good evening" };
}

/** deterministic daily character: HSK-1 first, then HSK-2 once HSK-1 mastery ≥ 80% */
function pickDailyChar(mastered: ReadonlySet<string>): Character {
  const hsk1Chars = characters.filter((c) => c.level === 1);
  const hsk2Chars = characters.filter((c) => c.level === 2);
  const hsk1Mastery = hsk1Chars.length
    ? hsk1Chars.filter((c) => mastered.has(c.char)).length / hsk1Chars.length
    : 0;
  const pool = hsk1Mastery >= 0.8 ? hsk2Chars : hsk1Chars;
  const remaining = pool.filter((c) => !mastered.has(c.char));
  const list = remaining.length > 0 ? remaining : pool;
  return list[dayOfYear() % list.length];
}

function useCountUp(target: number, duration = 1000): number {
  const [val, setVal] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return val;
}

/** 120x120 static Hanzi Writer outline with a play button for stroke animation. */
function MiniWriter({ char }: { char: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#26221B";
    const faint = getComputedStyle(document.documentElement).getPropertyValue("--ink-faint").trim() || "#9A9182";
    const writer = HanziWriter.create(el, char, {
      width: 120,
      height: 120,
      padding: 8,
      showCharacter: false,
      showOutline: true,
      strokeColor: ink,
      outlineColor: faint,
      delayBetweenStrokes: 300,
      charDataLoader: (c, onLoad, onError) => {
        fetch(`${import.meta.env.BASE_URL}hanzidata/${encodeURIComponent(c)}.json`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no data"))))
          .then(onLoad)
          .catch(onError);
      },
    });
    writerRef.current = writer;
    return () => {
      writerRef.current = null;
      el.innerHTML = "";
    };
  }, [char]);

  const play = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const w = writerRef.current;
    if (!w || playing) return;
    setPlaying(true);
    w.hideOutline();
    w.animateCharacter({
      onComplete: () => {
        setPlaying(false);
        w.showOutline();
      },
    });
  };

  return (
    <div className="relative h-[120px] w-[120px] shrink-0">
      <TianGrid className={`absolute inset-0 h-full w-full transition-opacity ${playing ? "opacity-100" : "opacity-70"}`} strokeWidth={0.9} />
      <div ref={ref} className="absolute inset-0" />
      <button
        type="button"
        onClick={play}
        aria-label={`Animate stroke order of ${char}`}
        className="absolute -right-1 -top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-vermilion text-paper-raised shadow-soft transition-transform active:scale-90"
      >
        <Play size={14} className={`ml-0.5 fill-paper-raised ${playing ? "animate-spin [animation-duration:1.5s]" : ""}`} />
      </button>
    </div>
  );
}

const QUICK_ACTIONS = [
  { to: "/practice", label: "Practice strokes", icon: Brush, tint: "text-vermilion", bg: "bg-vermilion/10" },
  { to: "/practice?random=1", label: "Random character", icon: Shuffle, tint: "text-gold", bg: "bg-gold/10" },
  { to: "/dialogues", label: "Dialogues", icon: MessagesSquare, tint: "text-wash-blue", bg: "bg-wash-blue/10" },
  { to: "/words", label: "Word list", icon: BookOpen, tint: "text-jade", bg: "bg-jade/10" },
];

interface ContinueState {
  label: string;
  to: string;
}

function readContinue(): ContinueState | null {
  try {
    const raw = localStorage.getItem("hanziflow:continue");
    if (!raw) return null;
    const s = JSON.parse(raw) as ContinueState;
    return typeof s.label === "string" && typeof s.to === "string" ? s : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { mastered, streak } = useProgress();
  const { showPinyin } = usePinyin();

  const g = useMemo(greeting, []);
  const motivation = MOTIVATIONS[dayOfYear() % MOTIVATIONS.length];
  const daily = useMemo(() => pickDailyChar(mastered), [mastered]);
  const dailyChar = getCharacter(daily.char) ?? daily;

  const hsk1Total = characters.filter((c) => c.level === 1).length;
  const hsk2Total = characters.filter((c) => c.level === 2).length;
  const hsk1Done = characters.filter((c) => c.level === 1 && mastered.has(c.char)).length;
  const hsk2Done = characters.filter((c) => c.level === 2 && mastered.has(c.char)).length;
  const hsk1Count = useCountUp(hsk1Done);
  const hsk2Count = useCountUp(hsk2Done);

  // featured fact rotates daily; "Another fact" cycles manually
  const [factOffset, setFactOffset] = useState(0);
  const fact: Fact = facts[(dayOfYear() + factOffset) % facts.length];

  // continue strip
  const [continueState, setContinueState] = useState<ContinueState | null>(readContinue);

  // flashcard review due count (localStorage snapshot on mount)
  const [dueReviewCount] = useState(() => deckStats(words.length).due);

  // hero parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const brushY = useTransform(scrollY, [0, 300], [0, -12]);
  void heroRef;

  return (
    <div className="pt-6">
      {/* ── Section 2: Greeting hero ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.img
          src="/hero-brush.png"
          alt=""
          aria-hidden="true"
          style={reduced ? undefined : { y: brushY }}
          className="pointer-events-none absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 opacity-25 dark:opacity-30"
        />
        <div className="relative">
          <motion.h2
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display text-[34px] font-bold leading-[40px] text-vermilion [text-shadow:0_0_14px_#F6F1E5,0_1px_3px_#F6F1E5] dark:[text-shadow:0_0_14px_#17150F,0_1px_3px_#17150F]"
          >
            <span className="font-brush text-[38px]">
              {g.zh.replace("，", "")}
              <span className="text-vermilion">，</span>
            </span>{" "}
            {g.en}
          </motion.h2>
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
            className="mt-2 text-[15px] font-semibold text-ink [text-shadow:0_0_12px_#F6F1E5,0_1px_2px_#F6F1E5] dark:text-ink-soft dark:[text-shadow:0_0_12px_#17150F,0_1px_2px_#17150F]"
          >
            {motivation}
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 48 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 h-0.5 rounded-full bg-vermilion"
          />
        </div>
      </section>

      {/* ── Section 3: Daily character card ── */}
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        className="mt-8"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/practice?char=${encodeURIComponent(daily.char)}`)}
          onKeyDown={(e) => e.key === "Enter" && navigate(`/practice?char=${encodeURIComponent(daily.char)}`)}
          className="relative cursor-pointer overflow-hidden rounded-[20px] bg-paper-raised p-5 shadow-soft transition-shadow hover:shadow-lift"
        >
          <img
            src="/daily-char-bg.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="relative flex items-center gap-5">
            <MiniWriter char={daily.char} />
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-faint">今日汉字 · Today</p>
              <AnimatePresence initial={false}>
                {showPinyin && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden text-[16px] font-semibold italic text-wash-blue"
                  >
                    {dailyChar.pinyin}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="mt-0.5 truncate text-[18px] font-bold text-ink">{dailyChar.gloss}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${
                    daily.level === 1 ? "bg-jade/10 text-jade" : "bg-gold/10 text-gold"
                  }`}
                >
                  HSK-{daily.level}
                </span>
                <span className="text-[13px] text-ink-faint">{dailyChar.strokeCount} strokes</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Section 4: Progress overview ── */}
      <section className="mt-10">
        <h3 className="font-display text-[20px] font-semibold text-ink">Your Progress</h3>
        <div className="mt-3 rounded-[20px] bg-paper-raised p-5 shadow-soft">
          <div className="flex items-center justify-around">
            <Link to="/words?level=hsk1" className="flex flex-col items-center gap-2">
              <ProgressRing value={hsk1Total ? hsk1Done / hsk1Total : 0} tone="jade" size={96}>
                <span className="font-display text-[18px] font-bold text-jade">
                  {hsk1Total ? Math.round((hsk1Done / hsk1Total) * 100) : 0}%
                </span>
              </ProgressRing>
              <span className="text-[13px] font-bold text-ink">HSK-1</span>
              <span className="-mt-1.5 text-[12px] text-ink-faint">{hsk1Count} / {hsk1Total} mastered</span>
            </Link>
            <Link to="/words?level=hsk2" className="flex flex-col items-center gap-2">
              <ProgressRing value={hsk2Total ? hsk2Done / hsk2Total : 0} tone="gold" size={96}>
                <span className="font-display text-[18px] font-bold text-gold">
                  {hsk2Total ? Math.round((hsk2Done / hsk2Total) * 100) : 0}%
                </span>
              </ProgressRing>
              <span className="text-[13px] font-bold text-ink">HSK-2</span>
              <span className="-mt-1.5 text-[12px] text-ink-faint">{hsk2Count} / {hsk2Total} mastered</span>
            </Link>
          </div>
          {/* character-wall tick strip */}
          <div className="mt-5 flex flex-wrap gap-[2px]" aria-hidden="true">
            {characters.map((c, i) => (
              <motion.span
                key={c.char}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduced ? 0 : Math.min(0.6, i * 0.002) }}
                className={`h-3 w-[3px] rounded-full ${
                  mastered.has(c.char) ? (c.level === 1 ? "bg-jade" : "bg-gold") : "bg-grid-line"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[12px] text-ink-faint">
            {mastered.size} / {characters.length} characters mastered — pass a character's quiz twice to master it.
          </p>
        </div>
      </section>

      {/* ── Section 5: Quick actions ── */}
      <section className="mt-10">
        {dueReviewCount > 0 && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.08, ease: EASE }}
          >
            <Link
              to="/review"
              className="mb-3 flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2.5 text-[13px] font-extrabold text-gold"
            >
              <Layers size={15} />
              {dueReviewCount} {dueReviewCount === 1 ? "card" : "cards"} due for review
              <ChevronRight size={15} />
            </Link>
          </motion.div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, tint, bg }, i) => (
            <motion.div
              key={to}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06, ease: EASE }}
            >
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link
                  to={to}
                  className="flex h-[84px] items-center gap-3 rounded-2xl bg-paper-raised px-4 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg} ${tint}`}>
                    <Icon size={20} />
                  </span>
                  <span className="flex-1 text-[14px] font-extrabold leading-tight text-ink">{label}</span>
                  <ChevronRight size={16} className="shrink-0 text-ink-faint" />
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Featured culture fact ── */}
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mt-10"
      >
        <h3 className="font-display text-[20px] font-semibold text-ink">Did you know?</h3>
        <div className="relative mt-3 overflow-hidden rounded-[20px] border-l-[3px] border-gold bg-paper-raised p-5 shadow-soft">
          <span className="absolute right-4 top-4 rounded-md bg-vermilion/10 px-2 py-0.5 font-brush text-[14px] text-vermilion">
            文化
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={fact.char + factOffset}
              initial={{ x: 12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 font-brush text-[26px] text-gold">
                  {fact.char}
                </span>
                <p className="font-display text-[17px] font-semibold text-ink">The story of {fact.char}</p>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{fact.origin}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{fact.culture}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFactOffset((v) => v + 1)}
              className="rounded-full border border-ink-faint/40 px-4 py-2 text-[13px] font-bold text-ink-soft transition-colors hover:border-ink-faint active:scale-95"
            >
              Another fact
            </button>
            <Link
              to={`/practice?char=${encodeURIComponent(fact.char)}`}
              className="flex items-center gap-1 text-[13px] font-bold text-vermilion"
            >
              Read in practice <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Section 7: Continue strip (conditional) ── */}
      <AnimatePresence>
        {continueState && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.4 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80) {
                localStorage.removeItem("hanziflow:continue");
                setContinueState(null);
              }
            }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 rounded-full bg-paper-raised py-2 pl-5 pr-2 shadow-soft">
              <Link to={continueState.to} className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-[14px] font-bold text-ink">Continue: {continueState.label}</span>
                <ArrowRight size={16} className="shrink-0 text-vermilion" />
              </Link>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => {
                  localStorage.removeItem("hanziflow:continue");
                  setContinueState(null);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-paper"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* streak hint */}
      <p className="mt-8 text-center text-[12px] text-ink-faint">
        {streak.count > 0
          ? `${streak.count}-day streak — 加油， keep it going!`
          : "Practice a character today to start your streak."}
      </p>
    </div>
  );
}
