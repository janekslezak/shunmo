export type LevelFilter = "all" | 1 | 2;

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  /** accent color: vermilion (default), jade (HSK-1), gold (HSK-2) */
  tone?: "vermilion" | "jade" | "gold";
}

const TONE_CLASSES: Record<NonNullable<ChipProps["tone"]>, { on: string; off: string }> = {
  vermilion: {
    on: "bg-vermilion text-paper-raised border-vermilion",
    off: "bg-transparent text-ink-soft border-grid-line hover:border-vermilion/50",
  },
  jade: {
    on: "bg-jade text-paper-raised border-jade",
    off: "bg-transparent text-jade border-jade/40 hover:bg-jade/10",
  },
  gold: {
    on: "bg-gold text-paper-raised border-gold",
    off: "bg-transparent text-gold border-gold/40 hover:bg-gold/10",
  },
};

/** Pill chip — selected = filled, unselected = outline. */
export function Chip({ label, selected, onClick, tone = "vermilion" }: ChipProps) {
  const toneCls = TONE_CLASSES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-[13px] font-bold uppercase tracking-[0.04em] transition-all active:scale-95 ${
        selected ? toneCls.on : toneCls.off
      }`}
    >
      {label}
    </button>
  );
}

interface LevelSegmentedFilterProps {
  value: LevelFilter;
  onChange: (v: LevelFilter) => void;
  className?: string;
}

/** Segmented filter: All / HSK-1 (jade) / HSK-2 (gold). */
export function LevelSegmentedFilter({ value, onChange, className = "" }: LevelSegmentedFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="tablist" aria-label="HSK level filter">
      <Chip label="All" selected={value === "all"} onClick={() => onChange("all")} />
      <Chip label="HSK-1" tone="jade" selected={value === 1} onClick={() => onChange(1)} />
      <Chip label="HSK-2" tone="gold" selected={value === 2} onClick={() => onChange(2)} />
    </div>
  );
}

export default Chip;
