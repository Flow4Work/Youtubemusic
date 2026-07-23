import { NextResponse } from "next/server";
import { createMockResult } from "@/lib/mock";
import { buildGenerationPrompt } from "@/lib/prompt";
import { generateRequestSchema, generationResultSchema } from "@/lib/schemas";
import type { GenerateRequest, GenerationResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

interface GroqFailure {
  model: string;
  message: string;
  status?: number;
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

async function postChatCompletion(options: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<GenerationResult> {
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
        temperature: 0.75,
        max_tokens: 5000,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ProviderError(`${options.model} 요청 실패`, response.status);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError(`${options.model} 응답 내용이 비어 있습니다.`);

    return generationResultSchema.parse(extractJson(content));
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(`${options.model} 요청 시간이 초과되었습니다.`, 408);
    }
    throw new ProviderError(`${options.model} 응답 처리에 실패했습니다.`);
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

function failureStatus(failures: GroqFailure[]): number {
  if (failures.some((failure) => failure.status === 401 || failure.status === 403)) return 401;
  if (failures.length > 0 && failures.every((failure) => failure.status === 429)) return 429;
  return 502;
}

export async function POST(request: Request) {
  let parsed: GenerateRequest;
  try {
    parsed = generateRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "요청 정보가 올바르지 않습니다. 가수와 대표곡을 다시 선택해 주세요." },
      { status: 400 },
    );
  }

  const prompt = buildGenerationPrompt(parsed);
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (!groqKey) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        result: createMockResult(parsed.song),
        provider: "mock",
        warning: "개발 환경에 GROQ_API_KEY가 없어 Mock 결과를 표시했습니다.",
      });
    }

    return NextResponse.json(
      { error: "GROQ_API_KEY가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const models = [
    configuredModel("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b"),
    configuredModel("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b"),
    configuredModel("GROQ_SECONDARY_MODEL", "llama-3.3-70b-versatile"),
  ];
  const failures: GroqFailure[] = [];

  for (const model of models) {
    try {
      const result = await postChatCompletion({
        apiKey: groqKey,
        model,
        prompt,
      });

      return NextResponse.json({
        result,
        provider: "groq",
        warning: failures.length > 0
          ? `${failures.length}개 Groq 모델 실패 후 ${model} 모델로 생성했습니다.`
          : undefined,
      });
    } catch (error) {
      failures.push({
        model,
        message: providerMessage(error),
        status: error instanceof ProviderError ? error.status : undefined,
      });
    }
  }

  return NextResponse.json(
    {
      error: `Groq 모델 호출에 모두 실패했습니다. ${failures
        .map((failure) => `${failure.model}: ${failure.message}`)
        .join(" / ")}`,
    },
    { status: failureStatus(failures) },
  );
}
