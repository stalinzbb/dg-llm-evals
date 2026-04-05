import {
  CAUSE_TAG_OPTIONS,
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  MODEL_OPTIONS,
} from "@/lib/constants";
import { normalizeTaxonomySelection } from "@/lib/taxonomy";

function clampTagSelection(tags) {
  const normalized = Array.isArray(tags) ? tags : [];
  return normalized.filter((tag) => CAUSE_TAG_OPTIONS.includes(tag)).slice(0, 3);
}

export function normalizeTestCase(input = {}) {
  const organizationName = input.organizationName?.trim() || DEFAULT_TEST_CASE.organizationName;
  const teamName = input.teamName?.trim() || DEFAULT_TEST_CASE.teamName;
  const inferredName = [organizationName, teamName].filter(Boolean).join(" · ");
  const taxonomy = normalizeTaxonomySelection({
    organizationType: input.organizationType?.trim() || DEFAULT_TEST_CASE.organizationType,
    teamActivity: input.teamActivity?.trim() || DEFAULT_TEST_CASE.teamActivity,
    teamAffiliation: input.teamAffiliation?.trim() || DEFAULT_TEST_CASE.teamAffiliation,
  });

  return {
    id: input.id || null,
    name: inferredName || input.name?.trim() || DEFAULT_TEST_CASE.name,
    organizationName,
    teamName,
    organizationType: taxonomy.organizationType,
    teamActivity: taxonomy.teamActivity,
    teamAffiliation: taxonomy.teamAffiliation,
    causeTags: clampTagSelection(input.causeTags ?? DEFAULT_TEST_CASE.causeTags),
    messageLength: input.messageLength?.trim() || DEFAULT_TEST_CASE.messageLength,
  };
}

export function normalizePromptTemplate(input = {}) {
  return {
    id: input.id || null,
    name: input.name?.trim() || DEFAULT_PROMPT_TEMPLATE.name,
    systemPrompt: input.systemPrompt?.trim() || DEFAULT_PROMPT_TEMPLATE.systemPrompt,
    userPromptTemplate:
      input.userPromptTemplate?.trim() || DEFAULT_PROMPT_TEMPLATE.userPromptTemplate,
    prefixText: input.prefixText?.trim() || DEFAULT_PROMPT_TEMPLATE.prefixText,
    suffixText: input.suffixText?.trim() || DEFAULT_PROMPT_TEMPLATE.suffixText,
    messageLengthInstruction:
      input.messageLengthInstruction?.trim() ||
      input.messageLength?.trim() ||
      DEFAULT_PROMPT_TEMPLATE.messageLengthInstruction,
    isActive: input.isActive ?? true,
  };
}

export function normalizeGenerationSettings(input = {}) {
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

export function normalizeVariants(input = []) {
  const rawVariants = Array.isArray(input) && input.length > 0 ? input : [{ label: "Primary" }];
  const defaultModel = MODEL_OPTIONS.find((model) => !model.unavailable)?.value || "openai/gpt-5.4-mini";

  return rawVariants.map((variant, index) => ({
    id: variant.id || `variant-${index + 1}`,
    label: variant.label?.trim() || `Variant ${index + 1}`,
    model: variant.model?.trim() || defaultModel,
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

export function inferCaseName(testCase) {
  return [testCase.organizationName, testCase.teamName].filter(Boolean).join(" · ");
}

export function renderUserPrompt(testCase, promptTemplate) {
  const details = [
    `Organization Name: ${testCase.organizationName}`,
    `Team Name: ${testCase.teamName}`,
    `Organization Type: ${testCase.organizationType}`,
    `Team Activity: ${testCase.teamActivity}`,
    `Team Affiliation: ${testCase.teamAffiliation}`,
    `Reason for Fundraiser Tags: ${testCase.causeTags.join(", ") || "Not specified"}`,
    `Desired Message Length: ${promptTemplate.messageLengthInstruction}`,
  ].join("\n");

  return `${promptTemplate.userPromptTemplate}\n\n${details}`;
}

export function buildFullMessage(promptTemplate, causeStatement) {
  const pieces = [promptTemplate.prefixText, causeStatement, promptTemplate.suffixText]
    .map((item) => item?.trim())
    .filter(Boolean);
  return pieces.join(" ");
}

export function scoreCharacterCounts(causeStatement, fullMessage) {
  return {
    causeOnlyCharacters: causeStatement.length,
    fullMessageCharacters: fullMessage.length,
  };
}
