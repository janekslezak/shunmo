import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, EllipsisVertical, PlusSquare, Share, SquarePlus } from "lucide-react";
import SealLogo from "./SealLogo";
import { promptInstall, useInstallState } from "./settings/settings";

/**
 * First-use install prompt — spring-up bottom sheet (not a full modal).
 * Android/Chromium: native prompt via the captured beforeinstallprompt event
 * (or menu instructions when the browser won't offer one). iOS: Safari
 * Share → Add to Home Screen instructions. Shown once (~1.5s after first
 * load), gated on the `hanziflow:install-prompt` localStorage flag; install
 * help remains available in Settings afterwards.
 */

const FLAG_KEY = "hanziflow:install-prompt";
type Flag = "seen" | "dismissed" | "installed";
const SHOW_DELAY_MS = 1500;

function getFlag(): Flag | null {
  try {
    const v = localStorage.getItem(FLAG_KEY);
    return v === "seen" || v === "dismissed" || v === "installed" ? v : null;
  } catch {
    return "dismissed"; // private mode etc. — never nag
  }
}

function setFlag(flag: Flag): void {
  try {
    localStorage.setItem(FLAG_KEY, flag);
  } catch {
    /* ignore */
  }
}

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

/** Chrome/Firefox/Edge/Opera on iOS — only Safari can install PWAs there. */
function isIOSNonSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /CriOS|FxiOS|EdgiOS|OPiOS|YaApp_iOS/i.test(navigator.userAgent);
}

const IOS_STEPS = [
  { icon: Share, label: "Tap the Share button (square with an arrow up)" },
  { icon: PlusSquare, label: 'Scroll and tap "Add to Home Screen"' },
  { icon: SquarePlus, label: 'Tap "Add"' },
];

export default function InstallPrompt() {
  const install = useInstallState();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const platform: "ios" | "android" | "other" = install.isIOS
    ? "ios"
    : isAndroid()
      ? "android"
      : "other";
  const eligible = !install.installed && platform !== "other" && getFlag() === null;

  // Show once, shortly after first load, so the app can settle first.
  useEffect(() => {
    if (!eligible || visible) return;
    const t = window.setTimeout(() => {
      setVisible(true);
      setFlag("seen");
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [eligible, visible]);

  // When the app actually installs, remember it and dismiss the sheet.
  useEffect(() => {
    const onInstalled = () => {
      setFlag("installed");
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // Already running installed (or became installed) — never show.
  useEffect(() => {
    if (install.installed && visible) setVisible(false);
  }, [install.installed, visible]);

  const dismiss = () => {
    setFlag("dismissed");
    setVisible(false);
  };

  const handleInstall = () => {
    void promptInstall().then((outcome) => {
      if (outcome === "accepted") {
        setFlag("installed");
        setVisible(false);
      }
      // dismissed from the native sheet → keep "seen", don't nag again
    });
  };

  const spring = reduceMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 260, damping: 26 };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Install Shunmo">
          {/* scrim */}
          <motion.button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            className="absolute inset-0 bg-ink/40"
          />
          {/* bottom sheet */}
          <motion.div
            initial={{ y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
            transition={spring}
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px]"
          >
            <div className="rounded-t-3xl border-t border-grid-line/60 bg-paper-raised px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 shadow-lift">
              {/* grab handle */}
              <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-grid-line" />

              <div className="flex items-center gap-3.5">
                <SealLogo size={46} />
                <div>
                  <h2 className="font-display text-[19px] font-bold leading-snug text-ink">
                    Install Shunmo 顺墨
                  </h2>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">
                    Add it to your home screen — works offline, opens like an app.
                  </p>
                </div>
              </div>

              {platform === "android" && install.canInstall && (
                <div className="mt-5 flex items-center gap-2.5">
                  <motion.button
                    type="button"
                    onClick={handleInstall}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[15px] font-extrabold text-paper-raised shadow-soft"
                  >
                    <Download size={18} />
                    Install app
                  </motion.button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="h-12 rounded-[14px] px-4 text-[14px] font-bold text-ink-soft transition-colors hover:text-ink"
                  >
                    Not now
                  </button>
                </div>
              )}

              {platform === "android" && !install.canInstall && (
                <>
                  <p className="mt-4 flex items-start gap-2 rounded-xl border border-grid-line/60 bg-paper px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
                    <EllipsisVertical size={17} className="mt-0.5 shrink-0 text-ink" />
                    <span>
                      Tap <strong className="text-ink">⋮ (browser menu)</strong> →{" "}
                      <strong className="text-ink">Add to Home screen / Install app</strong>.
                    </span>
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={dismiss}
                      className="h-11 rounded-[14px] px-5 text-[14px] font-bold text-ink-soft transition-colors hover:text-ink"
                    >
                      Not now
                    </button>
                  </div>
                </>
              )}

              {platform === "ios" && (
                <>
                  {isIOSNonSafari() && (
                    <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-[13px] font-semibold leading-relaxed text-ink">
                      Open this page in Safari — iOS only allows installing from Safari.
                    </p>
                  )}
                  <ol className="mt-4 space-y-2.5">
                    {IOS_STEPS.map((step, i) => (
                      <li key={step.label} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-grid-line bg-paper text-wash-blue">
                          <step.icon size={17} />
                        </span>
                        <span className="text-[13px] leading-snug text-ink-soft">
                          <strong className="mr-1 font-extrabold text-ink">{i + 1}.</strong>
                          {step.label}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={dismiss}
                      className="h-11 rounded-[14px] px-5 text-[14px] font-bold text-ink-soft transition-colors hover:text-ink"
                    >
                      Got it
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
