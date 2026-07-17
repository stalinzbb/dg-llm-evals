import type { Run, RunResult } from "@/lib/types/domain";

interface LegacyRunResultFields {
  causeStatement?: string;
  fullMessage?: string;
  metrics?: {
    causeOnlyCharacters?: number;
    fullMessageCharacters?: number;
  };
}

/**
 * Adapt runs persisted before the generic eval rework (which stored
 * `causeStatement`/`fullMessage`) to the current `output`/`wrappedOutput`
 * shape so history keeps rendering.
 */
export function normalizeRunResult(result: RunResult & LegacyRunResultFields): RunResult {
  const output = result.output ?? result.causeStatement ?? "";
  const wrappedOutput = result.wrappedOutput ?? result.fullMessage ?? "";
  const metrics = result.metrics
    ? {
        ...result.metrics,
        outputCharacters:
          result.metrics.outputCharacters ?? result.metrics.causeOnlyCharacters ?? output.length,
        wrappedOutputCharacters:
          result.metrics.wrappedOutputCharacters ??
          result.metrics.fullMessageCharacters ??
          wrappedOutput.length,
      }
    : result.metrics;

  return { ...result, output, wrappedOutput, metrics };
}

export function normalizeRun(run: Run): Run {
  return {
    ...run,
    results: (run.results || []).map((result) =>
      normalizeRunResult(result as RunResult & LegacyRunResultFields),
    ),
  };
}

export function normalizeRuns(runs: Run[] = []): Run[] {
  return runs.map(normalizeRun);
}
