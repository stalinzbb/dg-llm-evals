import { getEnabledModelOptions, getDefaultEnabledModelId } from "@/lib/constants";
import { getPromptTemplateSignature, getTestCaseSignature, normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";
import type {
  ModelOption,
  PromptTemplate,
  Run,
  TestCase,
  Variant,
} from "@/lib/types/domain";

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
