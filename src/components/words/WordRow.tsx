import { memo, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Brush, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import TianGrid from "@/components/TianGrid";
import type { Word } from "@/data";
import type { WordStatus } from "./wordUtils";

const ACTION_WIDTH = 88;

const STATUS_DOT: Record<WordStatus, string> = {
  mastered: "bg-jade",
  learning: "border-2 border-gold bg-transparent",
  new: "border-2 border-grid-line bg-transparent",
};

interface WordRowProps {
  word: Word;
  status: WordStatus;
  showPinyin: boolean;
  /** row index within the rendered window — only the first 15 animate in */
  index: number;
  onOpen: (word: Word) => void;
}

/**
 * Word list row card (64px, radius 14). Swipe-left reveals a vermilion
 * "Practice" quick action; tap opens the word detail route.
 */
function WordRowInner({ word, status, showPinyin, index, onOpen }: WordRowProps) {
  const navigate = useNavigate();
  const controls = useAnimationControls();
  const wasDrag = useRef(false);
  const animateMount = index < 15;
  const firstChar = Array.from(word.word)[0] ?? word.word;

  return (
    <motion.div
      initial={animateMount ? { y: 12, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: animateMount ? index * 0.03 : 0 }}
      className="relative overflow-hidden rounded-[14px] shadow-soft"
    >
      {/* quick action revealed by swiping left */}
      <div className="absolute inset-y-0 right-0 flex items-stretch justify-end bg-vermilion" style={{ width: ACTION_WIDTH }}>
        <button
          type="button"
          aria-label={`Practice ${word.word}`}
          onClick={() => navigate(`/practice?char=${encodeURIComponent(firstChar)}`)}
          className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-paper-raised active:bg-vermilion-deep"
        >
          <Brush size={18} />
          <span className="text-[11px] font-extrabold">Practice</span>
        </button>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.04}
        dragMomentum={false}
        animate={controls}
        onDragStart={() => {
          wasDrag.current = true;
        }}
        onDragEnd={(_, info) => {
          void controls.start({
            x: info.offset.x < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0,
            transition: { type: "spring", stiffness: 320, damping: 30 },
          });
          window.setTimeout(() => {
            wasDrag.current = false;
          }, 0);
        }}
        onClick={() => {
          if (wasDrag.current) return;
          void controls.start({ x: 0, transition: { type: "spring", stiffness: 320, damping: 30 } });
          onOpen(word);
        }}
        whileTap={{ scale: 0.98 }}
        className="relative flex cursor-pointer touch-pan-y items-center gap-3 bg-paper-raised px-3 transition-[height]"
        style={{ height: showPinyin ? 64 : 56 }}
      >
        {/* mini tian-grid tile with the first hanzi */}
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-grid-line/60 bg-paper">
          <TianGrid className="absolute inset-0 h-full w-full" strokeWidth={1} />
          <span className="absolute inset-0 flex items-center justify-center font-cjk text-[20px] leading-none text-ink">
            {firstChar}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-cjk text-[20px] leading-tight text-ink">{word.word}</span>
          {showPinyin && (
            <span className="block truncate text-[12px] italic leading-tight text-wash-blue">
              {word.pinyin}
            </span>
          )}
        </span>

        <span className="max-w-[38%] truncate text-right text-[13px] text-ink-soft">{word.gloss}</span>
        <span
          aria-label={status}
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[status]}`}
        />
        <ChevronRight size={16} className="shrink-0 text-ink-faint" />
      </motion.div>
    </motion.div>
  );
}

const WordRow = memo(WordRowInner);
export default WordRow;
