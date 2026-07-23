import type { GeneratedPayload } from "@/lib/types";

const STORAGE_KEY = "youtubemusic:history:v1";
const MAX_ITEMS = 20;

export function loadHistory(): GeneratedPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GeneratedPayload[]).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: GeneratedPayload[]): GeneratedPayload[] {
  const next = items.slice(0, MAX_ITEMS);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function prependHistory(item: GeneratedPayload, current: GeneratedPayload[]): GeneratedPayload[] {
  return saveHistory([item, ...current.filter((entry) => entry.id !== item.id)]);
}

export function removeHistory(id: string, current: GeneratedPayload[]): GeneratedPayload[] {
  return saveHistory(current.filter((entry) => entry.id !== id));
}

export function clearHistory(): GeneratedPayload[] {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  return [];
}
