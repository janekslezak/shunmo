import { dialogues, getCharacter } from "@/data";
import type { Dialogue } from "@/data";

/** max characters per dialogue drill */
export const DRILL_CAP = 12;

/**
 * Drill character set for a dialogue: unique characters from its lines that
 * exist in the character index (HSK 1-2 only — punctuation and unknown glyphs
 * are excluded), in order of first appearance, capped at `cap`.
 */
export function getDrillChars(dialogue: Dialogue, cap = DRILL_CAP): string[] {
  const out: string[] = [];
  for (const line of dialogue.lines) {
    for (const ch of line.zh) {
      if (out.includes(ch)) continue;
      if (!getCharacter(ch)) continue;
      out.push(ch);
      if (out.length >= cap) return out;
    }
  }
  return out;
}

/** Fisher–Yates shuffled copy (used for the stage-2 test order) */
export function shuffleDrillChars(chars: string[]): string[] {
  const out = [...chars];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getDialogue(id: string | null | undefined): Dialogue | undefined {
  if (!id) return undefined;
  return dialogues.find((d) => d.id === id);
}

/** next dialogue (library order) with a non-empty drill set, or null */
export function getNextDrillDialogue(afterId: string): Dialogue | null {
  const i = dialogues.findIndex((d) => d.id === afterId);
  for (let j = i + 1; j < dialogues.length; j += 1) {
    if (getDrillChars(dialogues[j]).length > 0) return dialogues[j];
  }
  return null;
}
