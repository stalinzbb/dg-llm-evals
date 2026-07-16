import type {
  Dataset,
  EvalDefinition,
  EvalPromptTemplate,
  RubricCriterion,
  VariableDefinition,
  VariableSource,
} from "@/lib/types/eval";
import { VARIABLE_KEY_PATTERN } from "@/lib/template";

export const DEFAULT_RUBRIC_CRITERIA: RubricCriterion[] = [
  { key: "clarity", label: "Clarity", min: 1, max: 5 },
  { key: "specificity", label: "Specificity", min: 1, max: 5 },
  { key: "relevance", label: "Relevance", min: 1, max: 5 },
  { key: "tone", label: "Tone", min: 1, max: 5 },
  { key: "overall", label: "Overall", min: 1, max: 5 },
];

const VARIABLE_SOURCES: VariableSource[] = ["manual", "random"];

export function normalizeVariableDefinition(
  input: Partial<VariableDefinition> = {},
): VariableDefinition | null {
  const key = input.key?.trim() || "";
  if (!VARIABLE_KEY_PATTERN.test(key)) {
    return null;
  }
  const defaultSource = VARIABLE_SOURCES.includes(input.defaultSource as VariableSource)
    ? (input.defaultSource as VariableSource)
    : "manual";
  return {
    key,
    label: input.label?.trim() || key,
    defaultSource,
    datasetId: input.datasetId || null,
    defaultValue: typeof input.defaultValue === "string" ? input.defaultValue : "",
    required: input.required ?? true,
  };
}

export function normalizeEvalTemplate(
  input: Partial<EvalPromptTemplate> = {},
  index = 0,
): EvalPromptTemplate {
  return {
    id: input.id?.trim() || `template-${index + 1}`,
    name: input.name?.trim() || `Template ${index + 1}`,
    systemPrompt: typeof input.systemPrompt === "string" ? input.systemPrompt : "",
    userPromptTemplate:
      typeof input.userPromptTemplate === "string" ? input.userPromptTemplate : "",
    prefixText: typeof input.prefixText === "string" ? input.prefixText : "",
    suffixText: typeof input.suffixText === "string" ? input.suffixText : "",
  };
}

export function normalizeRubricCriterion(
  input: Partial<RubricCriterion> = {},
): RubricCriterion | null {
  const key = input.key?.trim() || "";
  if (!key) {
    return null;
  }
  const min = Number.isFinite(Number(input.min)) ? Number(input.min) : 1;
  const max = Number.isFinite(Number(input.max)) ? Number(input.max) : 5;
  return {
    key,
    label: input.label?.trim() || key,
    min,
    max: max > min ? max : min + 1,
  };
}

export function normalizeEvalDefinition(input: Partial<EvalDefinition> = {}): EvalDefinition {
  const variables = (Array.isArray(input.variables) ? input.variables : [])
    .map((variable) => normalizeVariableDefinition(variable))
    .filter((variable): variable is VariableDefinition => variable !== null)
    .filter((variable, index, all) => all.findIndex((v) => v.key === variable.key) === index);

  const templatesInput = Array.isArray(input.templates) && input.templates.length ? input.templates : [{}];
  const templates = templatesInput.map((template, index) => normalizeEvalTemplate(template, index));

  const rubric = (Array.isArray(input.rubric) ? input.rubric : DEFAULT_RUBRIC_CRITERIA)
    .map((criterion) => normalizeRubricCriterion(criterion))
    .filter((criterion): criterion is RubricCriterion => criterion !== null);

  return {
    id: input.id || null,
    name: input.name?.trim() || "Untitled eval",
    description: typeof input.description === "string" ? input.description.trim() : "",
    variables,
    templates,
    rubric: rubric.length ? rubric : [...DEFAULT_RUBRIC_CRITERIA],
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function normalizeDataset(input: Partial<Dataset> = {}): Dataset {
  const values = (Array.isArray(input.values) ? input.values : [])
    .map((value) => `${value}`.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);

  return {
    id: input.id || null,
    name: input.name?.trim() || "Untitled dataset",
    description: typeof input.description === "string" ? input.description.trim() : "",
    values,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
