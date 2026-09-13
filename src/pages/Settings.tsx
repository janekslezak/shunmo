import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Info,
  Plus,
  RefreshCw,
  Share,
  Trash2,
  Volume2,
  WifiOff,
} from "lucide-react";
import { usePinyin } from "@/hooks/usePinyin";
import Toast from "@/components/Toast";
import {
  useAppSettings,
  updateSettings,
  useInstallState,
  promptInstall,
  type ThemeChoice,
} from "@/components/settings/settings";
import { useChineseVoices, speakChinese } from "@/components/settings/speech";
import { SettingsCard, SettingsRow, Toggle, Segmented } from "@/components/settings/controls";

const APP_VERSION = "1.0.0";
const VOICE_SAMPLE = "你好，很高兴认识你。";

/* ------------------------------- Voice sheet ------------------------------ */

function VoiceSheet({
  open,
  onClose,
  voiceURI,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  voiceURI: string | null;
  onSelect: (uri: string | null) => void;
}) {
  const voices = useChineseVoices();
  const settings = useAppSettings();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-ink/40"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[80] mx-auto max-h-[75dvh] w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-paper-raised pb-safe shadow-lift"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-grid-line" />
            <h3 className="px-5 pb-2 pt-3 font-display text-[18px] font-semibold text-ink">
              Chinese voice
            </h3>
            <div className="max-h-[55dvh] overflow-y-auto px-2 pb-4">
              {[
                { uri: null as string | null, name: "Auto (system default)", lang: "zh-CN" },
                ...voices.map((v) => ({ uri: v.voiceURI as string | null, name: v.name, lang: v.lang })),
              ].map((opt) => {
                const selected = opt.uri === voiceURI;
                return (
                  <div
                    key={opt.uri ?? "auto"}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${
                      selected ? "bg-vermilion/5" : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        onSelect(opt.uri);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected ? "border-vermilion bg-vermilion" : "border-grid-line"
                        }`}
                      >
                        {selected && (
                          <motion.svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--paper-raised)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <motion.path
                              d="M4 12.5 9.5 18 20 6.5"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          </motion.svg>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-bold text-ink">
                          {opt.name}
                        </span>
                        <span className="block text-[12px] text-ink-faint">{opt.lang}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Preview ${opt.name}`}
                      onClick={() => {
                        const voice = voices.find((v) => v.voiceURI === opt.uri) ?? null;
                        speakChinese(VOICE_SAMPLE, { voice, rate: settings.speechRate });
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-wash-blue transition-colors active:bg-wash-blue/10"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Theme picker ------------------------------ */

function ThemeThumb({ theme }: { theme: ThemeChoice }) {
  const light = (
    <>
      <rect width="72" height="96" rx="10" fill="#F6F1E5" />
      <rect x="10" y="12" width="52" height="34" rx="6" fill="#FDFBF5" stroke="#D9CFBB" />
      <rect x="16" y="18" width="12" height="12" rx="3" fill="#C8442C" />
      <rect x="32" y="20" width="24" height="4" rx="2" fill="#26221B" opacity="0.7" />
      <rect x="32" y="28" width="18" height="4" rx="2" fill="#9A9182" />
      <rect x="10" y="54" width="52" height="6" rx="3" fill="#26221B" opacity="0.25" />
      <rect x="10" y="66" width="40" height="6" rx="3" fill="#26221B" opacity="0.15" />
      <rect x="10" y="80" width="34" height="8" rx="4" fill="#C8442C" />
    </>
  );
  const dark = (
    <>
      <rect width="72" height="96" rx="10" fill="#17150F" />
      <rect x="10" y="12" width="52" height="34" rx="6" fill="#211E17" stroke="#3A352A" />
      <rect x="16" y="18" width="12" height="12" rx="3" fill="#D9573F" />
      <rect x="32" y="20" width="24" height="4" rx="2" fill="#EDE6D6" opacity="0.8" />
      <rect x="32" y="28" width="18" height="4" rx="2" fill="#6E675A" />
      <rect x="10" y="54" width="52" height="6" rx="3" fill="#EDE6D6" opacity="0.25" />
      <rect x="10" y="66" width="40" height="6" rx="3" fill="#EDE6D6" opacity="0.15" />
      <rect x="10" y="80" width="34" height="8" rx="4" fill="#D9573F" />
    </>
  );
  return (
    <svg width="72" height="96" viewBox="0 0 72 96" aria-hidden="true">
      {theme === "light" && light}
      {theme === "dark" && dark}
      {theme === "auto" && (
        <>
          <defs>
            <clipPath id="auto-left">
              <rect width="36" height="96" />
            </clipPath>
            <clipPath id="auto-right">
              <rect x="36" width="36" height="96" />
            </clipPath>
          </defs>
          <g clipPath="url(#auto-left)">{light}</g>
          <g clipPath="url(#auto-right)">{dark}</g>
        </>
      )}
    </svg>
  );
}

const THEME_OPTIONS: Array<{ value: ThemeChoice; label: string }> = [
  { value: "light", label: "Rice Paper" },
  { value: "dark", label: "Ink Night" },
  { value: "auto", label: "Auto" },
];

function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeChoice;
  onChange: (t: ThemeChoice) => void;
}) {
  return (
    <div className="flex justify-between gap-3 px-5 py-4">
      {THEME_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className="flex flex-col items-center gap-2"
          >
            <span className="relative rounded-[12px]">
              <ThemeThumb theme={opt.value} />
              {selected && (
                <motion.span
                  layoutId="theme-ring"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="pointer-events-none absolute -inset-1 rounded-[14px] border-2 border-vermilion"
                />
              )}
              {selected && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-jade text-paper-raised">
                  <Check size={12} strokeWidth={3.5} />
                </span>
              )}
            </span>
            <span
              className={`text-[12px] font-bold ${selected ? "text-vermilion" : "text-ink-soft"}`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- App section ------------------------------ */

type SwStatus = "checking" | "ready" | "updating" | "unavailable";

async function readSwStatus(): Promise<SwStatus> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return "unavailable";
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return "unavailable";
    if (reg.installing || reg.waiting) return "updating";
    return reg.active ? "ready" : "unavailable";
  } catch {
    return "unavailable";
  }
}

function useServiceWorkerStatus(): { status: SwStatus; refresh: () => void } {
  const [status, setStatus] = useState<SwStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    void readSwStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = () => {
    setStatus("checking");
    const update =
      typeof navigator !== "undefined" && "serviceWorker" in navigator
        ? navigator.serviceWorker
            .getRegistration()
            .then((reg) => reg?.update())
            .catch(() => undefined)
        : Promise.resolve();
    void update.then(() => readSwStatus()).then(setStatus);
  };

  return { status, refresh };
}

/* --------------------------------- page ----------------------------------- */

const cardVariants = {
  hidden: { y: 16, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Settings() {
  const settings = useAppSettings();
  const { showPinyin, setShowPinyin } = usePinyin();
  const voices = useChineseVoices();
  const install = useInstallState();
  const sw = useServiceWorkerStatus();

  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sampleTimer = useRef<number | null>(null);

  const currentVoiceName =
    voices.find((v) => v.voiceURI === settings.voiceURI)?.name ?? "Auto (system default)";

  const onRateChange = (rate: number) => {
    updateSettings({ speechRate: rate });
    if (sampleTimer.current) window.clearTimeout(sampleTimer.current);
    sampleTimer.current = window.setTimeout(() => {
      speakChinese("你好", { rate });
    }, 400);
  };

  const eraseProgress = () => {
    try {
      localStorage.removeItem("hanziflow:mastered");
      localStorage.removeItem("hanziflow:streak");
      localStorage.removeItem("hanziflow:continue");
    } catch {
      /* ignore */
    }
    setResetOpen(false);
    setToast("Progress erased");
    window.setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div className="space-y-5 pt-5">
      {/* Learning */}
      <motion.div variants={cardVariants} custom={0} initial="hidden" animate="show">
        <SettingsCard seal="学" title="Learning">
          <SettingsRow label="Show pinyin" caption="Master toggle (same as the 拼 chip)">
            <Toggle checked={showPinyin} onChange={setShowPinyin} label="Show pinyin" />
          </SettingsRow>
          <SettingsRow label="Default level" caption="Pre-filters picker & daily character">
            <Segmented
              id="level"
              ariaLabel="Default HSK level"
              value={settings.defaultLevel === "all" ? "all" : String(settings.defaultLevel)}
              onChange={(v) => updateSettings({ defaultLevel: v === "all" ? "all" : (Number(v) as 1 | 2) })}
              options={[
                { value: "all", label: "Both" },
                { value: "1", label: "HSK-1" },
                { value: "2", label: "HSK-2" },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Stroke animation speed">
            <Segmented
              id="speed"
              ariaLabel="Stroke animation speed"
              value={String(settings.strokeSpeed)}
              onChange={(v) => updateSettings({ strokeSpeed: Number(v) as 0.5 | 1 | 2 })}
              options={[
                { value: "0.5", label: "0.5×" },
                { value: "1", label: "1×" },
                { value: "2", label: "2×" },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Quiz hints" caption="Auto-hint after 3 mistakes">
            <Toggle
              checked={settings.quizHints}
              onChange={(v) => updateSettings({ quizHints: v })}
              label="Quiz hints"
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      {/* Voice & Audio */}
      <motion.div variants={cardVariants} custom={1} initial="hidden" animate="show">
        <SettingsCard seal="音" title="Voice & Audio">
          {voices.length === 0 ? (
            <div className="border-b border-grid-line/50 px-5 py-4">
              <div className="flex items-start gap-2.5">
                <Info size={18} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <p className="text-[15px] font-bold text-gold">No Chinese voice on this device</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                    iOS: Settings → Accessibility → Spoken Content → Voices → Chinese.
                    Android: install Google TTS voice data in Language &amp; input settings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <SettingsRow
              label="Chinese voice"
              caption={currentVoiceName}
              onClick={() => setVoiceSheetOpen(true)}
            >
              <ChevronRight size={18} className="shrink-0 text-ink-faint" />
            </SettingsRow>
          )}
          <div className="border-b border-grid-line/50 px-5 py-3 last:border-b-0">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Speech rate</span>
              <span className="rounded-full bg-wash-blue/10 px-2.5 py-0.5 text-[13px] font-extrabold text-wash-blue">
                {settings.speechRate.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.0}
              step={0.05}
              value={settings.speechRate}
              aria-label="Speech rate"
              onChange={(e) => onRateChange(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer accent-vermilion"
            />
            <div className="flex justify-between text-[11px] font-bold text-ink-faint">
              <span>0.6</span>
              <span>0.8</span>
              <span>1.0</span>
            </div>
          </div>
          <SettingsRow label="Auto-play strokes" caption="Animate when a character loads in Practice">
            <Toggle
              checked={settings.autoplayStrokes}
              onChange={(v) => updateSettings({ autoplayStrokes: v })}
              label="Auto-play strokes"
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={cardVariants} custom={2} initial="hidden" animate="show">
        <SettingsCard seal="观" title="Appearance">
          <div className="border-b border-grid-line/50">
            <p className="px-5 pt-3 text-[15px] font-bold text-ink">Theme</p>
            <ThemePicker value={settings.theme} onChange={(t) => updateSettings({ theme: t })} />
          </div>
          <SettingsRow label="Tian-zi-ge grid" caption="Guide grid on practice canvases">
            <Toggle
              checked={settings.showGrid}
              onChange={(v) => updateSettings({ showGrid: v })}
              label="Tian-zi-ge grid"
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      {/* App */}
      <motion.div variants={cardVariants} custom={3} initial="hidden" animate="show">
        <SettingsCard seal="用" title="App">
          {/* Install */}
          {install.installed ? (
            <SettingsRow label="Install app" caption="Installed on your home screen">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-jade/10 text-jade">
                <Check size={16} strokeWidth={3} />
              </span>
            </SettingsRow>
          ) : install.canInstall ? (
            <div className="border-b border-grid-line/50 px-5 py-3.5">
              <motion.button
                type="button"
                onClick={() => {
                  void promptInstall().then((outcome) => {
                    if (outcome === "accepted") setToast("Installing Shunmo…");
                  });
                }}
                animate={{ boxShadow: ["0 0 0 0 rgba(200,68,44,0.2)", "0 0 14px 2px rgba(200,68,44,0.25)", "0 0 0 0 rgba(200,68,44,0.2)"] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-vermilion text-[15px] font-extrabold text-paper-raised active:scale-[0.98]"
              >
                <Download size={18} />
                Add to Home Screen
              </motion.button>
            </div>
          ) : (
            <div className="border-b border-grid-line/50 px-5 py-4">
              <p className="text-[15px] font-bold text-ink">Install app</p>
              {install.isIOS ? (
                <>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                    In Safari: Share → Add to Home Screen.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {[
                      { icon: Share, label: "Share" },
                      { icon: Plus, label: "Add to Home Screen" },
                      { icon: Check, label: "Add" },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-2">
                        {i > 0 && <ChevronRight size={14} className="text-ink-faint" />}
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-grid-line bg-paper text-wash-blue">
                            <step.icon size={18} />
                          </span>
                          <span className="max-w-[72px] text-center text-[10px] font-bold leading-tight text-ink-soft">
                            {step.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  Use your browser menu → “Add to Home screen” to install Shunmo for offline use.
                </p>
              )}
            </div>
          )}

          {/* Offline data */}
          <SettingsRow
            label="Offline data"
            caption={
              sw.status === "ready"
                ? "Ready offline · app shell cached"
                : sw.status === "updating"
                  ? "Downloading update…"
                  : sw.status === "checking"
                    ? "Checking cache…"
                    : "Offline cache unavailable"
            }
          >
            <span className="flex items-center gap-2">
              {sw.status === "ready" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-jade/10 text-jade">
                  <Check size={16} strokeWidth={3} />
                </span>
              ) : (
                <WifiOff size={16} className="text-ink-faint" />
              )}
              <button
                type="button"
                onClick={() => {
                  sw.refresh();
                  setToast("Checking for updates…");
                }}
                className="flex h-9 items-center gap-1.5 rounded-full border border-grid-line px-3 text-[12px] font-bold text-ink-soft transition-colors active:bg-paper"
              >
                <RefreshCw size={13} />
                Re-download
              </button>
            </span>
          </SettingsRow>

          {/* Reset progress */}
          <SettingsRow
            label="Reset progress"
            caption="Erase practice history and streaks"
            destructive
            onClick={() => setResetOpen(true)}
          >
            <Trash2 size={18} className="shrink-0 text-error" />
          </SettingsRow>

          {/* About */}
          <div>
            <SettingsRow
              label="About Shunmo 顺墨"
              caption={`Version ${APP_VERSION}`}
              onClick={() => setAboutOpen((v) => !v)}
            >
              <motion.span animate={{ rotate: aboutOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
                <ChevronDown size={18} className="text-ink-faint" />
              </motion.span>
            </SettingsRow>
            <AnimatePresence initial={false}>
              {aboutOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-5 pb-5 text-[13px] leading-relaxed text-ink-soft">
                    <p>
                      Stroke animations: <span className="font-bold text-ink">Hanzi Writer</span> (MIT license).
                      Stroke data: <span className="font-bold text-ink">hanzi-writer-data</span>, from the
                      Make&nbsp;Me&nbsp;a&nbsp;Hanzi project (Arphic Public License). Audio: your device's speech
                      engine.
                    </p>
                    <div className="flex items-center gap-3 border-t border-grid-line/60 pt-3">
                      <img src={`${import.meta.env.BASE_URL}logo-seal.svg`} alt="Shunmo 顺墨 seal" className="h-9 w-9" />
                      <div>
                        <p className="font-display text-[15px] font-bold text-ink">
                          Shunmo <span className="font-brush text-[14px] font-normal text-ink-soft">顺墨</span>
                          <span className="ml-2 text-[12px] font-semibold text-ink-faint">Smooth ink, steady strokes</span>
                        </p>
                        <motion.p
                          initial={{ clipPath: "inset(0 100% 0 0)" }}
                          animate={{ clipPath: "inset(0 0% 0 0)" }}
                          transition={{ duration: 0.6 }}
                          className="font-brush text-[16px] text-ink-faint"
                        >
                          温故而知新
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SettingsCard>
      </motion.div>

      {/* Voice picker sheet */}
      <VoiceSheet
        open={voiceSheetOpen}
        onClose={() => setVoiceSheetOpen(false)}
        voiceURI={settings.voiceURI}
        onSelect={(uri) => {
          updateSettings({ voiceURI: uri });
        }}
      />

      {/* Reset confirmation dialog */}
      <AnimatePresence>
        {resetOpen && (
          <>
            <motion.div
              key="reset-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetOpen(false)}
              className="fixed inset-0 z-[70] bg-ink/50"
            />
            <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center px-8">
              <motion.div
                key="reset-dialog"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="pointer-events-auto w-full max-w-[320px] rounded-[20px] bg-paper-raised p-6 shadow-lift"
                role="alertdialog"
                aria-label="Reset progress"
              >
                <h3 className="font-display text-[18px] font-semibold text-ink">Reset progress?</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                  Erase all practice history and streaks? This cannot be undone.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetOpen(false)}
                    className="h-11 flex-1 rounded-[14px] border border-grid-line text-[14px] font-bold text-ink-soft active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={eraseProgress}
                    className="h-11 flex-1 rounded-[14px] bg-vermilion-deep text-[14px] font-extrabold text-paper-raised active:scale-[0.98]"
                  >
                    Erase
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
