import hsk1Raw from "./hsk1.json";
import hsk2Raw from "./hsk2.json";
import charactersRaw from "./characters.json";
import dialoguesRaw from "./dialogues.json";
import factsRaw from "./facts.json";

export interface Word {
  word: string;
  /** pinyin with tone marks */
  pinyin: string;
  /** concise English gloss */
  gloss: string;
  level: 1 | 2;
}

export interface Character {
  char: string;
  pinyin: string;
  gloss: string;
  level: 1 | 2;
  /** best-effort radical ("" when unknown) */
  radical: string;
  /** matches hanzi-writer-data medians length */
  strokeCount: number;
}

export interface DialogueLineData {
  speaker: "A" | "B";
  zh: string;
  pinyin: string;
  en: string;
}

export interface Dialogue {
  id: string;
  title: string;
  titleZh: string;
  level: 1 | 2;
  lines: DialogueLineData[];
}

export interface Fact {
  char: string;
  /** 1-3 sentences on etymology / character type */
  origin: string;
  /** 1-3 sentences cultural note */
  culture: string;
  examples?: string[];
}

export const hsk1: Word[] = hsk1Raw as Word[];
export const hsk2: Word[] = hsk2Raw as Word[];
export const words: Word[] = [...hsk1, ...hsk2];
export const characters: Character[] = charactersRaw as Character[];
export const dialogues: Dialogue[] = dialoguesRaw as Dialogue[];
export const facts: Fact[] = factsRaw as Fact[];

const charIndex = new Map(characters.map((c) => [c.char, c]));

export function getCharacter(char: string): Character | undefined {
  return charIndex.get(char);
}

export function getWordsForChar(char: string): Word[] {
  return words.filter((w) => w.word.includes(char));
}

export function getFactForChar(char: string): Fact | undefined {
  return facts.find((f) => f.char === char);
}
