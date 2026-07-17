import type {
  AppSettings,
  GenerationSettings,
  ModelOption,
  PlatformStatus,
  Run,
  Theme,
  Variant,
  WorkspacePage,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { SaveRatingRequest } from "@/lib/types/api";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";

export interface WorkspaceSnapshot extends AppSettings {}

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

export interface WorkspaceState {
  activePage: WorkspacePage;
  activeEvalId: string;
  availableModelOptions: ModelOption[];
  batchGenerating: boolean;
  datasets: Dataset[];
  defaultEnabledModelId: string;
  dismissMessage: (kind: "error" | "success") => void;
  enabledModelIds: string[];
  errorMessage: string;
  evals: EvalDefinition[];
  filteredRuns: Run[];
  generationSettings: GenerationSettings;
  handleDeleteDataset: (id: string) => Promise<void>;
  handleDeleteEval: (id: string) => Promise<void>;
  handleEvalBatchRun: (input: EvalRunInput) => Promise<void>;
  handleEvalGenerate: (input: EvalRunInput) => Promise<void>;
  handleSaveDataset: (entry: Partial<Dataset>) => Promise<Dataset | null>;
  handleSaveEval: (entry: Partial<EvalDefinition>) => Promise<EvalDefinition | null>;
  handleSaveRating: (payload: SaveRatingRequest) => Promise<void>;
  handleSaveSettings: (settings: Partial<WorkspaceSettings>) => Promise<void>;
  historySearch: string;
  loading: boolean;
  platformStatus: PlatformStatus;
  playgroundGenerating: boolean;
  playgroundMode: "single" | "compare";
  playgroundRun: Run | null;
  runs: Run[];
  selectedRun: Run | null;
  selectedRunId: string;
  setActiveEvalId: (id: string) => void;
  setActivePage: (page: WorkspacePage) => void;
  setGenerationSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  setHistorySearch: (value: string) => void;
  setSelectedRunId: (value: string) => void;
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>;
  settings: WorkspaceSettings;
  statusMessage: string;
  storageMode: string;
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
  handleSaveSettings: WorkspaceState["handleSaveSettings"];
}

export interface WorkspaceHomeProps {
  initialTab?: WorkspacePage;
}
