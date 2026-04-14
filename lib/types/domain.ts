export interface ModelOption {
  label: string;
  value: string;
  input?: number;
  output?: number;
  provider?: string;
  unavailable?: boolean;
  note?: string;
}

export interface GenerationSettings {
  temperature: number;
  topP: number;
  maxTokens: number;
  seed: string;
}

export interface VariantOverrideInput {
  temperature: number | "";
  topP: number | "";
  maxTokens: number | "";
  seed: string;
}

export interface Variant extends VariantOverrideInput {
  id: string;
  label: string;
  model: string;
  promptSource: string;
  useOverrides: boolean;
}

export interface NormalizedVariant {
  id: string;
  label: string;
  model: string;
  promptSource: string;
  temperature: number | null;
  topP: number | null;
  maxTokens: number | null;
  seed: string;
}

export interface TestCase {
  id: string | null;
  sourceRecordId: string | null;
  sourceType: string | null;
  organizationUuid: string | null;
  isVerified: boolean;
  name: string;
  organizationName: string;
  teamName: string;
  organizationType: string;
  teamActivity: string;
  teamAffiliation: string;
  causeTags: string[];
  messageLength: string;
}

export interface PromptTemplate {
  id: string | null;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  prefixText: string;
  suffixText: string;
  messageLengthInstruction: string;
  isActive: boolean;
}

export type RunMode = "single" | "compare" | "batch";
export type RunStatus = "running" | "completed" | "failed";

export interface RunMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number | null | "";
  latencyMs: number | "";
  causeOnlyCharacters?: number;
  fullMessageCharacters?: number;
}

export interface PricingInfo {
  input: number;
  output: number;
}

export interface RunResult {
  id: string;
  createdAt: string;
  runId: string;
  caseId: string | null;
  caseName: string;
  sourceRecordId: string | null;
  sourceType: string | null;
  organizationUuid: string | null;
  isVerified: boolean;
  variantLabel: string;
  model: string;
  promptTemplateId: string | null;
  promptTemplateName: string;
  promptSource: string;
  generationSettings: GenerationSettings;
  systemPrompt: string;
  userPrompt: string;
  prefixText: string;
  suffixText: string;
  causeStatement: string;
  fullMessage: string;
  metrics: RunMetrics;
  pricing: PricingInfo | null;
  provider: string;
  inputSnapshot: TestCase;
  error: string | null;
}

export interface Rating {
  id: string;
  createdAt: string;
  updatedAt: string;
  runId: string;
  variantResultId?: string | null;
  comparisonKey?: string | null;
  [key: string]: unknown;
}

export interface RunRecordPayload {
  caseSnapshot?: TestCase;
  promptSnapshot?: PromptTemplate;
  variantConfigs?: NormalizedVariant[];
  generationDefaults?: GenerationSettings;
  caseCount?: number;
  completedVariants?: number;
  [key: string]: unknown;
}

export interface Run {
  id: string;
  createdAt: string;
  updatedAt: string;
  mode: RunMode;
  label: string;
  status: RunStatus;
  payload: RunRecordPayload;
  results: RunResult[];
  ratings: Rating[];
}

export type WorkspacePage = "playground" | "batches" | "history" | "settings";
export type PlaygroundMode = "single" | "compare";
export type Theme = "light" | "dark";

export interface AppSettings {
  activeTab: WorkspacePage;
  playgroundMode: PlaygroundMode;
  caseDraft: TestCase;
  promptDraft: PromptTemplate;
  generationSettings: GenerationSettings;
  variants: Variant[];
  batchSelection: string[];
  importedCases: TestCase[];
}

export interface WorkspaceSettings {
  enabledModelIds: string[];
}

export interface PlatformStatus {
  openRouterConfigured: boolean;
  gateEnabled: boolean;
}

export interface SourcePoolStats {
  total: number;
  verified: number;
  unverified: number;
}

export interface SourcePoolRecord {
  id: string;
  importBatchId: string;
  name: string;
  organizationName: string;
  teamName: string;
  organizationUuid: string | null;
  isVerified: boolean;
  organizationType: string;
  teamActivity: string;
  teamAffiliation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BootstrapData {
  storageMode: "local" | "supabase";
  appSettingsStorageMode: "browser" | "supabase";
  appSettings: AppSettings;
  workspaceSettingsStorageMode: "browser" | "supabase";
  settings: WorkspaceSettings;
  testCases: TestCase[];
  promptTemplates: PromptTemplate[];
  runs: Run[];
  sourcePoolStats: SourcePoolStats;
}

export interface OpenRouterCompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface OpenRouterCompletionResult {
  provider: string;
  causeStatement: string;
  usage: OpenRouterCompletionUsage;
  estimatedCost: number | null;
  latencyMs: number;
  pricing: PricingInfo | null;
}
