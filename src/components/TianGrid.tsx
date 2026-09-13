interface TianGridProps {
  size?: number | string;
  className?: string;
  /** stroke color override (defaults to grid-line) */
  color?: string;
  strokeWidth?: number;
}

/** Reusable 田字格 (four-quadrant writing grid) SVG background: hairline cross + dashed diagonals. */
export default function TianGrid({
  size = "100%",
  className = "",
  color = "var(--grid-line)",
  strokeWidth = 1,
}: TianGridProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <rect x="1" y="1" width="98" height="98" fill="none" stroke={color} strokeWidth={strokeWidth * 1.6} />
      <line x1="50" y1="1" x2="50" y2="99" stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 3" />
      <line x1="1" y1="50" x2="99" y2="50" stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 3" />
      <line x1="1" y1="1" x2="99" y2="99" stroke={color} strokeWidth={strokeWidth * 0.7} strokeDasharray="3 4" opacity="0.6" />
      <line x1="99" y1="1" x2="1" y2="99" stroke={color} strokeWidth={strokeWidth * 0.7} strokeDasharray="3 4" opacity="0.6" />
    </svg>
  );
}
