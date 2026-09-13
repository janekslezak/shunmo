import { useEffect, useState } from "react";

interface ProgressRingProps {
  /** 0..1 progress */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** ring color: jade for HSK-1, gold for HSK-2 */
  tone?: "jade" | "gold" | "vermilion";
  className?: string;
  /** center content (e.g. percentage) */
  children?: React.ReactNode;
}

const TONE_COLOR: Record<NonNullable<ProgressRingProps["tone"]>, string> = {
  jade: "var(--jade)",
  gold: "var(--gold)",
  vermilion: "var(--vermilion)",
};

/** SVG progress ring, animates strokeDashoffset from empty to value on mount. */
export default function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  tone = "jade",
  className = "",
  children,
}: ProgressRingProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setAnimated(value);
      return;
    }
    const raf = requestAnimationFrame(() => setAnimated(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, animated));

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--grid-line)"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_COLOR[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
