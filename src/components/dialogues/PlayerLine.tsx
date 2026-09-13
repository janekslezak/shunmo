import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Brush } from "lucide-react";
import type { DialogueLineData } from "@/data";
import { usePinyin } from "@/hooks/usePinyin";
import { useSpeech } from "@/hooks/useSpeech";
import { segmentLine } from "./segment";
import type { Segment } from "./segment";

interface GlossPopoverProps {
  segment: Segment;
  onSayIt: (text: string) => void;
  voiceReady: boolean;
}

/** Floating gloss popover anchored above a tapped hanzi word. */
function GlossPopover({ segment, onSayIt, voiceReady }: GlossPopoverProps) {
  return (
    <motion.span
      initial={{ scale: 0.9, y: 4, opacity: 0, x: "-50%" }}
      animate={{ scale: 1, y: 0, opacity: 1, x: "-50%" }}
      exit={{ scale: 0.9, y: 4, opacity: 0, x: "-50%" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="absolute bottom-full left-1/2 z-30 mb-2 block w-max max-w-[220px] rounded-xl bg-paper-raised px-3.5 py-2.5 text-left shadow-lift ring-1 ring-grid-line/60"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="pointer-events-none absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-paper-raised ring-1 ring-grid-line/60" />
      <span className="block font-cjk text-[18px] font-semibold leading-6 text-ink">{segment.text}</span>
      {segment.pinyin && (
        <span className="block text-[12px] font-semibold italic leading-4 text-wash-blue">
          {segment.pinyin}
        </span>
      )}
      {segment.gloss && (
        <span className="mt-0.5 block text-[12px] leading-4 text-ink-soft">{segment.gloss}</span>
      )}
      <span className="mt-2 flex items-center gap-1.5 border-t border-grid-line/50 pt-2">
        <button
          type="button"
          onClick={() => onSayIt(segment.text)}
          disabled={!voiceReady}
          aria-label={`Say ${segment.text}`}
          className={`flex h-7 items-center gap-1 rounded-full bg-wash-blue/10 px-2.5 text-[11px] font-bold text-wash-blue transition-colors active:scale-95 ${
            voiceReady ? "hover:bg-wash-blue/20" : "opacity-40"
          }`}
        >
          <Volume2 size={12} /> Say it
        </button>
        <Link
          to={`/practice?char=${encodeURIComponent(segment.text[0])}`}
          className="flex h-7 items-center gap-1 rounded-full bg-vermilion/10 px-2.5 text-[11px] font-bold text-vermilion transition-colors hover:bg-vermilion/20 active:scale-95"
        >
          <Brush size={12} /> Practice
        </Link>
      </span>
    </motion.span>
  );
}

/** Three-bar sound-wave shown on the speaker button while its line plays. */
function SoundWave() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-3 w-[2.5px] origin-bottom rounded-full bg-current"
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

interface PlayerLineProps {
  line: DialogueLineData;
  index: number;
  /** highlighted during play-all playback */
  active?: boolean;
  /** false when no zh voice is installed — dims speaker buttons */
  voiceReady: boolean;
  /** page-level hook so single-line play can interrupt play-all */
  onWillSpeak?: () => void;
  /** notify page that a single line was played (marks "listened") */
  onPlayed?: () => void;
  /** fired when the user tries to play but no zh voice is installed */
  onNoVoice?: () => void;
}

/**
 * Chat-styled dialogue bubble: alternating A (left, jade avatar) / B (right,
 * vermilion avatar), toggleable pinyin row, tap-a-word gloss popover,
 * per-line read-aloud via the shared useSpeech hook.
 */
export default function PlayerLine({
  line,
  index,
  active = false,
  voiceReady,
  onWillSpeak,
  onPlayed,
  onNoVoice,
}: PlayerLineProps) {
  const { showPinyin } = usePinyin();
  const { speak, speaking } = useSpeech();
  const segments = useMemo(() => segmentLine(line.zh), [line.zh]);
  const [openSeg, setOpenSeg] = useState<number | null>(null);
  const [mine, setMine] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // wave animation stops when the shared speech hook goes quiet
  useEffect(() => {
    if (!speaking) setMine(false);
  }, [speaking]);

  // dismiss popover on outside tap
  useEffect(() => {
    if (openSeg === null) return;
    const close = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenSeg(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [openSeg]);

  // close popover when this line becomes the play-all target
  useEffect(() => {
    if (active) setOpenSeg(null);
  }, [active]);

  const speakText = (text: string) => {
    onWillSpeak?.();
    if (!voiceReady) {
      onNoVoice?.();
      return;
    }
    speak(text);
    setMine(true);
    onPlayed?.();
  };

  const isB = line.speaker === "B";

  return (
    <div ref={rootRef} className={`flex w-full ${isB ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[82%] items-start gap-2.5 ${isB ? "flex-row-reverse" : ""}`}>
        <img
          src={isB ? "/avatar-scholar-b.png" : "/avatar-scholar.png"}
          alt={`Speaker ${line.speaker}`}
          className={`mt-1 h-9 w-9 shrink-0 rounded-full border object-cover ${
            isB ? "border-vermilion/30" : "border-jade/30"
          }`}
          loading="lazy"
        />
        <div
          className={`relative rounded-2xl px-3.5 py-3 shadow-soft transition-colors duration-200 ${
            active
              ? `bg-vermilion/[0.08] ${
                  isB
                    ? "shadow-[inset_-3px_0_0_0_var(--vermilion)]"
                    : "shadow-[inset_3px_0_0_0_var(--vermilion)]"
                }`
              : "bg-paper-raised"
          } ${isB ? "rounded-tr-md" : "rounded-tl-md"}`}
        >
          <motion.div
            animate={{ maxHeight: showPinyin ? 24 : 0, opacity: showPinyin ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <span className="block text-[14px] font-semibold italic leading-6 text-wash-blue">
              {line.pinyin}
            </span>
          </motion.div>

          <p
            lang="zh"
            className={`font-cjk text-[22px] leading-8 text-ink ${isB ? "text-right" : ""}`}
          >
            {segments.map((seg, i) =>
              seg.gloss ? (
                <span key={i} className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setOpenSeg(openSeg === i ? null : i)}
                    aria-label={`${seg.text}: ${seg.gloss}`}
                    className={`mx-[1px] rounded px-[1px] transition-colors hover:bg-vermilion/10 ${
                      openSeg === i ? "bg-vermilion/15 text-vermilion-deep" : ""
                    }`}
                  >
                    {seg.text}
                  </button>
                  <AnimatePresence>
                    {openSeg === i && (
                      <GlossPopover
                        segment={seg}
                        voiceReady={voiceReady}
                        onSayIt={(t) => speakText(t)}
                      />
                    )}
                  </AnimatePresence>
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </p>

          <p className={`mt-1 text-[13px] leading-5 text-ink-soft ${isB ? "text-right" : ""}`}>
            {line.en}
          </p>

          <button
            type="button"
            onClick={() => speakText(line.zh)}
            aria-label={`Play line ${index + 1}: ${line.zh}`}
            className={`absolute bottom-2 flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 ${
              isB ? "-left-11" : "-right-11"
            } ${
              voiceReady
                ? "bg-wash-blue/10 text-wash-blue hover:bg-wash-blue/20"
                : "bg-wash-blue/5 text-wash-blue/40"
            }`}
          >
            {mine && speaking ? <SoundWave /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
