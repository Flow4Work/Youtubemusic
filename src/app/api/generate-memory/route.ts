import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createMemoryMockResult, getMemoryTopic } from "@/lib/memory-song";
import { buildMemoryGenerationPrompt } from "@/lib/memory-prompt";
import {
  memoryGenerationResultSchema,
  parseMemoryRequest,
  parseMemoryTargetResult,
} from "@/lib/memory-schemas";
import type {
  GenerationResult,
  GenerationTarget,
  MemoryGenerateRequest,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_RETRY_AFTER_SECONDS = 10;
const OUTPUT_RETRY_COUNT = 1;

type ErrorKind = "http" | "timeout" | "empty" | "json" | "schema" | "response";

class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfter?: number,
    readonly kind: ErrorKind = "response",
    readonly detail?: string,
  ) {
    super(message);
  }
}

interface ModelFailure {
  model: string;
  stage: string;
  message: string;
  status?: number;
  retryAfter?: number;
  kind?: ErrorKind;
  detail?: string;
}

interface GroqPayload {
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null; reasoning?: string | null };
  }>;
  error?: { message?: string; type?: string; failed_generation?: unknown };
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

class ModelSequenceError extends Error {
  constructor(readonly failures: ModelFailure[]) {
    super("모든 모델 호출에 실패했습니다.");
  }
}

function truncate(value: string, limit = 420): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit)}…`;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("AI 응답에서 JSON 객체를 찾지 못했습니다.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

function validationMessage(error: unknown): { kind: ErrorKind; message: string } {
  if (error instanceof ZodError) {
    const issues = error.issues.slice(0, 6).map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
    return { kind: "schema", message: issues.join(" | ") };
  }
  if (error instanceof SyntaxError) return { kind: "json", message: error.message };
  return { kind: "schema", message: error instanceof Error ? error.message : "응답 검증 실패" };
}

function parsePayload(raw: string): GroqPayload {
  try {
    return JSON.parse(raw) as GroqPayload;
  } catch (error) {
    throw new ProviderError(
      "Groq API 응답 본문을 해석하지 못했습니다.",
      502,
      undefined,
      "response",
      `${error instanceof Error ? error.message : "JSON 오류"}; body=${truncate(raw, 220)}`,
    );
  }
}

function providerMessage(error: unknown): string {
  if (!(error instanceof ProviderError)) return error instanceof Error ? error.message : "알 수 없는 오류";
  if (error.status === 401 || error.status === 403) return `API 인증 오류${error.detail ? `: ${error.detail}` : ""}`;
  if (error.status === 429) return `API 요청 한도 초과${error.detail ? `: ${error.detail}` : ""}`;
  if (error.status === 408) return "API 응답 시간 초과";
  return error.message;
}

function configuredModel(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function modelsForTarget(target: GenerationTarget): string[] {
  const models = [
    configuredModel("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b"),
    configuredModel("GROQ_SECONDARY_MODEL", "llama-3.3-70b-versatile"),
    configuredModel("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b"),
  ];
  if (target === "lyrics") {
    const lyricModel = configuredModel("GROQ_LYRICS_MODEL", "openai/gpt-oss-120b");
    return Array.from(new Set([lyricModel, ...models]));
  }
  return Array.from(new Set(models));
}

function generationOptions(target: GenerationTarget): { temperature: number; maxTokens: number } {
  if (target === "all") return { temperature: 0.42, maxTokens: 7200 };
  if (target === "lyrics") return { temperature: 0.45, maxTokens: 6200 };
  if (target === "style" || target === "titles") return { temperature: 0.62, maxTokens: 1500 };
  if (target === "chords") return { temperature: 0.38, maxTokens: 1500 };
  return { temperature: 0.5, maxTokens: 700 };
}

function isGptOss(model: string): boolean {
  return model.startsWith("openai/gpt-oss-");
}

async function callModel<T>(options: {
  apiKey: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  parse: (value: unknown) => T;
}): Promise<T> {
  let correction = "";

  for (let attempt = 0; attempt <= OUTPUT_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    const requestBody: Record<string, unknown> = {
      model: options.model,
      messages: [
        { role: "system", content: "유효한 JSON 객체 하나만 반환하세요. 설명과 Markdown은 출력하지 마세요." },
        {
          role: "user",
          content: correction
            ? `${options.prompt}\n\n직전 응답 오류: ${correction}\n오류를 모두 고쳐 JSON 객체 하나만 다시 반환하세요.`
            : options.prompt,
        },
      ],
      stream: false,
      temperature: attempt === 0 ? options.temperature : Math.min(options.temperature, 0.25),
      max_completion_tokens: options.maxTokens,
      response_format: { type: "json_object" },
    };
    if (isGptOss(options.model)) {
      requestBody.reasoning_effort = "low";
      requestBody.include_reasoning = false;
    }

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        cache: "no-store",
        signal: controller.signal,
      });
      const raw = await response.text();
      const payload = parsePayload(raw);

      if (!response.ok) {
        const detail = [payload.error?.message, payload.error?.type, payload.error?.failed_generation ? truncate(JSON.stringify(payload.error.failed_generation), 220) : ""]
          .filter(Boolean).join("; ");
        throw new ProviderError(
          `${options.model} 요청 실패`,
          response.status,
          parseRetryAfter(response.headers.get("retry-after")),
          "http",
          detail || truncate(raw, 220),
        );
      }

      const choice = payload.choices?.[0];
      const content = choice?.message?.content?.trim();
      if (!content) {
        const reason = choice?.finish_reason === "length"
          ? "출력 토큰 한도에 도달해 최종 JSON이 비었습니다."
          : "최종 응답 내용이 비어 있습니다.";
        if (attempt < OUTPUT_RETRY_COUNT) {
          correction = reason;
          continue;
        }
        throw new ProviderError(reason, 502, undefined, "empty", `finish_reason=${choice?.finish_reason ?? "unknown"}`);
      }

      try {
        return options.parse(extractJson(content));
      } catch (error) {
        const validation = validationMessage(error);
        if (attempt < OUTPUT_RETRY_COUNT) {
          correction = validation.message;
          continue;
        }
        throw new ProviderError(
          `${options.model} JSON 검증 실패: ${validation.message}`,
          502,
          undefined,
          validation.kind,
          `content=${truncate(content)}`,
        );
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderError(`${options.model} 요청 시간이 초과되었습니다.`, 408, undefined, "timeout");
      }
      throw new ProviderError(
        `${options.model} 응답 처리 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
        502,
        undefined,
        "response",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new ProviderError(`${options.model} 응답 처리에 실패했습니다.`, 502);
}

