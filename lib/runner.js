import { buildFullMessage, normalizeGenerationSettings, normalizePromptTemplate, normalizeTestCase, normalizeVariants, renderUserPrompt, scoreCharacterCounts } from "@/lib/prompt";
import { addVariantResult, createRun, getPromptTemplateById, getRunById, listTestCasesByIds, updateRun } from "@/lib/store";
import { requestCompletion } from "@/lib/openrouter";

function createEphemeralId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function buildVariantSettings(sharedGeneration, variant) {
  return {
    ...sharedGeneration,
    ...(variant.temperature !== null && Number.isFinite(variant.temperature)
      ? { temperature: variant.temperature }
      : {}),
    ...(variant.topP !== null && Number.isFinite(variant.topP) ? { topP: variant.topP } : {}),
    ...(variant.maxTokens !== null && Number.isFinite(variant.maxTokens)
      ? { maxTokens: variant.maxTokens }
      : {}),
    ...(variant.seed ? { seed: variant.seed } : {}),
  };
}

async function resolvePromptTemplate(promptDraft, variant, promptTemplatesById) {
  if (variant.promptSource !== "current" && promptTemplatesById[variant.promptSource]) {
    return promptTemplatesById[variant.promptSource];
  }

  if (variant.promptSource !== "current") {
    const savedPrompt = await getPromptTemplateById(variant.promptSource);
    if (savedPrompt) {
      promptTemplatesById[variant.promptSource] = normalizePromptTemplate(savedPrompt);
      return promptTemplatesById[variant.promptSource];
    }
  }

  return normalizePromptTemplate(promptDraft);
}

async function runVariant({
  runId,
  testCase,
  promptTemplate,
  variant,
  sharedGeneration,
  persist = true,
}) {
  const generationSettings = buildVariantSettings(sharedGeneration, variant);
  const userPrompt = renderUserPrompt(testCase, promptTemplate);
  const response = await requestCompletion({
    model: variant.model,
    systemPrompt: promptTemplate.systemPrompt,
    userPrompt,
    generationSettings,
    testCase,
  });

  const fullMessage = buildFullMessage(promptTemplate, response.causeStatement);
  const characters = scoreCharacterCounts(response.causeStatement, fullMessage);

  const resultPayload = {
    runId,
    caseId: testCase.id || null,
    caseName: testCase.name,
    variantLabel: variant.label,
    model: variant.model,
    promptTemplateId: promptTemplate.id || null,
    promptTemplateName: promptTemplate.name,
    promptSource: variant.promptSource,
    generationSettings,
    systemPrompt: promptTemplate.systemPrompt,
    userPrompt,
    prefixText: promptTemplate.prefixText,
    suffixText: promptTemplate.suffixText,
    causeStatement: response.causeStatement,
    fullMessage,
    metrics: {
      ...response.usage,
      estimatedCost: response.estimatedCost,
      latencyMs: response.latencyMs,
      ...characters,
    },
    pricing: response.pricing,
    provider: response.provider,
    inputSnapshot: testCase,
    error: null,
  };

  if (!persist) {
    return {
      id: createEphemeralId("variant"),
      createdAt: new Date().toISOString(),
      ...resultPayload,
    };
  }

  return addVariantResult(resultPayload);
}

async function runVariantSafely(args) {
  try {
    return await runVariant(args);
  } catch (error) {
    const errorPayload = {
      runId: args.runId,
      caseId: args.testCase.id || null,
      caseName: args.testCase.name,
      variantLabel: args.variant.label,
      model: args.variant.model,
      promptTemplateId: null,
      promptTemplateName: "",
      promptSource: args.variant.promptSource,
      generationSettings: buildVariantSettings(args.sharedGeneration, args.variant),
      systemPrompt: "",
      userPrompt: "",
      prefixText: "",
      suffixText: "",
      causeStatement: "",
      fullMessage: "",
      metrics: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: null,
        latencyMs: 0,
        causeOnlyCharacters: 0,
        fullMessageCharacters: 0,
      },
      pricing: null,
      provider: "error",
      inputSnapshot: args.testCase,
      error: error.message,
    };

    if (!args.persist) {
      return {
        id: createEphemeralId("variant"),
        createdAt: new Date().toISOString(),
        ...errorPayload,
      };
    }

    return addVariantResult(errorPayload);
  }
}

