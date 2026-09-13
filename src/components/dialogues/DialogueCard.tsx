import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Brush } from "lucide-react";
import type { Dialogue } from "@/data";
import TopicIcon from "./TopicIcon";
import { TONE_TILE, estimateSeconds, toneOf, topicOf } from "./topics";
import { relativeTime } from "./useDialogueStats";
import type { DialogueStat } from "./useDialogueStats";

interface DialogueCardProps {
  dialogue: Dialogue;
  stat?: DialogueStat;
}

/** Library card: topic tile, bilingual title, meta row, circular play button, listen stats. */
export default function DialogueCard({ dialogue, stat }: DialogueCardProps) {
  const navigate = useNavigate();
  const [rippling, setRippling] = useState(false);
  const topic = topicOf(dialogue);

  const open = () => navigate(`/dialogues/${dialogue.id}`);

  const playAll = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setRippling(true);
    window.setTimeout(() => setRippling(false), 500);
    navigate(`/dialogues/${dialogue.id}?autoplay=1`);
  };

  const practiceChars = (e: ReactMouseEvent) => {
    e.stopPropagation();
    navigate(`/practice?dialogue=${encodeURIComponent(dialogue.id)}`);
  };

  return (
    <motion.article
      layout
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open dialogue ${dialogue.title}`}
      className="cursor-pointer overflow-hidden rounded-[20px] bg-paper-raised shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-center gap-3 p-4 pb-3">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${TONE_TILE[toneOf(dialogue)]}`}
        >
          <TopicIcon dialogueId={dialogue.id} className="h-8 w-8" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span lang="zh" className="truncate font-cjk text-[20px] font-semibold leading-7 text-ink">
              {dialogue.titleZh}
            </span>
          </span>
          <span className="block truncate text-[15px] font-bold leading-5 text-ink">
            {dialogue.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-ink-faint">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.04em] ${
                dialogue.level === 1 ? "bg-jade/10 text-jade" : "bg-gold/15 text-gold"
              }`}
            >
              HSK-{dialogue.level}
            </span>
            {topic && <span>{topic}</span>}
            <span aria-hidden="true">·</span>
            <span>{dialogue.lines.length} lines</span>
            <span aria-hidden="true">·</span>
            <span>≈{estimateSeconds(dialogue)} sec</span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={practiceChars}
            aria-label={`Practice characters from ${dialogue.title}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-vermilion/40 bg-vermilion/5 text-vermilion transition-colors hover:border-vermilion/70 active:scale-90"
          >
            <Brush size={17} />
          </button>
          <button
            type="button"
            onClick={playAll}
            aria-label={`Play all lines of ${dialogue.title}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-vermilion text-paper-raised shadow-soft transition-transform active:scale-90"
          >
            {rippling && (
              <motion.span
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-vermilion"
                aria-hidden="true"
              />
            )}
            <Play size={18} className="relative ml-0.5 fill-current" />
          </button>
        </span>
      </div>

      {(stat?.completedAt || stat?.listenedAt) && (
        <div className="flex items-center gap-2 border-t border-grid-line/50 px-4 py-2">
          {stat.completedAt && (
            <span className="flex items-center gap-1 text-[12px] font-bold text-jade">
              <CheckCircle2 size={13} /> Completed
            </span>
          )}
          {stat.listenedAt && (
            <span className="text-[12px] text-ink-faint">
              Last listened {relativeTime(stat.listenedAt)}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}
