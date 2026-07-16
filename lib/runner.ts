import {
  buildWrappedOutput,
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
  getDatasetById,
  getEvalById,
  getPromptTemplateById,
  getRunById,
  listTestCasesByIds,
  updateRun,
} from "@/lib/store";
import { normalizeEvalDefinition } from "@/lib/eval";
import { requestCompletion } from "@/lib/openrouter";
import { normalizeRun } from "@/lib/runs";
import { renderTemplate, validateTemplate } from "@/lib/template";
import { resolveVariables } from "@/lib/resolve-variables";
import type {
  BatchRunRequest,
  EvalRunRequest,
  GenerateRunRequest,
} from "@/lib/types/api";
import type {
  GenerationSettings,
  NormalizedVariant,
  PromptTemplate,
  Run,
  RunResult,
  TestCase,
} from "@/lib/types/domain";
import type { Dataset, EvalDefinition, EvalPromptTemplate, ResolvedVariables } from "@/lib/types/eval";

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

interface RunnerOptions {
  apiKey?: string | null;
}

/* ------------------------------------------------------------------ */
/* Eval-based execution                                                */
/* ------------------------------------------------------------------ */

async function loadEvalContext(payload: EvalRunRequest): Promise<{
  evalDefinition: EvalDefinition;
  template: EvalPromptTemplate;
  datasets: Dataset[];
}> {
  const saved = payload.evalId ? await getEvalById(payload.evalId) : null;
  const evalDefinition = normalizeEvalDefinition(saved || payload.evalDraft || {});
  if (!evalDefinition.templates.length) {
    throw new Error("This eval has no prompt templates.");
  }

  const template =
    evalDefinition.templates.find((item) => item.id === payload.templateId) ||
    evalDefinition.templates[0];

  const validation = validateTemplate(template.userPromptTemplate, evalDefinition.variables);
  if (!validation.valid) {
    throw new Error(validation.errors.map((issue) => issue.message).join(" "));
  }

  const datasetIds = [
    ...new Set(
      evalDefinition.variables
        .map((variable) => variable.datasetId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const datasets = (
    await Promise.all(datasetIds.map((id) => getDatasetById(id)))
  ).filter((dataset): dataset is Dataset => dataset !== null);

  return { evalDefinition, template, datasets };
}

async function runEvalVariant({
  runId,
  evalDefinition,
  template,
  resolved,
  caseName,
  variant,
  sharedGeneration,
  apiKey,
}: {
  runId: string;
  evalDefinition: EvalDefinition;
  template: EvalPromptTemplate;
  resolved: ResolvedVariables;
  caseName: string;
  variant: NormalizedVariant;
  sharedGeneration: GenerationSettings;
  apiKey?: string | null;
}): Promise<RunResult> {
  const generationSettings = buildVariantSettings(sharedGeneration, variant);
  const userPrompt = renderTemplate(template.userPromptTemplate, resolved.values).output;
  const systemPrompt = renderTemplate(template.systemPrompt, resolved.values).output;

  const basePayload = {
    runId,
    caseId: null,
    caseName,
    sourceRecordId: null,
    sourceType: null,
    organizationUuid: null,
    isVerified: false,
    variantLabel: variant.label,
    model: variant.model,
    promptTemplateId: template.id,
    promptTemplateName: template.name,
    promptSource: variant.promptSource,
    generationSettings,
    systemPrompt,
    userPrompt,
    prefixText: template.prefixText,
    suffixText: template.suffixText,
    variableValues: resolved.values,
    variableSources: resolved.sources,
  };

  try {
    const response = await requestCompletion({
      model: variant.model,
      systemPrompt,
      userPrompt,
      generationSettings,
      apiKey,
    });
    const wrappedOutput = buildWrappedOutput(template, response.output);
    return addVariantResult({
      ...basePayload,
      output: response.output,
      wrappedOutput,
      metrics: {
        ...response.usage,
        estimatedCost: response.estimatedCost,
        latencyMs: response.latencyMs,
        ...scoreCharacterCounts(response.output, wrappedOutput),
      },
      pricing: response.pricing,
      provider: response.provider,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    return addVariantResult({
      ...basePayload,
      output: "",
      wrappedOutput: "",
      metrics: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: null,
        latencyMs: 0,
        outputCharacters: 0,
        wrappedOutputCharacters: 0,
      },
      pricing: null,
      provider: "error",
      error: message,
    });
  }
}

function describeRecord(evalDefinition: EvalDefinition, resolved: ResolvedVariables, index: number, total: number) {
  const firstValue = evalDefinition.variables
    .map((variable) => resolved.values[variable.key])
    .find((value) => value && value.trim());
  const suffix = total > 1 ? ` · row ${index + 1}` : "";
  return `${firstValue || evalDefinition.name}${suffix}`;
}

export async function executeEvalRun(
  payload: EvalRunRequest,
  options: RunnerOptions = {},
): Promise<Run | null> {
  const { evalDefinition, template, datasets } = await loadEvalContext(payload);
  const sharedGeneration = normalizeGenerationSettings(payload.generationSettings);
  const variants = normalizeVariants(payload.variants, {
    enabledModelIds: payload.settings?.enabledModelIds,
  });

  const records = resolveVariables(
    evalDefinition,
    datasets,
    {
      manualValues: payload.manualValues || {},
      csvRows: payload.csvRows || null,
      columnMapping: payload.columnMapping || null,
    },
    { seed: sharedGeneration.seed || undefined },
  );

  const isBatch = records.length > 1;
  const run = await createRun({
    mode: isBatch ? "batch" : payload.mode === "compare" ? "compare" : "single",
    label: payload.label || evalDefinition.name,
    status: "running",
    payload: {
      evalId: payload.evalId || evalDefinition.id || null,
      evalSnapshot: evalDefinition,
      templateId: template.id,
      variantConfigs: variants,
      generationDefaults: sharedGeneration,
      caseCount: records.length,
    },
  });

  for (const [index, resolved] of records.entries()) {
    const caseName = describeRecord(evalDefinition, resolved, index, records.length);
    for (const variant of variants) {
      await runEvalVariant({
        runId: run.id,
        evalDefinition,
        template,
        resolved,
        caseName,
        variant,
        sharedGeneration,
        apiKey: options.apiKey,
      });
    }
  }

  await updateRun(run.id, {
    status: "completed",
    payload: { ...run.payload, completedVariants: records.length * variants.length },
  });
  const finished = await getRunById(run.id);
  return finished ? normalizeRun(finished) : null;
}

/* ------------------------------------------------------------------ */
/* Legacy fundraiser execution (used until the UI moves to evals)      */
/* ------------------------------------------------------------------ */

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
  apiKey,
  persist = true,
}: {
  runId: string;
  testCase: TestCase;
  promptTemplate: PromptTemplate;
  variant: NormalizedVariant;
  sharedGeneration: GenerationSettings;
  apiKey?: string | null;
  persist?: boolean;
}): Promise<RunResult> {
  const generationSettings = buildVariantSettings(sharedGeneration, variant);
  const userPrompt = renderUserPrompt(testCase, promptTemplate);
  const response = await requestCompletion({
    model: variant.model,
    systemPrompt: promptTemplate.systemPrompt,
    userPrompt,
    generationSettings,
    apiKey,
  });

  const wrappedOutput = buildWrappedOutput(promptTemplate, response.output);
  const characters = scoreCharacterCounts(response.output, wrappedOutput);

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
    output: response.output,
    wrappedOutput,
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
      output: "",
      wrappedOutput: "",
      metrics: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: null,
        latencyMs: 0,
        outputCharacters: 0,
        wrappedOutputCharacters: 0,
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

export async function executePlaygroundRun(
  payload: GenerateRunRequest,
  options: RunnerOptions = {},
): Promise<Run | null> {
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
      apiKey: options.apiKey,
    });
  }

  await updateRun(run.id, { status: "completed" });
  const finished = await getRunById(run.id);
  return finished ? normalizeRun(finished) : null;
}

export async function executeBatchRun(
  payload: BatchRunRequest,
  options: RunnerOptions = {},
): Promise<Run | null> {
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
        apiKey: options.apiKey,
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

  const finished = await getRunById(run.id);
  return finished ? normalizeRun(finished) : null;
}
