import * as localStore from "@/lib/local-store";
import * as supabaseStore from "@/lib/supabase-store";
import type {
  AppSettings,
  BootstrapData,
  PromptTemplate,
  Rating,
  Run,
  RunResult,
  SourcePoolRecord,
  SourcePoolStats,
  TestCase,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { SourcePoolImportResponse, SourcePoolSampleResponse } from "@/lib/types/api";

type StoreModule = typeof localStore;

async function withFallback<K extends keyof StoreModule>(
  method: K,
  ...args: Parameters<StoreModule[K]>
): Promise<Awaited<ReturnType<StoreModule[K]>>> {
  const supabaseMethod = supabaseStore[method] as unknown as (
    ...innerArgs: Parameters<StoreModule[K]>
  ) => Promise<Awaited<ReturnType<StoreModule[K]>> | null>;
  try {
    const supabaseResult = await supabaseMethod(...args);
    if (supabaseResult !== null) {
      return supabaseResult as Awaited<ReturnType<StoreModule[K]>>;
    }
  } catch (error) {
    console.error(`Supabase store failed for ${String(method)}, falling back to local store.`, error);
  }

  const localMethod = localStore[method] as unknown as (
    ...innerArgs: Parameters<StoreModule[K]>
  ) => Promise<Awaited<ReturnType<StoreModule[K]>>>;
  return localMethod(...args);
}

export function getBootstrapData(): Promise<BootstrapData> {
  return withFallback("getBootstrapData");
}

export function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  return withFallback("getWorkspaceSettings");
}

export function getAppSettings(): Promise<AppSettings> {
  return withFallback("getAppSettings");
}

export function listTestCasesByIds(ids: string[]): Promise<TestCase[]> {
  return withFallback("listTestCasesByIds", ids);
}

export function getPromptTemplateById(id: string): Promise<PromptTemplate | null> {
  return withFallback("getPromptTemplateById", id);
}

export function saveTestCases(entries: TestCase[] | TestCase): Promise<TestCase[]> {
  return withFallback("saveTestCases", entries);
}

export function saveWorkspaceSettings(entry: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  return withFallback("saveWorkspaceSettings", entry);
}

export function saveAppSettings(entry: Partial<AppSettings>): Promise<AppSettings> {
  return withFallback("saveAppSettings", entry);
}

export function savePromptTemplate(
  entry: PromptTemplate & { createdAt?: string },
): Promise<PromptTemplate> {
  return withFallback("savePromptTemplate", entry);
}

export function deleteTestCase(id: string): Promise<TestCase[]> {
  return withFallback("deleteTestCase", id);
}

export function deletePromptTemplate(id: string): Promise<PromptTemplate[]> {
  return withFallback("deletePromptTemplate", id);
}

export function createRun(
  record: Omit<Run, "id" | "createdAt" | "updatedAt" | "results" | "ratings">,
): Promise<Run> {
  return withFallback("createRun", record);
}

export function updateRun(runId: string, patch: Partial<Run>): Promise<Run> {
  return withFallback("updateRun", runId, patch);
}

export function addVariantResult(result: Omit<RunResult, "id" | "createdAt">): Promise<RunResult> {
  return withFallback("addVariantResult", result);
}

export function saveRating(entry: Rating): Promise<Rating> {
  return withFallback("saveRating", entry);
}

export function getRunById(runId: string): Promise<Run | null> {
  return withFallback("getRunById", runId);
}

export function getSourcePoolStats(): Promise<SourcePoolStats> {
  return withFallback("getSourcePoolStats");
}

export function importSourcePool(
  entries: SourcePoolRecord[] | Record<string, string>[],
  options?: { replace?: boolean },
): Promise<SourcePoolImportResponse> {
  return withFallback("importSourcePool", entries, options);
}

export function getRandomSourcePoolRecord(
  verificationFilter?: "any" | "verified" | "unverified",
): Promise<SourcePoolRecord | null> {
  return withFallback("getRandomSourcePoolRecord", verificationFilter);
}

export function sampleSourcePool(options?: {
  count?: number;
  verificationFilter?: "any" | "verified" | "unverified";
}): Promise<SourcePoolSampleResponse> {
  return withFallback("sampleSourcePool", options);
}
