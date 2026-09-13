import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Search, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { words, type Word } from "@/data";
import { Chip } from "@/components/Chip";
import TianGrid from "@/components/TianGrid";
import { usePinyin } from "@/hooks/usePinyin";
import { useProgress } from "@/hooks/useProgress";
import WordRow from "@/components/words/WordRow";
import {
  matchesQuery,
  stripTones,
  totalStrokes,
  wordStatus,
  type SortMode,
  type StatusFilter,
  type WordStatus,
} from "@/components/words/wordUtils";

type LevelFilter = "all" | 1 | 2;

const PAGE_SIZE = 60;

type ListItem =
  | { type: "header"; key: string; label: string; count: number; tone: "jade" | "gold" }
  | { type: "row"; key: string; word: Word; status: WordStatus };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function Words() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLevel: LevelFilter =
    searchParams.get("level") === "hsk1" ? 1 : searchParams.get("level") === "hsk2" ? 2 : "all";

  const [level, setLevel] = useState<LevelFilter>(initialLevel);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("freq");
  const [query, setQuery] = useState("");
  const debouncedQuery = stripTones(useDebounced(query, 150).trim());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { mastered } = useProgress();
  const { showPinyin } = usePinyin();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const items = useMemo<ListItem[]>(() => {
    let list = words.filter((w) => level === "all" || w.level === level);
    if (status !== "all") list = list.filter((w) => wordStatus(w.word, mastered) === status);
    if (debouncedQuery !== "") list = list.filter((w) => matchesQuery(w, debouncedQuery));
    if (sort === "strokes") {
      list = [...list].sort((a, b) => totalStrokes(a.word) - totalStrokes(b.word));
    }

    const result: ListItem[] = [];
    const groupByLevel = level === "all" && sort === "freq";
    let lastLevel: 1 | 2 | null = null;
    let groupCount = 0;
    const flushHeader = (lvl: 1 | 2, count: number, insertAt: number) => {
      result.splice(insertAt, 0, {
        type: "header",
        key: `h${lvl}`,
        label: `HSK-${lvl} — ${count} words`,
        count,
        tone: lvl === 1 ? "jade" : "gold",
      });
    };
    let groupStart = 0;
    for (const w of list) {
      if (groupByLevel && w.level !== lastLevel) {
        if (lastLevel !== null) flushHeader(lastLevel, groupCount, groupStart);
        lastLevel = w.level;
        groupCount = 0;
        groupStart = result.length;
      }
      groupCount += 1;
      result.push({ type: "row", key: w.word, word: w, status: wordStatus(w.word, mastered) });
    }
    if (groupByLevel && lastLevel !== null) flushHeader(lastLevel, groupCount, groupStart);
    return result;
  }, [level, status, sort, debouncedQuery, mastered]);

  const rowCount = useMemo(() => items.filter((i) => i.type === "row").length, [items]);

  // reset the lazy window whenever the result set changes (adjust-state-during-render pattern)
  const filterKey = `${level}|${status}|${sort}|${debouncedQuery}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  // lazy chunks: grow the rendered window as the sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, visibleCount]);

  const visible = items.slice(0, visibleCount);
  let rowIndex = -1;

  const openWord = (w: Word) => navigate(`/words/${encodeURIComponent(w.word)}`);

  return (
    <div className="pt-5">
      {/* Search */}
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex h-12 items-center gap-2.5 rounded-[14px] bg-paper-raised px-4 shadow-soft">
          <Search size={18} className="shrink-0 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 汉字, pinyin or English…"
            aria-label="Search words"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {query !== "" && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-grid-line/50 text-ink-soft active:scale-95"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="mt-1.5 h-4 px-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={rowCount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="block text-[12px] font-bold text-ink-faint"
            >
              {rowCount === words.length ? `${words.length} words` : `${rowCount} matches`}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Filter row */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 py-2"
      >
        {(
          [
            { node: <Chip label="All" selected={level === "all"} onClick={() => setLevel("all")} />, key: "lvl-all" },
            { node: <Chip label="HSK-1" tone="jade" selected={level === 1} onClick={() => setLevel(1)} />, key: "lvl-1" },
            { node: <Chip label="HSK-2" tone="gold" selected={level === 2} onClick={() => setLevel(2)} />, key: "lvl-2" },
            { node: <span className="h-6 w-px shrink-0 bg-grid-line" />, key: "div" },
            { node: <Chip label="All" selected={status === "all"} onClick={() => setStatus("all")} />, key: "st-all" },
            { node: <Chip label="Mastered" tone="jade" selected={status === "mastered"} onClick={() => setStatus("mastered")} />, key: "st-m" },
            { node: <Chip label="Learning" tone="gold" selected={status === "learning"} onClick={() => setStatus("learning")} />, key: "st-l" },
            { node: <Chip label="New" selected={status === "new"} onClick={() => setStatus("new")} />, key: "st-n" },
            { node: <span className="h-6 w-px shrink-0 bg-grid-line" />, key: "div2" },
            {
              node: (
                <button
                  type="button"
                  onClick={() => setSort((s) => (s === "freq" ? "strokes" : "freq"))}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-grid-line bg-transparent px-4 text-[13px] font-bold uppercase tracking-[0.04em] text-ink-soft transition-all active:scale-95"
                >
                  <ArrowUpDown size={13} />
                  {sort === "freq" ? "Frequency" : "Strokes"}
                </button>
              ),
              key: "sort",
            },
          ]
        ).map((c) => (
          <motion.div
            key={c.key}
            variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
            className="shrink-0"
          >
            {c.node}
          </motion.div>
        ))}
      </motion.div>

      {/* Word list */}
      <div className="mt-2 space-y-2">
        {visible.map((item) => {
          if (item.type === "header") {
            return (
              <div
                key={item.key}
                className="sticky z-20 -mx-5 flex items-center justify-between bg-paper/90 px-5 py-2 backdrop-blur-sm"
                style={{ top: "calc(56px + env(safe-area-inset-top))" }}
              >
                <span className="font-display text-[16px] font-semibold text-ink">{item.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                    item.tone === "jade" ? "bg-jade/10 text-jade" : "bg-gold/10 text-gold"
                  }`}
                >
                  {item.count}
                </span>
              </div>
            );
          }
          rowIndex += 1;
          return (
            <WordRow
              key={item.key}
              word={item.word}
              status={item.status}
              showPinyin={showPinyin}
              index={rowIndex}
              onOpen={openWord}
            />
          );
        })}

        {rowCount === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <span className="relative h-20 w-20 overflow-hidden rounded-2xl border border-grid-line/60">
              <TianGrid className="absolute inset-0 h-full w-full" />
              <span className="absolute inset-0 flex items-center justify-center font-brush text-4xl text-ink-faint">
                无
              </span>
            </span>
            <p className="text-[14px] font-bold text-ink-soft">No words match your search</p>
          </div>
        )}

        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      </div>

      {/* List footer ornament */}
      {rowCount > 0 && visibleCount >= items.length && (
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.4 }}
          whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
          viewport={{ amount: 0.95, once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-2 py-10"
        >
          <span className="relative h-8 w-8 overflow-hidden rounded-md border border-grid-line/60">
            <TianGrid className="absolute inset-0 h-full w-full" strokeWidth={1.2} />
          </span>
          <p className="font-brush text-[18px] text-ink-faint">
            {words.length} words · 温故而知新
          </p>
        </motion.div>
      )}
    </div>
  );
}
