import * as localStore from "@/lib/local-store";
import * as supabaseStore from "@/lib/supabase-store";
import type {
  AppSettings,
  BootstrapData,
  Rating,
  Run,
  RunResult,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";

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

export function saveWorkspaceSettings(entry: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  return withFallback("saveWorkspaceSettings", entry);
}

export function saveAppSettings(entry: Partial<AppSettings>): Promise<AppSettings> {
  return withFallback("saveAppSettings", entry);
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

export function listEvals(): Promise<EvalDefinition[]> {
  return withFallback("listEvals");
}

export function getEvalById(id: string): Promise<EvalDefinition | null> {
  return withFallback("getEvalById", id);
}

export function saveEval(
  entry: Partial<EvalDefinition> & { createdAt?: string },
): Promise<EvalDefinition> {
  return withFallback("saveEval", entry);
}

export function deleteEval(id: string): Promise<EvalDefinition[]> {
  return withFallback("deleteEval", id);
}

export function listDatasets(): Promise<Dataset[]> {
  return withFallback("listDatasets");
}

export function getDatasetById(id: string): Promise<Dataset | null> {
  return withFallback("getDatasetById", id);
}

export function saveDataset(entry: Partial<Dataset> & { createdAt?: string }): Promise<Dataset> {
  return withFallback("saveDataset", entry);
}

export function deleteDataset(id: string): Promise<Dataset[]> {
  return withFallback("deleteDataset", id);
}
