import {
  buildWrappedOutput,
  normalizeGenerationSettings,
  normalizeVariants,
  scoreCharacterCounts,
} from "@/lib/prompt";
import {
  addVariantResult,
  createRun,
  getDatasetById,
  getEvalById,
  getRunById,
  updateRun,
} from "@/lib/store";
import { normalizeEvalDefinition } from "@/lib/eval";
import { requestCompletion } from "@/lib/openrouter";
import { normalizeRun } from "@/lib/runs";
import { renderTemplate, validateTemplate } from "@/lib/template";
import { resolveVariables } from "@/lib/resolve-variables";
import type { EvalRunRequest } from "@/lib/types/api";
import type { GenerationSettings, NormalizedVariant, Run, RunResult } from "@/lib/types/domain";
import type { Dataset, EvalDefinition, EvalPromptTemplate, ResolvedVariables } from "@/lib/types/eval";

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
  template,
  resolved,
  caseName,
  variant,
  sharedGeneration,
  apiKey,
}: {
  runId: string;
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
