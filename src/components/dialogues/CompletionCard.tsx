import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Brush } from "lucide-react";

const RADICALS = ["氵", "木", "心", "口", "手", "日", "火", "土"];
const CONFETTI_COLORS = ["var(--vermilion)", "var(--jade)", "var(--gold)", "var(--wash-blue)"];

/** Reduced 8-piece falling-radicals confetti, fired once on mount. */
function RadicalConfetti() {
  const pieces = useMemo(
    () =>
      RADICALS.map((r, i) => ({
        r,
        left: 8 + ((i * 37) % 84),
        delay: (i % 4) * 0.12,
        duration: 1.1 + (i % 3) * 0.25,
        size: 14 + ((i * 5) % 10),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: (i % 2 === 0 ? 1 : -1) * (10 + ((i * 7) % 14)),
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -24, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: 150, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.drift * 4 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute font-cjk font-bold"
          style={{ left: `${p.left}%`, fontSize: p.size, color: p.color }}
        >
          {p.r}
        </motion.span>
      ))}
    </div>
  );
}

interface CompletionCardProps {
  onListenAgain: () => void;
  /** fallback when no dialogue route param is available */
  onPractice?: () => void;
}

/** End-of-dialogue completion state: jade check draws on, two actions. */
export default function CompletionCard({ onListenAgain, onPractice }: CompletionCardProps) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  /** the practice CTA launches this dialogue's writing drill */
  const startDrill = () => {
    if (id) navigate(`/practice?dialogue=${encodeURIComponent(id)}`);
    else onPractice?.();
  };

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="relative mt-6 overflow-hidden rounded-[20px] bg-paper-raised px-6 py-8 text-center shadow-soft"
    >
      {!reduced && <RadicalConfetti />}

      <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16" aria-hidden="true">
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="var(--jade)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.path
          d="M20 33.5 28.5 42 45 24"
          fill="none"
          stroke="var(--jade)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
        />
      </svg>

      <h3 className="mt-4 font-display text-[20px] font-bold text-ink">Dialogue complete!</h3>
      <p lang="zh" className="mt-1 font-cjk text-[15px] text-ink-soft">
        听懂了。 <span className="font-sans text-[13px] not-italic">You understood it.</span>
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onListenAgain}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-ink/20 text-[15px] font-extrabold text-ink transition-colors hover:bg-ink/5 active:scale-[0.98]"
        >
          <RotateCcw size={17} /> Listen again
        </button>
        <button
          type="button"
          onClick={startDrill}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[15px] font-extrabold text-paper-raised shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:bg-vermilion-deep active:scale-[0.98]"
        >
          <Brush size={17} /> Practice characters from this dialogue
        </button>
      </div>
    </motion.div>
  );
}
