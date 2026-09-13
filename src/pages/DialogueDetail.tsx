import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Pause, Repeat, Gauge, Brush } from "lucide-react";
import { dialogues, getCharacter } from "@/data";
import { usePinyin } from "@/hooks/usePinyin";
import Toast from "@/components/Toast";
import PlayerLine from "@/components/dialogues/PlayerLine";
import CompletionCard from "@/components/dialogues/CompletionCard";
import { useDialoguePlayer } from "@/components/dialogues/useDialoguePlayer";
import { useDialogueStats } from "@/components/dialogues/useDialogueStats";

const NO_VOICE_MSG = "No Chinese voice found — check Settings for help";

/** View B — Dialogue Player (/dialogues/:id). */
export default function DialogueDetail() {
  const { id } = useParams<{ id: string }>();
  const dialogue = useMemo(() => dialogues.find((d) => d.id === id), [id]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showPinyin } = usePinyin();
  const reduced = useReducedMotion();
  const { markListened, markCompleted } = useDialogueStats();

  const [completed, setCompleted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleLinePlayed = useCallback(() => {
    if (id) markListened(id);
  }, [id, markListened]);

  const handleCompleted = useCallback(() => {
    setCompleted(true);
    if (id) markCompleted(id);
  }, [id, markCompleted]);

  const player = useDialoguePlayer(dialogue, {
    onLinePlayed: handleLinePlayed,
    onCompleted: handleCompleted,
  });

  // stop playback if the route id changes under us
  useEffect(() => {
    setCompleted(false);
    player.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ?autoplay=1 — start play-all once voices resolve
  const autoplayedRef = useRef(false);
  useEffect(() => {
    if (searchParams.get("autoplay") !== "1" || autoplayedRef.current || !player.supported) return;
    autoplayedRef.current = true;
    if (player.hasVoice) {
      player.playAll(0);
    } else {
      setToast(NO_VOICE_MSG);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, player.supported, player.hasVoice]);

  // auto-scroll the active line into view
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (player.activeIndex === null) return;
    lineRefs.current[player.activeIndex]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
  }, [player.activeIndex, reduced]);

  // title pinyin derived from the character dictionary (data ships none)
  const titlePinyin = useMemo(() => {
    if (!dialogue) return "";
    return dialogue.titleZh
      .split("")
      .map((ch) => getCharacter(ch)?.pinyin ?? ch)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }, [dialogue]);

  // key character for the practice CTA: most frequent known char in the dialogue
  const keyChar = useMemo(() => {
    if (!dialogue) return null;
    const counts = new Map<string, number>();
    for (const line of dialogue.lines) {
      for (const ch of line.zh) {
        if (getCharacter(ch)) counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }
    let best: string | null = null;
    let bestN = 0;
    counts.forEach((n, ch) => {
      if (n > bestN) {
        bestN = n;
        best = ch;
      }
    });
    return best ?? dialogue.titleZh.charAt(0);
  }, [dialogue]);

  const togglePlayAll = useCallback(() => {
    if (!player.hasVoice) {
      setToast(NO_VOICE_MSG);
      return;
    }
    if (player.playing) {
      player.pause();
    } else {
      setCompleted(false);
      player.playAll();
    }
  }, [player]);

  const listenAgain = useCallback(() => {
    if (!player.hasVoice) {
      setToast(NO_VOICE_MSG);
      return;
    }
    setCompleted(false);
    player.playAll(0);
  }, [player]);

  if (!dialogue) {
    return (
      <div className="flex flex-col items-center pt-16 text-center">
        <img src="/empty-dialogues.png" alt="" className="h-40 w-60 object-contain" loading="lazy" />
        <p className="mt-4 max-w-[260px] text-[15px] font-semibold text-ink-soft">
          This dialogue wandered off the page.
        </p>
        <Link
          to="/dialogues"
          className="mt-4 flex h-11 items-center rounded-[14px] bg-vermilion px-6 text-[15px] font-extrabold text-paper-raised shadow-soft transition-colors hover:bg-vermilion-deep active:scale-[0.97]"
        >
          Back to dialogues
        </Link>
      </div>
    );
  }

  const total = dialogue.lines.length;
  const progress = completed
    ? 1
    : player.activeIndex !== null
      ? (player.activeIndex + 1) / total
      : 0;

  return (
    <div className="pt-4">
      {/* Section 1 — player header */}
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2">
          <Link
            to="/dialogues"
            aria-label="Back to dialogue library"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 active:scale-95"
          >
            <ChevronLeft size={22} />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <h2 lang="zh" className="truncate font-cjk text-[20px] font-semibold leading-7 text-ink">
              {dialogue.titleZh}
            </h2>
            <motion.div
              animate={{ maxHeight: showPinyin ? 20 : 0, opacity: showPinyin ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <span className="block truncate text-[13px] font-semibold italic leading-5 text-wash-blue">
                {titlePinyin}
              </span>
            </motion.div>
            <span className="block truncate text-[13px] leading-5 text-ink-soft">
              {dialogue.title}
            </span>
          </div>
          {/* writing drill CTA (balances the back button) */}
          <Link
            to={`/practice?dialogue=${encodeURIComponent(dialogue.id)}`}
            aria-label={`Practice characters from ${dialogue.title}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-vermilion active:scale-95"
          >
            <Brush size={19} />
          </Link>
        </div>

        {/* progress bar: lines played / total */}
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-grid-line/60">
          <motion.div
            className="h-full rounded-full bg-vermilion"
            initial={false}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Section 2 — player controls bar (sticky under the app bar) */}
      <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-40 -mx-5 mt-3 border-b border-grid-line/40 bg-paper/90 px-5 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={player.toggleRepeat}
            aria-pressed={player.repeat}
            aria-label="Toggle repeat"
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
              player.repeat
                ? "bg-vermilion/10 text-vermilion"
                : "text-ink-faint hover:bg-ink/5"
            }`}
          >
            <Repeat size={18} />
          </button>

          <button
            type="button"
            onClick={togglePlayAll}
            aria-label={player.playing ? "Pause dialogue" : "Play all lines"}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-vermilion text-paper-raised shadow-soft transition-colors hover:bg-vermilion-deep active:scale-90"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={player.playing ? "pause" : "play"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                {player.playing ? (
                  <Pause size={22} className="fill-current" />
                ) : (
                  <Play size={22} className="ml-0.5 fill-current" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={player.cycleSpeed}
            aria-label={`Playback speed ${player.speed}x — tap to change`}
            className="flex h-10 items-center gap-1.5 rounded-full border border-grid-line px-3 text-[13px] font-extrabold text-ink-soft transition-colors hover:border-vermilion/50 active:scale-95"
          >
            <Gauge size={15} className="text-wash-blue" />
            <span className="inline-flex [perspective:200px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={player.speed}
                  initial={{ rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {player.speed}×
                </motion.span>
              </AnimatePresence>
            </span>
          </button>

          <span className="flex-1" />

          <label className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-ink-soft">Auto-advance</span>
            <button
              type="button"
              role="switch"
              aria-checked={player.autoAdvance}
              aria-label="Toggle auto-advance between lines"
              onClick={() => player.setAutoAdvance(!player.autoAdvance)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                player.autoAdvance ? "bg-jade" : "bg-grid-line"
              }`}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`absolute top-1 h-5 w-5 rounded-full bg-paper-raised shadow ${
                  player.autoAdvance ? "right-1" : "left-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Section 3 — dialogue lines */}
      <div className="mt-4 flex flex-col gap-3">
        {dialogue.lines.map((line, i) => (
          <motion.div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            initial={
              reduced
                ? { opacity: 0 }
                : { x: line.speaker === "B" ? 16 : -16, opacity: 0 }
            }
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
          >
            <PlayerLine
              line={line}
              index={i}
              active={player.activeIndex === i && (player.playing || completed)}
              voiceReady={player.hasVoice}
              onWillSpeak={player.pause}
              onPlayed={handleLinePlayed}
              onNoVoice={() => setToast(NO_VOICE_MSG)}
            />
          </motion.div>
        ))}
      </div>

      {/* Section 4 — completion state */}
      <AnimatePresence>
        {completed && (
          <CompletionCard
            onListenAgain={listenAgain}
            onPractice={() => keyChar && navigate(`/practice?char=${encodeURIComponent(keyChar)}`)}
          />
        )}
      </AnimatePresence>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
