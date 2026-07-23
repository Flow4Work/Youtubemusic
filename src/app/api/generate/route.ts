import { NextResponse } from "next/server";
import { createMockResult } from "@/lib/mock";
import { buildGenerationPrompt } from "@/lib/prompt";
import { generateRequestSchema, generationResultSchema } from "@/lib/schemas";
import type { GenerateRequest, GenerationResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
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

async function postChatCompletion(options: {
  url: string;
  apiKey: string;
  model: string;
  prompt: string;
  provider: "glm" | "groq";
}): Promise<GenerationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: [
        { role: "system", content: "Return only one valid JSON object that follows the requested schema." },
        { role: "user", content: options.prompt },
      ],
      stream: false,
      temperature: options.provider === "glm" ? 0.7 : 0.75,
      max_tokens: 5000,
    };

    if (options.provider === "glm") {
      body.thinking = { type: "disabled" };
    }

    const response = await fetch(options.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ProviderError(`${options.provider.toUpperCase()} 요청 실패`, response.status);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError(`${options.provider.toUpperCase()} 응답 내용이 비어 있습니다.`);

    return generationResultSchema.parse(extractJson(content));
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(`${options.provider.toUpperCase()} 요청 시간이 초과되었습니다.`, 408);
    }
    throw new ProviderError(`${options.provider.toUpperCase()} 응답 처리에 실패했습니다.`);
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

  if (!parsed.song.verified) {
    return NextResponse.json(
      { error: "검수되지 않은 곡 데이터는 생성에 사용할 수 없습니다." },
      { status: 400 },
    );
  }

  const prompt = buildGenerationPrompt(parsed);
  const failures: string[] = [];
  const glmKey = process.env.GLM_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (glmKey) {
    try {
      const base = (process.env.GLM_BASE_URL || "https://api.z.ai/api/paas/v4").replace(/\/$/u, "");
      const result = await postChatCompletion({
        url: `${base}/chat/completions`,
        apiKey: glmKey,
        model: process.env.GLM_MODEL || "glm-4.5-flash",
        prompt,
        provider: "glm",
      });
      return NextResponse.json({ result, provider: "glm" });
    } catch (error) {
      failures.push(`GLM: ${providerMessage(error)}`);
    }
  } else {
    failures.push("GLM: API Key 없음");
  }

  if (groqKey) {
    try {
      const base = (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/u, "");
      const result = await postChatCompletion({
        url: `${base}/chat/completions`,
        apiKey: groqKey,
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        prompt,
        provider: "groq",
      });
      return NextResponse.json({
        result,
        provider: "groq",
        warning: failures.join(" / "),
      });
    } catch (error) {
      failures.push(`Groq: ${providerMessage(error)}`);
    }
  } else {
    failures.push("Groq: API Key 없음");
  }

  return NextResponse.json({
    result: createMockResult(parsed.song),
    provider: "mock",
    warning: `${failures.join(" / ")} — 안전한 Mock 결과를 표시했습니다.`,
  });
}
