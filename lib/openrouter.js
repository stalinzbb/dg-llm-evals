import { MODEL_PRICING } from "@/lib/constants";

function estimateTokensFromText(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateCost(model, promptTokens, completionTokens) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return null;
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

function parseTextContent(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === "string" ? item : item?.text || ""))
      .join("\n")
      .trim();
  }

  return "";
}

function buildMockCause(testCase) {
  const tags = testCase.causeTags.length ? testCase.causeTags.join(", ") : "team needs";
  return `${testCase.teamName} is raising funds to cover ${tags} so athletes at ${testCase.organizationName} can keep showing up fully prepared for ${testCase.teamActivity.toLowerCase()}. Every contribution helps ease costs for families while giving the team reliable support and a stronger season ahead.`;
}

export async function requestCompletion({
  model,
  systemPrompt,
  userPrompt,
  generationSettings,
  testCase,
}) {
  const promptTokenEstimate = estimateTokensFromText(`${systemPrompt}\n${userPrompt}`);
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    const causeStatement = buildMockCause(testCase);
    const completionTokens = estimateTokensFromText(causeStatement);
    return {
      provider: "mock",
      causeStatement,
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
      "X-Title": process.env.OPENROUTER_TITLE || "DG Fundraiser LLM Eval Tool",
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

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenRouter request failed.");
  }

  const causeStatement = parseTextContent(payload?.choices?.[0]?.message?.content);
  const promptTokens = payload?.usage?.prompt_tokens ?? promptTokenEstimate;
  const completionTokens = payload?.usage?.completion_tokens ?? estimateTokensFromText(causeStatement);
  const totalTokens = payload?.usage?.total_tokens ?? promptTokens + completionTokens;

  return {
    provider: "openrouter",
    causeStatement,
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
