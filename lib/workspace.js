import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  CAUSE_TAG_OPTIONS,
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_ENABLED_MODEL_IDS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  filterEnabledModelIds,
  getDefaultEnabledModelId,
  getEnabledModelOptions,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import {
  getPromptTemplateSignature,
  getTestCaseSignature,
  normalizePromptTemplate,
  normalizeTestCase,
} from "@/lib/prompt";
import { randomizeCauseTags } from "@/lib/source-pool";

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

export function downloadCsv(filename, csvString) {
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

export function createInitialVariant(enabledModelIds = DEFAULT_ENABLED_MODEL_IDS) {
  const defaultModel = getDefaultEnabledModelId(enabledModelIds);
  return {
    id: crypto.randomUUID(),
    label: "Primary",
    model: defaultModel,
    promptSource: "current",
    useOverrides: false,
    temperature: "",
    topP: "",
    maxTokens: "",
    seed: "",
  };
}

export function shapeImportedCase(record) {
  const causeTags = record.causeTags
    ? record.causeTags.split("|").map((item) => item.trim()).filter(Boolean)
    : [];

  return normalizeTestCase({
    name: record.name,
    organizationName: record.organizationName,
    teamName: record.teamName,
    organizationType: record.organizationType,
    teamActivity: record.teamActivity,
    teamAffiliation: record.teamAffiliation,
    causeTags,
    messageLength: record.messageLength,
  });
}

export function serializeRunRows(runs) {
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

export function formatModelOption(model) {
  if (model.unavailable) {
    return `${model.label} · unavailable`;
  }
  return `${model.label} · $${model.input}/$${model.output} per 1M in/out`;
}

export function formatShortId(value, length = 8) {
  if (!value) {
    return "";
  }
  return value.slice(0, length);
}

export function useWorkspaceState(defaultPage = "playground") {
  const [activePage, setActivePage] = useState(defaultPage);
  const [playgroundMode, setPlaygroundMode] = useState("single");
  const [testCases, setTestCases] = useState([]);
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [runs, setRuns] = useState([]);
  const [storageMode, setStorageMode] = useState("local");
  const [platformStatus, setPlatformStatus] = useState({
    openRouterConfigured: false,
    gateEnabled: false,
  });
  const [caseDraft, setCaseDraft] = useState(DEFAULT_TEST_CASE);
  const [promptDraft, setPromptDraft] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [generationSettings, setGenerationSettings] = useState(DEFAULT_GENERATION_SETTINGS);
  const [settings, setSettings] = useState({ enabledModelIds: DEFAULT_ENABLED_MODEL_IDS });
  const [variants, setVariants] = useState([createInitialVariant(DEFAULT_ENABLED_MODEL_IDS)]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [playgroundRun, setPlaygroundRun] = useState(null);
  const [playgroundGenerating, setPlaygroundGenerating] = useState(false);
  const [playgroundRandomizing, setPlaygroundRandomizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [batchSelection, setBatchSelection] = useState([]);
  const [importedCases, setImportedCases] = useState([]);
  const [sourcePoolStats, setSourcePoolStats] = useState({ total: 0, verified: 0, unverified: 0 });
  const [sourcePoolImporting, setSourcePoolImporting] = useState(false);
  const [batchSampleCount, setBatchSampleCount] = useState("20");
  const [batchVerificationFilter, setBatchVerificationFilter] = useState("any");
  const [theme, setTheme] = useState("light");

  const deferredSearch = useDeferredValue(historySearch);
  const enabledModelIds = useMemo(
    () => normalizeEnabledModelIds(settings.enabledModelIds),
    [settings.enabledModelIds],
  );
  const availableModelOptions = useMemo(
    () => getEnabledModelOptions(enabledModelIds),
    [enabledModelIds],
  );
  const defaultEnabledModelId = useMemo(
    () => getDefaultEnabledModelId(enabledModelIds),
    [enabledModelIds],
  );
  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0] || null;
  const normalizedCaseDraft = normalizeTestCase(caseDraft);
  const normalizedPromptDraft = normalizePromptTemplate(promptDraft);
  const caseDraftSignature = getTestCaseSignature(normalizedCaseDraft);
  const promptDraftSignature = getPromptTemplateSignature(normalizedPromptDraft);
  const caseMatchesExisting = testCases.some((item) => getTestCaseSignature(item) === caseDraftSignature);
  const promptMatchesExisting = promptTemplates.some(
    (item) => getPromptTemplateSignature(item) === promptDraftSignature,
  );

  useEffect(() => {
    async function loadAppData() {
      setLoading(true);
      try {
        const payload = await readJson(await fetch("/api/bootstrap"));
        setTestCases(payload.testCases || []);
        setPromptTemplates(payload.promptTemplates || []);
        setRuns(payload.runs || []);
        setStorageMode(payload.storageMode || "local");
        setSettings({
          enabledModelIds: normalizeEnabledModelIds(payload.settings?.enabledModelIds),
        });
        setSourcePoolStats(payload.sourcePoolStats || { total: 0, verified: 0, unverified: 0 });
        setPlatformStatus({
          openRouterConfigured: payload.openRouterConfigured,
          gateEnabled: payload.gateEnabled,
        });
        if (payload.runs?.[0]?.id) {
          setSelectedRunId((current) => current || payload.runs[0].id);
        }
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadAppData();
  }, []);

  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined" ? window.localStorage.getItem("dg-evals-theme") : null;
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
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

  const filteredRuns = runs.filter((run) => {
    if (!deferredSearch.trim()) {
      return true;
    }
    const haystack = [
      run.id,
      run.label,
      run.mode,
      ...(run.results || []).map(
        (result) => `${result.id} ${result.caseName} ${result.model} ${result.variantLabel}`,
      ),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(deferredSearch.toLowerCase());
  });

  function clearMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  function dismissMessage(kind) {
    if (kind === "error") {
      setErrorMessage("");
      return;
    }
    setStatusMessage("");
  }

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      window.localStorage.setItem("dg-evals-theme", nextTheme);
      return nextTheme;
    });
  }

  async function handleSaveCase(singleCase) {
    clearMessages();
    try {
      const payloadCase = {
        ...normalizeTestCase(singleCase),
        id: null,
      };
      const payload = await readJson(
        await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: payloadCase }),
        }),
      );
      setTestCases(payload.testCases || []);
      setStatusMessage("Saved test case library.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSaveImportedCases() {
    if (!importedCases.length) {
      return;
    }
    clearMessages();
    try {
      const payload = await readJson(
        await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: importedCases }),
        }),
      );
      setTestCases(payload.testCases || []);
      setImportedCases([]);
      setStatusMessage("Imported cases were saved to the library.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSavePrompt() {
    clearMessages();
    try {
      const payloadPrompt = {
        ...normalizedPromptDraft,
        id: null,
      };
      const payload = await readJson(
        await fetch("/api/prompt-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadPrompt),
        }),
      );
      setPromptTemplates(payload.promptTemplates || []);
      setStatusMessage("Saved prompt template.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleGenerate() {
    if (playgroundGenerating) {
      return;
    }
    clearMessages();
    setPlaygroundGenerating(true);
    try {
      const payload = await readJson(
        await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: playgroundMode,
            caseInput: caseDraft,
            promptDraft,
            generationSettings,
            settings,
            variants: playgroundMode === "single" ? [variants[0]] : variants,
          }),
        }),
      );
      setPlaygroundRun(payload.run);
      setRuns((current) => [payload.run, ...current.filter((item) => item.id !== payload.run.id)]);
      setSelectedRunId(payload.run.id);
    } catch (error) {
      setPlaygroundRun(null);
      setErrorMessage(error.message);
    } finally {
      setPlaygroundGenerating(false);
    }
  }

  async function handleBatchRun() {
    clearMessages();
    try {
      let sampledCount = 0;
      let requestedSampleCount = 0;
      let sampledSourceCases = [];

      if ((Number(batchSampleCount) || 0) > 0) {
        requestedSampleCount = Number(batchSampleCount) || 0;
        const samplePayload = await readJson(
          await fetch("/api/source-pool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sample",
              count: requestedSampleCount,
              verificationFilter: batchVerificationFilter,
            }),
          }),
        );

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

      const payload = await readJson(
        await fetch("/api/batch-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseIds: batchSelection,
            inlineCases: [...importedCases, ...sampledSourceCases],
            promptDraft,
            generationSettings,
            settings,
            variants,
          }),
        }),
      );
      setRuns((current) => [payload.run, ...current.filter((item) => item.id !== payload.run.id)]);
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
      setErrorMessage(error.message);
    }
  }

  async function handleImportSourcePool(file) {
    if (!file) {
      return;
    }
    clearMessages();
    setSourcePoolImporting(true);
    try {
      const csvText = await file.text();
      const payload = await readJson(
        await fetch("/api/source-pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import", csvText }),
        }),
      );
      setSourcePoolStats(payload.stats || { total: 0, verified: 0, unverified: 0 });
      setStatusMessage(
        `Imported ${payload.importedCount} source rows${payload.skippedCount ? ` and skipped ${payload.skippedCount}` : ""}.`,
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSourcePoolImporting(false);
    }
  }

  async function handleRandomizeCaseFromSourcePool() {
    clearMessages();
    setPlaygroundRandomizing(true);
    try {
      const payload = await readJson(
        await fetch("/api/source-pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "random", verificationFilter: "any" }),
        }),
      );

      if (!payload.row) {
        throw new Error("No source-pool rows available. Upload a source CSV first.");
      }

      setCaseDraft((current) =>
        normalizeTestCase({
          ...current,
          sourceRecordId: payload.row.id,
          sourceType: "source_pool",
          organizationUuid: payload.row.organizationUuid,
          isVerified: payload.row.isVerified,
          organizationName: payload.row.organizationName,
          teamName: payload.row.teamName,
          organizationType: payload.row.organizationType,
          teamActivity: payload.row.teamActivity,
          teamAffiliation: payload.row.teamAffiliation,
          causeTags: current.causeTags,
        }),
      );
      setStatusMessage("Loaded a random source-pool row into Data Variables.");
    } catch (error) {
      setErrorMessage(error.message);
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

  async function handleSaveRating(payload) {
    clearMessages();
    const response = await readJson(
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    setRuns((current) => current.map((run) => (run.id === response.run.id ? response.run : run)));
    setSelectedRunId(response.run.id);
    setStatusMessage("Saved rating.");
  }

  async function handleDeleteCase(id) {
    clearMessages();
    try {
      const payload = await readJson(
        await fetch("/api/test-cases", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }),
      );
      setTestCases(payload.testCases || []);
      setStatusMessage("Deleted saved case.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeletePrompt(id) {
    clearMessages();
    try {
      const payload = await readJson(
        await fetch("/api/prompt-templates", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }),
      );
      setPromptTemplates(payload.promptTemplates || []);
      setStatusMessage("Deleted saved recipe.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSaveSettings(nextSettings) {
    clearMessages();
    const sanitizedEnabledModelIds = filterEnabledModelIds(nextSettings?.enabledModelIds);

    try {
      const payload = await readJson(
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabledModelIds: sanitizedEnabledModelIds }),
        }),
      );
      setSettings({
        enabledModelIds: normalizeEnabledModelIds(payload.settings?.enabledModelIds),
      });
      setStatusMessage("Settings saved.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function updateVariant(id, patch) {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    );
  }

  return {
    activePage,
    batchSelection,
    batchSampleCount,
    batchVerificationFilter,
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
    setBatchVerificationFilter,
    setCaseDraft,
    setGenerationSettings,
    setHistorySearch,
    setImportedCases,
    setPromptDraft,
    setSelectedRunId,
    setPlaygroundMode,
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
    causeTagOptions: CAUSE_TAG_OPTIONS,
    canSaveCase: !caseMatchesExisting,
    canSavePrompt: !promptMatchesExisting,
    dismissMessage,
    normalizeTestCase,
  };
}
