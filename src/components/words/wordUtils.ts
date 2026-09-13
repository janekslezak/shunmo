import { characters, type Word } from "@/data";

export type WordStatus = "mastered" | "learning" | "new";
export type StatusFilter = "all" | WordStatus;
export type SortMode = "freq" | "strokes";

const charIndex = new Map(characters.map((c) => [c.char, c]));

/** Remove tone marks/diacritics and lowercase, for tone-less pinyin search. */
export function stripTones(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** The individual hanzi of a word (skips punctuation etc.). */
export function hanziCharsOf(word: string): string[] {
  return Array.from(word).filter((ch) => /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch));
}

/** Derive learning status from the mastered-character set. */
export function wordStatus(word: string, mastered: ReadonlySet<string>): WordStatus {
  const chars = hanziCharsOf(word);
  if (chars.length === 0) return "new";
  const done = chars.filter((c) => mastered.has(c)).length;
  if (done === chars.length) return "mastered";
  if (done > 0) return "learning";
  return "new";
}

/** Total stroke count across the word's characters (fallback 8/char when unknown). */
export function totalStrokes(word: string): number {
  return hanziCharsOf(word).reduce((sum, ch) => sum + (charIndex.get(ch)?.strokeCount ?? 8), 0);
}

/** Does the word match the (already tone-stripped, lowercased) query? */
export function matchesQuery(word: Word, query: string): boolean {
  if (query === "") return true;
  if (word.word.includes(query)) return true;
  if (stripTones(word.pinyin).replace(/\s+/g, "").includes(query.replace(/\s+/g, ""))) return true;
  if (stripTones(word.pinyin).includes(query)) return true;
  return word.gloss.toLowerCase().includes(query);
}
