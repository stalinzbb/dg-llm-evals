import { describe, expect, it } from "vitest";

import { normalizeEvalDefinition } from "@/lib/eval";
import { VariableResolutionError, resolveVariables } from "@/lib/resolve-variables";
import type { Dataset } from "@/lib/types/eval";

const tones: Dataset = {
  id: "dataset_tones",
  name: "Tones",
  description: "",
  values: ["warm", "direct", "playful"],
};

const evalDef = normalizeEvalDefinition({
  id: "eval_test",
  name: "Test eval",
  variables: [
    { key: "topic", label: "Topic", defaultSource: "manual", datasetId: null, defaultValue: "", required: true },
    { key: "tone", label: "Tone", defaultSource: "random", datasetId: "dataset_tones", defaultValue: "", required: false },
    { key: "audience", label: "Audience", defaultSource: "manual", datasetId: null, defaultValue: "general readers", required: false },
  ],
  templates: [
    {
      id: "template-1",
      name: "Template 1",
      systemPrompt: "",
      userPromptTemplate: "Write about {{topic}} in a {{tone}} tone for {{audience}}.",
      prefixText: "",
      suffixText: "",
    },
  ],
});

describe("resolveVariables", () => {
  it("resolves manual, random, and default values", () => {
    const [record] = resolveVariables(evalDef, [tones], { manualValues: { topic: "space" } });
    expect(record.values.topic).toBe("space");
    expect(record.sources.topic).toBe("manual");
    expect(tones.values).toContain(record.values.tone);
    expect(record.sources.tone).toBe("random");
    expect(record.values.audience).toBe("general readers");
    expect(record.sources.audience).toBe("default");
  });

  it("samples reproducibly for the same seed", () => {
    const run = () =>
      resolveVariables(evalDef, [tones], { manualValues: { topic: "x" } }, { seed: "42" })[0].values.tone;
    expect(run()).toBe(run());
  });

  it("throws a structured error when required values are missing", () => {
    expect(() => resolveVariables(evalDef, [tones], { manualValues: {} })).toThrow(
      VariableResolutionError,
    );
  });

  it("produces one record per CSV row with column mapping", () => {
    const records = resolveVariables(evalDef, [tones], {
      manualValues: {},
      csvRows: [
        { Subject: "oceans", Voice: "calm" },
        { Subject: "volcanoes", Voice: "" },
      ],
      columnMapping: { Subject: "topic", Voice: "tone" },
    });
    expect(records).toHaveLength(2);
    expect(records[0].values).toMatchObject({ topic: "oceans", tone: "calm" });
    expect(records[0].sources.tone).toBe("csv");
    // Empty CSV cell falls back to the variable's random sourcing.
    expect(tones.values).toContain(records[1].values.tone);
    expect(records[1].sources.tone).toBe("random");
  });
});