async function runModelSequence<T>(options: {
  requestId: string;
  target: GenerationTarget;
  apiKey: string;
  prompt: string;
  parse: (value: unknown) => T;
}): Promise<{ value: T; model: string; failures: ModelFailure[] }> {
  const failures: ModelFailure[] = [];
  const generation = generationOptions(options.target);

  for (const model of modelsForTarget(options.target)) {
    const startedAt = Date.now();
    try {
      const value = await callModel({
        apiKey: options.apiKey,
        model,
        prompt: options.prompt,
        temperature: generation.temperature,
        maxTokens: generation.maxTokens,
        parse: options.parse,
      });
      console.info(JSON.stringify({
        event: "memory_generation.model_succeeded",
        requestId: options.requestId,
        target: options.target,
        model,
        durationMs: Date.now() - startedAt,
        failedModels: failures.length,
      }));
      return { value, model, failures };
    } catch (error) {
      const failure: ModelFailure = {
        model,
        stage: `memory.${options.target}`,
        message: providerMessage(error),
        status: error instanceof ProviderError ? error.status : undefined,
        retryAfter: error instanceof ProviderError ? error.retryAfter : undefined,
        kind: error instanceof ProviderError ? error.kind : undefined,
        detail: error instanceof ProviderError ? error.detail : undefined,
      };
      failures.push(failure);
      console.info(JSON.stringify({
        event: "memory_generation.model_failed",
        requestId: options.requestId,
        target: options.target,
        model,
        status: failure.status ?? null,
        kind: failure.kind ?? null,
        reason: failure.message,
        detail: failure.detail ?? null,
        durationMs: Date.now() - startedAt,
      }));
    }
  }
  throw new ModelSequenceError(failures);
}

