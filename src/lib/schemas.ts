import { z } from "zod";
import type { GenerationTarget } from "@/lib/types";

export const songSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
});

export const songSchema = z.object({
  id: z.string().min(1),
  artistId: z.string().min(1).optional(),
  artistName: z.string().min(1).optional(),
  title: z.string().min(1),
  key: z.string().min(1).nullable(),
  bpm: z.number().int().min(30).max(240).nullable(),
  timeSignature: z.string().min(1).nullable(),
  sections: z.record(z.string(), z.array(z.string())),
  sources: z.array(songSourceSchema).optional(),
  verificationNote: z.string().optional(),
  sourceName: z.string().min(1).optional(),
  sourceUrl: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  verified: z.boolean(),
  demo: z.boolean().optional(),
});

export const artistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  demo: z.boolean().optional(),
  songs: z.array(songSchema).min(1),
});

export const chordResultSchema = z.object({
  key: z.string().min(1),
  bpm: z.number().int().min(30).max(240),
  timeSignature: z.string().min(1),
  sections: z.record(z.string(), z.array(z.string())),
}).superRefine((value, context) => {
  const entries = Object.entries(value.sections);
  const nonEmptySections = entries.filter(([, chords]) => chords.length > 0);
  const verse = entries.find(([name]) => /^verse$/iu.test(name))?.[1] ?? [];
  const chorus = entries.find(([name]) => /^chorus$/iu.test(name))?.[1] ?? [];

  if (nonEmptySections.length < 3) {
    context.addIssue({ code: "custom", path: ["sections"], message: "코드는 최소 3개 이상의 구간이 필요합니다." });
  }
  if (verse.length === 0) {
    context.addIssue({ code: "custom", path: ["sections", "verse"], message: "Verse 코드가 필요합니다." });
  }
  if (chorus.length === 0) {
    context.addIssue({ code: "custom", path: ["sections", "chorus"], message: "Chorus 코드가 필요합니다." });
  }
});

const sectionHeaderPattern = /^\s*\[[^\]]+\]\s*$/u;

function lyricLineCount(text: string): number {
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0 && !sectionHeaderPattern.test(line))
    .length;
}

function hasRequiredLyricSections(text: string): boolean {
  return /\[Verse(?:\s*\d+)?\]/iu.test(text) && /\[Chorus\]/iu.test(text) && /\[Final\s+Chorus\]/iu.test(text);
}

const lyricA = z.string().min(180)
  .refine(hasRequiredLyricSections, "A안에는 [Verse], [Chorus], [Final Chorus] 구간명이 필요합니다.")
  .refine(
    (text) => {
      const count = lyricLineCount(text);
      return count >= 24 && count <= 28;
    },
    "A안은 구간명을 제외한 실제 가사 24~28줄이어야 합니다.",
  );

const lyricB = z.string().min(140)
  .refine(hasRequiredLyricSections, "B안에는 [Verse], [Chorus], [Final Chorus] 구간명이 필요합니다.")
  .refine(
    (text) => {
      const count = lyricLineCount(text);
      return count >= 20 && count <= 24;
    },
    "B안은 구간명을 제외한 실제 가사 20~24줄이어야 합니다.",
  );

const lyricsSchema = z.object({
  a: lyricA,
  b: lyricB,
});

const legacyLyricsSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
});

function uniqueStrings(values: string[]): boolean {
  return new Set(values.map((value) => value.trim().toLocaleLowerCase())).size === values.length;
}

const titlesSchema = z.array(z.string().min(1).max(40)).length(3)
  .refine(uniqueStrings, "제목 3개는 서로 달라야 합니다.");

const hashtagsSchema = z.array(z.string().regex(/^#[^\s#]+$/u, "해시태그는 #으로 시작하고 공백이 없어야 합니다.")).length(8)
  .refine(uniqueStrings, "해시태그 8개는 서로 달라야 합니다.");

export const lyricBlueprintSchema = z.object({
  storyPremise: z.string().min(20).max(240),
  openingScene: z.string().min(15).max(180),
  speakerGoal: z.string().min(10).max(160),
  emotionalArc: z.array(z.string().min(5).max(100)).min(4).max(6),
  chorusHookIntent: z.string().min(10).max(160),
  finalResolution: z.string().min(10).max(160),
  tempoFeel: z.string().min(8).max(100),
  harmonicMotion: z.string().min(8).max(140),
  vocalEnergy: z.string().min(8).max(140),
  concreteWordPalette: z.array(z.string().min(1).max(30)).min(6).max(12),
  avoidList: z.array(z.string().min(1).max(40)).min(8).max(16),
});

export const songPlanSchema = z.object({
  chords: chordResultSchema,
  sunoStyle: z.string().min(180).max(1200),
  sunoStyleKorean: z.string().min(100).max(1600),
  lyricBlueprint: lyricBlueprintSchema,
});

export const lyricsResultSchema = z.object({
  lyrics: lyricsSchema,
});

export const lyricPublicationPackageSchema = z.object({
  lyrics: lyricsSchema,
  titles: titlesSchema,
  titlesEnglish: titlesSchema,
  hashtags: hashtagsSchema,
});

export const styleResultSchema = z.object({
  sunoStyle: z.string().min(180).max(1200),
  sunoStyleKorean: z.string().min(100).max(1600),
});

export const titlesResultSchema = z.object({
  titles: titlesSchema,
  titlesEnglish: titlesSchema,
});

export const hashtagsResultSchema = z.object({
  hashtags: hashtagsSchema,
});

export const chordsResultSchema = z.object({
  chords: chordResultSchema,
});

export const generationResultSchema = z.object({
  chords: chordResultSchema,
  sunoStyle: z.string().min(180).max(1200),
  sunoStyleKorean: z.string().min(100).max(1600),
  lyrics: lyricsSchema,
  titles: titlesSchema,
  titlesEnglish: titlesSchema,
  hashtags: hashtagsSchema,
});

export const existingGenerationResultSchema = z.object({
  chords: z.object({
    key: z.string().min(1),
    bpm: z.number().int().min(30).max(240),
    timeSignature: z.string().min(1),
    sections: z.record(z.string(), z.array(z.string())),
  }),
  sunoStyle: z.string().min(1),
  sunoStyleKorean: z.string().min(1),
  lyrics: legacyLyricsSchema,
  titles: z.array(z.string().min(1)).length(3),
  titlesEnglish: z.array(z.string().min(1)).length(3),
  hashtags: z.array(z.string().min(1)).length(8),
});

export const generateRequestSchema = z.object({
  artist: artistSchema,
  song: songSchema,
  target: z.enum(["all", "chords", "style", "lyrics", "titles", "hashtags"]),
  existing: existingGenerationResultSchema.optional(),
}).superRefine((value, context) => {
  if (value.target !== "all" && !value.existing) {
    context.addIssue({
      code: "custom",
      path: ["existing"],
      message: "부분 재생성에는 기존 결과가 필요합니다.",
    });
  }
});

export function parseTargetResult(target: GenerationTarget, value: unknown): Record<string, unknown> {
  if (target === "all") return generationResultSchema.parse(value);
  if (target === "chords") return chordsResultSchema.parse(value);
  if (target === "style") return styleResultSchema.parse(value);
  if (target === "lyrics") return lyricsResultSchema.parse(value);
  if (target === "titles") return titlesResultSchema.parse(value);
  return hashtagsResultSchema.parse(value);
}
