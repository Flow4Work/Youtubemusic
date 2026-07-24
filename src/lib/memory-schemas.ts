import { z } from "zod";
import { MEMORY_STYLES, getMemoryTopic, isMemoryStyle } from "@/lib/memory-song";
import { chordResultSchema, existingGenerationResultSchema } from "@/lib/schemas";
import type { GenerationTarget, MemoryGenerateRequest } from "@/lib/types";

const sectionPattern = /\[(?:Intro|Verse(?:\s*\d+)?|Chorus|Bridge|Outro)\]/iu;
const requiredSections = ["Intro", "Verse", "Chorus", "Bridge", "Outro"] as const;

function hasMemorySections(text: string): boolean {
  return requiredSections.every((section) => new RegExp(`\\[${section}(?:\\s*\\d+)?\\]`, "iu").test(text));
}

const memoryLyric = z.string().min(120).max(16000)
  .refine((text: string) => sectionPattern.test(text), "가사 구간명이 필요합니다.")
  .refine(hasMemorySections, "[Intro], [Verse], [Chorus], [Bridge], [Outro] 구간이 모두 필요합니다.");

const memoryLyricsSchema = z.object({
  a: memoryLyric,
  b: memoryLyric,
});

const memoryTitlesSchema = z.array(z.string().min(2).max(60)).length(3)
  .refine((values: string[]) => new Set(values.map((value: string) => value.trim().toLocaleLowerCase())).size === 3, "제목 3개는 서로 달라야 합니다.");

const memoryHashtagsSchema = z.array(z.string().regex(/^#[^\s#]+$/u)).length(8)
  .refine((values: string[]) => new Set(values.map((value: string) => value.trim().toLocaleLowerCase())).size === 8, "해시태그 8개는 서로 달라야 합니다.");

const memoryStyleSchema = z.string().min(80).max(1000)
  .refine((value: string) => !/\n/u.test(value.trim()), "Suno 스타일은 줄바꿈 없는 한 문단이어야 합니다.");

const memorySequenceSchema = z.array(z.string().min(1)).min(1).max(120);

export const memoryGenerationResultSchema = z.object({
  chords: chordResultSchema,
  sunoStyle: memoryStyleSchema,
  sunoStyleKorean: z.string().min(50).max(1400),
  lyrics: memoryLyricsSchema,
  titles: memoryTitlesSchema,
  titlesEnglish: memoryTitlesSchema,
  hashtags: memoryHashtagsSchema,
});

const memoryFullResponseSchema = memoryGenerationResultSchema.extend({
  memorySequence: memorySequenceSchema,
});

const memoryLyricsResponseSchema = z.object({
  memorySequence: memorySequenceSchema,
  lyrics: memoryLyricsSchema,
});

const memoryChordsResponseSchema = z.object({ chords: chordResultSchema });
const memoryStyleResponseSchema = z.object({
  sunoStyle: memoryStyleSchema,
  sunoStyleKorean: z.string().min(50).max(1400),
});
const memoryTitlesResponseSchema = z.object({
  titles: memoryTitlesSchema,
  titlesEnglish: memoryTitlesSchema,
});
const memoryHashtagsResponseSchema = z.object({ hashtags: memoryHashtagsSchema });

export const memoryGenerateRequestSchema = z.object({
  mode: z.literal("memory"),
  topicId: z.string().min(1).refine((value: string) => Boolean(getMemoryTopic(value)), "존재하지 않는 암기 주제입니다."),
  style: z.string().refine(isMemoryStyle, `음악 스타일은 ${MEMORY_STYLES.join(", ")} 중 하나여야 합니다.`),
  target: z.enum(["all", "chords", "style", "lyrics", "titles", "hashtags"]),
  existing: existingGenerationResultSchema.optional(),
}).superRefine((value, context) => {
  if (value.target !== "all" && !value.existing) {
    context.addIssue({ code: "custom", path: ["existing"], message: "부분 재생성에는 기존 결과가 필요합니다." });
  }
});

function assertExactSequence(actual: string[], expected: readonly string[]): void {
  if (actual.length !== expected.length) {
    throw new Error(`암기 항목 개수가 다릅니다. 필요 ${expected.length}개, 응답 ${actual.length}개`);
  }
  expected.forEach((item, index) => {
    if (actual[index] !== item) {
      throw new Error(`${index + 1}번째 암기 항목이 변경되었습니다. 필요: ${item} / 응답: ${actual[index] ?? "없음"}`);
    }
  });
}

function assertSequenceInLyrics(text: string, items: readonly string[], label: string): void {
  let cursor = 0;
  for (const item of items) {
    const found = text.indexOf(item, cursor);
    if (found === -1) {
      throw new Error(`${label}에서 암기 항목이 누락되거나 순서가 바뀌었습니다: ${item}`);
    }
    cursor = found + item.length;
  }
}

export function parseMemoryTargetResult(
  target: GenerationTarget,
  value: unknown,
  expectedItems: readonly string[],
): Record<string, unknown> {
  if (target === "all") {
    const parsed = memoryFullResponseSchema.parse(value);
    assertExactSequence(parsed.memorySequence, expectedItems);
    assertSequenceInLyrics(parsed.lyrics.a, expectedItems, "A안");
    assertSequenceInLyrics(parsed.lyrics.b, expectedItems, "B안");
    return {
      chords: parsed.chords,
      sunoStyle: parsed.sunoStyle,
      sunoStyleKorean: parsed.sunoStyleKorean,
      lyrics: parsed.lyrics,
      titles: parsed.titles,
      titlesEnglish: parsed.titlesEnglish,
      hashtags: parsed.hashtags,
    };
  }
  if (target === "lyrics") {
    const parsed = memoryLyricsResponseSchema.parse(value);
    assertExactSequence(parsed.memorySequence, expectedItems);
    assertSequenceInLyrics(parsed.lyrics.a, expectedItems, "A안");
    assertSequenceInLyrics(parsed.lyrics.b, expectedItems, "B안");
    return { lyrics: parsed.lyrics };
  }
  if (target === "chords") return memoryChordsResponseSchema.parse(value);
  if (target === "style") return memoryStyleResponseSchema.parse(value);
  if (target === "titles") return memoryTitlesResponseSchema.parse(value);
  return memoryHashtagsResponseSchema.parse(value);
}

export function parseMemoryRequest(value: unknown): MemoryGenerateRequest {
  return memoryGenerateRequestSchema.parse(value) as MemoryGenerateRequest;
}