function mergeMemoryResult(input: MemoryGenerateRequest, generated: Record<string, unknown>): GenerationResult {
  if (input.target === "all") return memoryGenerationResultSchema.parse(generated);
  if (!input.existing) throw new Error("부분 재생성에 필요한 기존 결과가 없습니다.");

  if (input.target === "chords") return memoryGenerationResultSchema.parse({ ...input.existing, chords: generated.chords });
  if (input.target === "style") return memoryGenerationResultSchema.parse({
    ...input.existing,
    sunoStyle: generated.sunoStyle,
    sunoStyleKorean: generated.sunoStyleKorean,
  });
  if (input.target === "lyrics") return memoryGenerationResultSchema.parse({ ...input.existing, lyrics: generated.lyrics });
  if (input.target === "titles") return memoryGenerationResultSchema.parse({
    ...input.existing,
    titles: generated.titles,
    titlesEnglish: generated.titlesEnglish,
  });
  return memoryGenerationResultSchema.parse({ ...input.existing, hashtags: generated.hashtags });
}

function failureStatus(failures: ModelFailure[]): number {
  if (failures.some((failure) => failure.status === 401 || failure.status === 403)) return 401;
  if (failures.length > 0 && failures.every((failure) => failure.status === 429)) return 429;
  return 502;
}

export async function POST(request: Request) {
  const requestId = globalThis.crypto.randomUUID();
  const startedAt = Date.now();
  let parsed: MemoryGenerateRequest;

  try {
    parsed = parseMemoryRequest(await request.json());
  } catch (error) {
    const detail = validationMessage(error).message;
    return NextResponse.json({ error: `암기송 요청 정보가 올바르지 않습니다. ${detail}`, requestId }, { status: 400 });
  }

  const topic = getMemoryTopic(parsed.topicId);
  if (!topic) return NextResponse.json({ error: "암기 주제를 찾지 못했습니다.", requestId }, { status: 400 });

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        result: createMemoryMockResult(topic, parsed.style),
        provider: "mock",
        warning: "개발 환경에 GROQ_API_KEY가 없어 Mock 암기송을 표시했습니다.",
      });
    }
    return NextResponse.json({ error: "GROQ_API_KEY가 설정되지 않았습니다.", requestId }, { status: 503 });
  }

  try {
    const run = await runModelSequence<Record<string, unknown>>({
      requestId,
      target: parsed.target,
      apiKey: groqKey,
      prompt: buildMemoryGenerationPrompt(parsed, topic),
      parse: (value) => parseMemoryTargetResult(parsed.target, value, topic.items),
    });
    const result = mergeMemoryResult(parsed, run.value);
    console.info(JSON.stringify({
      event: "memory_generation.succeeded",
      requestId,
      target: parsed.target,
      topicId: topic.id,
      style: parsed.style,
      model: run.model,
      failedModels: run.failures.length,
      durationMs: Date.now() - startedAt,
    }));
    return NextResponse.json({
      result,
      provider: "groq",
      warning: run.failures.length > 0
        ? `${run.failures.length}개 Groq 모델 실패 후 ${run.model} 모델로 생성했습니다.`
        : undefined,
    });
  } catch (error) {
    if (error instanceof ModelSequenceError) {
      const status = failureStatus(error.failures);
      const retryAfter = Math.max(DEFAULT_RETRY_AFTER_SECONDS, ...error.failures.map((failure) => failure.retryAfter ?? 0));
      return NextResponse.json(
        {
          error: `암기송 생성 모델 호출에 모두 실패했습니다. ${error.failures.map((failure) => `${failure.model}: ${failure.message}`).join(" / ")}`,
          requestId,
          failures: error.failures.map((failure) => ({
            model: failure.model,
            status: failure.status ?? null,
            kind: failure.kind ?? null,
            reason: failure.message,
          })),
        },
        { status, headers: status === 429 ? { "Retry-After": String(retryAfter) } : undefined },
      );
    }

    const detail = validationMessage(error).message;
    return NextResponse.json(
      { error: `암기송 결과를 검증하거나 결합하는 중 오류가 발생했습니다. ${detail}`, requestId },
      { status: 502 },
    );
  }
}
