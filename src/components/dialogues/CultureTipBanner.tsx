import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessagesSquare, RefreshCw } from "lucide-react";

const TIPS: string[] = [
  "你好吗？ is textbook — native speakers more often say 最近怎么样？",
  "When handing over money or a business card, use both hands — it shows respect.",
  "吃了吗？ (“Have you eaten?”) is a classic casual greeting — no invitation intended.",
  "Saying 谢谢 too often to close friends can feel distant — among friends, actions speak.",
];

/** Slim FactCard-style banner with a rotating speaking-etiquette tip. */
export default function CultureTipBanner() {
  const [idx, setIdx] = useState(0);
  const tip = TIPS[idx % TIPS.length];

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="mt-5 rounded-2xl border-l-[3px] border-gold bg-paper-raised p-4 shadow-soft"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
          <MessagesSquare size={16} className="text-gold" />
          Speaking tip
        </span>
        <button
          type="button"
          onClick={() => setIdx((i) => (i + 1) % TIPS.length)}
          className="flex h-8 items-center gap-1.5 rounded-full bg-gold/10 px-3 text-[12px] font-bold text-gold transition-colors hover:bg-gold/20 active:scale-95"
        >
          <RefreshCw size={12} /> Another tip
        </button>
      </div>
      <div className="relative mt-2 min-h-[40px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[14px] leading-6 text-ink-soft"
          >
            {tip}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
