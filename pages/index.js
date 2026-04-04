import Head from "next/head";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import ResultCard from "@/components/result-card";
import {
  CAUSE_TAG_OPTIONS,
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  MODEL_OPTIONS,
} from "@/lib/constants";
import { parseCsv, toCsv } from "@/lib/csv";
import { normalizeTestCase } from "@/lib/prompt";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createInitialVariant() {
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

function shapeImportedCase(record) {
  const causeTags = record.causeTags
    ? record.causeTags.split("|").map((item) => item.trim()).filter(Boolean)
    : [];

  return normalizeTestCase({
    name: record.name,
    organizationName: record.organizationName,
    teamName: record.teamName,
    organizationType: record.organizationType,
    teamActivity: record.teamActivity,
    teamAffiliation: record.teamAffiliation,
    causeTags,
    messageLength: record.messageLength,
  });
}

function serializeRunRows(runs) {
  return runs.flatMap((run) =>
    (run.results || []).map((result) => ({
      runId: run.id,
      runLabel: run.label,
      runMode: run.mode,
      createdAt: run.createdAt,
      caseName: result.caseName,
      variantLabel: result.variantLabel,
      model: result.model,
      promptTemplateName: result.promptTemplateName,
      causeStatement: result.causeStatement,
      fullMessage: result.fullMessage,
      promptTokens: result.metrics?.promptTokens ?? 0,
      completionTokens: result.metrics?.completionTokens ?? 0,
      totalTokens: result.metrics?.totalTokens ?? 0,
      estimatedCost: result.metrics?.estimatedCost ?? "",
      latencyMs: result.metrics?.latencyMs ?? "",
      error: result.error || "",
    })),
  );
}

function formatModelOption(model) {
  if (model.unavailable) {
    return `${model.label} · unavailable`;
  }
  return `${model.label} · $${model.input}/$${model.output} per 1M in/out`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("playground");
  const [playgroundMode, setPlaygroundMode] = useState("single");
  const [testCases, setTestCases] = useState([]);
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [runs, setRuns] = useState([]);
  const [storageMode, setStorageMode] = useState("local");
  const [platformStatus, setPlatformStatus] = useState({
    openRouterConfigured: false,
    gateEnabled: false,
  });
  const [caseDraft, setCaseDraft] = useState(DEFAULT_TEST_CASE);
  const [promptDraft, setPromptDraft] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [generationSettings, setGenerationSettings] = useState(DEFAULT_GENERATION_SETTINGS);
  const [variants, setVariants] = useState([createInitialVariant()]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [batchSelection, setBatchSelection] = useState([]);
  const [importedCases, setImportedCases] = useState([]);
  const [theme, setTheme] = useState("light");

  const deferredSearch = useDeferredValue(historySearch);
  const selectedRun =
    runs.find((run) => run.id === selectedRunId) || runs[0] || null;

  async function loadAppData() {
    setLoading(true);
    try {
      const payload = await readJson(await fetch("/api/bootstrap"));
      setTestCases(payload.testCases || []);
      setPromptTemplates(payload.promptTemplates || []);
      setRuns(payload.runs || []);
      setStorageMode(payload.storageMode || "local");
      setPlatformStatus({
        openRouterConfigured: payload.openRouterConfigured,
        gateEnabled: payload.gateEnabled,
      });
      if (payload.runs?.[0]?.id) {
        setSelectedRunId((current) => current || payload.runs[0].id);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppData();
  }, []);

  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined" ? window.localStorage.getItem("dg-evals-theme") : null;
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
    }
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      window.localStorage.setItem("dg-evals-theme", nextTheme);
      return nextTheme;
    });
  }

  async function handleSaveCase(singleCase) {
    setStatusMessage("");
    setErrorMessage("");
    try {
      const payload = await readJson(
        await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: singleCase }),
        }),
      );
      setTestCases(payload.testCases || []);
      setStatusMessage("Saved test case library.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSaveImportedCases() {
    if (!importedCases.length) {
      return;
    }
    setStatusMessage("");
    setErrorMessage("");
    try {
      const payload = await readJson(
        await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: importedCases }),
        }),
      );
      setTestCases(payload.testCases || []);
      setImportedCases([]);
      setStatusMessage("Imported cases were saved to the library.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSavePrompt() {
    setStatusMessage("");
    setErrorMessage("");
    try {
      const payload = await readJson(
        await fetch("/api/prompt-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(promptDraft),
        }),
      );
      setPromptTemplates(payload.promptTemplates || []);
      setStatusMessage("Saved prompt template.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleGenerate() {
    setStatusMessage("");
    setErrorMessage("");
    try {
      const payload = await readJson(
        await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: playgroundMode,
            caseInput: caseDraft,
            promptDraft,
            generationSettings,
            variants: playgroundMode === "single" ? [variants[0]] : variants,
          }),
        }),
      );
      setRuns((current) => [payload.run, ...current.filter((item) => item.id !== payload.run.id)]);
      setSelectedRunId(payload.run.id);
      startTransition(() => setActiveTab("history"));
      setStatusMessage("Generation completed and saved to history.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleBatchRun() {
    setStatusMessage("");
    setErrorMessage("");
    try {
      const payload = await readJson(
        await fetch("/api/batch-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseIds: batchSelection,
            inlineCases: importedCases,
            promptDraft,
            generationSettings,
            variants,
          }),
        }),
      );
      setRuns((current) => [payload.run, ...current.filter((item) => item.id !== payload.run.id)]);
      setSelectedRunId(payload.run.id);
      startTransition(() => setActiveTab("history"));
      setStatusMessage("Batch run completed.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSaveRating(payload) {
    setStatusMessage("");
    setErrorMessage("");
    const response = await readJson(
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    setRuns((current) =>
      current.map((run) =>
        run.id === response.run.id ? response.run : run,
      ),
    );
    setSelectedRunId(response.run.id);
    setStatusMessage("Saved rating.");
  }

  const filteredRuns = runs.filter((run) => {
    if (!deferredSearch.trim()) {
      return true;
    }
    const haystack = [
      run.id,
      run.label,
      run.mode,
      ...(run.results || []).map(
        (result) => `${result.id} ${result.caseName} ${result.model} ${result.variantLabel}`,
      ),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(deferredSearch.toLowerCase());
  });

  function updateVariant(id, patch) {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    );
  }

  function renderPlayground() {
    return (
      <>
        <div className="content-header">
          <div>
            <h2>Playground</h2>
            <p>
              Run a single real-world prompt or compare multiple model and prompt variants on
              the same fundraiser input. Every generate action is saved to history.
            </p>
          </div>
          <div className="button-row">
            <button
              className={`mode-button ${playgroundMode === "single" ? "is-active" : ""}`}
              onClick={() => setPlaygroundMode("single")}
              type="button"
            >
              Single output
            </button>
            <button
              className={`mode-button ${playgroundMode === "compare" ? "is-active" : ""}`}
              onClick={() => setPlaygroundMode("compare")}
              type="button"
            >
              Comparison
            </button>
          </div>
        </div>

        <div className="two-column">
          <section className="panel-block">
            <h3>Fundraiser case</h3>
            <div className="field-grid">
              <div className="callout">
                Saved and generated cases are named automatically from the organization and team.
              </div>
              <Field
                label="Organization name"
                value={caseDraft.organizationName}
                onChange={(value) =>
                  setCaseDraft((current) => ({ ...current, organizationName: value }))
                }
              />
              <Field
                label="Team name"
                value={caseDraft.teamName}
                onChange={(value) => setCaseDraft((current) => ({ ...current, teamName: value }))}
              />
              <Field
                label="Organization type"
                value={caseDraft.organizationType}
                onChange={(value) =>
                  setCaseDraft((current) => ({ ...current, organizationType: value }))
                }
              />
              <Field
                label="Team activity"
                value={caseDraft.teamActivity}
                onChange={(value) =>
                  setCaseDraft((current) => ({ ...current, teamActivity: value }))
                }
              />
              <Field
                label="Team affiliation"
                value={caseDraft.teamAffiliation}
                onChange={(value) =>
                  setCaseDraft((current) => ({ ...current, teamAffiliation: value }))
                }
              />
              <div className="field-group">
                <label>Cause tags</label>
                <div className="chip-grid">
                  {CAUSE_TAG_OPTIONS.map((tag) => {
                    const selected = caseDraft.causeTags.includes(tag);
                    return (
                      <button
                        className={`chip-button ${selected ? "is-selected" : ""}`}
                        key={tag}
                        onClick={() =>
                          setCaseDraft((current) => {
                            const exists = current.causeTags.includes(tag);
                            const nextTags = exists
                              ? current.causeTags.filter((item) => item !== tag)
                              : [...current.causeTags, tag].slice(0, 3);
                            return { ...current, causeTags: nextTags };
                          })
                        }
                        type="button"
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <div className="field-help">Up to 3 tags in the prompt payload.</div>
              </div>
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <button
                className="ghost-button"
                onClick={() => handleSaveCase(normalizeTestCase(caseDraft))}
                type="button"
              >
                Save case
              </button>
              <button
                className="ghost-button"
                onClick={() => {
                  const testCase = testCases[0];
                  if (testCase) {
                    setCaseDraft(testCase);
                  }
                }}
                type="button"
              >
                Load first saved case
              </button>
            </div>
          </section>

          <section className="panel-block">
            <h3>Message recipe</h3>
            <div className="field-grid">
              <Field
                label="Recipe name"
                value={promptDraft.name}
                onChange={(value) => setPromptDraft((current) => ({ ...current, name: value }))}
              />
              <TextAreaField
                label="System prompt"
                value={promptDraft.systemPrompt}
                onChange={(value) =>
                  setPromptDraft((current) => ({ ...current, systemPrompt: value }))
                }
              />
              <TextAreaField
                label="User prompt template"
                value={promptDraft.userPromptTemplate}
                onChange={(value) =>
                  setPromptDraft((current) => ({ ...current, userPromptTemplate: value }))
                }
              />
              <Field
                label="Prefix text"
                value={promptDraft.prefixText}
                onChange={(value) => setPromptDraft((current) => ({ ...current, prefixText: value }))}
              />
              <Field
                label="Suffix text"
                value={promptDraft.suffixText}
                onChange={(value) => setPromptDraft((current) => ({ ...current, suffixText: value }))}
              />
              <Field
                label="Message length instruction"
                value={promptDraft.messageLengthInstruction}
                onChange={(value) =>
                  setPromptDraft((current) => ({ ...current, messageLengthInstruction: value }))
                }
              />
              <div className="inline-grid">
                <Field
                  label="Temperature"
                  type="number"
                  value={generationSettings.temperature}
                  onChange={(value) =>
                    setGenerationSettings((current) => ({ ...current, temperature: value }))
                  }
                />
                <Field
                  label="Top P"
                  type="number"
                  value={generationSettings.topP}
                  onChange={(value) =>
                    setGenerationSettings((current) => ({ ...current, topP: value }))
                  }
                />
                <Field
                  label="Max tokens"
                  type="number"
                  value={generationSettings.maxTokens}
                  onChange={(value) =>
                    setGenerationSettings((current) => ({ ...current, maxTokens: value }))
                  }
                />
                <Field
                  label="Seed"
                  value={generationSettings.seed}
                  onChange={(value) =>
                    setGenerationSettings((current) => ({ ...current, seed: value }))
                  }
                />
              </div>
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <button className="ghost-button" onClick={handleSavePrompt} type="button">
                Save recipe
              </button>
              <button
                className="ghost-button"
                onClick={() => {
                  const template = promptTemplates[0];
                  if (template) {
                    setPromptDraft(template);
                  }
                }}
                type="button"
              >
                Load first saved template
              </button>
            </div>
          </section>
        </div>

        <section className="panel-block" style={{ marginTop: 18 }}>
          <div className="variant-row" style={{ marginBottom: 16 }}>
            <div>
              <h3>Variants</h3>
              <div className="field-help">
                In single mode the first variant is used. In compare mode each row is generated
                side-by-side.
              </div>
            </div>
            <button
              className="ghost-button"
              onClick={() =>
                setVariants((current) => [
                  ...current,
                  {
                    ...createInitialVariant(),
                    label: `Variant ${current.length + 1}`,
                  },
                ])
              }
              type="button"
            >
              Add variant
            </button>
          </div>

          <div className="variant-list">
            {variants.map((variant, index) => (
              <div className="variant-card" key={variant.id}>
                <div className="variant-row">
                  <div>
                    <div className="variant-title">{variant.label}</div>
                    <div className="field-help">Model + optional per-variant overrides.</div>
                  </div>
                  {index > 0 ? (
                    <button
                      className="danger-button"
                      onClick={() =>
                        setVariants((current) => current.filter((item) => item.id !== variant.id))
                      }
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="inline-grid">
                  <Field
                    label="Label"
                    value={variant.label}
                    onChange={(value) => updateVariant(variant.id, { label: value })}
                  />
                  <div className="field-group">
                    <label htmlFor={`${variant.id}-model`}>Model</label>
                    <select
                      id={`${variant.id}-model`}
                      onChange={(event) => updateVariant(variant.id, { model: event.target.value })}
                      value={variant.model}
                    >
                      {MODEL_OPTIONS.map((model) => (
                        <option disabled={model.unavailable} key={model.value} value={model.value}>
                          {formatModelOption(model)}
                        </option>
                      ))}
                    </select>
                    <div className="field-help">
                      Pricing shown is per 1M input / 1M output tokens.
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor={`${variant.id}-prompt-source`}>Prompt source</label>
                    <select
                      id={`${variant.id}-prompt-source`}
                      onChange={(event) =>
                        updateVariant(variant.id, { promptSource: event.target.value })
                      }
                      value={variant.promptSource}
                    >
                      <option value="current">Current draft</option>
                      {promptTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field
                    label="Temperature override"
                    type="number"
                    value={variant.temperature}
                    onChange={(value) => updateVariant(variant.id, { temperature: value })}
                  />
                  <Field
                    label="Top P override"
                    type="number"
                    value={variant.topP}
                    onChange={(value) => updateVariant(variant.id, { topP: value })}
                  />
                  <Field
                    label="Max tokens override"
                    type="number"
                    value={variant.maxTokens}
                    onChange={(value) => updateVariant(variant.id, { maxTokens: value })}
                  />
                  <Field
                    label="Seed override"
                    value={variant.seed}
                    onChange={(value) => updateVariant(variant.id, { seed: value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="button-row" style={{ marginTop: 18 }}>
            <button className="primary-button" onClick={handleGenerate} type="button">
              Generate
            </button>
            <button
              className="ghost-button"
              onClick={() => downloadCsv("test-cases.csv", testCases)}
              type="button"
            >
              Export saved cases
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderBatch() {
    return (
      <>
        <div className="content-header">
          <div>
            <h2>Batch Runs</h2>
            <p>
              Run the same prompt stack across multiple saved or imported cases. Imported rows
              can be saved back into the shared case library.
            </p>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={handleBatchRun} type="button">
              Run batch
            </button>
            <button
              className="ghost-button"
              onClick={() => downloadCsv("saved-runs.csv", serializeRunRows(runs))}
              type="button"
            >
              Export run rows
            </button>
          </div>
        </div>

        <div className="two-column">
          <section className="panel-block">
            <h3>Saved case library</h3>
            {testCases.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Use</th>
                      <th>Name</th>
                      <th>Tags</th>
                      <th>Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.map((testCase) => (
                      <tr key={testCase.id}>
                        <td>
                          <input
                            checked={batchSelection.includes(testCase.id)}
                            onChange={(event) =>
                              setBatchSelection((current) =>
                                event.target.checked
                                  ? [...current, testCase.id]
                                  : current.filter((id) => id !== testCase.id),
                              )
                            }
                            type="checkbox"
                          />
                        </td>
                        <td>{testCase.name}</td>
                        <td>{testCase.causeTags.join(", ")}</td>
                        <td>{testCase.messageLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No saved cases yet.</div>
            )}
          </section>

          <section className="panel-block">
            <h3>CSV import</h3>
            <div className="field-help" style={{ marginBottom: 12 }}>
              Expected headers: name, organizationName, teamName, organizationType, teamActivity,
              teamAffiliation, causeTags, messageLength. Use `|` between cause tags.
            </div>
            <div className="field-group">
              <label htmlFor="csv-import">Upload CSV</label>
              <input
                id="csv-import"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  const text = await file.text();
                  const parsed = parseCsv(text).map(shapeImportedCase);
                  setImportedCases(parsed);
                }}
                type="file"
              />
            </div>
            {importedCases.length ? (
              <>
                <div className="callout" style={{ marginTop: 16 }}>
                  {importedCases.length} imported cases are staged for the next batch run.
                </div>
                <div className="button-row" style={{ marginTop: 16 }}>
                  <button className="ghost-button" onClick={handleSaveImportedCases} type="button">
                    Save imported cases
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => downloadCsv("imported-cases.csv", importedCases)}
                    type="button"
                  >
                    Export staged rows
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ marginTop: 16 }}>
                Import a CSV to stage additional batch cases.
              </div>
            )}
          </section>
        </div>

        <section className="panel-block" style={{ marginTop: 18 }}>
          <h3>Current variant matrix</h3>
          <div className="field-help" style={{ marginBottom: 16 }}>
            Batch runs reuse the same variant definitions from the Playground tab.
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Model</th>
                  <th>Prompt source</th>
                  <th>Overrides</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td>{variant.label}</td>
                    <td>{variant.model}</td>
                    <td>
                      {variant.promptSource === "current"
                        ? "Current draft"
                        : promptTemplates.find((item) => item.id === variant.promptSource)?.name ||
                          "Saved template"}
                    </td>
                    <td>
                      T {variant.temperature || "shared"} · P {variant.topP || "shared"} · Max{" "}
                      {variant.maxTokens || "shared"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  function renderHistory() {
    return (
      <>
        <div className="content-header">
          <div>
            <h2>History</h2>
            <p>
              Review saved outputs, export experiment rows, and search by run ID or output ID when
              you need to reopen a specific experiment.
            </p>
          </div>
          <input
            className="search-input"
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Search runs, cases, or models"
            value={historySearch}
          />
        </div>

        <div className="two-column">
          <section className="panel-block">
            <h3>Saved runs</h3>
            {filteredRuns.length ? (
              <div className="history-list">
                {filteredRuns.map((run) => (
                  <button
                    className="history-card"
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    style={{
                      borderColor: selectedRunId === run.id ? "rgba(242, 135, 73, 0.35)" : undefined,
                      textAlign: "left",
                    }}
                    type="button"
                  >
                    <div className="history-row">
                      <h4>{run.label}</h4>
                      <span className="badge">
                        <strong>{run.mode}</strong>
                        mode
                      </span>
                    </div>
                    <div className="status-line">
                      <span>ID {run.id}</span>
                      <span>{new Date(run.createdAt).toLocaleString()}</span>
                      <span>{run.results?.length || 0} variants</span>
                      <span>{run.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">No runs match the current filter.</div>
            )}
          </section>

          <section className="panel-block">
            <div className="utility-row" style={{ marginBottom: 16 }}>
              <h3>Selected run</h3>
              {selectedRun ? (
                <button
                  className="ghost-button"
                  onClick={() =>
                    downloadCsv(`run-${selectedRun.id}.csv`, serializeRunRows([selectedRun]))
                  }
                  type="button"
                >
                  Export selected run
                </button>
              ) : null}
            </div>
            {selectedRun ? (
              <>
                <div className="callout">
                  <strong>{selectedRun.label}</strong> · {selectedRun.mode} ·{" "}
                  {selectedRun.results?.length || 0} results · run ID {selectedRun.id}
                </div>
                <div className="result-grid" style={{ marginTop: 18 }}>
                  {(selectedRun.results || []).map((result) => (
                    <ResultCard
                      key={result.id}
                      onSaveRating={handleSaveRating}
                      result={{ ...result, runId: selectedRun.id }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">Generate or batch-run something to populate history.</div>
            )}
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>DG Fundraiser LLM Eval Tool</title>
        <meta
          content="Generate, compare, and batch-evaluate fundraiser cause statements with OpenRouter-backed models."
          name="description"
        />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <div className={`${displayFont.variable} ${bodyFont.variable} app-shell`}>
        <div className="app-frame">
          <div className="layout-grid">
            <aside className="nav-panel">
              <div className="section-label">DG workspace</div>
              <div className="sidebar-title">Fundraiser message evals</div>
              <div className="field-help" style={{ marginBottom: 16 }}>
                Single runs, comparisons, batch experiments, and saved scoring in one place.
              </div>
              <div className="nav-list">
                {[
                  ["playground", "Playground"],
                  ["batch", "Batch Runs"],
                  ["history", "History"],
                ].map(([id, label]) => (
                  <button
                    className={`nav-button ${activeTab === id ? "is-active" : ""}`}
                    key={id}
                    onClick={() => setActiveTab(id)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="button-row" style={{ marginTop: 14 }}>
                <button className="ghost-button" onClick={toggleTheme} type="button">
                  {theme === "dark" ? "Switch to light" : "Switch to dark"}
                </button>
              </div>

              <div className="meta-stack">
                <div className="meta-item">
                  <span>Generation</span>
                  <strong>{platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode"}</strong>
                </div>
                <div className="meta-item">
                  <span>Saved cases</span>
                  <strong>{testCases.length}</strong>
                </div>
                <div className="meta-item">
                  <span>Prompt templates</span>
                  <strong>{promptTemplates.length}</strong>
                </div>
                <div className="meta-item">
                  <span>Storage</span>
                  <strong>{storageMode}</strong>
                </div>
              </div>
            </aside>

            <main className="content-panel">
              {loading ? <div className="empty-state">Loading workspace…</div> : null}
              {!loading && errorMessage ? (
                <div className="callout error-callout" style={{ marginBottom: 16 }}>
                  {errorMessage}
                </div>
              ) : null}
              {!loading && statusMessage ? (
                <div className="callout success-callout" style={{ marginBottom: 16 }}>
                  {statusMessage}
                </div>
              ) : null}
              {!loading && activeTab === "playground" ? renderPlayground() : null}
              {!loading && activeTab === "batch" ? renderBatch() : null}
              {!loading && activeTab === "history" ? renderHistory() : null}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, onChange, type = "text", value, ...props }) {
  return (
    <div className="field-group">
      <label>{label}</label>
      <input onChange={(event) => onChange(event.target.value)} type={type} value={value} {...props} />
    </div>
  );
}

function TextAreaField({ label, onChange, value }) {
  return (
    <div className="field-group">
      <label>{label}</label>
      <textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}
