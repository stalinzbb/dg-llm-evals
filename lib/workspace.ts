import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { createDefaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import {
  CAUSE_TAG_OPTIONS,
  DEFAULT_ENABLED_MODEL_IDS,
  filterEnabledModelIds,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import { parseCsv } from "@/lib/csv";
import {
  getPromptTemplateSignature,
  getTestCaseSignature,
  normalizePromptTemplate,
  normalizeTestCase,
} from "@/lib/prompt";
import { randomizeCauseTags } from "@/lib/source-pool";
import {
  applyThemePreference,
  readBrowserAppSettings,
  readBrowserModelSettings,
  readStoredTheme,
  writeBrowserAppSettings,
  writeBrowserModelSettings,
  writeStoredTheme,
} from "@/lib/workspace-browser";
import {
  batchRunRequest,
  deletePromptTemplateRequest,
  deleteTestCaseRequest,
  fetchBootstrap,
  generateRunRequest,
  importSourcePoolChunkRequest,
  randomSourcePoolRowRequest,
  sampleSourcePoolRequest,
  saveAppSettingsRequest,
  savePromptTemplateRequest,
  saveRatingRequest,
  saveTestCasesRequest,
  saveWorkspaceSettingsRequest,
} from "@/lib/workspace-api";
import {
  getAvailableModelOptions,
  getCaseDraftSignature,
  getCaseMatchesExisting,
  getFilteredRuns,
  getPlaygroundMode,
  getPromptDraftSignature,
  getPromptMatchesExisting,
  getSelectedRun,
  getWorkspaceDefaultEnabledModelId,
} from "@/lib/workspace-selectors";
import type { SaveRatingRequest } from "@/lib/types/api";
import type {
  AppSettings,
  GenerationSettings,
  ModelOption,
  PromptTemplate,
  Run,
  SourcePoolRecord,
  SourcePoolStats,
  TestCase,
  Theme,
  Variant,
  WorkspacePage,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { HandleBatchRunOptions, WorkspaceSnapshot, WorkspaceState } from "@/lib/types/workspace";

const SOURCE_POOL_IMPORT_CHUNK_SIZE = 250;

type StorageMode = "local" | "supabase";
type SettingsStorageMode = "browser" | "supabase";

function ensureErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function updateRunCollection(run: Run, currentRuns: Run[]) {
  return [run, ...currentRuns.filter((item) => item.id !== run.id)];
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
  return createDefaultAppSettings().variants[0] && enabledModelIds
    ? {
        ...createDefaultAppSettings().variants[0],
        model: getWorkspaceDefaultEnabledModelId(enabledModelIds),
        id: crypto.randomUUID(),
      }
    : createDefaultAppSettings().variants[0];
}

export function shapeImportedCase(record: Record<string, string>): TestCase {
  const organizationUuid = `${record.ORGANIZATION_UUID || record.organizationUuid || ""}`.trim();
  const causeTags = record.causeTags
    ? record.causeTags.split("|").map((item) => item.trim()).filter(Boolean)
    : [];

  return normalizeTestCase({
    name: record.name,
    organizationName: record.ORGANIZATION_NAME || record.organizationName,
    teamName: record["TEAM NAME"] || record.teamName,
    organizationType: record.ORGANIZATION_TYPE || record.organizationType,
    teamActivity: record.TEAM_ACTIVITY || record.teamActivity,
    teamAffiliation: record.TEAM_AFFILIATION || record.teamAffiliation,
    organizationUuid: organizationUuid || null,
    isVerified: Boolean(organizationUuid),
    causeTags: causeTags.length ? causeTags : randomizeCauseTags(),
    messageLength: record.messageLength,
  });
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
      isVerified: result.isVerified ? "true" : "false",
      organizationUuid: result.organizationUuid || "",
      sourceType: result.sourceType || "",
      sourceRecordId: result.sourceRecordId || "",
      causeStatement: result.causeStatement,
      fullMessage: result.fullMessage,
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
  caseDraft: TestCase;
  promptDraft: PromptTemplate;
  generationSettings: GenerationSettings;
  variants: Variant[];
  batchSelection: string[];
  importedCases: TestCase[];
}): WorkspaceSnapshot {
  return {
    activeTab: args.activePage,
    playgroundMode: args.playgroundMode,
    caseDraft: args.caseDraft,
    promptDraft: args.promptDraft,
    generationSettings: args.generationSettings,
    variants: args.variants,
    batchSelection: args.batchSelection,
    importedCases: args.importedCases,
  };
}

export function useWorkspaceState(defaultPage: WorkspacePage = "playground"): WorkspaceState {
  const initialPageRef = useRef(defaultPage);
  const defaultAppSettingsRef = useRef(createDefaultAppSettings());
  const [activePage, setActivePage] = useState<WorkspacePage>(defaultPage);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [storageMode, setStorageMode] = useState<StorageMode>("local");
  const [platformStatus, setPlatformStatus] = useState({
    openRouterConfigured: false,
    gateEnabled: false,
  });
  const [caseDraft, setCaseDraft] = useState<TestCase>(defaultAppSettingsRef.current.caseDraft);
  const [promptDraft, setPromptDraft] = useState<PromptTemplate>(defaultAppSettingsRef.current.promptDraft);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(
    defaultAppSettingsRef.current.generationSettings,
  );
  const [settings, setSettings] = useState<WorkspaceSettings>({ enabledModelIds: DEFAULT_ENABLED_MODEL_IDS });
  const [variants, setVariants] = useState<Variant[]>(defaultAppSettingsRef.current.variants);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [playgroundRun, setPlaygroundRun] = useState<Run | null>(null);
  const [playgroundGenerating, setPlaygroundGenerating] = useState(false);
  const [playgroundRandomizing, setPlaygroundRandomizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [batchSelection, setBatchSelection] = useState<string[]>(defaultAppSettingsRef.current.batchSelection);
  const [importedCases, setImportedCases] = useState<TestCase[]>(defaultAppSettingsRef.current.importedCases);
  const [sourcePoolStats, setSourcePoolStats] = useState<SourcePoolStats>({ total: 0, verified: 0, unverified: 0 });
  const [sourcePoolImporting, setSourcePoolImporting] = useState(false);
  const [batchSampleCount, setBatchSampleCount] = useState("20");
  const [batchVerificationFilter, setBatchVerificationFilter] = useState<"any" | "verified" | "unverified">("any");
  const [batchGenerating, setBatchGenerating] = useState(false);
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
  const normalizedCaseDraft = useMemo(() => normalizeTestCase(caseDraft), [caseDraft]);
  const normalizedPromptDraft = useMemo(() => normalizePromptTemplate(promptDraft), [promptDraft]);
  const caseDraftSignature = useMemo(() => getCaseDraftSignature(normalizedCaseDraft), [normalizedCaseDraft]);
  const promptDraftSignature = useMemo(
    () => getPromptDraftSignature(normalizedPromptDraft),
    [normalizedPromptDraft],
  );
  const playgroundMode = useMemo(() => getPlaygroundMode(variants), [variants]);
  const caseMatchesExisting = useMemo(
    () => getCaseMatchesExisting(testCases, caseDraftSignature),
    [testCases, caseDraftSignature],
  );
  const promptMatchesExisting = useMemo(
    () => getPromptMatchesExisting(promptTemplates, promptDraftSignature),
    [promptTemplates, promptDraftSignature],
  );
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
        setTestCases(payload.testCases || []);
        setPromptTemplates(payload.promptTemplates || []);
        setRuns(payload.runs || []);
        setStorageMode(nextStorageMode);
        setAppSettingsStorageMode(nextAppSettingsStorageMode);
        setWorkspaceSettingsStorageMode(nextWorkspaceSettingsStorageMode);
        setActivePage(initialPageRef.current);
        setCaseDraft(appSettings.caseDraft);
        setPromptDraft(appSettings.promptDraft);
        setGenerationSettings(appSettings.generationSettings);
        setVariants(
          appSettings.variants?.length ? appSettings.variants : defaultAppSettingsRef.current.variants,
        );
        setBatchSelection(appSettings.batchSelection || []);
        setImportedCases(appSettings.importedCases || []);
        setSettings(resolvedWorkspaceSettings);
        setSourcePoolStats(payload.sourcePoolStats || { total: 0, verified: 0, unverified: 0 });
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
    if (defaultPage !== "batches" || !promptTemplates.length) {
      return;
    }

    const firstPromptId = promptTemplates[0]?.id;
    if (!firstPromptId) {
      return;
    }

    setVariants((current) =>
      current.map((variant) => {
        const promptExists =
          variant.promptSource !== "current" &&
          promptTemplates.some((template) => template.id === variant.promptSource);

        return promptExists
          ? variant
          : {
              ...variant,
              promptSource: firstPromptId,
            };
      }),
    );
  }, [defaultPage, promptTemplates]);

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
      caseDraft,
      promptDraft,
      generationSettings,
      variants,
      batchSelection,
      importedCases,
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
    caseDraft,
    promptDraft,
    generationSettings,
    variants,
    batchSelection,
    importedCases,
  ]);

  function clearMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  function dismissMessage(kind: "error" | "success") {
    if (kind === "error") {
      setErrorMessage("");
      return;
    }
    setStatusMessage("");
  }

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme: Theme = current === "dark" ? "light" : "dark";
      applyThemePreference(nextTheme);
      writeStoredTheme(nextTheme);
      return nextTheme;
    });
  }

  async function handleSaveCase(singleCase: TestCase) {
    clearMessages();
    try {
      const payloadCase = {
        ...normalizeTestCase(singleCase),
        id: null,
      };
      const payload = await saveTestCasesRequest(payloadCase);
      setTestCases(payload.testCases || []);
      setStatusMessage("Saved test case library.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to save test case."));
    }
  }

  async function handleSaveImportedCases() {
    if (!importedCases.length) {
      return;
    }
    clearMessages();
    try {
      const payload = await saveTestCasesRequest(importedCases);
      setTestCases(payload.testCases || []);
      setImportedCases([]);
      setStatusMessage("Imported cases were saved to the library.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to save imported cases."));
    }
  }

  async function handleSavePrompt() {
    clearMessages();
    try {
      const payloadPrompt: PromptTemplate = {
        ...normalizedPromptDraft,
        id: null,
      };
      const payload = await savePromptTemplateRequest(payloadPrompt);
      setPromptTemplates(payload.promptTemplates || []);
      setStatusMessage("Saved prompt template.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to save prompt template."));
    }
  }

  async function handleGenerate() {
    if (playgroundGenerating) {
      return;
    }
    clearMessages();
    setPlaygroundGenerating(true);
    try {
      const payload = await generateRunRequest({
        mode: playgroundMode,
        caseInput: caseDraft,
        promptDraft,
        generationSettings,
        settings,
        variants,
      });
      setPlaygroundRun(payload.run);
      setRuns((current) => updateRunCollection(payload.run, current));
      setSelectedRunId(payload.run.id);
      startTransition(() => setActivePage("history"));
    } catch (error) {
      setPlaygroundRun(null);
      setErrorMessage(ensureErrorMessage(error, "Failed to generate run."));
    } finally {
      setPlaygroundGenerating(false);
    }
  }

  async function handleBatchRun(options: HandleBatchRunOptions = {}) {
    clearMessages();
    setBatchGenerating(true);
    try {
      const {
        includeSavedCases = true,
        includeImportedCases = true,
        includeSourcePool = true,
      } = options;

      if (!promptTemplates.length) {
        throw new Error("Save at least one prompt before running a batch.");
      }

      if (variants.some((variant) => variant.promptSource === "current")) {
        throw new Error("Batch runs require saved prompts. Select a saved prompt for each variant.");
      }

      let sampledCount = 0;
      let requestedSampleCount = 0;
      let sampledSourceCases: TestCase[] = [];

      if (includeSourcePool && (Number(batchSampleCount) || 0) > 0) {
        requestedSampleCount = Number(batchSampleCount) || 0;
        const samplePayload = await sampleSourcePoolRequest({
          count: requestedSampleCount,
          verificationFilter: batchVerificationFilter,
        });

        sampledCount = samplePayload.actualCount || 0;
        sampledSourceCases = (samplePayload.rows || []).map((row) =>
          normalizeTestCase({
            sourceRecordId: row.id,
            sourceType: "source_pool",
            organizationUuid: row.organizationUuid,
            isVerified: row.isVerified,
            organizationName: row.organizationName,
            teamName: row.teamName,
            organizationType: row.organizationType,
            teamActivity: row.teamActivity,
            teamAffiliation: row.teamAffiliation,
            causeTags: randomizeCauseTags(),
          }),
        );
      }

      const selectedCaseIds = includeSavedCases ? batchSelection : [];
      const inlineCases = [
        ...(includeImportedCases ? importedCases : []),
        ...sampledSourceCases,
      ];

      const payload = await batchRunRequest({
        caseIds: selectedCaseIds,
        inlineCases,
        promptDraft,
        generationSettings,
        settings,
        variants,
      });
      setRuns((current) => updateRunCollection(payload.run, current));
      setSelectedRunId(payload.run.id);
      startTransition(() => setActivePage("history"));
      if (requestedSampleCount && sampledCount !== requestedSampleCount) {
        setStatusMessage(
          `Batch run completed. Sampled ${sampledCount} of ${requestedSampleCount} requested source-pool rows.`,
        );
      } else {
        setStatusMessage("Batch run completed.");
      }
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to run batch."));
    } finally {
      setBatchGenerating(false);
    }
  }

  async function handleImportSourcePool(file: File | null) {
    if (!file) {
      return;
    }
    clearMessages();
    setSourcePoolImporting(true);
    try {
      const csvText = await file.text();
      const records = parseCsv(csvText);

      if (!records.length) {
        throw new Error("The CSV did not contain any importable rows.");
      }

      let aggregateImportedCount = 0;
      let aggregateSkippedCount = 0;
      let latestStats: SourcePoolStats = { total: 0, verified: 0, unverified: 0 };

      for (let index = 0; index < records.length; index += SOURCE_POOL_IMPORT_CHUNK_SIZE) {
        const chunk = records.slice(index, index + SOURCE_POOL_IMPORT_CHUNK_SIZE);
        const payload = await importSourcePoolChunkRequest(chunk, index === 0);
        aggregateImportedCount += payload.importedCount || 0;
        aggregateSkippedCount += payload.skippedCount || 0;
        latestStats = payload.stats || latestStats;
      }

      setSourcePoolStats(latestStats);
      setStatusMessage(
        `Imported ${aggregateImportedCount} source rows${aggregateSkippedCount ? ` and skipped ${aggregateSkippedCount}` : ""}.`,
      );
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to import source pool."));
    } finally {
      setSourcePoolImporting(false);
    }
  }

  async function handleRandomizeCaseFromSourcePool() {
    clearMessages();
    setPlaygroundRandomizing(true);
    try {
      const payload = await randomSourcePoolRowRequest("any");
      if (!payload.row) {
        throw new Error("No source-pool rows available. Upload a source CSV first.");
      }

      setCaseDraft((current) =>
        normalizeTestCase({
          ...current,
          sourceRecordId: payload.row?.id,
          sourceType: "source_pool",
          organizationUuid: payload.row?.organizationUuid,
          isVerified: payload.row?.isVerified,
          organizationName: payload.row?.organizationName,
          teamName: payload.row?.teamName,
          organizationType: payload.row?.organizationType,
          teamActivity: payload.row?.teamActivity,
          teamAffiliation: payload.row?.teamAffiliation,
          causeTags: current.causeTags,
        }),
      );
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to randomize case."));
    } finally {
      setPlaygroundRandomizing(false);
    }
  }

  function handleRandomizeCauseTags() {
    clearMessages();
    setCaseDraft((current) => ({
      ...current,
      causeTags: randomizeCauseTags(),
    }));
  }

  async function handleSaveRating(payload: SaveRatingRequest) {
    clearMessages();
    const response = await saveRatingRequest(payload);
    setRuns((current) => current.map((run) => (run.id === response.run.id ? response.run : run)));
    setSelectedRunId(response.run.id);
    setStatusMessage("Saved rating.");
  }

  async function handleDeleteCase(id: string) {
    clearMessages();
    try {
      const payload = await deleteTestCaseRequest(id);
      setTestCases(payload.testCases || []);
      setStatusMessage("Deleted saved case.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to delete case."));
    }
  }

  async function handleDeletePrompt(id: string) {
    clearMessages();
    try {
      const payload = await deletePromptTemplateRequest(id);
      setPromptTemplates(payload.promptTemplates || []);
      setStatusMessage("Deleted saved recipe.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to delete prompt."));
    }
  }

  async function handleSaveSettings(nextSettings: Partial<WorkspaceSettings>) {
    clearMessages();
    const sanitizedEnabledModelIds = filterEnabledModelIds(nextSettings?.enabledModelIds);

    try {
      const payload = await saveWorkspaceSettingsRequest({ enabledModelIds: sanitizedEnabledModelIds });
      const nextSavedSettings = {
        enabledModelIds: normalizeEnabledModelIds(payload.settings?.enabledModelIds),
      };
      if (workspaceSettingsStorageMode !== "supabase") {
        writeBrowserModelSettings(nextSavedSettings);
      }
      setSettings(nextSavedSettings);
      setStatusMessage(
        workspaceSettingsStorageMode === "supabase" ? "Settings saved." : "Settings saved in browser.",
      );
    } catch (error) {
      if (workspaceSettingsStorageMode !== "supabase") {
        const nextSavedSettings = {
          enabledModelIds: normalizeEnabledModelIds(sanitizedEnabledModelIds),
        };
        writeBrowserModelSettings(nextSavedSettings);
        setSettings(nextSavedSettings);
        setStatusMessage("Settings saved in browser.");
        return;
      }
      setErrorMessage(ensureErrorMessage(error, "Failed to save settings."));
    }
  }

  function updateVariant(id: string, patch: Partial<Variant>) {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    );
  }

  return {
    activePage,
    batchSelection,
    batchSampleCount,
    batchVerificationFilter,
    batchGenerating,
    caseDraft,
    filteredRuns,
    generationSettings,
    handleSaveSettings,
    handleBatchRun,
    handleImportSourcePool,
    handleGenerate,
    handleRandomizeCauseTags,
    handleRandomizeCaseFromSourcePool,
    handleSaveCase,
    handleDeleteCase,
    handleSaveImportedCases,
    handleSavePrompt,
    handleDeletePrompt,
    handleSaveRating,
    historySearch,
    importedCases,
    loading,
    platformStatus,
    playgroundGenerating,
    playgroundRandomizing,
    playgroundRun,
    promptDraft,
    promptTemplates,
    runs,
    settings,
    selectedRun,
    selectedRunId,
    setActivePage,
    setBatchSelection,
    setBatchSampleCount,
    setBatchVerificationFilter: setBatchVerificationFilter as Dispatch<SetStateAction<string>>,
    setCaseDraft,
    setGenerationSettings,
    setHistorySearch,
    setImportedCases,
    setPromptDraft,
    setSelectedRunId,
    setVariants,
    shapeImportedCase,
    sourcePoolImporting,
    sourcePoolStats,
    statusMessage,
    errorMessage,
    storageMode,
    testCases,
    theme,
    toggleTheme,
    updateVariant,
    availableModelOptions,
    variants,
    playgroundMode,
    enabledModelIds,
    defaultEnabledModelId,
    causeTagOptions: [...CAUSE_TAG_OPTIONS],
    canSaveCase: !caseMatchesExisting,
    canSavePrompt: !promptMatchesExisting,
    dismissMessage,
    normalizeTestCase,
    workspaceSaveState,
  };
}
