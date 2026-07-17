import type {
  Dataset,
  EvalDefinition,
  ResolvedVariables,
  RunVariableInput,
} from "@/lib/types/eval";

/** Deterministic RNG (mulberry32) so seeded runs sample reproducibly. */
function createRng(seedText: string): () => number {
  let hash = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = Math.imul(hash ^ seedText.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class VariableResolutionError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "VariableResolutionError";
    this.issues = issues;
  }
}

/**
 * Resolve every variable of an eval to concrete values.
 * Returns one record per run: a single record for manual/random sourcing, or
 * one per CSV row when csvRows are provided.
 */
export function resolveVariables(
  evalDefinition: EvalDefinition,
  datasets: Dataset[],
  input: RunVariableInput,
  options: { seed?: string } = {},
): ResolvedVariables[] {
  const datasetsById = new Map(datasets.map((dataset) => [dataset.id, dataset]));
  const manualValues = input.manualValues || {};
  const csvRows = Array.isArray(input.csvRows) && input.csvRows.length ? input.csvRows : null;
  const columnMapping = input.columnMapping || null;
  const issues: string[] = [];

  const csvValueByVariable = (row: Record<string, string>): Record<string, string> => {
    const mapped: Record<string, string> = {};
    if (!columnMapping) {
      return { ...row };
    }
    for (const [column, variableKey] of Object.entries(columnMapping)) {
      if (!variableKey) continue;
      if (column in row) {
        mapped[variableKey] = row[column];
      }
    }
    return mapped;
  };

  const rows = csvRows ? csvRows.map(csvValueByVariable) : [null];
  const rng = createRng(options.seed || evalDefinition.id || evalDefinition.name || "seed");

  const records = rows.map((row, rowIndex) => {
    const values: Record<string, string> = {};
    const sources: Record<string, string> = {};

    for (const variable of evalDefinition.variables) {
      const csvValue = row?.[variable.key];
      if (csvValue !== undefined && `${csvValue}`.trim() !== "") {
        values[variable.key] = `${csvValue}`.trim();
        sources[variable.key] = "csv";
        continue;
      }

      const manualValue = manualValues[variable.key];
      if (manualValue !== undefined && `${manualValue}`.trim() !== "") {
        values[variable.key] = `${manualValue}`.trim();
        sources[variable.key] = "manual";
        continue;
      }

      if (variable.defaultSource === "random") {
        const dataset = variable.datasetId ? datasetsById.get(variable.datasetId) : null;
        if (!dataset || !dataset.values.length) {
          if (variable.required) {
            issues.push(
              `Variable "${variable.key}" is set to random sourcing but its dataset is ${dataset ? "empty" : "missing"}.`,
            );
          }
          values[variable.key] = variable.defaultValue || "";
          sources[variable.key] = "default";
          continue;
        }
        values[variable.key] = dataset.values[Math.floor(rng() * dataset.values.length)];
        sources[variable.key] = "random";
        continue;
      }

      if (variable.defaultValue) {
        values[variable.key] = variable.defaultValue;
        sources[variable.key] = "default";
        continue;
      }

      if (variable.required) {
        issues.push(
          csvRows
            ? `Variable "${variable.key}" has no value in CSV row ${rowIndex + 1} and no manual/default value.`
            : `Variable "${variable.key}" is required but has no value.`,
        );
      }
      values[variable.key] = "";
      sources[variable.key] = "empty";
    }

    return { values, sources };
  });

  if (issues.length) {
    throw new VariableResolutionError(issues);
  }

  return records;
}
