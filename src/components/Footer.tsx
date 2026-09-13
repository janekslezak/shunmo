import { NavLink } from "react-router";
import { motion } from "framer-motion";
import { Home, Brush, MessagesSquare, BookOpen } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/practice", label: "Practice", icon: Brush, end: false },
  { to: "/dialogues", label: "Dialogues", icon: MessagesSquare, end: false },
  { to: "/words", label: "Words", icon: BookOpen, end: false },
];

/** BOTTOM TAB BAR — 64px + safe-area-bottom, 4 tabs, active vermilion with sliding indicator. */
export default function Footer() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-grid-line/50 bg-paper/90 pb-safe backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[480px] items-stretch">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={isActive ? "text-vermilion" : "text-ink-faint"}
                />
                <span
                  className={`text-[11px] font-bold ${isActive ? "text-vermilion" : "text-ink-faint"}`}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="absolute -bottom-0 h-1 w-6 rounded-full bg-vermilion"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
