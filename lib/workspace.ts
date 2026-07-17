import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createDefaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import { DEFAULT_ENABLED_MODEL_IDS, normalizeEnabledModelIds } from "@/lib/constants";
import { createWorkspaceActions } from "@/lib/workspace-actions";
import {
  applyThemePreference,
  readBrowserAppSettings,
  readBrowserModelSettings,
  readStoredTheme,
  writeBrowserAppSettings,
} from "@/lib/workspace-browser";
import { fetchBootstrap, saveAppSettingsRequest } from "@/lib/workspace-api";
import {
  getAvailableModelOptions,
  getFilteredRuns,
  getPlaygroundMode,
  getSelectedRun,
  getWorkspaceDefaultEnabledModelId,
} from "@/lib/workspace-selectors";
import type {
  GenerationSettings,
  ModelOption,
  Run,
  Theme,
  Variant,
  WorkspacePage,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";
import type { WorkspaceSnapshot, WorkspaceState } from "@/lib/types/workspace";

type StorageMode = "local" | "supabase";
type SettingsStorageMode = "browser" | "supabase";

function ensureErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function downloadCsv(filename: string, csvString: string) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createInitialVariant(enabledModelIds = DEFAULT_ENABLED_MODEL_IDS): Variant {
  return {
    ...createDefaultAppSettings().variants[0],
    model: getWorkspaceDefaultEnabledModelId(enabledModelIds),
    id: crypto.randomUUID(),
  };
}

export function serializeRunRows(runs: Run[]) {
  return runs.flatMap((run) =>
    (run.results || []).map((result) => ({
      runId: run.id,
      runLabel: run.label,
      runMode: run.mode,
      createdAt: run.createdAt,
      caseName: result.caseName,
      variantLabel: result.variantLabel,
      model: result.model,
      promptTemplateName: result.promptTemplateName,
      variableValues: JSON.stringify(result.variableValues || {}),
      output: result.output,
      wrappedOutput: result.wrappedOutput,
      promptTokens: result.metrics?.promptTokens ?? 0,
      completionTokens: result.metrics?.completionTokens ?? 0,
      totalTokens: result.metrics?.totalTokens ?? 0,
      estimatedCost: result.metrics?.estimatedCost ?? "",
      latencyMs: result.metrics?.latencyMs ?? "",
      error: result.error || "",
    })),
  );
}

export function formatModelOption(model: ModelOption) {
  if (model.unavailable) {
    return `${model.label} · unavailable`;
  }
  return `${model.label} · $${model.input}/$${model.output} per 1M in/out`;
}

export function formatShortId(value: string, length = 8) {
  if (!value) {
    return "";
  }
  return value.slice(0, length);
}

function createWorkspaceSnapshot(args: {
  activePage: WorkspacePage;
  playgroundMode: "single" | "compare";
  generationSettings: GenerationSettings;
  variants: Variant[];
}): WorkspaceSnapshot {
  return {
    activeTab: args.activePage,
    playgroundMode: args.playgroundMode,
    generationSettings: args.generationSettings,
    variants: args.variants,
  };
}

export function useWorkspaceState(defaultPage: WorkspacePage = "playground"): WorkspaceState {
  const initialPageRef = useRef(defaultPage);
  const defaultAppSettingsRef = useRef(createDefaultAppSettings());
  const [activePage, setActivePage] = useState<WorkspacePage>(defaultPage);
  const [runs, setRuns] = useState<Run[]>([]);
  const [evals, setEvals] = useState<EvalDefinition[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeEvalId, setActiveEvalId] = useState("");
  const [storageMode, setStorageMode] = useState<StorageMode>("local");
  const [platformStatus, setPlatformStatus] = useState({
    openRouterConfigured: false,
    gateEnabled: false,
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(
    defaultAppSettingsRef.current.generationSettings,
  );
  const [settings, setSettings] = useState<WorkspaceSettings>({ enabledModelIds: DEFAULT_ENABLED_MODEL_IDS });
  const [variants, setVariants] = useState<Variant[]>(defaultAppSettingsRef.current.variants);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [playgroundRun, setPlaygroundRun] = useState<Run | null>(null);
  const [playgroundGenerating, setPlaygroundGenerating] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [workspaceSaveState, setWorkspaceSaveState] = useState("Saved");
  const [appSettingsStorageMode, setAppSettingsStorageMode] = useState<SettingsStorageMode>("browser");
  const [workspaceSettingsStorageMode, setWorkspaceSettingsStorageMode] = useState<SettingsStorageMode>("browser");
  const workspaceSettingsReadyRef = useRef(false);
  const workspaceSaveTimerRef = useRef<number | null>(null);
  const skipNextWorkspaceSaveRef = useRef(false);

  const deferredSearch = useDeferredValue(historySearch);
  const enabledModelIds = useMemo(
    () => normalizeEnabledModelIds(settings.enabledModelIds),
    [settings.enabledModelIds],
  );
  const availableModelOptions = useMemo(
    () => getAvailableModelOptions(enabledModelIds),
    [enabledModelIds],
  );
  const defaultEnabledModelId = useMemo(
    () => getWorkspaceDefaultEnabledModelId(enabledModelIds),
    [enabledModelIds],
  );
  const selectedRun = useMemo(
    () => getSelectedRun(runs, selectedRunId),
    [runs, selectedRunId],
  );
  const playgroundMode = useMemo(() => getPlaygroundMode(variants), [variants]);
  const filteredRuns = useMemo(
    () => getFilteredRuns(runs, deferredSearch),
    [runs, deferredSearch],
  );

  useEffect(() => {
    async function loadAppData() {
      setLoading(true);
      try {
        const payload = await fetchBootstrap();
        const nextStorageMode = payload.storageMode || "local";
        const nextAppSettingsStorageMode =
          payload.appSettingsStorageMode || (nextStorageMode === "supabase" ? "supabase" : "browser");
        const nextWorkspaceSettingsStorageMode =
          payload.workspaceSettingsStorageMode || (nextStorageMode === "supabase" ? "supabase" : "browser");
        const serverAppSettings = normalizeAppSettings(payload.appSettings);
        const serverWorkspaceSettings = {
          enabledModelIds: normalizeEnabledModelIds(payload.settings?.enabledModelIds),
        };
        const appSettings =
          nextAppSettingsStorageMode === "supabase"
            ? serverAppSettings
            : readBrowserAppSettings(serverAppSettings);
        const resolvedWorkspaceSettings =
          nextWorkspaceSettingsStorageMode === "supabase"
            ? serverWorkspaceSettings
            : readBrowserModelSettings(serverWorkspaceSettings);

        skipNextWorkspaceSaveRef.current = true;
        setRuns(payload.runs || []);
        setEvals(payload.evals || []);
        setDatasets(payload.datasets || []);
        setActiveEvalId((current) => current || payload.evals?.[0]?.id || "");
        setStorageMode(nextStorageMode);
        setAppSettingsStorageMode(nextAppSettingsStorageMode);
        setWorkspaceSettingsStorageMode(nextWorkspaceSettingsStorageMode);
        setActivePage(initialPageRef.current);
        setGenerationSettings(appSettings.generationSettings);
        setVariants(
          appSettings.variants?.length ? appSettings.variants : defaultAppSettingsRef.current.variants,
        );
        setSettings(resolvedWorkspaceSettings);
        setPlatformStatus({
          openRouterConfigured: payload.openRouterConfigured,
          gateEnabled: payload.gateEnabled,
        });
        workspaceSettingsReadyRef.current = true;
        setWorkspaceSaveState("Saved");
        if (payload.runs?.[0]?.id) {
          setSelectedRunId((current) => current || payload.runs[0].id);
        }
      } catch (error) {
        setErrorMessage(ensureErrorMessage(error, "Failed to load workspace."));
        workspaceSettingsReadyRef.current = true;
        setWorkspaceSaveState("Save unavailable");
      } finally {
        setLoading(false);
      }
    }

    void loadAppData();
  }, []);

  useEffect(() => {
    const storedTheme = readStoredTheme();
    if (storedTheme) {
      setTheme(storedTheme);
      applyThemePreference(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (!defaultEnabledModelId) {
      return;
    }

    setVariants((current) =>
      current.map((variant) =>
        enabledModelIds.includes(variant.model)
          ? variant
          : {
              ...variant,
              model: defaultEnabledModelId,
            },
      ),
    );
  }, [defaultEnabledModelId, enabledModelIds]);

  useEffect(() => {
    if (!workspaceSettingsReadyRef.current) {
      return undefined;
    }

    if (skipNextWorkspaceSaveRef.current) {
      skipNextWorkspaceSaveRef.current = false;
      return undefined;
    }

    const snapshot = createWorkspaceSnapshot({
      activePage,
      playgroundMode,
      generationSettings,
      variants,
    });

    setWorkspaceSaveState("Saving...");
    if (workspaceSaveTimerRef.current !== null) {
      window.clearTimeout(workspaceSaveTimerRef.current);
    }
    workspaceSaveTimerRef.current = window.setTimeout(async () => {
      if (appSettingsStorageMode !== "supabase") {
        writeBrowserAppSettings(snapshot);
      }

      try {
        await saveAppSettingsRequest(snapshot);
        setWorkspaceSaveState(appSettingsStorageMode === "supabase" ? "Saved" : "Saved in browser");
      } catch (error) {
        console.error("Failed to save workspace settings.", error);
        setWorkspaceSaveState(
          appSettingsStorageMode === "supabase" ? "Save failed" : "Saved in browser",
        );
      }
    }, 300);

    return () => {
      if (workspaceSaveTimerRef.current !== null) {
        window.clearTimeout(workspaceSaveTimerRef.current);
      }
    };
  }, [
    activePage,
    appSettingsStorageMode,
    playgroundMode,
    generationSettings,
    variants,
  ]);

  const {
    dismissMessage,
    toggleTheme,
    handleEvalGenerate,
    handleEvalBatchRun,
    handleSaveEval,
    handleDeleteEval,
    handleSaveDataset,
    handleDeleteDataset,
    handleSaveRating,
    handleSaveSettings,
    updateVariant,
  } = createWorkspaceActions({
    generationSettings,
    playgroundGenerating,
    playgroundMode,
    setActivePage,
    setBatchGenerating,
    setDatasets,
    setErrorMessage,
    setEvals,
    setPlaygroundGenerating,
    setPlaygroundRun,
    setRuns,
    setSelectedRunId,
    setSettings,
    setStatusMessage,
    setTheme,
    setVariants,
    settings,
    variants,
    workspaceSettingsStorageMode,
  });

  return {
    activePage,
    activeEvalId,
    setActiveEvalId,
    evals,
    datasets,
    handleEvalGenerate,
    handleEvalBatchRun,
    handleSaveEval,
    handleDeleteEval,
    handleSaveDataset,
    handleDeleteDataset,
    batchGenerating,
    filteredRuns,
    generationSettings,
    handleSaveSettings,
    handleSaveRating,
    historySearch,
    loading,
    platformStatus,
    playgroundGenerating,
    playgroundRun,
    runs,
    settings,
    selectedRun,
    selectedRunId,
    setActivePage,
    setGenerationSettings,
    setHistorySearch,
    setSelectedRunId,
    setVariants,
    statusMessage,
    errorMessage,
    storageMode,
    theme,
    toggleTheme,
    updateVariant,
    availableModelOptions,
    variants,
    playgroundMode,
    enabledModelIds,
    defaultEnabledModelId,
    dismissMessage,
    workspaceSaveState,
  };
}
