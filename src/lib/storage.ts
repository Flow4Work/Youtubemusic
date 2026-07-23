import type { GeneratedPayload } from "@/lib/types";

const STORAGE_KEY = "youtubemusic:history:v1";
const MAX_ITEMS = 20;

function normalizeHistoryItem(value: unknown): GeneratedPayload | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<GeneratedPayload> & Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.artistId !== "string" ||
    typeof item.artistName !== "string" ||
    typeof item.songId !== "string" ||
    typeof item.songTitle !== "string" ||
    typeof item.sunoStyle !== "string" ||
    !item.chords ||
    !item.lyrics ||
    !Array.isArray(item.titles) ||
    !Array.isArray(item.hashtags)
  ) return null;

  const koreanStyle = typeof item.sunoStyleKorean === "string"
    ? item.sunoStyleKorean
    : "한국어 뜻은 새로 생성한 결과부터 표시됩니다.";
  const englishTitles = Array.isArray(item.titlesEnglish) && item.titlesEnglish.length === 3
    ? item.titlesEnglish.map(String)
    : item.titles.map(String);

  return {
    ...(item as GeneratedPayload),
    sunoStyleKorean: koreanStyle,
    titlesEnglish: englishTitles,
  };
}

export function loadHistory(): GeneratedPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHistoryItem).filter((item): item is GeneratedPayload => Boolean(item)).slice(0, MAX_ITEMS);
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
