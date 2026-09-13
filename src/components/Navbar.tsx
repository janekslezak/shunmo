import { useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Moon, Sun } from "lucide-react";
import SealLogo from "./SealLogo";
import { usePinyin } from "@/hooks/usePinyin";
import { useProgress } from "@/hooks/useProgress";
import { useAppSettings, updateSettings } from "@/components/settings/settings";

const TITLES: Array<[RegExp, string]> = [
  [/^\/practice/, "Practice"],
  [/^\/dialogues\/[^/]+/, "Dialogue"],
  [/^\/dialogues/, "Dialogues"],
  [/^\/words\/[^/]+/, "Character"],
  [/^\/words/, "Words"],
  [/^\/settings/, "Settings"],
];

function titleFor(pathname: string): string {
  for (const [re, t] of TITLES) if (re.test(pathname)) return t;
  return "Shunmo";
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Quick light/dark toggle: light ⇄ dark; from auto, jump to the opposite of the effective theme. */
function ThemeToggle() {
  const { theme } = useAppSettings();
  const effectiveDark = theme === "dark" || (theme === "auto" && systemPrefersDark());

  const toggle = () => {
    if (theme === "light") updateSettings({ theme: "dark" });
    else if (theme === "dark") updateSettings({ theme: "light" });
    else updateSettings({ theme: effectiveDark ? "light" : "dark" });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={effectiveDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors active:bg-ink/5"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={effectiveDark ? "sun" : "moon"}
          initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex"
        >
          {effectiveDark ? <Sun size={19} /> : <Moon size={19} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/** TOP APP BAR — 56px + safe-area-top, blurred paper bg, sticky in normal flow. */
export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { showPinyin, togglePinyin } = usePinyin();
  const { streak, streakExtendedToday } = useProgress();

  return (
    <header className="sticky top-0 z-50 border-b border-grid-line/50 bg-paper/85 pt-safe backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[480px] items-center justify-between px-5">
        {isHome ? (
          <div className="flex items-center gap-2.5">
            <motion.div
              initial={{ scale: 1.6, rotate: -8 }}
              animate={{ scale: 1, rotate: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <SealLogo size={30} />
            </motion.div>
            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-baseline gap-1.5 font-display text-[18px] font-bold text-ink"
            >
              Shunmo
              <span className="font-brush text-[15px] font-normal text-ink-soft">顺墨</span>
            </motion.span>
          </div>
        ) : (
          <h1 className="font-display text-[18px] font-bold text-ink">{titleFor(pathname)}</h1>
        )}

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={togglePinyin}
            aria-pressed={showPinyin}
            aria-label="Toggle pinyin"
            className={`mx-1 flex h-8 items-center rounded-full border px-3 text-[14px] font-extrabold transition-all active:scale-95 ${
              showPinyin
                ? "border-wash-blue bg-wash-blue text-paper-raised"
                : "border-ink-faint/50 bg-transparent text-ink-faint"
            }`}
          >
            拼
          </button>
          <motion.div
            animate={streakExtendedToday ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.4 }}
            className="flex h-8 items-center gap-1 rounded-full bg-gold/10 px-3"
            aria-label={`Streak: ${streak.count} days`}
          >
            <Flame size={15} className="fill-gold text-gold" />
            <span className="text-[14px] font-extrabold text-gold">{streak.count}</span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
