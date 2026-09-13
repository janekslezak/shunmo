import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import type { StrokeData } from "hanzi-writer";
import { Grid2x2, Repeat } from "lucide-react";
import TianGrid from "./TianGrid";

export type StrokeCanvasMode = "animate" | "quiz" | "reveal";

interface StrokeCanvasProps {
  char: string;
  mode?: StrokeCanvasMode;
  /** stroke animation speed multiplier (default 1) */
  speed?: number;
  /** show tian-zi-ge grid behind the character */
  showGrid?: boolean;
  /** px size of the square canvas */
  size?: number;
  className?: string;
  onMistake?: (strokeData: StrokeData) => void;
  onCorrectStroke?: (strokeData: StrokeData) => void;
  onComplete?: (summary: { totalMistakes: number }) => void;
}

function getCssColor(name: string): string {
  if (typeof window === "undefined") return "#26221B";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Hanzi Writer wrapper. Stroke data is loaded from /hanzidata/<char>.json
 * (precached at runtime by the service worker for offline use).
 */
export default function StrokeCanvas({
  char,
  mode = "reveal",
  speed = 1,
  showGrid = true,
  size = 280,
  className = "",
  onMistake,
  onCorrectStroke,
  onComplete,
}: StrokeCanvasProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const loopRef = useRef(false);
  const [gridOn, setGridOn] = useState(showGrid);
  const [loopOn, setLoopOn] = useState(false);
  const callbacksRef = useRef({ onMistake, onCorrectStroke, onComplete });
  callbacksRef.current = { onMistake, onCorrectStroke, onComplete };

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    el.innerHTML = "";
    loopRef.current = false;

    const writer = HanziWriter.create(el, char, {
      width: size,
      height: size,
      padding: Math.round(size * 0.06),
      showCharacter: mode !== "quiz",
      showOutline: true,
      strokeAnimationSpeed: speed,
      delayBetweenStrokes: 300,
      strokeColor: getCssColor("--ink") || "#26221B",
      outlineColor: getCssColor("--ink-faint") || "#9A9182",
      highlightColor: getCssColor("--vermilion") || "#C8442C",
      drawingColor: getCssColor("--ink") || "#26221B",
      radicalColor: getCssColor("--vermilion") || "#C8442C",
      charDataLoader: (c, onLoad, onError) => {
        fetch(`${import.meta.env.BASE_URL}hanzidata/${encodeURIComponent(c)}.json`)
          .then((r) => {
            if (!r.ok) throw new Error(`no stroke data for ${c}`);
            return r.json();
          })
          .then((data) => onLoad(data))
          .catch((err) => onError(err));
      },
    });
    writerRef.current = writer;

    if (mode === "quiz") {
      writer.quiz({
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onMistake: (d) => callbacksRef.current.onMistake?.(d),
        onCorrectStroke: (d) => callbacksRef.current.onCorrectStroke?.(d),
        onComplete: (s) => callbacksRef.current.onComplete?.(s),
      });
    } else if (mode === "animate") {
      const play = () => {
        if (!loopRef.current) return;
        writer.animateCharacter({
          onComplete: () => {
            if (loopRef.current) window.setTimeout(play, 800);
          },
        });
      };
      loopRef.current = true;
      play();
    }

    return () => {
      loopRef.current = false;
      writerRef.current = null;
      el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, mode, speed, size]);

  const toggleLoop = () => {
    const next = !loopOn;
    setLoopOn(next);
    const writer = writerRef.current;
    if (!writer) return;
    loopRef.current = next;
    if (next) {
      const play = () => {
        if (!loopRef.current) return;
        writer.animateCharacter({
          onComplete: () => {
            if (loopRef.current) window.setTimeout(play, 800);
          },
        });
      };
      play();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-paper-raised shadow-soft ${className}`}
      style={{ width: size, height: size }}
    >
      {gridOn && (
        <TianGrid className="absolute inset-0 h-full w-full" strokeWidth={0.8} />
      )}
      <div ref={targetRef} className="absolute inset-0" />
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          aria-label="Toggle grid"
          onClick={() => setGridOn((v) => !v)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            gridOn ? "border-vermilion/40 bg-vermilion/10 text-vermilion" : "border-grid-line bg-paper text-ink-faint"
          }`}
        >
          <Grid2x2 size={16} />
        </button>
        {mode !== "quiz" && (
          <button
            type="button"
            aria-label="Toggle stroke animation loop"
            onClick={toggleLoop}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              loopOn ? "border-vermilion/40 bg-vermilion/10 text-vermilion" : "border-grid-line bg-paper text-ink-faint"
            }`}
          >
            <Repeat size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
