import { NextResponse } from "next/server";
import type { z } from "zod";
import { createMockResult } from "@/lib/mock";
import { buildGenerationPrompt } from "@/lib/prompt";
import {
  buildLyricBlueprintPrompt,
  buildLyricRepairPrompt,
  buildLyricsPrompt,
  buildSongPlanPrompt,
  inspectLyrics,
} from "@/lib/lyric-pipeline";
import {
  existingGenerationResultSchema,
  generateRequestSchema,
  generationResultSchema,
  lyricBlueprintSchema,
  lyricPublicationPackageSchema,
  lyricsResultSchema,
  parseTargetResult,
  songPlanSchema,
} from "@/lib/schemas";
import type { GenerateRequest, GenerationResult, GenerationTarget } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_RETRY_AFTER_SECONDS = 10;
const OSS_LYRICS_MODEL = "openai/gpt-oss-120b";

type LyricBlueprint = z.infer<typeof lyricBlueprintSchema>;
type LyricsResult = z.infer<typeof lyricsResultSchema>;
type LyricPublicationPackage = z.infer<typeof lyricPublicationPackageSchema>;
type SongPlan = z.infer<typeof songPlanSchema>;

class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

interface GroqFailure {
  model: string;
  stage: string;
  message: string;
  status?: number;
  retryAfter?: number;
}

class ModelSequenceError extends Error {
  constructor(readonly failures: GroqFailure[]) {
    super("모든 모델 호출에 실패했습니다.");
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("AI 응답에서 JSON 객체를 찾지 못했습니다.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

async function postChatCompletion<T>(options: {
  apiKey: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  parse: (value: unknown) => T;
}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: "system", content: "Return only one valid JSON object that follows the requested schema." },
          { role: "user", content: options.prompt },
        ],
        stream: false,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ProviderError(
        `${options.model} 요청 실패`,
        response.status,
        parseRetryAfter(response.headers.get("retry-after")),
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError(`${options.model} 응답 내용이 비어 있습니다.`);

    return options.parse(extractJson(content));
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(`${options.model} 요청 시간이 초과되었습니다.`, 408);
    }
    throw new ProviderError(`${options.model} 응답 형식 또는 품질 검증에 실패했습니다.`);
  } finally {
    clearTimeout(timeout);
  }
}

function providerMessage(error: unknown): string {
  if (!(error instanceof ProviderError)) return "알 수 없는 오류";
  if (error.status === 401 || error.status === 403) return "API 인증 오류";
  if (error.status === 429) return "API 요청 한도 초과";
  if (error.status === 408) return "API 응답 시간 초과";
  if (error.status && error.status >= 500) return "API 서버 오류";
  return error.message;
}

