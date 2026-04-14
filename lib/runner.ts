import {
  buildFullMessage,
  normalizeGenerationSettings,
  normalizePromptTemplate,
  normalizeTestCase,
  normalizeVariants,
  renderUserPrompt,
  scoreCharacterCounts,
} from "@/lib/prompt";
import {
  addVariantResult,
  createRun,
  getPromptTemplateById,
  getRunById,
  listTestCasesByIds,
  updateRun,
} from "@/lib/store";
import { requestCompletion } from "@/lib/openrouter";
import type { BatchRunRequest, GenerateRunRequest } from "@/lib/types/api";
import type {
  GenerationSettings,
  NormalizedVariant,
  PromptTemplate,
  Run,
  RunResult,
  TestCase,
} from "@/lib/types/domain";

function createEphemeralId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function buildVariantSettings(sharedGeneration: GenerationSettings, variant: NormalizedVariant): GenerationSettings {
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

async function resolvePromptTemplate(
  promptDraft: PromptTemplate,
  variant: NormalizedVariant,
  promptTemplatesById: Record<string, PromptTemplate>,
): Promise<PromptTemplate> {
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
}: {
  runId: string;
  testCase: TestCase;
  promptTemplate: PromptTemplate;
  variant: NormalizedVariant;
  sharedGeneration: GenerationSettings;
  persist?: boolean;
}): Promise<RunResult> {
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
    sourceRecordId: testCase.sourceRecordId || null,
    sourceType: testCase.sourceType || null,
    organizationUuid: testCase.organizationUuid || null,
    isVerified: Boolean(testCase.isVerified),
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

async function runVariantSafely(args: Parameters<typeof runVariant>[0]): Promise<RunResult> {
  try {
    return await runVariant(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    const errorPayload = {
      runId: args.runId,
      caseId: args.testCase.id || null,
      caseName: args.testCase.name,
      sourceRecordId: args.testCase.sourceRecordId || null,
      sourceType: args.testCase.sourceType || null,
      organizationUuid: args.testCase.organizationUuid || null,
      isVerified: Boolean(args.testCase.isVerified),
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
      error: message,
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

export async function executePlaygroundRun(payload: GenerateRunRequest): Promise<Run | null> {
  const testCase = normalizeTestCase(payload.caseInput);
  const promptDraft = normalizePromptTemplate(payload.promptDraft);
  const sharedGeneration = normalizeGenerationSettings(payload.generationSettings);
  const variants = normalizeVariants(payload.variants, {
    enabledModelIds: payload.settings?.enabledModelIds,
  });
  const promptTemplatesById: Record<string, PromptTemplate> = {};

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

export async function executeBatchRun(payload: BatchRunRequest): Promise<Run | null> {
  const sharedGeneration = normalizeGenerationSettings(payload.generationSettings);
  const variants = normalizeVariants(payload.variants, {
    enabledModelIds: payload.settings?.enabledModelIds,
  });
  const promptDraft = normalizePromptTemplate(payload.promptDraft);
  const selectedCases = payload.caseIds?.length ? await listTestCasesByIds(payload.caseIds) : [];
  const inlineCases = Array.isArray(payload.inlineCases) ? payload.inlineCases.map(normalizeTestCase) : [];
  const testCases = [...selectedCases, ...inlineCases];
  const promptTemplatesById: Record<string, PromptTemplate> = {};

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
