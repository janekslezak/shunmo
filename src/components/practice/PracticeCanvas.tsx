import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode } from "react";
import HanziWriter from "hanzi-writer";
import { motion, useAnimationControls } from "framer-motion";
import { Grid2x2, Repeat, Eye, EyeOff } from "lucide-react";
import TianGrid from "../TianGrid";
import RadicalConfetti from "./RadicalConfetti";

export type PracticeMode = "animate" | "step" | "quiz";
export type CanvasLoadState = "loading" | "ready" | "error";

export interface PracticeCanvasHandle {
  /** re-run the stroke animation once (animate mode) */
  replay: () => void;
  /** clear and restart the quiz from stroke 1 */
  restartQuiz: () => void;
  /** reveal the current quiz stroke (Hint — marks attempt assisted) */
  skipStroke: () => void;
}

interface PracticeCanvasProps {
  char: string;
  mode: PracticeMode;
  /** 0.5 | 1 | 2 */
  speed: number;
  loop: boolean;
  /** step mode: number of strokes to reveal (1-based) */
  step: number;
  gridOn: boolean;
  /** quiz mode: faint character outline visible */
  outlineOn: boolean;
  reducedMotion: boolean;
  /** drill mode: corner toggles are hidden (grid + outline forced off) */
  lockToggles?: boolean;
  onGridToggle: () => void;
  onOutlineToggle: () => void;
  onLoopToggle: () => void;
  onReady: (strokeCount: number) => void;
  onError: () => void;
  onQuizProgress: (strokesDone: number, mistakes: number) => void;
  onQuizComplete: (totalMistakes: number) => void;
  /** page-rendered overlay (slot-machine cycle, prev-char ghost) */
  overlay?: ReactNode;
}

function css(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — no-op */
  }
}

/**
 * Full Hanzi Writer studio canvas: animate / step / quiz modes, auto-play on
 * character change, step-mode stroke reveal, graded quiz with jade/error
 * flashes, shake feedback, haptics, jade completion ring + radical confetti.
 */
