import type {
  BatchSectionProps,
  HistorySectionProps,
  PlaygroundSectionProps,
  SettingsSectionProps,
  WorkspaceState,
  WorkspaceStatItem,
  WorkspaceStatusViewModel,
} from "@/lib/types/workspace";

export function getWorkspaceStatItems(workspace: WorkspaceState): WorkspaceStatItem[] {
  return [
    {
      label: "Generation",
      value: workspace.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
    },
    { label: "Cases", value: workspace.testCases.length },
    { label: "Prompts", value: workspace.promptTemplates.length },
    { label: "Runs", value: workspace.runs.length },
    { label: "Source pool", value: workspace.sourcePoolStats.total },
    { label: "Workspace", value: workspace.workspaceSaveState },
  ];
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
    availableModelOptions: workspace.availableModelOptions,
    canSaveCase: workspace.canSaveCase,
    canSavePrompt: workspace.canSavePrompt,
    caseDraft: workspace.caseDraft,
    causeTagOptions: workspace.causeTagOptions,
    enabledModelIds: workspace.enabledModelIds,
    generationSettings: workspace.generationSettings,
    handleDeleteCase: workspace.handleDeleteCase,
    handleDeletePrompt: workspace.handleDeletePrompt,
    handleGenerate: workspace.handleGenerate,
    handleRandomizeCaseFromSourcePool: workspace.handleRandomizeCaseFromSourcePool,
    handleRandomizeCauseTags: workspace.handleRandomizeCauseTags,
    handleSaveCase: workspace.handleSaveCase,
    handleSavePrompt: workspace.handleSavePrompt,
    normalizeTestCase: workspace.normalizeTestCase,
    playgroundGenerating: workspace.playgroundGenerating,
    playgroundMode: workspace.playgroundMode,
    playgroundRandomizing: workspace.playgroundRandomizing,
    playgroundRun: workspace.playgroundRun,
    promptDraft: workspace.promptDraft,
    promptTemplates: workspace.promptTemplates,
    setCaseDraft: workspace.setCaseDraft,
    setGenerationSettings: workspace.setGenerationSettings,
    setPromptDraft: workspace.setPromptDraft,
    setVariants: workspace.setVariants,
    sourcePoolStats: workspace.sourcePoolStats,
    testCases: workspace.testCases,
    updateVariant: workspace.updateVariant,
    variants: workspace.variants,
  };
}

export function getBatchSectionProps(workspace: WorkspaceState): BatchSectionProps {
  return {
    availableModelOptions: workspace.availableModelOptions,
    batchGenerating: workspace.batchGenerating,
    batchSampleCount: workspace.batchSampleCount,
    batchSelection: workspace.batchSelection,
    batchVerificationFilter: workspace.batchVerificationFilter,
    enabledModelIds: workspace.enabledModelIds,
    handleBatchRun: workspace.handleBatchRun,
    handleSaveImportedCases: workspace.handleSaveImportedCases,
    importedCases: workspace.importedCases,
    promptTemplates: workspace.promptTemplates,
    setBatchSampleCount: workspace.setBatchSampleCount,
    setBatchSelection: workspace.setBatchSelection,
    setBatchVerificationFilter: workspace.setBatchVerificationFilter,
    setImportedCases: workspace.setImportedCases,
    setVariants: workspace.setVariants,
    shapeImportedCase: workspace.shapeImportedCase,
    sourcePoolStats: workspace.sourcePoolStats,
    testCases: workspace.testCases,
    updateVariant: workspace.updateVariant,
    variants: workspace.variants,
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
