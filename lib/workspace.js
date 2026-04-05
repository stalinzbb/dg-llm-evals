import { startTransition, useDeferredValue, useEffect, useState } from "react";

import {
  CAUSE_TAG_OPTIONS,
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  MODEL_OPTIONS,
} from "@/lib/constants";
import { normalizeTestCase } from "@/lib/prompt";

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

export function createInitialVariant() {
  const defaultModel = MODEL_OPTIONS.find((model) => !model.unavailable)?.value || "";
  return {
    id: crypto.randomUUID(),
    label: "Primary",
    model: defaultModel,
    promptSource: "current",
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
  const [variants, setVariants] = useState([createInitialVariant()]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [playgroundRun, setPlaygroundRun] = useState(null);
  const [playgroundGenerating, setPlaygroundGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [batchSelection, setBatchSelection] = useState([]);
  const [importedCases, setImportedCases] = useState([]);
  const [theme, setTheme] = useState("light");

  const deferredSearch = useDeferredValue(historySearch);
  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0] || null;

  useEffect(() => {
    async function loadAppData() {
      setLoading(true);
      try {
        const payload = await readJson(await fetch("/api/bootstrap"));
        setTestCases(payload.testCases || []);
        setPromptTemplates(payload.promptTemplates || []);
        setRuns(payload.runs || []);
        setStorageMode(payload.storageMode || "local");
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
      const payload = await readJson(
        await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: singleCase }),
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
      const payload = await readJson(
        await fetch("/api/prompt-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(promptDraft),
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
      const payload = await readJson(
        await fetch("/api/batch-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseIds: batchSelection,
            inlineCases: importedCases,
            promptDraft,
            generationSettings,
            variants,
          }),
        }),
      );
      setRuns((current) => [payload.run, ...current.filter((item) => item.id !== payload.run.id)]);
      setSelectedRunId(payload.run.id);
      startTransition(() => setActivePage("history"));
      setStatusMessage("Batch run completed.");
    } catch (error) {
      setErrorMessage(error.message);
    }
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

  function updateVariant(id, patch) {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    );
  }

  return {
    activePage,
    batchSelection,
    caseDraft,
    filteredRuns,
    generationSettings,
    handleBatchRun,
    handleGenerate,
    handleSaveCase,
    handleSaveImportedCases,
    handleSavePrompt,
    handleSaveRating,
    historySearch,
    importedCases,
    loading,
    platformStatus,
    playgroundGenerating,
    playgroundRun,
    promptDraft,
    promptTemplates,
    runs,
    selectedRun,
    selectedRunId,
    setActivePage,
    setBatchSelection,
    setCaseDraft,
    setGenerationSettings,
    setHistorySearch,
    setImportedCases,
    setPromptDraft,
    setSelectedRunId,
    setPlaygroundMode,
    setVariants,
    shapeImportedCase,
    statusMessage,
    errorMessage,
    storageMode,
    testCases,
    theme,
    toggleTheme,
    updateVariant,
    variants,
    playgroundMode,
    causeTagOptions: CAUSE_TAG_OPTIONS,
    normalizeTestCase,
  };
}
