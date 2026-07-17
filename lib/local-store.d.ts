import type {
  AppSettings,
  BootstrapData,
  Rating,
  Run,
  RunResult,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";

export function getBootstrapData(): Promise<BootstrapData>;
export function getWorkspaceSettings(): Promise<WorkspaceSettings>;
export function saveWorkspaceSettings(entry: Partial<WorkspaceSettings>): Promise<WorkspaceSettings>;
export function getAppSettings(): Promise<AppSettings>;
export function saveAppSettings(entry: Partial<AppSettings>): Promise<AppSettings>;
export function createRun(record: Omit<Run, "id" | "createdAt" | "updatedAt" | "results" | "ratings">): Promise<Run>;
export function updateRun(runId: string, patch: Partial<Run>): Promise<Run>;
export function addVariantResult(result: Omit<RunResult, "id" | "createdAt">): Promise<RunResult>;
export function saveRating(entry: Rating): Promise<Rating>;
export function getRunById(runId: string): Promise<Run | null>;
export function listEvals(): Promise<EvalDefinition[]>;
export function getEvalById(id: string): Promise<EvalDefinition | null>;
export function saveEval(entry: Partial<EvalDefinition> & { createdAt?: string }): Promise<EvalDefinition>;
export function deleteEval(id: string): Promise<EvalDefinition[]>;
export function listDatasets(): Promise<Dataset[]>;
export function getDatasetById(id: string): Promise<Dataset | null>;
export function saveDataset(entry: Partial<Dataset> & { createdAt?: string }): Promise<Dataset>;
export function deleteDataset(id: string): Promise<Dataset[]>;
