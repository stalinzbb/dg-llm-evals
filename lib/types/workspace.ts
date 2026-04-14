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

export type SectionProps = WorkspaceState;

export interface WorkspaceHomeProps {
  initialTab?: WorkspacePage;
}
