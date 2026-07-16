import type {
  BatchSectionProps,
  EvalsSectionProps,
  HistorySectionProps,
  PlaygroundSectionProps,
  SettingsSectionProps,
  WorkspaceState,
  WorkspaceStatusViewModel,
} from "@/lib/types/workspace";
import { getWorkspaceStatItems } from "@/lib/workspace-selectors";

export function getWorkspaceStatsViewModel(workspace: WorkspaceState) {
  return getWorkspaceStatItems({
    platformStatus: workspace.platformStatus,
    promptTemplateCount: workspace.promptTemplates.length,
    runCount: workspace.runs.length,
    sourcePoolStats: workspace.sourcePoolStats,
    testCaseCount: workspace.testCases.length,
    workspaceSaveState: workspace.workspaceSaveState,
  });
}

export function getWorkspaceStatusViewModel(workspace: WorkspaceState): WorkspaceStatusViewModel {
  return {
    dismissMessage: workspace.dismissMessage,
    errorMessage: workspace.errorMessage,
    loading: workspace.loading,
    statusMessage: workspace.statusMessage,
  };
}

export function getPlaygroundSectionProps(workspace: WorkspaceState): PlaygroundSectionProps {
  return {
    activeEvalId: workspace.activeEvalId,
    availableModelOptions: workspace.availableModelOptions,
    datasets: workspace.datasets,
    enabledModelIds: workspace.enabledModelIds,
    evals: workspace.evals,
    generationSettings: workspace.generationSettings,
    handleEvalGenerate: workspace.handleEvalGenerate,
    handleSaveEval: workspace.handleSaveEval,
    playgroundGenerating: workspace.playgroundGenerating,
    playgroundMode: workspace.playgroundMode,
    playgroundRun: workspace.playgroundRun,
    setActiveEvalId: workspace.setActiveEvalId,
    setActivePage: workspace.setActivePage,
    setGenerationSettings: workspace.setGenerationSettings,
    setVariants: workspace.setVariants,
    updateVariant: workspace.updateVariant,
    variants: workspace.variants,
  };
}

export function getBatchSectionProps(workspace: WorkspaceState): BatchSectionProps {
  return {
    activeEvalId: workspace.activeEvalId,
    availableModelOptions: workspace.availableModelOptions,
    batchGenerating: workspace.batchGenerating,
    datasets: workspace.datasets,
    enabledModelIds: workspace.enabledModelIds,
    evals: workspace.evals,
    handleEvalBatchRun: workspace.handleEvalBatchRun,
    setActiveEvalId: workspace.setActiveEvalId,
    setVariants: workspace.setVariants,
    updateVariant: workspace.updateVariant,
    variants: workspace.variants,
  };
}

export function getEvalsSectionProps(workspace: WorkspaceState): EvalsSectionProps {
  return {
    datasets: workspace.datasets,
    evals: workspace.evals,
    handleDeleteDataset: workspace.handleDeleteDataset,
    handleDeleteEval: workspace.handleDeleteEval,
    handleSaveDataset: workspace.handleSaveDataset,
    handleSaveEval: workspace.handleSaveEval,
    setActiveEvalId: workspace.setActiveEvalId,
    setActivePage: workspace.setActivePage,
  };
}

export function getHistorySectionProps(workspace: WorkspaceState): HistorySectionProps {
  return {
    filteredRuns: workspace.filteredRuns,
    handleSaveRating: workspace.handleSaveRating,
    historySearch: workspace.historySearch,
    selectedRun: workspace.selectedRun,
    selectedRunId: workspace.selectedRunId,
    setHistorySearch: workspace.setHistorySearch,
    setSelectedRunId: workspace.setSelectedRunId,
  };
}

export function getSettingsSectionProps(workspace: WorkspaceState): SettingsSectionProps {
  return {
    enabledModelIds: workspace.enabledModelIds,
    handleImportSourcePool: workspace.handleImportSourcePool,
    handleSaveSettings: workspace.handleSaveSettings,
    sourcePoolImporting: workspace.sourcePoolImporting,
    sourcePoolStats: workspace.sourcePoolStats,
  };
}
