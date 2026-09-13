import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dialogues } from "@/data";
import Chip from "@/components/Chip";
import DialogueCard from "@/components/dialogues/DialogueCard";
import CultureTipBanner from "@/components/dialogues/CultureTipBanner";
import { TOPICS } from "@/components/dialogues/topics";
import { topicOf } from "@/components/dialogues/topics";
import { useDialogueStats } from "@/components/dialogues/useDialogueStats";
import type { Topic } from "@/components/dialogues/topics";

type Filter = "all" | "hsk1" | "hsk2" | Topic;

const FILTERS: { value: Filter; label: string; tone?: "vermilion" | "jade" | "gold" }[] = [
  { value: "all", label: "All" },
  { value: "hsk1", label: "HSK-1", tone: "jade" },
  { value: "hsk2", label: "HSK-2", tone: "gold" },
  ...TOPICS.map((t) => ({ value: t as Filter, label: t })),
];

function matches(filter: Filter, level: 1 | 2, topic: Topic | null): boolean {
  if (filter === "all") return true;
  if (filter === "hsk1") return level === 1;
  if (filter === "hsk2") return level === 2;
  return topic === filter;
}

/** View A — Dialogue Library (/dialogues). */
export default function Dialogues() {
  const [filter, setFilter] = useState<Filter>("all");
  const { stats } = useDialogueStats();

  const visible = useMemo(
    () => dialogues.filter((d) => matches(filter, d.level, topicOf(d))),
    [filter]
  );

  return (
    <div className="pt-6">
      {/* Section 1 — intro block + filter chips */}
      <motion.h2
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="font-display text-[24px] font-bold leading-[30px] text-ink"
      >
        Dialogues
      </motion.h2>
      <p className="mt-1.5 text-[15px] font-semibold text-ink-soft">
        Short real-life conversations. Tap play and follow along.
      </p>

      <div className="-mx-5 mt-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-2 pb-1">
          {FILTERS.map((f, i) => (
            <motion.div
              key={f.value}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.04 * i, ease: "easeOut" }}
            >
              <Chip
                label={f.label}
                tone={f.tone ?? "vermilion"}
                selected={filter === f.value}
                onClick={() => setFilter(f.value)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 2 — dialogue cards */}
      {visible.length > 0 ? (
        <motion.div layout className="mt-4 flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {visible.map((d, i) => (
              <motion.div
                key={d.id}
                layout
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                }}
              >
                <DialogueCard dialogue={d} stat={stats[d.id]} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty state — topic filter with no matches */
        <motion.div
          key="empty"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <img
            src="/empty-dialogues.png"
            alt=""
            className="h-40 w-60 object-contain"
            loading="lazy"
          />
          <p className="mt-4 max-w-[260px] text-[15px] font-semibold text-ink-soft">
            No dialogues here yet — try another topic.
          </p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-4 h-11 rounded-[14px] bg-vermilion px-6 text-[15px] font-extrabold text-paper-raised shadow-soft transition-colors hover:bg-vermilion-deep active:scale-[0.97]"
          >
            Show all
          </button>
        </motion.div>
      )}

      {/* Section 3 — culture note banner */}
      <CultureTipBanner />
    </div>
  );
}