function configuredModel(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function modelsForTarget(target: GenerationTarget): string[] {
  if (target === "lyrics") return [OSS_LYRICS_MODEL];

  return Array.from(new Set([
    configuredModel("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b"),
    configuredModel("GROQ_SECONDARY_MODEL", "llama-3.3-70b-versatile"),
    configuredModel("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b"),
  ]));
}

function generationOptions(target: GenerationTarget): { temperature: number; maxTokens: number } {
  if (target === "lyrics") return { temperature: 0.58, maxTokens: 3000 };
  if (target === "all") return { temperature: 0.48, maxTokens: 4400 };
  if (target === "style" || target === "titles") return { temperature: 0.68, maxTokens: 1400 };
  if (target === "chords") return { temperature: 0.42, maxTokens: 1600 };
  return { temperature: 0.52, maxTokens: 700 };
}

function failureStatus(failures: GroqFailure[]): number {
  if (failures.some((failure) => failure.status === 401 || failure.status === 403)) return 401;
  if (failures.length > 0 && failures.every((failure) => failure.status === 429)) return 429;
  return 502;
}

function logGeneration(event: string, fields: Record<string, unknown>): void {
  console.info(JSON.stringify({ event, ...fields }));
}

async function runModelSequence<T>(options: {
  requestId: string;
  target: GenerationTarget;
  stage: string;
  apiKey: string;
  models: string[];
  prompt: string;
  temperature: number;
  maxTokens: number;
  parse: (value: unknown) => T;
}): Promise<{ value: T; model: string; failures: GroqFailure[] }> {
  const failures: GroqFailure[] = [];

  for (const model of options.models) {
    const modelStartedAt = Date.now();
    try {
      const value = await postChatCompletion({
        apiKey: options.apiKey,
        model,
        prompt: options.prompt,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        parse: options.parse,
      });

      logGeneration("generation.stage_succeeded", {
        requestId: options.requestId,
        target: options.target,
        stage: options.stage,
        model,
        modelDurationMs: Date.now() - modelStartedAt,
        failedModels: failures.length,
      });
      return { value, model, failures };
    } catch (error) {
      const failure: GroqFailure = {
        model,
        stage: options.stage,
        message: providerMessage(error),
        status: error instanceof ProviderError ? error.status : undefined,
        retryAfter: error instanceof ProviderError ? error.retryAfter : undefined,
      };
      failures.push(failure);
      logGeneration("generation.stage_failed", {
        requestId: options.requestId,
        target: options.target,
        stage: options.stage,
        model,
        status: failure.status ?? null,
        reason: failure.message,
        modelDurationMs: Date.now() - modelStartedAt,
      });
    }
  }

  throw new ModelSequenceError(failures);
}

async function generateLyricsFromBlueprint(options: {
  requestId: string;
  target: GenerationTarget;
  apiKey: string;
  blueprint: LyricBlueprint;
  includePublication: boolean;
}): Promise<{
  value: LyricsResult | LyricPublicationPackage;
  repaired: boolean;
  issues: string[];
}> {
  const parse = options.includePublication
    ? (value: unknown) => lyricPublicationPackageSchema.parse(value)
    : (value: unknown) => lyricsResultSchema.parse(value);

  const draftRun = await runModelSequence({
    requestId: options.requestId,
    target: options.target,
    stage: "lyrics.draft",
    apiKey: options.apiKey,
    models: [OSS_LYRICS_MODEL],
    prompt: buildLyricsPrompt(options.blueprint, options.includePublication),
    temperature: 0.58,
    maxTokens: options.includePublication ? 3600 : 3000,
    parse,
  });

  const issues = inspectLyrics(draftRun.value);
  if (issues.length === 0) return { value: draftRun.value, repaired: false, issues: [] };

  logGeneration("generation.lyrics_quality_retry", {
    requestId: options.requestId,
    target: options.target,
    issueCount: issues.length,
    issueTypes: issues.map((issue) => issue.split(":")[0]),
  });

  const repairRun = await runModelSequence({
    requestId: options.requestId,
    target: options.target,
    stage: "lyrics.repair",
    apiKey: options.apiKey,
    models: [OSS_LYRICS_MODEL],
    prompt: buildLyricRepairPrompt(options.blueprint, draftRun.value, issues, options.includePublication),
    temperature: 0.42,
    maxTokens: options.includePublication ? 3600 : 3000,
    parse,
  });

  const remainingIssues = inspectLyrics(repairRun.value);
  if (remainingIssues.length > 0) {
    logGeneration("generation.lyrics_quality_warning", {
      requestId: options.requestId,
      target: options.target,
      issueCount: remainingIssues.length,
      issueTypes: remainingIssues.map((issue) => issue.split(":")[0]),
    });
  }

  return { value: repairRun.value, repaired: true, issues: remainingIssues };
}

async function generateAll(input: GenerateRequest, apiKey: string, requestId: string): Promise<{
  result: GenerationResult;
  warning?: string;
}> {
  const planOptions = generationOptions("all");
  const planRun = await runModelSequence<SongPlan>({
    requestId,
    target: "all",
    stage: "song.plan",
    apiKey,
    models: modelsForTarget("all"),
    prompt: buildSongPlanPrompt(input),
    temperature: planOptions.temperature,
    maxTokens: planOptions.maxTokens,
    parse: (value) => songPlanSchema.parse(value),
  });

  const lyricRun = await generateLyricsFromBlueprint({
    requestId,
    target: "all",
    apiKey,
    blueprint: planRun.value.lyricBlueprint,
    includePublication: true,
  });
  const publication = lyricRun.value as LyricPublicationPackage;

  const result = generationResultSchema.parse({
    chords: planRun.value.chords,
    sunoStyle: planRun.value.sunoStyle,
    sunoStyleKorean: planRun.value.sunoStyleKorean,
    lyrics: publication.lyrics,
    titles: publication.titles,
    titlesEnglish: publication.titlesEnglish,
    hashtags: publication.hashtags,
  });

  const warnings: string[] = [];
  if (planRun.failures.length > 0) warnings.push(`${planRun.failures.length}개 모델 실패 후 ${planRun.model}로 곡을 설계했습니다.`);
  if (lyricRun.repaired) warnings.push("가사를 자동 검수하고 문제가 있는 표현을 한 번 교정했습니다.");
  if (lyricRun.issues.length > 0) warnings.push("일부 가사 표현은 추가 확인이 필요할 수 있습니다.");

  return { result, warning: warnings.length > 0 ? warnings.join(" ") : undefined };
}

async function regenerateLyrics(input: GenerateRequest, apiKey: string, requestId: string): Promise<{
  result: GenerationResult;
  warning?: string;
}> {
  if (!input.existing) throw new Error("부분 재생성에 필요한 기존 결과가 없습니다.");

  const blueprintRun = await runModelSequence<LyricBlueprint>({
    requestId,
    target: "lyrics",
    stage: "lyrics.blueprint",
    apiKey,
    models: [OSS_LYRICS_MODEL],
    prompt: buildLyricBlueprintPrompt(input),
    temperature: 0.32,
    maxTokens: 1100,
    parse: (value) => lyricBlueprintSchema.parse(value),
  });

  const lyricRun = await generateLyricsFromBlueprint({
    requestId,
    target: "lyrics",
    apiKey,
    blueprint: blueprintRun.value,
    includePublication: false,
  });
  const lyrics = (lyricRun.value as LyricsResult).lyrics;
  const result = existingGenerationResultSchema.parse({ ...input.existing, lyrics }) as GenerationResult;

  const warnings: string[] = [];
  if (lyricRun.repaired) warnings.push("가사를 자동 검수하고 문제가 있는 표현을 한 번 교정했습니다.");
  if (lyricRun.issues.length > 0) warnings.push("일부 가사 표현은 추가 확인이 필요할 수 있습니다.");
  return { result, warning: warnings.length > 0 ? warnings.join(" ") : undefined };
}

function mergeTargetResult(input: GenerateRequest, generated: Record<string, unknown>): GenerationResult {
  if (!input.existing) throw new Error("부분 재생성에 필요한 기존 결과가 없습니다.");

  if (input.target === "chords") {
    return existingGenerationResultSchema.parse({ ...input.existing, chords: generated.chords }) as GenerationResult;
  }
  if (input.target === "style") {
    return existingGenerationResultSchema.parse({
      ...input.existing,
      sunoStyle: generated.sunoStyle,
      sunoStyleKorean: generated.sunoStyleKorean,
    }) as GenerationResult;
  }
  if (input.target === "titles") {
    return existingGenerationResultSchema.parse({
      ...input.existing,
      titles: generated.titles,
      titlesEnglish: generated.titlesEnglish,
    }) as GenerationResult;
  }
  return existingGenerationResultSchema.parse({ ...input.existing, hashtags: generated.hashtags }) as GenerationResult;
}

function sequenceErrorResponse(error: ModelSequenceError): NextResponse {
  const status = failureStatus(error.failures);
  const retryAfter = Math.max(
    DEFAULT_RETRY_AFTER_SECONDS,
    ...error.failures.map((failure) => failure.retryAfter ?? 0),
  );
  return NextResponse.json(
    {
      error: `Groq 호출에 실패했습니다. ${error.failures
        .map((failure) => `${failure.stage}/${failure.model}: ${failure.message}`)
        .join(" / ")}`,
    },
    {
      status,
      headers: status === 429 ? { "Retry-After": String(retryAfter) } : undefined,
    },
  );
}

export async function POST(request: Request) {
  const requestId = globalThis.crypto.randomUUID();
  const requestStartedAt = Date.now();
  let parsed: GenerateRequest;

  try {
    parsed = generateRequestSchema.parse(await request.json());
  } catch {
    logGeneration("generation.invalid_request", { requestId, durationMs: Date.now() - requestStartedAt });
    return NextResponse.json(
      { error: "요청 정보가 올바르지 않습니다. 가수와 대표곡을 다시 선택해 주세요." },
      { status: 400 },
    );
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  logGeneration("generation.started", {
    requestId,
    target: parsed.target,
    artistId: parsed.artist.id,
    songId: parsed.song.id,
    pipeline: parsed.target === "all" || parsed.target === "lyrics" ? "oss-lyric-v1" : "single-stage",
  });

  if (!groqKey) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        result: createMockResult(parsed.song),
        provider: "mock",
        warning: "개발 환경에 GROQ_API_KEY가 없어 Mock 결과를 표시했습니다.",
      });
    }

    logGeneration("generation.failed", {
      requestId,
      target: parsed.target,
      reason: "missing_api_key",
      durationMs: Date.now() - requestStartedAt,
    });
    return NextResponse.json({ error: "GROQ_API_KEY가 설정되지 않았습니다." }, { status: 503 });
  }

  try {
    if (parsed.target === "all") {
      const generated = await generateAll(parsed, groqKey, requestId);
      logGeneration("generation.succeeded", {
        requestId,
        target: parsed.target,
        pipeline: "oss-lyric-v1",
        durationMs: Date.now() - requestStartedAt,
      });
      return NextResponse.json({ result: generated.result, provider: "groq", warning: generated.warning });
    }

    if (parsed.target === "lyrics") {
      const generated = await regenerateLyrics(parsed, groqKey, requestId);
      logGeneration("generation.succeeded", {
        requestId,
        target: parsed.target,
        pipeline: "oss-lyric-v1",
        model: OSS_LYRICS_MODEL,
        durationMs: Date.now() - requestStartedAt,
      });
      return NextResponse.json({ result: generated.result, provider: "groq", warning: generated.warning });
    }

    const options = generationOptions(parsed.target);
    const run = await runModelSequence<Record<string, unknown>>({
      requestId,
      target: parsed.target,
      stage: `${parsed.target}.single`,
      apiKey: groqKey,
      models: modelsForTarget(parsed.target),
      prompt: buildGenerationPrompt(parsed),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      parse: (value) => parseTargetResult(parsed.target, value),
    });
    const result = mergeTargetResult(parsed, run.value);

    logGeneration("generation.succeeded", {
      requestId,
      target: parsed.target,
      model: run.model,
      durationMs: Date.now() - requestStartedAt,
      failedModels: run.failures.length,
    });

    return NextResponse.json({
      result,
      provider: "groq",
      warning: run.failures.length > 0
        ? `${run.failures.length}개 Groq 모델 실패 후 ${run.model} 모델로 생성했습니다.`
        : undefined,
    });
  } catch (error) {
    if (error instanceof ModelSequenceError) {
      logGeneration("generation.failed", {
        requestId,
        target: parsed.target,
        status: failureStatus(error.failures),
        durationMs: Date.now() - requestStartedAt,
        failures: error.failures.map((failure) => ({
          stage: failure.stage,
          model: failure.model,
          status: failure.status ?? null,
          reason: failure.message,
        })),
      });
      return sequenceErrorResponse(error);
    }

    logGeneration("generation.failed", {
      requestId,
      target: parsed.target,
      status: 502,
      reason: error instanceof Error ? error.message : "unknown_error",
      durationMs: Date.now() - requestStartedAt,
    });
    return NextResponse.json(
      { error: "생성 결과를 검증하거나 결합하는 중 오류가 발생했습니다. 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
