import { startTransition, type Dispatch, type SetStateAction } from "react";

import { filterEnabledModelIds, normalizeEnabledModelIds } from "@/lib/constants";
import { applyThemePreference, writeBrowserModelSettings, writeStoredTheme } from "@/lib/workspace-browser";
import {
  batchRunRequest,
  deleteDatasetRequest,
  deleteEvalRequest,
  generateRunRequest,
  saveDatasetRequest,
  saveEvalRequest,
  saveRatingRequest,
  saveWorkspaceSettingsRequest,
} from "@/lib/workspace-api";
import type { SaveRatingRequest } from "@/lib/types/api";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";
import type {
  GenerationSettings,
  Run,
  Theme,
  Variant,
  WorkspacePage,
  WorkspaceSettings,
} from "@/lib/types/domain";
import type { EvalRunInput, WorkspaceState } from "@/lib/types/workspace";

function ensureErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function updateRunCollection(run: Run, currentRuns: Run[]) {
  return [run, ...currentRuns.filter((item) => item.id !== run.id)];
}

interface CreateWorkspaceActionsArgs {
  generationSettings: GenerationSettings;
  playgroundGenerating: boolean;
  playgroundMode: "single" | "compare";
  setActivePage: Dispatch<SetStateAction<WorkspacePage>>;
  setBatchGenerating: Dispatch<SetStateAction<boolean>>;
  setDatasets: Dispatch<SetStateAction<Dataset[]>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setEvals: Dispatch<SetStateAction<EvalDefinition[]>>;
  setPlaygroundGenerating: Dispatch<SetStateAction<boolean>>;
  setPlaygroundRun: Dispatch<SetStateAction<Run | null>>;
  setRuns: Dispatch<SetStateAction<Run[]>>;
  setSelectedRunId: Dispatch<SetStateAction<string>>;
  setSettings: Dispatch<SetStateAction<WorkspaceSettings>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setTheme: Dispatch<SetStateAction<Theme>>;
  setVariants: Dispatch<SetStateAction<Variant[]>>;
  settings: WorkspaceSettings;
  variants: Variant[];
  workspaceSettingsStorageMode: "browser" | "supabase";
}

export function createWorkspaceActions({
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
}: CreateWorkspaceActionsArgs): Pick<
  WorkspaceState,
  | "dismissMessage"
  | "toggleTheme"
  | "handleEvalGenerate"
  | "handleEvalBatchRun"
  | "handleSaveEval"
  | "handleDeleteEval"
  | "handleSaveDataset"
  | "handleDeleteDataset"
  | "handleSaveRating"
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

  async function handleEvalGenerate(input: EvalRunInput) {
    if (playgroundGenerating) {
      return;
    }
    clearMessages();
    setPlaygroundGenerating(true);
    try {
      const payload = await generateRunRequest({
        mode: input.mode || playgroundMode,
        label: input.label,
        evalId: input.evalId || null,
        evalDraft: input.evalDraft,
        templateId: input.templateId,
        manualValues: input.manualValues || {},
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

  async function handleEvalBatchRun(input: EvalRunInput) {
    clearMessages();
    setBatchGenerating(true);
    try {
      if (!input.csvRows?.length) {
        throw new Error("Import a CSV with at least one row to run a batch.");
      }
      const payload = await batchRunRequest({
        label: input.label,
        evalId: input.evalId || null,
        evalDraft: input.evalDraft,
        templateId: input.templateId,
        manualValues: input.manualValues || {},
        csvRows: input.csvRows,
        columnMapping: input.columnMapping || null,
        generationSettings,
        settings,
        variants,
      });
      setRuns((current) => updateRunCollection(payload.run, current));
      setSelectedRunId(payload.run.id);
      startTransition(() => setActivePage("history"));
      setStatusMessage("Batch run completed.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to run batch."));
    } finally {
      setBatchGenerating(false);
    }
  }

  async function handleSaveEval(entry: Partial<EvalDefinition>): Promise<EvalDefinition | null> {
    clearMessages();
    try {
      const payload = await saveEvalRequest(entry);
      setEvals(payload.evals || []);
      setStatusMessage(`Saved eval "${payload.saved?.name || entry.name || ""}".`);
      return payload.saved || null;
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to save eval."));
      return null;
    }
  }

  async function handleDeleteEval(id: string) {
    clearMessages();
    try {
      const payload = await deleteEvalRequest(id);
      setEvals(payload.evals || []);
      setStatusMessage("Deleted eval.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to delete eval."));
    }
  }

  async function handleSaveDataset(entry: Partial<Dataset>): Promise<Dataset | null> {
    clearMessages();
    try {
      const payload = await saveDatasetRequest(entry);
      setDatasets(payload.datasets || []);
      setStatusMessage(`Saved dataset "${payload.saved?.name || entry.name || ""}".`);
      return payload.saved || null;
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to save dataset."));
      return null;
    }
  }

  async function handleDeleteDataset(id: string) {
    clearMessages();
    try {
      const payload = await deleteDatasetRequest(id);
      setDatasets(payload.datasets || []);
      setStatusMessage("Deleted dataset.");
    } catch (error) {
      setErrorMessage(ensureErrorMessage(error, "Failed to delete dataset."));
    }
  }

  async function handleSaveRating(payload: SaveRatingRequest) {
    clearMessages();
    const response = await saveRatingRequest(payload);
    setRuns((current) => current.map((run) => (run.id === response.run.id ? response.run : run)));
    setSelectedRunId(response.run.id);
    setStatusMessage("Saved rating.");
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
    handleEvalGenerate,
    handleEvalBatchRun,
    handleSaveEval,
    handleDeleteEval,
    handleSaveDataset,
    handleDeleteDataset,
    handleSaveRating,
    handleSaveSettings,
    updateVariant,
  };
}
