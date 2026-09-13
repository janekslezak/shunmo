import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Fact } from "@/data";

interface FactCardProps {
  fact: Fact;
  className?: string;
  /** start expanded */
  defaultOpen?: boolean;
}

/** "Origin & Culture" card: gold left border, Fraunces title, expandable with accordion spring. */
export default function FactCard({ fact, className = "", defaultOpen = false }: FactCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`overflow-hidden rounded-2xl border-l-[3px] border-gold bg-paper-raised shadow-soft ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 font-brush text-2xl text-gold">
          {fact.char}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] font-semibold text-ink">
            Origin &amp; Culture — {fact.char}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-soft">{fact.origin}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
          <ChevronDown size={18} className="text-ink-faint" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="space-y-3 px-5 pb-5 text-[14px] leading-relaxed text-ink-soft">
              <p>
                <span className="font-bold text-ink">Origin. </span>
                {fact.origin}
              </p>
              <p>
                <span className="font-bold text-ink">Culture. </span>
                {fact.culture}
              </p>
              {fact.examples && fact.examples.length > 0 && (
                <ul className="space-y-1 border-t border-grid-line/60 pt-2">
                  {fact.examples.map((ex) => (
                    <li key={ex} className="text-[13px] text-ink-soft">
                      {ex}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
