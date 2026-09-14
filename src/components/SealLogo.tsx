interface SealLogoProps {
  size?: number;
  className?: string;
}

/** Vermilion rounded-square seal stamp with white carved 顺墨 (Shunmo) glyphs, stacked vertically. */
export default function SealLogo({ size = 34, className = "" }: SealLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-[22%] bg-vermilion shadow-soft ${className}`}
      style={{ width: size, height: size }}
      aria-label="Shunmo 顺墨 seal logo"
      role="img"
    >
      {/* carved inner border */}
      <div className="absolute inset-[6%] rounded-[18%] border border-white/50" />
      <span
        className="flex flex-col items-center font-brush leading-[1.02] text-paper-raised"
        style={{ fontSize: size * 0.36, transform: "translateY(-2%)" }}
      >
        <span>顺</span>
        <span>墨</span>
      </span>
    </div>
  );
}
