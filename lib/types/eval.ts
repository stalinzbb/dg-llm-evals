export type VariableSource = "manual" | "random";

export interface VariableDefinition {
  /** Identifier used inside templates, e.g. "org.name". Dots are literal characters. */
  key: string;
  /** Human-friendly label shown in forms. */
  label: string;
  /** How the value is sourced by default when running. CSV batch mode overrides per run. */
  defaultSource: VariableSource;
  /** Dataset backing "random" sourcing (and offering suggestions for manual entry). */
  datasetId: string | null;
  /** Pre-filled value for manual entry. */
  defaultValue: string;
  required: boolean;
}

export interface Dataset {
  id: string | null;
  name: string;
  description: string;
  values: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EvalPromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  /** Optional static text prepended to the model output when assembling the final content. */
  prefixText: string;
  /** Optional static text appended to the model output. */
  suffixText: string;
}

export interface RubricCriterion {
  key: string;
  label: string;
  /** Inclusive score bounds; defaults 1–5. */
  min: number;
  max: number;
}

export interface EvalDefinition {
  id: string | null;
  name: string;
  description: string;
  variables: VariableDefinition[];
  templates: EvalPromptTemplate[];
  rubric: RubricCriterion[];
  createdAt?: string;
  updatedAt?: string;
}

/** Input describing where each variable's value comes from for one run. */
export interface RunVariableInput {
  /** Values typed by the user, keyed by variable key. */
  manualValues: Record<string, string>;
  /** When set, each row produces one resolved record; column header → variable key. */
  csvRows?: Record<string, string>[] | null;
  /** CSV header → variable key mapping. Defaults to identity on variable keys. */
  columnMapping?: Record<string, string> | null;
}

export interface ResolvedVariables {
  values: Record<string, string>;
  /** Which source actually supplied each value ("manual" | "random" | "csv" | "default"). */
  sources: Record<string, string>;
}
