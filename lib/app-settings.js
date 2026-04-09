import {
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_ENABLED_MODEL_IDS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  getDefaultEnabledModelId,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";

export function createInitialVariant(enabledModelIds = DEFAULT_ENABLED_MODEL_IDS) {
  const defaultModel = getDefaultEnabledModelId(normalizeEnabledModelIds(enabledModelIds));
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

export function createDefaultAppSettings() {
  return {
    activeTab: "playground",
    playgroundMode: "single",
    caseDraft: normalizeTestCase(DEFAULT_TEST_CASE),
    promptDraft: normalizePromptTemplate(DEFAULT_PROMPT_TEMPLATE),
    generationSettings: { ...DEFAULT_GENERATION_SETTINGS },
    variants: [createInitialVariant(DEFAULT_ENABLED_MODEL_IDS)],
    batchSelection: [],
    importedCases: [],
  };
}

function sanitizeVariant(variant, index) {
  const fallback = createInitialVariant(DEFAULT_ENABLED_MODEL_IDS);
  const validModelIds = new Set(normalizeEnabledModelIds(DEFAULT_ENABLED_MODEL_IDS));
  const modelExists = typeof variant?.model === "string" && validModelIds.has(variant.model);

  return {
    ...fallback,
    ...variant,
    id: typeof variant?.id === "string" && variant.id ? variant.id : fallback.id,
    label:
      typeof variant?.label === "string" && variant.label
        ? variant.label
        : index === 0
          ? "Primary"
          : `Variant ${index + 1}`,
    model: modelExists ? variant.model : fallback.model,
    useOverrides: Boolean(variant?.useOverrides),
    promptSource:
      typeof variant?.promptSource === "string" && variant.promptSource
        ? variant.promptSource
        : "current",
  };
}

export function normalizeAppSettings(value) {
  const defaults = createDefaultAppSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  return {
    activeTab:
      value.activeTab === "playground" ||
      value.activeTab === "batch" ||
      value.activeTab === "batches" ||
      value.activeTab === "history" ||
      value.activeTab === "settings"
        ? value.activeTab
        : defaults.activeTab,
    playgroundMode: value.playgroundMode === "compare" ? "compare" : defaults.playgroundMode,
    caseDraft: normalizeTestCase({
      ...defaults.caseDraft,
      ...(value.caseDraft || {}),
    }),
    promptDraft: normalizePromptTemplate({
      ...defaults.promptDraft,
      ...(value.promptDraft || {}),
    }),
    generationSettings: {
      ...defaults.generationSettings,
      ...(value.generationSettings || {}),
    },
    variants:
      Array.isArray(value.variants) && value.variants.length
        ? value.variants.map((variant, index) => sanitizeVariant(variant, index))
        : defaults.variants,
    batchSelection: Array.isArray(value.batchSelection)
      ? value.batchSelection.filter((item) => typeof item === "string")
      : defaults.batchSelection,
    importedCases: Array.isArray(value.importedCases)
      ? value.importedCases.map((item) => normalizeTestCase(item))
      : defaults.importedCases,
  };
}
