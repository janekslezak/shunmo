import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ArrowRight } from "lucide-react";
import RadicalConfetti from "@/components/practice/RadicalConfetti";

interface DrillCompleteCardProps {
  /** how many drill characters were mastered */
  count: number;
  onBackToDialogue: () => void;
  /** omitted when there is no further dialogue to drill */
  onNextDrill?: () => void;
}

/**
 * End-of-drill completion state (patterns shared with the dialogue
 * CompletionCard): jade check draws on, radical confetti, mastery summary.
 */
export default function DrillCompleteCard({ count, onBackToDialogue, onNextDrill }: DrillCompleteCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="relative mt-4 overflow-hidden rounded-[20px] bg-paper-raised px-6 py-8 text-center shadow-soft"
    >
      {!reduced && <RadicalConfetti />}

      <svg viewBox="0 0 64 64" className="relative mx-auto h-16 w-16" aria-hidden="true">
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

      <h3 className="relative mt-4 font-display text-[20px] font-bold text-ink">Drill complete!</h3>
      <p className="relative mt-1 text-[15px] text-ink-soft">
        <span className="font-bold text-jade">{count}</span> character{count === 1 ? "" : "s"} mastered
      </p>
      <p lang="zh" className="relative mt-0.5 font-cjk text-[13px] text-ink-faint">
        写得真好。<span className="font-sans not-italic"> Written from memory — no outline, no grid.</span>
      </p>

      <div className="relative mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onBackToDialogue}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-ink/20 text-[15px] font-extrabold text-ink transition-colors hover:bg-ink/5 active:scale-[0.98]"
        >
          <ChevronLeft size={17} /> Back to dialogue
        </button>
        {onNextDrill && (
          <button
            type="button"
            onClick={onNextDrill}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[15px] font-extrabold text-paper-raised shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:bg-vermilion-deep active:scale-[0.98]"
          >
            Next drill <ArrowRight size={17} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
