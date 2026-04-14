import {
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_ENABLED_MODEL_IDS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  getDefaultEnabledModelId,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";
import type { AppSettings, Variant } from "@/lib/types/domain";

export function createInitialVariant(enabledModelIds = DEFAULT_ENABLED_MODEL_IDS): Variant {
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

export function createDefaultAppSettings(): AppSettings {
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

function sanitizeVariant(variant: Partial<Variant> | undefined, index: number): Variant {
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
    model: modelExists ? (variant?.model as string) : fallback.model,
    useOverrides: Boolean(variant?.useOverrides),
    promptSource:
      typeof variant?.promptSource === "string" && variant.promptSource
        ? variant.promptSource
        : "current",
  };
}

export function normalizeAppSettings(value: unknown): AppSettings {
  const defaults = createDefaultAppSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const input = value as Partial<AppSettings>;
  const rawActiveTab =
    typeof (value as { activeTab?: unknown }).activeTab === "string"
      ? ((value as { activeTab?: string }).activeTab ?? "")
      : "";
  const activeTab =
    rawActiveTab === "playground" ||
    rawActiveTab === "batch" ||
    rawActiveTab === "batches" ||
    rawActiveTab === "history" ||
    rawActiveTab === "settings"
      ? rawActiveTab === "batch"
        ? "batches"
        : rawActiveTab
      : defaults.activeTab;
  return {
    activeTab,
    playgroundMode: input.playgroundMode === "compare" ? "compare" : defaults.playgroundMode,
    caseDraft: normalizeTestCase({
      ...defaults.caseDraft,
      ...(input.caseDraft || {}),
    }),
    promptDraft: normalizePromptTemplate({
      ...defaults.promptDraft,
      ...(input.promptDraft || {}),
    }),
    generationSettings: {
      ...defaults.generationSettings,
      ...(input.generationSettings || {}),
    },
    variants:
      Array.isArray(input.variants) && input.variants.length
        ? input.variants.map((variant, index) => sanitizeVariant(variant, index))
        : defaults.variants,
    batchSelection: Array.isArray(input.batchSelection)
      ? input.batchSelection.filter((item): item is string => typeof item === "string")
      : defaults.batchSelection,
    importedCases: Array.isArray(input.importedCases)
      ? input.importedCases.map((item) => normalizeTestCase(item))
      : defaults.importedCases,
  };
}
