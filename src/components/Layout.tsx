import { Outlet, useLocation } from "react-router";
import { motion } from "framer-motion";
import { Github } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import InstallPrompt from "./InstallPrompt";

const TAB_ORDER = ["/", "/practice", "/review", "/dialogues", "/words"];

function tabIndex(pathname: string): number {
  const i = TAB_ORDER.findIndex((t) => (t === "/" ? pathname === "/" : pathname.startsWith(t)));
  return i === -1 ? 0 : i;
}

/**
 * App shell: sticky top app bar + content slot (<Outlet/>) + fixed bottom tab bar.
 * Content column is max-width 480px centered; decorative calligraphy strips appear ≥1024px.
 */
export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="paper-texture min-h-[100dvh] overflow-x-clip bg-paper">
      {/* desktop side panels (decorative, ≥1024px) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-0 z-0 hidden w-[calc((100vw-480px)/2)] lg:block"
      >
        <img
          src="/calligraphy-strip.png"
          alt=""
          className="h-full w-full object-cover opacity-[0.35] [mask-image:linear-gradient(to_right,transparent,black_60%)]"
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-[calc((100vw-480px)/2)] lg:block"
      >
        <img
          src="/calligraphy-strip.png"
          alt=""
          className="h-full w-full -scale-x-100 object-cover opacity-[0.35] [mask-image:linear-gradient(to_left,transparent,black_60%)]"
        />
      </div>

      <Navbar />

      <motion.main
        key={pathname}
        initial={{ x: 12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.22 }}
        data-tab={tabIndex(pathname)}
        className="relative z-10 mx-auto w-full max-w-[480px] px-5 pb-6"
      >
        <Outlet />
      </motion.main>

      {/* slim credit strip — sits above the fixed tab bar, clears it + safe-area */}
      <footer className="relative z-10 mx-auto w-full max-w-[480px] border-t border-grid-line/50 px-5 pb-[calc(64px+env(safe-area-inset-bottom)+12px)] pt-3">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-ink-faint">
          <span>
            This site is powered by{" "}
            <a
              href="https://www.netlify.com/"
              target="_blank"
              rel="noopener"
              className="font-semibold text-vermilion hover:underline"
            >
              Netlify
            </a>
            .
          </span>
          <a
            href="https://github.com/janekslezak/shunmo"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-semibold text-ink-faint transition-colors hover:text-ink"
            aria-label="Shunmo on GitHub"
          >
            <Github size={13} />
            GitHub
          </a>
          <a
            href="https://github.com/janekslezak/shunmo/blob/main/CODE_OF_CONDUCT.md"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-semibold text-ink-faint transition-colors hover:text-ink"
          >
            Code of Conduct
          </a>
        </p>
      </footer>

      <Footer />
      <InstallPrompt />
    </div>
  );
}
