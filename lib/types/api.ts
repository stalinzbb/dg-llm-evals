import type {
  AppSettings,
  BootstrapData,
  Run,
  WorkspaceSettings,
  Rating,
  Variant,
  GenerationSettings,
} from "@/lib/types/domain";
import type { EvalDefinition } from "@/lib/types/eval";

export interface ApiErrorResponse {
  error: string;
}

export interface BootstrapResponse extends BootstrapData {
  openRouterConfigured: boolean;
  gateEnabled: boolean;
}

export interface AppSettingsResponse {
  appSettings: AppSettings;
}

export interface WorkspaceSettingsResponse {
  settings: WorkspaceSettings;
}

export interface RunsResponse {
  runs: Run[];
}

export interface RunResponse {
  run: Run;
}

export interface EvalRunRequest {
  mode?: "single" | "compare";
  label?: string;
  /** Saved eval to run; when absent, evalDraft is used. */
  evalId?: string | null;
  /** Unsaved eval definition (draft) to run directly. */
  evalDraft?: Partial<EvalDefinition>;
  /** Which template in the eval to run; defaults to the first. */
  templateId?: string;
  manualValues?: Record<string, string>;
  csvRows?: Record<string, string>[] | null;
  columnMapping?: Record<string, string> | null;
  generationSettings: GenerationSettings;
  settings?: WorkspaceSettings;
  variants: Variant[];
}

export interface SaveRatingRequest extends Rating {}

export interface AuthSuccessResponse {
  ok: true;
}
