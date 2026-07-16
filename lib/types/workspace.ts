import type {
  AppSettings,
  GenerationSettings,
  ModelOption,
  PlatformStatus,
  PromptTemplate,
  Run,
  SourcePoolStats,
  TestCase,
  Theme,
  Variant,
  WorkspacePage,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { SaveRatingRequest } from "@/lib/types/api";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";

/** Input for eval-based runs assembled by the sections; shared run config is filled in by actions. */
export interface EvalRunInput {
  mode?: "single" | "compare";
  label?: string;
  evalId?: string | null;
  evalDraft?: Partial<EvalDefinition>;
  templateId?: string;
  manualValues?: Record<string, string>;
  csvRows?: Record<string, string>[] | null;
  columnMapping?: Record<string, string> | null;
}

export interface WorkspaceSnapshot extends AppSettings {}

export interface HandleBatchRunOptions {
  includeSavedCases?: boolean;
  includeImportedCases?: boolean;
  includeSourcePool?: boolean;
}

export interface WorkspaceDerivedState {
  availableModelOptions: ModelOption[];
  canSaveCase: boolean;
  canSavePrompt: boolean;
  defaultEnabledModelId: string;
  enabledModelIds: string[];
  filteredRuns: Run[];
  playgroundMode: "single" | "compare";
  selectedRun: Run | null;
}

export interface WorkspaceState {
  activePage: WorkspacePage;
  availableModelOptions: ModelOption[];
  batchGenerating: boolean;
  batchSampleCount: string;
  batchSelection: string[];
  batchVerificationFilter: string;
  canSaveCase: boolean;
  canSavePrompt: boolean;
  caseDraft: TestCase;
  causeTagOptions: string[];
  defaultEnabledModelId: string;
  dismissMessage: (kind: "error" | "success") => void;
  enabledModelIds: string[];
  errorMessage: string;
  filteredRuns: Run[];
  generationSettings: GenerationSettings;
  handleBatchRun: (options?: {
    includeSavedCases?: boolean;
    includeImportedCases?: boolean;
    includeSourcePool?: boolean;
  }) => Promise<void>;
  handleDeleteCase: (id: string) => Promise<void>;
  handleDeletePrompt: (id: string) => Promise<void>;
  handleGenerate: () => Promise<void>;
  handleEvalGenerate: (input: EvalRunInput) => Promise<void>;
  handleEvalBatchRun: (input: EvalRunInput) => Promise<void>;
  handleSaveEval: (entry: Partial<EvalDefinition>) => Promise<EvalDefinition | null>;
  handleDeleteEval: (id: string) => Promise<void>;
  handleSaveDataset: (entry: Partial<Dataset>) => Promise<Dataset | null>;
  handleDeleteDataset: (id: string) => Promise<void>;
  evals: EvalDefinition[];
  datasets: Dataset[];
  activeEvalId: string;
  setActiveEvalId: (id: string) => void;
  handleImportSourcePool: (file: File | null) => Promise<void>;
  handleRandomizeCaseFromSourcePool: () => Promise<void>;
  handleRandomizeCauseTags: () => void;
  handleSaveCase: (singleCase: TestCase) => Promise<void>;
  handleSaveImportedCases: () => Promise<void>;
  handleSavePrompt: () => Promise<void>;
  handleSaveRating: (payload: SaveRatingRequest) => Promise<void>;
  handleSaveSettings: (settings: Partial<WorkspaceSettings>) => Promise<void>;
  historySearch: string;
  importedCases: TestCase[];
  loading: boolean;
  normalizeTestCase: (input?: Partial<TestCase>) => TestCase;
  platformStatus: PlatformStatus;
  playgroundGenerating: boolean;
  playgroundMode: "single" | "compare";
  playgroundRandomizing: boolean;
  playgroundRun: Run | null;
  promptDraft: PromptTemplate;
  promptTemplates: PromptTemplate[];
  runs: Run[];
  selectedRun: Run | null;
  selectedRunId: string;
  setActivePage: (page: WorkspacePage) => void;
  setBatchSampleCount: (value: string) => void;
  setBatchSelection: (value: string[]) => void;
  setBatchVerificationFilter: (value: string) => void;
  setCaseDraft: React.Dispatch<React.SetStateAction<TestCase>>;
  setGenerationSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  setHistorySearch: (value: string) => void;
  setImportedCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  setPromptDraft: React.Dispatch<React.SetStateAction<PromptTemplate>>;
  setSelectedRunId: (value: string) => void;
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>;
  settings: WorkspaceSettings;
  shapeImportedCase: (record: Record<string, string>) => TestCase;
  sourcePoolImporting: boolean;
  sourcePoolStats: SourcePoolStats;
  statusMessage: string;
  storageMode: string;
  testCases: TestCase[];
  theme: Theme;
  toggleTheme: () => void;
  updateVariant: (id: string, patch: Partial<Variant>) => void;
  variants: Variant[];
  workspaceSaveState: string;
}

export interface WorkspaceStatItem {
  label: string;
  value: number | string;
}

export interface WorkspaceStatusViewModel {
  dismissMessage: (kind: "error" | "success") => void;
  errorMessage: string;
  loading: boolean;
  statusMessage: string;
}

export interface PlaygroundSectionProps {
  activeEvalId: WorkspaceState["activeEvalId"];
  availableModelOptions: WorkspaceState["availableModelOptions"];
  datasets: WorkspaceState["datasets"];
  enabledModelIds: WorkspaceState["enabledModelIds"];
  evals: WorkspaceState["evals"];
  generationSettings: WorkspaceState["generationSettings"];
  handleEvalGenerate: WorkspaceState["handleEvalGenerate"];
  handleSaveEval: WorkspaceState["handleSaveEval"];
  playgroundGenerating: WorkspaceState["playgroundGenerating"];
  playgroundMode: WorkspaceState["playgroundMode"];
  playgroundRun: WorkspaceState["playgroundRun"];
  setActiveEvalId: WorkspaceState["setActiveEvalId"];
  setActivePage: WorkspaceState["setActivePage"];
  setGenerationSettings: WorkspaceState["setGenerationSettings"];
  setVariants: WorkspaceState["setVariants"];
  updateVariant: WorkspaceState["updateVariant"];
  variants: WorkspaceState["variants"];
}

export interface BatchSectionProps {
  activeEvalId: WorkspaceState["activeEvalId"];
  availableModelOptions: WorkspaceState["availableModelOptions"];
  batchGenerating: WorkspaceState["batchGenerating"];
  datasets: WorkspaceState["datasets"];
  enabledModelIds: WorkspaceState["enabledModelIds"];
  evals: WorkspaceState["evals"];
  handleEvalBatchRun: WorkspaceState["handleEvalBatchRun"];
  setActiveEvalId: WorkspaceState["setActiveEvalId"];
  setVariants: WorkspaceState["setVariants"];
  updateVariant: WorkspaceState["updateVariant"];
  variants: WorkspaceState["variants"];
}

export interface EvalsSectionProps {
  datasets: WorkspaceState["datasets"];
  evals: WorkspaceState["evals"];
  handleDeleteDataset: WorkspaceState["handleDeleteDataset"];
  handleDeleteEval: WorkspaceState["handleDeleteEval"];
  handleSaveDataset: WorkspaceState["handleSaveDataset"];
  handleSaveEval: WorkspaceState["handleSaveEval"];
  setActiveEvalId: WorkspaceState["setActiveEvalId"];
  setActivePage: WorkspaceState["setActivePage"];
}

export interface HistorySectionProps {
  filteredRuns: WorkspaceState["filteredRuns"];
  handleSaveRating: WorkspaceState["handleSaveRating"];
  historySearch: WorkspaceState["historySearch"];
  selectedRun: WorkspaceState["selectedRun"];
  selectedRunId: WorkspaceState["selectedRunId"];
  setHistorySearch: WorkspaceState["setHistorySearch"];
  setSelectedRunId: WorkspaceState["setSelectedRunId"];
}

export interface SettingsSectionProps {
  enabledModelIds: WorkspaceState["enabledModelIds"];
  handleImportSourcePool: WorkspaceState["handleImportSourcePool"];
  handleSaveSettings: WorkspaceState["handleSaveSettings"];
  sourcePoolImporting: WorkspaceState["sourcePoolImporting"];
  sourcePoolStats: WorkspaceState["sourcePoolStats"];
}

export interface WorkspaceHomeProps {
  initialTab?: WorkspacePage;
}
