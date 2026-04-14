import type {
  AppSettings,
  BootstrapData,
  Run,
  SourcePoolRecord,
  SourcePoolStats,
  TestCase,
  PromptTemplate,
  WorkspaceSettings,
  Rating,
  Variant,
  GenerationSettings,
} from "@/lib/types/domain";

export interface ApiErrorResponse {
  error: string;
}

export interface BootstrapResponse extends BootstrapData {
  openRouterConfigured: boolean;
  gateEnabled: boolean;
}

export interface TestCasesResponse {
  testCases: TestCase[];
}

export interface SaveTestCasesRequest {
  entries?: TestCase[];
  id?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface PromptTemplatesResponse {
  promptTemplates: PromptTemplate[];
}

export type SavePromptTemplateRequest = PromptTemplate & {
  createdAt?: string;
};

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

export interface GenerateRunRequest {
  mode: "single" | "compare";
  label?: string;
  caseInput: TestCase;
  promptDraft: PromptTemplate;
  generationSettings: GenerationSettings;
  settings?: WorkspaceSettings;
  variants: Variant[];
}

export interface BatchRunRequest {
  label?: string;
  caseIds?: string[];
  inlineCases?: TestCase[];
  promptDraft: PromptTemplate;
  generationSettings: GenerationSettings;
  settings?: WorkspaceSettings;
  variants: Variant[];
}

export interface SaveRatingRequest extends Rating {}

export interface SourcePoolStatsResponse {
  stats: SourcePoolStats;
}

export interface SourcePoolImportRequest {
  action: "import";
  entries?: Record<string, string>[];
  csvText?: string;
  replace?: boolean;
}

export interface SourcePoolRandomRequest {
  action: "random";
  verificationFilter?: "any" | "verified" | "unverified";
}

export interface SourcePoolSampleRequest {
  action: "sample";
  count?: number;
  verificationFilter?: "any" | "verified" | "unverified";
}

export type SourcePoolRequest =
  | SourcePoolImportRequest
  | SourcePoolRandomRequest
  | SourcePoolSampleRequest;

export interface SourcePoolImportResponse {
  importBatchId: string;
  importedCount: number;
  skippedCount: number;
  stats: SourcePoolStats;
}

export interface SourcePoolRandomResponse {
  row: SourcePoolRecord | null;
}

export interface SourcePoolSampleResponse {
  requestedCount: number;
  actualCount: number;
  rows: SourcePoolRecord[];
  stats: SourcePoolStats;
}

export interface AuthSuccessResponse {
  ok: true;
}
