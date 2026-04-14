import { MODEL_OPTIONS, getDefaultEnabledModelId, getEnabledModelOptions } from "@/lib/constants";
import { getPromptTemplateSignature, getTestCaseSignature, normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";
import type {
  ModelOption,
  PlatformStatus,
  PromptTemplate,
  Run,
  SourcePoolStats,
  TestCase,
  Variant,
} from "@/lib/types/domain";
import type { WorkspaceStatItem } from "@/lib/types/workspace";

export function getAvailableModelOptions(enabledModelIds: string[]): ModelOption[] {
  return getEnabledModelOptions(enabledModelIds);
}

export function getWorkspaceDefaultEnabledModelId(enabledModelIds: string[]): string {
  return getDefaultEnabledModelId(enabledModelIds);
}

export function getSelectedRun(runs: Run[], selectedRunId: string): Run | null {
  return runs.find((run) => run.id === selectedRunId) || runs[0] || null;
}

export function getPlaygroundMode(variants: Variant[]): "single" | "compare" {
  return variants.length > 1 ? "compare" : "single";
}

export function getFilteredRuns(runs: Run[], search: string): Run[] {
  if (!search.trim()) {
    return runs;
  }

  const normalizedSearch = search.toLowerCase();
  return runs.filter((run) => {
    const haystack = [
      run.id,
      run.label,
      run.mode,
      ...(run.results || []).map(
        (result) => `${result.id} ${result.caseName} ${result.model} ${result.variantLabel}`,
      ),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });
}

export function getCaseDraftSignature(caseDraft: TestCase): string {
  return getTestCaseSignature(normalizeTestCase(caseDraft));
}

export function getPromptDraftSignature(promptDraft: PromptTemplate): string {
  return getPromptTemplateSignature(normalizePromptTemplate(promptDraft));
}

export function getCaseMatchesExisting(testCases: TestCase[], signature: string): boolean {
  return testCases.some((item) => getTestCaseSignature(item) === signature);
}

export function getPromptMatchesExisting(promptTemplates: PromptTemplate[], signature: string): boolean {
  return promptTemplates.some((item) => getPromptTemplateSignature(item) === signature);
}

export function getWorkspaceStatItems(args: {
  platformStatus: PlatformStatus;
  promptTemplateCount: number;
  runCount: number;
  sourcePoolStats: SourcePoolStats;
  testCaseCount: number;
  workspaceSaveState: string;
}): WorkspaceStatItem[] {
  return [
    {
      label: "Generation",
      value: args.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
    },
    { label: "Cases", value: args.testCaseCount },
    { label: "Prompts", value: args.promptTemplateCount },
    { label: "Runs", value: args.runCount },
    { label: "Source pool", value: args.sourcePoolStats.total },
    { label: "Workspace", value: args.workspaceSaveState },
  ];
}

export function getSourcePoolSummary(sourcePoolStats: SourcePoolStats): string {
  return `Current pool: ${sourcePoolStats.total} rows, ${sourcePoolStats.verified} verified, ${sourcePoolStats.unverified} unverified.`;
}

export function sanitizeModelConfigurationIds(value: unknown): string[] {
  const runnableModelIds = MODEL_OPTIONS.filter((model) => !model.unavailable).map(
    (model) => model.value,
  );
  const ids = Array.isArray(value) ? value : [];
  return ids.filter(
    (id, index) =>
      typeof id === "string" && runnableModelIds.includes(id) && ids.indexOf(id) === index,
  );
}

export function getModelConfigurationState(
  draftEnabledModelIds: string[],
  enabledModelIds: string[],
): {
  enabledRunnableCount: number;
  hasChanges: boolean;
  selectedEnabledIds: string[];
} {
  const selectedEnabledIds = sanitizeModelConfigurationIds(draftEnabledModelIds);
  const persistedEnabledIds = sanitizeModelConfigurationIds(enabledModelIds);

  return {
    enabledRunnableCount: selectedEnabledIds.length,
    hasChanges: JSON.stringify(selectedEnabledIds) !== JSON.stringify(persistedEnabledIds),
    selectedEnabledIds,
  };
}
