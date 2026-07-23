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
});

const sectionHeaderPattern = /^\s*\[[^\]]+\]\s*$/u;

function lyricLineCount(text: string): number {
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0 && !sectionHeaderPattern.test(line))
    .length;
}

function hasRequiredLyricSections(text: string): boolean {
  return /\[Verse(?:\s*\d+)?\]/iu.test(text) && /\[(?:Final\s+)?Chorus\]/iu.test(text);
}

const lyricA = z.string().min(180)
  .refine(hasRequiredLyricSections, "A안에는 [Verse]와 [Chorus] 구간명이 필요합니다.")
  .refine(
    (text) => {
      const count = lyricLineCount(text);
      return count >= 24 && count <= 30;
    },
    "A안은 구간명을 제외한 실제 가사 24~30줄이어야 합니다.",
  );

const lyricB = z.string().min(140)
  .refine(hasRequiredLyricSections, "B안에는 [Verse]와 [Chorus] 구간명이 필요합니다.")
  .refine(
    (text) => {
      const count = lyricLineCount(text);
      return count >= 20 && count <= 26;
    },
    "B안은 구간명을 제외한 실제 가사 20~26줄이어야 합니다.",
  );

export const lyricsResultSchema = z.object({
  lyrics: z.object({
    a: lyricA,
    b: lyricB,
  }),
});

export const styleResultSchema = z.object({
  sunoStyle: z.string().min(20),
  sunoStyleKorean: z.string().min(20),
});

export const titlesResultSchema = z.object({
  titles: z.array(z.string().min(1)).length(3),
  titlesEnglish: z.array(z.string().min(1)).length(3),
});

export const hashtagsResultSchema = z.object({
  hashtags: z.array(z.string().min(1)).length(8),
});

export const chordsResultSchema = z.object({
  chords: chordResultSchema,
});

export const generationResultSchema = z.object({
  chords: chordResultSchema,
  sunoStyle: z.string().min(20),
  sunoStyleKorean: z.string().min(20),
  lyrics: z.object({
    a: lyricA,
    b: lyricB,
  }),
  titles: z.array(z.string().min(1)).length(3),
  titlesEnglish: z.array(z.string().min(1)).length(3),
  hashtags: z.array(z.string().min(1)).length(8),
});

export const generateRequestSchema = z.object({
  artist: artistSchema,
  song: songSchema,
  target: z.enum(["all", "chords", "style", "lyrics", "titles", "hashtags"]),
  existing: generationResultSchema.optional(),
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
