import type { Dialogue } from "@/data";

export type Topic = "Greetings" | "Daily life" | "Food" | "Travel" | "Shopping";

export const TOPICS: Topic[] = ["Greetings", "Daily life", "Food", "Travel", "Shopping"];

/** Topic tag per dialogue id (data ships no topic field). */
const TOPIC_BY_ID: Record<string, Topic> = {
  greetings: "Greetings",
  introductions: "Greetings",
  family: "Greetings",
  hobbies: "Daily life",
  weather: "Daily life",
  "making-plans": "Daily life",
  "seeing-a-doctor": "Daily life",
  "phone-call": "Daily life",
  birthday: "Daily life",
  restaurant: "Food",
  "at-the-cafe": "Food",
  shopping: "Shopping",
  "at-the-market": "Shopping",
  directions: "Travel",
  "time-date": "Travel",
  transport: "Travel",
};

export function topicOf(d: Dialogue): Topic | null {
  return TOPIC_BY_ID[d.id] ?? null;
}

export type TopicTone = "vermilion" | "jade" | "gold" | "wash";

const TONE_BY_TOPIC: Record<Topic, TopicTone> = {
  Greetings: "vermilion",
  "Daily life": "gold",
  Food: "jade",
  Shopping: "gold",
  Travel: "wash",
};

export function toneOf(d: Dialogue): TopicTone {
  const t = topicOf(d);
  return t ? TONE_BY_TOPIC[t] : "jade";
}

export const TONE_TILE: Record<TopicTone, string> = {
  vermilion: "bg-vermilion/10 text-vermilion",
  jade: "bg-jade/10 text-jade",
  gold: "bg-gold/10 text-gold",
  wash: "bg-wash-blue/10 text-wash-blue",
};

const CJK_RE = /[一-鿿]/g;

/** Rough listening estimate at the default 0.85x rate (~4.5 chars/sec). */
export function estimateSeconds(d: Dialogue): number {
  const chars = d.lines.reduce((n, l) => n + (l.zh.match(CJK_RE)?.length ?? 0), 0);
  const sec = Math.round(chars / 4.5 / 5) * 5;
  return Math.max(15, sec);
}
