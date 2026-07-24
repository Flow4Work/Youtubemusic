export type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  let current = value;

  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) {
      if (current.length === 1) {
        current = current[0];
        continue;
      }

      const records = current.filter(isRecord);
      if (records.length === current.length && records.length > 0) return Object.assign({}, ...records);

      const entries = current.filter(
        (entry): entry is [string, unknown] => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string",
      );
      if (entries.length === current.length && entries.length > 0) return Object.fromEntries(entries);
      return {};
    }

    if (!isRecord(current)) return {};
    const record = current;

    const wrapperKey = ["result", "data", "output", "response"].find(
      (key) => key in record && Object.keys(record).length === 1,
    );
    if (!wrapperKey) return record;
    current = record[wrapperKey];
  }

  return isRecord(current) ? current : {};
}

function firstDefined(record: JsonRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("\n");
  if (isRecord(value)) return Object.values(value).map(toText).filter(Boolean).join("\n");
  return "";
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => toStringArray(item)).filter(Boolean);
  if (isRecord(value)) return Object.values(value).flatMap((item) => toStringArray(item)).filter(Boolean);
  const text = toText(value);
  if (!text) return [];
  return text.split(/\r?\n|\s*\|\s*/u).map((item) => item.trim()).filter(Boolean);
}

function sectionLabel(key: string): string {
  const normalized = key.replace(/[\s_-]+/gu, "").toLocaleLowerCase();
  if (/^intro/u.test(normalized)) return "Intro";
  if (/^verse\d*/u.test(normalized)) {
    const number = normalized.match(/\d+/u)?.[0];
    return number ? `Verse ${number}` : "Verse";
  }
  if (/^chorus\d*/u.test(normalized)) return "Chorus";
  if (/^bridge/u.test(normalized)) return "Bridge";
  if (/^outro/u.test(normalized)) return "Outro";
  return key.trim() || "Verse";
}

function lyricVariant(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("\n");
  if (!isRecord(value)) return toText(value);

  const preferredOrder = ["intro", "verse", "verse1", "verse2", "verse3", "chorus", "bridge", "outro"];
  return Object.entries(value)
    .sort(([left], [right]) => {
      const leftIndex = preferredOrder.indexOf(left.replace(/[\s_-]+/gu, "").toLocaleLowerCase());
      const rightIndex = preferredOrder.indexOf(right.replace(/[\s_-]+/gu, "").toLocaleLowerCase());
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    })
    .map(([key, content]) => {
      const text = toText(content);
      return text ? `[${sectionLabel(key)}]\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeLyrics(value: unknown): JsonRecord {
  if (Array.isArray(value)) return { a: lyricVariant(value[0]), b: lyricVariant(value[1] ?? value[0]) };
  const record = asRecord(value);
  const a = firstDefined(record, ["a", "A", "optionA", "versionA", "lyricsA"]);
  const b = firstDefined(record, ["b", "B", "optionB", "versionB", "lyricsB"]);
  return { a: lyricVariant(a), b: lyricVariant(b ?? a) };
}

function chordSectionKey(key: string): string {
  const normalized = key.replace(/[\s_-]+/gu, "").toLocaleLowerCase();
  if (/^intro/u.test(normalized)) return "intro";
  if (/^verse/u.test(normalized)) return "verse";
  if (/^prechorus/u.test(normalized)) return "preChorus";
  if (/^chorus/u.test(normalized)) return "chorus";
  if (/^bridge/u.test(normalized)) return "bridge";
  if (/^outro/u.test(normalized)) return "outro";
  return key.trim() || "section";
}

function normalizeSections(value: unknown): JsonRecord {
  const record = asRecord(value);
  const sections: Record<string, string[]> = {};

  for (const [key, section] of Object.entries(record)) {
    const canonical = chordSectionKey(key);
    sections[canonical] = [...(sections[canonical] ?? []), ...toStringArray(section)];
  }

  return sections;
}

function normalizeChords(value: unknown): JsonRecord {
  const record = asRecord(value);
  const bpmValue = firstDefined(record, ["bpm", "BPM", "tempo"]);
  const bpm = typeof bpmValue === "number" ? bpmValue : Number.parseInt(String(bpmValue ?? ""), 10);
  return {
    key: toText(firstDefined(record, ["key", "Key", "songKey", "tonality"])),
    bpm,
    timeSignature: toText(firstDefined(record, ["timeSignature", "time_signature", "meter", "beat"])) || "4/4",
    sections: normalizeSections(firstDefined(record, ["sections", "progressions", "chordProgressions"])),
  };
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean);
  const text = toText(value);
  if (!text) return [];
  return text.split(/\r?\n|\s*,\s*/u).map((item) => item.trim()).filter(Boolean);
}

export function normalizeMemoryResponse(value: unknown, expectedItems: readonly string[]): JsonRecord {
  const root = asRecord(value);
  const normalized: JsonRecord = { ...root };

  const chordSource = root.chords ?? (root.sections !== undefined ? root : undefined);
  if (chordSource !== undefined) normalized.chords = normalizeChords(chordSource);

  const lyricSource = root.lyrics ?? (root.a !== undefined || root.b !== undefined ? root : undefined);
  if (lyricSource !== undefined) normalized.lyrics = normalizeLyrics(lyricSource);

  const sequence = normalizeList(firstDefined(root, ["memorySequence", "memory_sequence", "sequence"]));
  normalized.memorySequence = sequence.length > 0 ? sequence : [...expectedItems];

  if (root.titles !== undefined) normalized.titles = normalizeList(root.titles);
  if (root.titlesEnglish !== undefined || root.englishTitles !== undefined) {
    normalized.titlesEnglish = normalizeList(firstDefined(root, ["titlesEnglish", "englishTitles"]));
  }
  if (root.hashtags !== undefined) {
    normalized.hashtags = normalizeList(root.hashtags).map((tag) => tag.startsWith("#") ? tag : `#${tag.replace(/\s+/gu, "")}`);
  }

  if (root.sunoStyle === undefined && root.style !== undefined) normalized.sunoStyle = toText(root.style);
  if (root.sunoStyleKorean === undefined) {
    normalized.sunoStyleKorean = toText(firstDefined(root, ["styleKorean", "koreanStyle", "sunoStyleKr"]));
  }

  return normalized;
}
