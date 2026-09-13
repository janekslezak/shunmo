import { words, getCharacter } from "@/data";

export interface Segment {
  text: string;
  /** gloss info when the segment is a known word/character */
  pinyin?: string;
  gloss?: string;
}

/** Known multi-char words, longest first, for greedy segmentation. */
const VOCAB: { text: string; pinyin: string; gloss: string }[] = (() => {
  const seen = new Set<string>();
  const list: { text: string; pinyin: string; gloss: string }[] = [];
  for (const w of words) {
    if (w.word.length < 2 || seen.has(w.word)) continue;
    seen.add(w.word);
    list.push({ text: w.word, pinyin: w.pinyin, gloss: w.gloss });
  }
  return list.sort((a, b) => b.text.length - a.text.length);
})();

const CJK = /[一-鿿]/;

function isCjk(ch: string): boolean {
  return CJK.test(ch);
}

/**
 * Greedy longest-match segmentation of a hanzi line into tappable words.
 * Punctuation / latin runs pass through as plain (non-glossed) segments.
 * Unknown single hanzi fall back to the character dictionary gloss.
 */
export function segmentLine(zh: string): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  while (i < zh.length) {
    const ch = zh[i];
    if (!isCjk(ch)) {
      // merge consecutive non-CJK into one plain segment
      let j = i + 1;
      while (j < zh.length && !isCjk(zh[j])) j++;
      segs.push({ text: zh.slice(i, j) });
      i = j;
      continue;
    }
    const rest = zh.slice(i);
    const hit = VOCAB.find((v) => rest.startsWith(v.text));
    if (hit) {
      segs.push({ text: hit.text, pinyin: hit.pinyin, gloss: hit.gloss });
      i += hit.text.length;
      continue;
    }
    const c = getCharacter(ch);
    segs.push(c ? { text: ch, pinyin: c.pinyin, gloss: c.gloss } : { text: ch });
    i += 1;
  }
  return segs;
}
