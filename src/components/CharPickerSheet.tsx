import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Dices, X } from "lucide-react";
import { characters } from "@/data";
import type { Character } from "@/data";
import type { LevelFilter } from "@/components/Chip";
import { LevelSegmentedFilter } from "@/components/Chip";
import TianGrid from "@/components/TianGrid";
import { usePinyin } from "@/hooks/usePinyin";
import { useProgress } from "@/hooks/useProgress";

interface CharPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (char: string) => void;
  /** random pick within the sheet's current level filter */
  onRandom: (level: LevelFilter) => void;
  currentChar: string;
  initialFilter: LevelFilter;
}

type Row =
  | { kind: "header"; key: string; label: string; tone: "jade" | "gold" }
  | { kind: "tiles"; key: string; items: Character[]; rowIndex: number };

/** lowercase, strip tone marks, ü → v */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ü/g, "v");
}

function matches(c: Character, q: string): boolean {
  if (!q) return true;
  const nq = norm(q);
  const py = norm(c.pinyin);
  return (
    c.char.includes(q) ||
    py.includes(nq) ||
    py.replace(/v/g, "u").includes(nq) ||
    c.gloss.toLowerCase().includes(nq)
  );
}

const ROWS_PER_CHUNK = 10; // 10 rows = 40 tiles per lazy chunk

