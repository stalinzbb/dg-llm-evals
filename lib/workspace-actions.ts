import { startTransition, type Dispatch, type SetStateAction } from "react";

import { filterEnabledModelIds, normalizeEnabledModelIds } from "@/lib/constants";
import { parseCsv } from "@/lib/csv";
import { normalizeTestCase } from "@/lib/prompt";
import { randomizeCauseTags } from "@/lib/source-pool";
import { applyThemePreference, writeBrowserModelSettings, writeStoredTheme } from "@/lib/workspace-browser";
import {
  batchRunRequest,
  deletePromptTemplateRequest,
  deleteTestCaseRequest,
  generateRunRequest,
  importSourcePoolChunkRequest,
  randomSourcePoolRowRequest,
  sampleSourcePoolRequest,
  savePromptTemplateRequest,
  saveRatingRequest,
  saveTestCasesRequest,
  saveWorkspaceSettingsRequest,
} from "@/lib/workspace-api";
import type { SaveRatingRequest } from "@/lib/types/api";
import type {
  GenerationSettings,
  PromptTemplate,
  Run,
  SourcePoolStats,
  TestCase,
  Theme,
  Variant,
  WorkspacePage,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { HandleBatchRunOptions, WorkspaceState } from "@/lib/types/workspace";

const SOURCE_POOL_IMPORT_CHUNK_SIZE = 250;

function ensureErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function updateRunCollection(run: Run, currentRuns: Run[]) {
  return [run, ...currentRuns.filter((item) => item.id !== run.id)];
}

interface CreateWorkspaceActionsArgs {
  batchSampleCount: string;
  batchSelection: string[];
  batchVerificationFilter: "any" | "verified" | "unverified";
  caseDraft: TestCase;
  generationSettings: GenerationSettings;
  importedCases: TestCase[];
  normalizedPromptDraft: PromptTemplate;
  playgroundGenerating: boolean;
  playgroundMode: "single" | "compare";
  promptDraft: PromptTemplate;
  promptTemplates: PromptTemplate[];
  setActivePage: Dispatch<SetStateAction<WorkspacePage>>;
  setBatchGenerating: Dispatch<SetStateAction<boolean>>;
  setCaseDraft: Dispatch<SetStateAction<TestCase>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setImportedCases: Dispatch<SetStateAction<TestCase[]>>;
  setPlaygroundGenerating: Dispatch<SetStateAction<boolean>>;
  setPlaygroundRandomizing: Dispatch<SetStateAction<boolean>>;
  setPlaygroundRun: Dispatch<SetStateAction<Run | null>>;
  setPromptTemplates: Dispatch<SetStateAction<PromptTemplate[]>>;
  setRuns: Dispatch<SetStateAction<Run[]>>;
  setSelectedRunId: Dispatch<SetStateAction<string>>;
  setSettings: Dispatch<SetStateAction<WorkspaceSettings>>;
  setSourcePoolImporting: Dispatch<SetStateAction<boolean>>;
  setSourcePoolStats: Dispatch<SetStateAction<SourcePoolStats>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setTestCases: Dispatch<SetStateAction<TestCase[]>>;
  setTheme: Dispatch<SetStateAction<Theme>>;
  setVariants: Dispatch<SetStateAction<Variant[]>>;
  settings: WorkspaceSettings;
  variants: Variant[];
  workspaceSettingsStorageMode: "browser" | "supabase";
}

export function createWorkspaceActions({
  batchSampleCount,
  batchSelection,
  batchVerificationFilter,
  caseDraft,
  generationSettings,
  importedCases,
  normalizedPromptDraft,
  playgroundGenerating,
  playgroundMode,
  promptDraft,
  promptTemplates,
  setActivePage,
  setBatchGenerating,
  setCaseDraft,
  setErrorMessage,
  setImportedCases,
  setPlaygroundGenerating,
  setPlaygroundRandomizing,
  setPlaygroundRun,
  setPromptTemplates,
  setRuns,
  setSelectedRunId,
  setSettings,
  setSourcePoolImporting,
  setSourcePoolStats,
  setStatusMessage,
  setTestCases,
  setTheme,
  setVariants,
  settings,
  variants,
  workspaceSettingsStorageMode,
}: CreateWorkspaceActionsArgs): Pick<
  WorkspaceState,
  | "dismissMessage"
  | "toggleTheme"
  | "handleSaveCase"
  | "handleSaveImportedCases"
  | "handleSavePrompt"
  | "handleGenerate"
  | "handleBatchRun"
  | "handleImportSourcePool"
  | "handleRandomizeCaseFromSourcePool"
  | "handleRandomizeCauseTags"
  | "handleSaveRating"
  | "handleDeleteCase"
  | "handleDeletePrompt"
  | "handleSaveSettings"
  | "updateVariant"
> {
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
      const inlineCases = [...(includeImportedCases ? importedCases : []), ...sampledSourceCases];

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
    dismissMessage,
    toggleTheme,
    handleSaveCase,
    handleSaveImportedCases,
    handleSavePrompt,
    handleGenerate,
    handleBatchRun,
    handleImportSourcePool,
    handleRandomizeCaseFromSourcePool,
    handleRandomizeCauseTags,
    handleSaveRating,
    handleDeleteCase,
    handleDeletePrompt,
    handleSaveSettings,
    updateVariant,
  };
}