const PracticeCanvas = forwardRef<PracticeCanvasHandle, PracticeCanvasProps>(function PracticeCanvas(
  {
    char,
    mode,
    speed,
    loop,
    step,
    gridOn,
    outlineOn,
    reducedMotion,
    lockToggles = false,
    onGridToggle,
    onOutlineToggle,
    onLoopToggle,
    onReady,
    onError,
    onQuizProgress,
    onQuizComplete,
    overlay,
  },
  ref
) {
  const boxRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const readyRef = useRef(false);
  const strokeCountRef = useRef(0);
  const stepShownRef = useRef(0);
  const modeRef = useRef(mode);
  const stepRef = useRef(step);
  const loopRef = useRef(loop);
  const outlineRef = useRef(outlineOn);
  outlineRef.current = outlineOn;
  const cbRef = useRef({ onReady, onError, onQuizProgress, onQuizComplete });
  cbRef.current = { onReady, onError, onQuizProgress, onQuizComplete };
  modeRef.current = mode;
  stepRef.current = step;
  loopRef.current = loop;

  const [size, setSize] = useState(0);
  const [loadState, setLoadState] = useState<CanvasLoadState>("loading");
  const [quizDone, setQuizDone] = useState(false);

  const shakeControls = useAnimationControls();
  const cardControls = useAnimationControls();
  const jadeFlash = useAnimationControls();
  const errorFlash = useAnimationControls();

  const speedEff = reducedMotion ? 1 : speed;

  /* measure the square box */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setSize(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const startQuiz = useCallback(() => {
    const w = writerRef.current;
    if (!w) return;
    setQuizDone(false);
    /* advanced quiz: no faint outline and no character hint while quizzing */
    if (outlineRef.current) {
      w.showOutline({ duration: 0 });
    } else {
      w.hideOutline({ duration: 0 });
      w.hideCharacter({ duration: 0 });
    }
    w.quiz({
      showHintAfterMisses: 3,
      highlightOnComplete: true,
      leniency: 1,
      onMistake: (d) => {
        shakeControls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.3 } });
        errorFlash.start({ opacity: [0, 0.22, 0], transition: { duration: 0.4 } });
        cbRef.current.onQuizProgress(d.strokeNum, d.totalMistakes);
      },
      onCorrectStroke: (d) => {
        buzz(10);
        jadeFlash.start({ opacity: [0, 0.28, 0], transition: { duration: 0.45 } });
        cbRef.current.onQuizProgress(d.strokeNum + 1, d.totalMistakes);
      },
      onComplete: (s) => {
        buzz([10, 50, 20]);
        setQuizDone(true);
        cardControls.start({ scale: [1, 1.015, 1], transition: { duration: 0.6 } });
        cbRef.current.onQuizComplete(s.totalMistakes);
      },
    });
  }, [shakeControls, errorFlash, jadeFlash, cardControls]);

  /** step mode: reveal `target` strokes instantly via quiz positioning (input is blocked by an overlay) */
  const startStepReveal = useCallback((target: number) => {
    const w = writerRef.current;
    if (!w) return;
    const total = strokeCountRef.current;
    const clamped = Math.max(1, Math.min(target, total));
    w.quiz({ quizStartStrokeNum: clamped, highlightOnComplete: false, onComplete: () => {} });
    if (clamped >= total) w.skipQuizStroke(); // start index is clamped to len-1 internally
    stepShownRef.current = clamped;
  }, []);

  const playOnce = useCallback((vermilionPass: boolean, done?: () => void) => {
    const w = writerRef.current;
    if (!w) {
      done?.();
      return;
    }
    const finish = () => {
      if (vermilionPass) {
        w.updateColor("strokeColor", css("--ink", "#26221B"), { duration: 300, onComplete: () => done?.() });
      } else {
        done?.();
      }
    };
    if (vermilionPass) {
      w.updateColor("strokeColor", css("--vermilion", "#C8442C"), {
        duration: 0,
        onComplete: () => {
          w.animateCharacter({ onComplete: finish });
        },
      });
    } else {
      w.animateCharacter({ onComplete: finish });
    }
  }, []);

  const applyMode = useCallback(
    (m: PracticeMode, replay: boolean) => {
      const w = writerRef.current;
      if (!w || !readyRef.current) return;
      if (m === "animate") {
        w.cancelQuiz();
        w.showCharacter();
        if (replay) playOnce(true);
        if (loopRef.current) w.loopCharacterAnimation();
      } else if (m === "step") {
        startStepReveal(stepRef.current);
      } else {
        startQuiz();
      }
    },
    [playOnce, startQuiz, startStepReveal]
  );

  /* create / recreate the writer when the character, size or speed changes */
  useEffect(() => {
    const el = targetRef.current;
    if (!el || size <= 0) return;
    el.innerHTML = "";
    readyRef.current = false;
    stepShownRef.current = 0;
    setQuizDone(false);
    setLoadState("loading");

    const writer = HanziWriter.create(el, char, {
      width: size,
      height: size,
      padding: Math.round(size * 0.06),
      showCharacter: true,
      showOutline: true,
      strokeAnimationSpeed: speedEff,
      delayBetweenStrokes: 300,
      strokeColor: css("--ink", "#26221B"),
      outlineColor: css("--ink-faint", "#9A9182"),
      highlightColor: css("--vermilion", "#C8442C"),
      drawingColor: css("--ink", "#26221B"),
      radicalColor: css("--vermilion", "#C8442C"),
      highlightCompleteColor: css("--jade", "#3E7C5B"),
      charDataLoader: (c, onLoad, onLoadError) => {
        fetch(`${import.meta.env.BASE_URL}hanzidata/${encodeURIComponent(c)}.json`)
          .then((r) => {
            if (!r.ok) throw new Error(`no stroke data for ${c}`);
            return r.json();
          })
          .then((data) => onLoad(data))
          .catch((err) => onLoadError(err));
      },
    });
    writerRef.current = writer;
    let stale = false;
    const isStale = () => stale || writerRef.current !== writer;

    writer
      .getCharacterData()
      .then((data) => {
        if (isStale()) return;
        const count = data && Array.isArray(data.strokes) ? data.strokes.length : 0;
        if (count <= 0) {
          setLoadState("error");
          cbRef.current.onError();
          return;
        }
        strokeCountRef.current = count;
        readyRef.current = true;
        setLoadState("ready");
        cbRef.current.onReady(count);
        /* auto-play the full stroke animation once on every character change */
        playOnce(modeRef.current === "animate", () => {
          if (isStale()) return;
          applyMode(modeRef.current, false);
        });
      })
      .catch(() => {
        if (isStale()) return;
        setLoadState("error");
        cbRef.current.onError();
      });

    return () => {
      stale = true;
      writerRef.current = null;
      el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, size, speedEff]);

  /* react to mode switches without recreating the writer */
  useEffect(() => {
    setQuizDone(false);
    if (readyRef.current) applyMode(mode, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* outline toggle (quiz) — show/hide at runtime; also re-applied after data (re)loads */
  useEffect(() => {
    const w = writerRef.current;
    if (!w || !readyRef.current) return;
    if (outlineOn) {
      w.showOutline();
    } else {
      w.hideOutline();
      if (modeRef.current === "quiz") w.hideCharacter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineOn, loadState]);

  /* loop toggle (animate mode only) */
  useEffect(() => {
    const w = writerRef.current;
    if (!w || !readyRef.current || modeRef.current !== "animate") return;
    if (loop) w.loopCharacterAnimation();
    else w.pauseAnimation();
  }, [loop]);

  /* step-mode reveal changes */
  useEffect(() => {
    const w = writerRef.current;
    if (!w || !readyRef.current || modeRef.current !== "step") return;
    const total = strokeCountRef.current;
    const target = Math.max(1, Math.min(step, total));
    if (target === stepShownRef.current + 1) {
      w.skipQuizStroke();
      w.highlightStroke(target - 1); // vermilion sweep over the freshly revealed stroke
      stepShownRef.current = target;
    } else if (target !== stepShownRef.current) {
      startStepReveal(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useImperativeHandle(
    ref,
    () => ({
      replay: () => {
        if (modeRef.current === "animate") playOnce(true);
      },
      restartQuiz: () => startQuiz(),
      skipStroke: () => {
        const w = writerRef.current;
        if (w && modeRef.current === "quiz" && !quizDone) w.skipQuizStroke();
      },
    }),
    [playOnce, startQuiz, quizDone]
  );

  const loopOn = loop && mode === "animate";

  return (
    <div ref={boxRef} className="relative aspect-square w-full">
      {/* shake wrapper (quiz wrong stroke) */}
      <motion.div animate={shakeControls} className="absolute inset-0">
        <motion.div
          animate={cardControls}
          className="relative h-full w-full overflow-hidden rounded-3xl bg-paper-raised shadow-soft"
        >
          {gridOn && <TianGrid className="absolute inset-0 h-full w-full" strokeWidth={0.8} />}
          <div ref={targetRef} className="absolute inset-0" />

          {/* tian-grid shimmer skeleton while stroke data loads */}
          {loadState === "loading" && (
            <motion.div
              aria-hidden="true"
              animate={{ opacity: [0.05, 0.12, 0.05] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 z-10"
            >
              <TianGrid className="h-full w-full" strokeWidth={1.4} />
            </motion.div>
          )}

          {/* step mode: block pointer input so the reveal-only quiz is never graded */}
          {mode === "step" && <div aria-hidden="true" className="absolute inset-0 z-10" />}

          {/* quiz feedback flashes */}
          <motion.div
            aria-hidden="true"
            animate={jadeFlash}
            initial={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 bg-jade"
          />
          <motion.div
            aria-hidden="true"
            animate={errorFlash}
            initial={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 bg-error"
          />

          {/* page overlay (slot-machine cycle, prev-char ghost) */}
          {overlay && <div className="pointer-events-none absolute inset-0 z-20">{overlay}</div>}

          {/* quiz completion: jade ring draws around the canvas + radical confetti */}
          {quizDone && (
            <>
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-1.5 z-30 h-[calc(100%+12px)] w-[calc(100%+12px)]"
              >
                <motion.path
                  d="M 8 1 H 92 Q 99 1 99 8 V 92 Q 99 99 92 99 H 8 Q 1 99 1 92 V 8 Q 1 1 8 1 Z"
                  fill="none"
                  stroke="var(--jade)"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </svg>
              {!reducedMotion && <RadicalConfetti />}
            </>
          )}

          {/* corner controls */}
          {!lockToggles && (
            <div className="absolute left-3 top-3 z-40 flex flex-col gap-2">
              <button
                type="button"
                aria-label="Toggle grid"
                aria-pressed={gridOn}
                onClick={onGridToggle}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                  gridOn
                    ? "border-vermilion/40 bg-vermilion/10 text-vermilion"
                    : "border-grid-line bg-paper text-ink-faint"
                }`}
              >
                <Grid2x2 size={18} />
              </button>
              {mode === "quiz" && (
                <button
                  type="button"
                  aria-label="Toggle character outline"
                  aria-pressed={outlineOn}
                  onClick={onOutlineToggle}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                    outlineOn
                      ? "border-wash-blue/40 bg-wash-blue/10 text-wash-blue"
                      : "border-jade/50 bg-jade/10 text-jade"
                  }`}
                >
                  {outlineOn ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              )}
            </div>
          )}
          {mode === "animate" && !lockToggles && (
            <div className="absolute right-3 top-3 z-40">
              <button
                type="button"
                aria-label="Toggle animation loop"
                aria-pressed={loopOn}
                onClick={onLoopToggle}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                  loopOn
                    ? "border-vermilion/40 bg-vermilion/10 text-vermilion"
                    : "border-grid-line bg-paper text-ink-faint"
                }`}
              >
                <Repeat size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
});

export default PracticeCanvas;
