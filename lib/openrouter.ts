import { MODEL_PRICING } from "@/lib/constants";
import type { GenerationSettings, OpenRouterCompletionResult } from "@/lib/types/domain";

function estimateTokensFromText(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateCost(model: string, promptTokens: number, completionTokens: number) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return null;
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

function parseTextContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === "string" ? item : typeof item === "object" && item ? `${(item as { text?: string }).text || ""}` : ""))
      .join("\n")
      .trim();
  }

  return "";
}

function buildMockOutput(userPrompt: string) {
  const excerpt = userPrompt.replace(/\s+/g, " ").trim().slice(0, 160);
  return `[Mock output — set an OpenRouter API key in Settings to call real models.] Based on the provided input (“${excerpt}…”), here is a sample response demonstrating how generated content will appear in results.`;
}

export async function requestCompletion({
  model,
  systemPrompt,
  userPrompt,
  generationSettings,
  apiKey,
}: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  generationSettings: GenerationSettings;
  /** Bring-your-own-key; falls back to the server env key, then mock mode. */
  apiKey?: string | null;
}): Promise<OpenRouterCompletionResult> {
  const promptTokenEstimate = estimateTokensFromText(`${systemPrompt}\n${userPrompt}`);
  const key = apiKey?.trim() || process.env.OPENROUTER_API_KEY;

  if (!key) {
    const output = buildMockOutput(userPrompt);
    const completionTokens = estimateTokensFromText(output);
    return {
      provider: "mock",
      output,
      usage: {
        promptTokens: promptTokenEstimate,
        completionTokens,
        totalTokens: promptTokenEstimate + completionTokens,
      },
      estimatedCost: 0,
      latencyMs: 0,
      pricing: MODEL_PRICING[model] || null,
    };
  }

  const startedAt = Date.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_TITLE || "LLM Eval Builder",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: generationSettings.temperature,
      top_p: generationSettings.topP,
      max_tokens: generationSettings.maxTokens,
      ...(generationSettings.seed ? { seed: Number(generationSettings.seed) } : {}),
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: unknown } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenRouter request failed.");
  }

  const output = parseTextContent(payload?.choices?.[0]?.message?.content);
  const promptTokens = payload?.usage?.prompt_tokens ?? promptTokenEstimate;
  const completionTokens = payload?.usage?.completion_tokens ?? estimateTokensFromText(output);
  const totalTokens = payload?.usage?.total_tokens ?? promptTokens + completionTokens;

  return {
    provider: "openrouter",
    output,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
    },
    estimatedCost: estimateCost(model, promptTokens, completionTokens),
    latencyMs: Date.now() - startedAt,
    pricing: MODEL_PRICING[model] || null,
  };
}