/** Full-height (85vh) bottom sheet: search + HSK filter + lazy grid of character tiles. */
export default function CharPickerSheet({
  open,
  onClose,
  onSelect,
  onRandom,
  currentChar,
  initialFilter,
}: CharPickerSheetProps) {
  const { showPinyin } = usePinyin();
  const { isMastered } = useProgress();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LevelFilter>(initialFilter);
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_CHUNK);
  const [picked, setPicked] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pickTimer = useRef<number | null>(null);

  /* reset state each time the sheet opens */
  useEffect(() => {
    if (open) {
      setQuery("");
      setFilter(initialFilter);
      setVisibleRows(ROWS_PER_CHUNK);
      setPicked(null);
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [open, initialFilter]);

  /* lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(
    () => () => {
      if (pickTimer.current !== null) window.clearTimeout(pickTimer.current);
    },
    []
  );

  const rows = useMemo<Row[]>(() => {
    const q = query.trim();
    const pool = characters.filter(
      (c) => (filter === "all" || c.level === filter) && matches(c, q)
    );
    const out: Row[] = [];
    let rowIndex = 0;
    const pushTiles = (items: Character[]) => {
      for (let i = 0; i < items.length; i += 4) {
        out.push({ kind: "tiles", key: `r${rowIndex}-${items[i].char}`, items: items.slice(i, i + 4), rowIndex });
        rowIndex += 1;
      }
    };
    if (filter === "all" && !q) {
      const l1 = pool.filter((c) => c.level === 1);
      const l2 = pool.filter((c) => c.level === 2);
      out.push({ kind: "header", key: "h1", label: `HSK-1 · ${l1.length} characters`, tone: "jade" });
      pushTiles(l1);
      out.push({ kind: "header", key: "h2", label: `HSK-2 · ${l2.length} characters`, tone: "gold" });
      pushTiles(l2);
    } else {
      pushTiles(pool);
    }
    return out;
  }, [query, filter]);

  const totalChars = useMemo(
    () => rows.reduce((n, r) => n + (r.kind === "tiles" ? r.items.length : 0), 0),
    [rows]
  );

  /* lazy rendering: grow visible rows when the sentinel enters view */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !open) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleRows((v) => v + ROWS_PER_CHUNK);
        }
      },
      { root: scrollRef.current, rootMargin: "400px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [open, rows.length]);

  const shown = rows.slice(0, visibleRows);
  const hasMore = visibleRows < rows.length;

  const pick = (char: string) => {
    if (picked) return;
    setPicked(char);
    pickTimer.current = window.setTimeout(() => onSelect(char), 220);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Choose a character">
          {/* scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink"
          />
          {/* sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-x-0 bottom-0 mx-auto flex h-[85dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-paper-raised shadow-lift"
          >
            {/* drag handle */}
            <div className="flex justify-center pb-1 pt-2.5">
              <div className="h-1.5 w-11 rounded-full bg-grid-line" />
            </div>

            {/* header */}
            <div className="space-y-3 px-5 pb-3 pt-1">
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleRows(ROWS_PER_CHUNK);
                    scrollRef.current?.scrollTo({ top: 0 });
                  }}
                  placeholder="Search hanzi, pinyin or English…"
                  aria-label="Search characters"
                  className="h-12 w-full rounded-2xl border border-grid-line bg-paper pl-11 pr-10 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-vermilion/60"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-grid-line/60 text-ink-soft"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <LevelSegmentedFilter
                  value={filter}
                  onChange={(v) => {
                    setFilter(v);
                    setVisibleRows(ROWS_PER_CHUNK);
                    scrollRef.current?.scrollTo({ top: 0 });
                  }}
                />
                <button
                  type="button"
                  onClick={() => onRandom(filter)}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-vermilion transition-colors hover:bg-vermilion/10 active:scale-95"
                >
                  <Dices size={15} />
                  Random pick
                </button>
              </div>
            </div>

            {/* body: lazy grid */}
            <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              {totalChars === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="relative h-20 w-20">
                    <TianGrid className="h-full w-full" />
                    <span className="font-brush absolute inset-0 flex items-center justify-center text-4xl text-ink-faint">
                      ？
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-ink-soft">No characters match “{query}”</p>
                </div>
              ) : (
                <>
                  {shown.map((row) =>
                    row.kind === "header" ? (
                      <div
                        key={row.key}
                        className={`sticky top-0 z-10 -mx-1 bg-paper-raised/95 px-1 pb-2 pt-3 text-[12px] font-extrabold uppercase tracking-[0.06em] backdrop-blur-sm ${
                          row.tone === "jade" ? "text-jade" : "text-gold"
                        }`}
                      >
                        {row.label}
                      </div>
                    ) : (
                      <div key={row.key} className="grid grid-cols-4 gap-2 pb-2">
                        {row.items.map((c, i) => {
                          const mastered = isMastered(c.char);
                          const isCurrent = c.char === currentChar;
                          const isPicked = c.char === picked;
                          return (
                            <motion.button
                              key={c.char}
                              type="button"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.25,
                                delay: Math.min(row.rowIndex * 0.02 + i * 0.005, 0.3),
                              }}
                              onClick={() => pick(c.char)}
                              aria-label={`${c.char} ${c.pinyin} — ${c.gloss}`}
                              className={`relative flex flex-col items-center rounded-xl border pb-1 pt-0 transition-colors active:scale-95 ${
                                isCurrent
                                  ? "border-vermilion/60 bg-vermilion/5"
                                  : "border-grid-line/70 bg-paper hover:border-vermilion/40"
                              }`}
                            >
                              <span className="relative flex h-[68px] w-full items-center justify-center">
                                <TianGrid className="absolute inset-1.5 h-[calc(100%-12px)] w-[calc(100%-12px)] opacity-70" strokeWidth={0.8} />
                                <span className="font-cjk relative text-[26px] leading-none text-ink">{c.char}</span>
                                {mastered && (
                                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-jade" aria-label="mastered" />
                                )}
                                {isPicked && (
                                  <motion.span
                                    initial={{ opacity: 0.9, scale: 0.85 }}
                                    animate={{ opacity: 0, scale: 1.15 }}
                                    transition={{ duration: 0.22 }}
                                    className="absolute inset-0 rounded-lg border-2 border-vermilion"
                                  />
                                )}
                              </span>
                              <span
                                className={`block h-3.5 w-full truncate px-1 text-center text-[10px] leading-[14px] text-ink-faint transition-opacity ${
                                  showPinyin ? "opacity-100" : "opacity-0"
                                }`}
                              >
                                {c.pinyin}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )
                  )}
                  {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
