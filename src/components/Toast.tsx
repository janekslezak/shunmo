import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  /** message to show; null hides the toast */
  message: string | null;
  /** auto-dismiss after ms (default 2500) */
  duration?: number;
  onDismiss?: () => void;
}

/** Bottom-anchored toast (sits above the tab bar): ink background, slides up, auto-dismiss. */
export default function Toast({ message, duration = 2500, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => onDismiss?.(), duration);
    return () => window.clearTimeout(t);
  }, [message, duration, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-6">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="max-w-sm rounded-full bg-ink px-5 py-2.5 text-center text-[14px] font-semibold text-paper shadow-lift"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