export async function executePlaygroundRun(payload) {
  const testCase = normalizeTestCase(payload.caseInput);
  const promptDraft = normalizePromptTemplate(payload.promptDraft);
  const sharedGeneration = normalizeGenerationSettings(payload.generationSettings);
  const variants = normalizeVariants(payload.variants);
  const promptTemplatesById = {};

  const run = await createRun({
    mode: payload.mode === "compare" ? "compare" : "single",
    label: payload.label || testCase.name,
    status: "running",
    payload: {
      caseSnapshot: testCase,
      promptSnapshot: promptDraft,
      variantConfigs: variants,
      generationDefaults: sharedGeneration,
    },
  });

  for (const variant of variants) {
    const promptTemplate = await resolvePromptTemplate(promptDraft, variant, promptTemplatesById);
    await runVariantSafely({
      runId: run.id,
      testCase,
      promptTemplate,
      variant,
      sharedGeneration,
    });
  }

  await updateRun(run.id, { status: "completed" });
  return getRunById(run.id);
}

export async function executePlaygroundPreview(payload) {
  const testCase = normalizeTestCase(payload.caseInput);
  const promptDraft = normalizePromptTemplate(payload.promptDraft);
  const sharedGeneration = normalizeGenerationSettings(payload.generationSettings);
  const variants = normalizeVariants(payload.variants);
  const promptTemplatesById = {};
  const timestamp = new Date().toISOString();
  const run = {
    id: createEphemeralId("preview"),
    createdAt: timestamp,
    updatedAt: timestamp,
    mode: payload.mode === "compare" ? "compare" : "single",
    label: payload.label || testCase.name,
    status: "completed",
    payload: {
      caseSnapshot: testCase,
      promptSnapshot: promptDraft,
      variantConfigs: variants,
      generationDefaults: sharedGeneration,
    },
    results: [],
    ratings: [],
  };

  for (const variant of variants) {
    const promptTemplate = await resolvePromptTemplate(promptDraft, variant, promptTemplatesById);
    const result = await runVariantSafely({
      runId: run.id,
      testCase,
      promptTemplate,
      variant,
      sharedGeneration,
      persist: false,
    });
    run.results.push(result);
  }

  return run;
}

export async function executeBatchRun(payload) {
  const sharedGeneration = normalizeGenerationSettings(payload.generationSettings);
  const variants = normalizeVariants(payload.variants);
  const promptDraft = normalizePromptTemplate(payload.promptDraft);
  const selectedCases = payload.caseIds?.length ? await listTestCasesByIds(payload.caseIds) : [];
  const inlineCases = Array.isArray(payload.inlineCases) ? payload.inlineCases.map(normalizeTestCase) : [];
  const testCases = [...selectedCases, ...inlineCases];
  const promptTemplatesById = {};

  if (!testCases.length) {
    throw new Error("Select at least one saved case or import at least one inline case.");
  }

  const run = await createRun({
    mode: "batch",
    label: payload.label || `Batch ${new Date().toLocaleString()}`,
    status: "running",
    payload: {
      caseCount: testCases.length,
      variantConfigs: variants,
      generationDefaults: sharedGeneration,
      promptSnapshot: promptDraft,
    },
  });

  for (const testCaseInput of testCases) {
    const testCase = normalizeTestCase(testCaseInput);
    for (const variant of variants) {
      const promptTemplate = await resolvePromptTemplate(promptDraft, variant, promptTemplatesById);
      await runVariantSafely({
        runId: run.id,
        testCase,
        promptTemplate,
        variant,
        sharedGeneration,
      });
    }
  }

  await updateRun(run.id, {
    status: "completed",
    payload: {
      ...run.payload,
      completedVariants: testCases.length * variants.length,
    },
  });

  return getRunById(run.id);
}
