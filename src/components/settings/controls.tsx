import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Grouped paper card with a Chinese section seal header. */
export function SettingsCard({
  seal,
  title,
  children,
}: {
  /** seal glyph, e.g. 学 */
  seal: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[20px] bg-paper-raised shadow-soft">
      <header className="flex items-center gap-2.5 border-b border-grid-line/60 px-5 py-3.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-vermilion/10 font-brush text-[16px] text-vermilion">
          {seal}
        </span>
        <h2 className="font-display text-[16px] font-semibold text-ink">{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

/** 56px settings row: label left (+ optional caption), control right, hairline divider. */
export function SettingsRow({
  label,
  caption,
  children,
  onClick,
  destructive = false,
}: {
  label: string;
  caption?: string;
  children?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[15px] font-bold ${destructive ? "text-error" : "text-ink"}`}
        >
          {label}
        </span>
        {caption && <span className="mt-0.5 block text-[12px] text-ink-faint">{caption}</span>}
      </span>
      {children}
    </>
  );
  const cls =
    "flex min-h-14 w-full items-center gap-3 border-b border-grid-line/50 px-5 py-2.5 text-left last:border-b-0";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} transition-colors active:bg-paper`}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/** iOS-style switch, vermilion when on, spring knob. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-vermilion" : "bg-grid-line"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="absolute top-[2px] h-7 w-7 rounded-full bg-paper-raised shadow-soft"
      />
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** Segmented control with a sliding pill (layoutId per instance id). */
export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  /** unique id so the layoutId pill doesn't clash across instances */
  id: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex shrink-0 items-center rounded-full border border-grid-line/70 bg-paper p-1"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`relative h-8 rounded-full px-3 text-[13px] font-bold transition-colors ${
              selected ? "text-paper-raised" : "text-ink-soft"
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`segmented-${id}`}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="absolute inset-0 rounded-full bg-vermilion"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
