import { motion, useReducedMotion } from "framer-motion";
import { PenLine, RotateCcw, BadgeCheck } from "lucide-react";

interface DrillStageTransitionProps {
  /** how many characters were practiced in the guided round */
  count: number;
  onTakeTest: () => void;
  onPracticeAgain: () => void;
}

/**
 * Interstitial between drill stage 1 (guided, outline + grid) and stage 2
 * (test, no outline). Springs up like the drill completion card.
 */
export default function DrillStageTransition({ count, onTakeTest, onPracticeAgain }: DrillStageTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="relative mt-4 overflow-hidden rounded-[20px] bg-paper-raised px-6 py-8 text-center shadow-soft"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jade/10 text-jade">
        <BadgeCheck size={24} />
      </span>

      <h3 className="mt-4 font-display text-[20px] font-bold text-ink">Guided round complete</h3>
      <p className="mt-1 text-[15px] text-ink-soft">
        <span className="font-bold text-jade">{count}</span> character{count === 1 ? "" : "s"} practiced
      </p>
      <p className="mt-1.5 text-[13px] text-ink-faint">
        Ready for the test? In the test the outline is hidden — the grid is optional.
      </p>
      <p lang="zh" className="mt-0.5 font-cjk text-[13px] text-ink-faint">
        学习完了，该测试了。
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onTakeTest}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[15px] font-extrabold text-paper-raised shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:bg-vermilion-deep active:scale-[0.98]"
        >
          <PenLine size={17} /> Take the test
        </button>
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-ink/20 text-[15px] font-extrabold text-ink transition-colors hover:bg-ink/5 active:scale-[0.98]"
        >
          <RotateCcw size={17} /> Practice again
        </button>
      </div>
    </motion.div>
  );
}
