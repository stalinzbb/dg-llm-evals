import {
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  MODEL_OPTIONS,
} from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";

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

export function createDefaultAppSettings() {
  return {
    activeTab: "playground",
    playgroundMode: "single",
    caseDraft: normalizeTestCase(DEFAULT_TEST_CASE),
    promptDraft: normalizePromptTemplate(DEFAULT_PROMPT_TEMPLATE),
    generationSettings: { ...DEFAULT_GENERATION_SETTINGS },
    variants: [createInitialVariant()],
    batchSelection: [],
    importedCases: [],
  };
}

function sanitizeVariant(variant, index) {
  const fallback = createInitialVariant();
  const modelExists =
    typeof variant?.model === "string" &&
    MODEL_OPTIONS.some((option) => option.value === variant.model && !option.unavailable);

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
      value.activeTab === "playground" || value.activeTab === "batch" || value.activeTab === "history"
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
