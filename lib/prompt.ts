import {
  DEFAULT_GENERATION_SETTINGS,
  getDefaultEnabledModelId,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import type { GenerationSettings, NormalizedVariant, Variant } from "@/lib/types/domain";

export function normalizeGenerationSettings(input: Partial<GenerationSettings> = {}): GenerationSettings {
  return {
    temperature: Number.isFinite(Number(input.temperature))
      ? Number(input.temperature)
      : DEFAULT_GENERATION_SETTINGS.temperature,
    topP: Number.isFinite(Number(input.topP))
      ? Number(input.topP)
      : DEFAULT_GENERATION_SETTINGS.topP,
    maxTokens: Number.isFinite(Number(input.maxTokens))
      ? Number(input.maxTokens)
      : DEFAULT_GENERATION_SETTINGS.maxTokens,
    seed: input.seed?.toString().trim() || "",
  };
}

export function normalizeVariants(
  input: Partial<Variant>[] = [],
  options: { enabledModelIds?: string[] } = {},
): NormalizedVariant[] {
  const rawVariants = Array.isArray(input) && input.length > 0 ? input : [{ label: "Primary" }];
  const enabledModelIds = normalizeEnabledModelIds(options.enabledModelIds);
  const defaultModel = getDefaultEnabledModelId(enabledModelIds) || "openai/gpt-5.4-mini";
  const validModelIds = new Set(enabledModelIds.length ? enabledModelIds : [defaultModel]);

  return rawVariants.map((variant, index) => ({
    id: variant.id || `variant-${index + 1}`,
    label: variant.label?.trim() || `Variant ${index + 1}`,
    model:
      variant.model?.trim() && validModelIds.has(variant.model.trim())
        ? variant.model.trim()
        : defaultModel,
    promptSource: variant.promptSource?.trim() || "current",
    temperature:
      variant.temperature === undefined || variant.temperature === ""
        ? null
        : Number(variant.temperature),
    topP: variant.topP === undefined || variant.topP === "" ? null : Number(variant.topP),
    maxTokens:
      variant.maxTokens === undefined || variant.maxTokens === ""
        ? null
        : Number(variant.maxTokens),
    seed: variant.seed?.toString().trim() || "",
  }));
}

export function buildWrappedOutput(
  template: { prefixText?: string; suffixText?: string },
  output: string,
): string {
  const pieces = [template.prefixText, output, template.suffixText]
    .map((item) => item?.trim())
    .filter(Boolean);
  return pieces.join(" ");
}

export function scoreCharacterCounts(output: string, wrappedOutput: string) {
  return {
    outputCharacters: output.length,
    wrappedOutputCharacters: wrappedOutput.length,
  };
}
