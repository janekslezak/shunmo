interface SealLogoProps {
  size?: number;
  className?: string;
}

/** Vermilion rounded-square seal stamp with a white carved 墨 (ink) glyph, slight -3° rotation. */
export default function SealLogo({ size = 34, className = "" }: SealLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-[22%] bg-vermilion shadow-soft ${className}`}
      style={{ width: size, height: size, transform: "rotate(-3deg)" }}
      aria-label="Shunmo 顺墨 seal logo"
      role="img"
    >
      {/* carved inner border */}
      <div className="absolute inset-[6%] rounded-[18%] border border-white/50" />
      <span
        className="font-brush leading-none text-paper-raised"
        style={{ fontSize: size * 0.62, transform: "translateY(-4%)" }}
      >
        墨
      </span>
    </div>
  );
}
