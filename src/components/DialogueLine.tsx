import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { DialogueLineData } from "@/data";
import { usePinyin } from "@/hooks/usePinyin";
import { useSpeech } from "@/hooks/useSpeech";

interface DialogueLineProps {
  line: DialogueLineData;
  /** highlighted during play-all playback */
  active?: boolean;
  /** speech rate override */
  rate?: number;
  onPlayed?: () => void;
}

/** Stacked ruby dialogue line: pinyin row (toggleable), hanzi row, per-line speaker button. */
export default function DialogueLine({ line, active = false, rate = 0.85, onPlayed }: DialogueLineProps) {
  const { showPinyin } = usePinyin();
  const { speak } = useSpeech();

  const handlePlay = () => {
    speak(line.zh, rate);
    onPlayed?.();
  };

  return (
    <motion.div
      layout
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors ${
        active ? "bg-vermilion/10 shadow-[inset_3px_0_0_0_var(--vermilion)]" : "bg-paper-raised"
      }`}
    >
      <img
        src={line.speaker === "A" ? "/avatar-scholar.png" : "/avatar-scholar-b.png"}
        alt={`Speaker ${line.speaker}`}
        className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-grid-line object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <motion.div
          animate={{ maxHeight: showPinyin ? 72 : 0, opacity: showPinyin ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <span className="text-[13px] font-semibold italic leading-6 text-wash-blue">{line.pinyin}</span>
        </motion.div>
        <p className="font-cjk text-[17px] leading-7 text-ink">{line.zh}</p>
        <p className="mt-0.5 text-[13px] text-ink-soft">{line.en}</p>
      </div>
      <button
        type="button"
        onClick={handlePlay}
        aria-label={`Play line: ${line.zh}`}
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wash-blue/10 text-wash-blue transition-colors hover:bg-wash-blue/20 active:scale-95"
      >
        <Volume2 size={16} />
      </button>
    </motion.div>
  );
}
