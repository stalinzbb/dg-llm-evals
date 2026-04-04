import ResultCard from "@/components/result-card";
import {
  createInitialVariant,
  downloadCsv,
  formatModelOption,
  formatShortId,
  serializeRunRows,
} from "@/lib/workspace";
import { MODEL_OPTIONS } from "@/lib/constants";
import { parseCsv, toCsv } from "@/lib/csv";

const HELP_TEXT = {
  temperature:
    "Controls randomness. Lower values stay more deterministic, while higher values allow more variation in tone and phrasing.",
  topP:
    "Limits sampling to the most likely token choices within a probability mass. Lower values make responses tighter and more focused.",
  seed:
    "Sets the sampling starting point. Reusing the same seed can help reproduce similar outputs when the rest of the settings stay the same.",
};

function formatHistoryDateParts(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  };
}

function normalizeShortRunId(value) {
  if (!value) {
    return "";
  }
  return formatShortId(value.replace(/^run_/, ""), 6);
}

function clampDecimalInput(value, { min, max }) {
  if (value === "") {
    return "";
  }
  if (!/^\d*\.?\d*$/.test(value)) {
    return value.slice(0, -1);
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return "";
  }
  if (parsed < min) {
    return String(min);
  }
  if (parsed > max) {
    return String(max);
  }
  return value;
}

function clampIntegerInput(value) {
  if (value === "") {
    return "";
  }
  const sanitized = value.replace(/[^\d-]/g, "");
  if (sanitized === "-" || /^-?\d+$/.test(sanitized)) {
    return sanitized;
  }
  return value.slice(0, -1);
}

export function PlaygroundSection(workspace) {
  const {
    causeTagOptions,
    caseDraft,
    generationSettings,
    handleGenerate,
    handleSaveCase,
    handleSavePrompt,
    normalizeTestCase,
    playgroundMode,
    promptDraft,
    promptTemplates,
    setCaseDraft,
    setGenerationSettings,
    setPlaygroundMode,
    setPromptDraft,
    setVariants,
    testCases,
    updateVariant,
    variants,
  } = workspace;

  return (
    <>
      <div className="content-header">
        <div>
          <div className="section-label">Workspace</div>
          <h2>Playground</h2>
          <p>
            Run a single prompt or compare multiple model and prompt variants on the same
            fundraiser input.
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
              onChange={(value) => setCaseDraft((current) => ({ ...current, organizationName: value }))}
              value={caseDraft.organizationName}
            />
            <Field
              label="Team name"
              onChange={(value) => setCaseDraft((current) => ({ ...current, teamName: value }))}
              value={caseDraft.teamName}
            />
            <Field
              label="Organization type"
              onChange={(value) => setCaseDraft((current) => ({ ...current, organizationType: value }))}
              value={caseDraft.organizationType}
            />
            <Field
              label="Team activity"
              onChange={(value) => setCaseDraft((current) => ({ ...current, teamActivity: value }))}
              value={caseDraft.teamActivity}
            />
            <Field
              label="Team affiliation"
              onChange={(value) => setCaseDraft((current) => ({ ...current, teamAffiliation: value }))}
              value={caseDraft.teamAffiliation}
            />
            <div className="field-group">
              <label>Cause tags</label>
              <div className="chip-grid">
                {causeTagOptions.map((tag) => {
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
          <div className="button-row section-actions">
            <button
              className="secondary-button"
              onClick={() => handleSaveCase(normalizeTestCase(caseDraft))}
              type="button"
            >
              Save case
            </button>
            <button
              className="tertiary-button"
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
              onChange={(value) => setPromptDraft((current) => ({ ...current, name: value }))}
              value={promptDraft.name}
            />
            <TextAreaField
              label="System prompt"
              onChange={(value) => setPromptDraft((current) => ({ ...current, systemPrompt: value }))}
              value={promptDraft.systemPrompt}
            />
            <TextAreaField
              label="User prompt template"
              onChange={(value) =>
                setPromptDraft((current) => ({ ...current, userPromptTemplate: value }))
              }
              value={promptDraft.userPromptTemplate}
            />
            <Field
              label="Prefix text"
              onChange={(value) => setPromptDraft((current) => ({ ...current, prefixText: value }))}
              value={promptDraft.prefixText}
            />
            <Field
              label="Suffix text"
              onChange={(value) => setPromptDraft((current) => ({ ...current, suffixText: value }))}
              value={promptDraft.suffixText}
            />
            <Field
              label="Message length instruction"
              onChange={(value) =>
                setPromptDraft((current) => ({ ...current, messageLengthInstruction: value }))
              }
              value={promptDraft.messageLengthInstruction}
            />
            <div className="inline-grid">
              <Field
                helpText={HELP_TEXT.temperature}
                label="Temperature"
                max="1"
                min="0"
                onChange={(value) =>
                  setGenerationSettings((current) => ({
                    ...current,
                    temperature: clampDecimalInput(value, { min: 0, max: 1 }),
                  }))
                }
                step="0.01"
                type="number"
                value={generationSettings.temperature}
              />
              <Field
                helpText={HELP_TEXT.topP}
                label="Top P"
                max="1"
                min="0"
                onChange={(value) =>
                  setGenerationSettings((current) => ({
                    ...current,
                    topP: clampDecimalInput(value, { min: 0, max: 1 }),
                  }))
                }
                step="0.01"
                type="number"
                value={generationSettings.topP}
              />
              <Field
                label="Max tokens"
                onChange={(value) => setGenerationSettings((current) => ({ ...current, maxTokens: value }))}
                type="number"
                value={generationSettings.maxTokens}
              />
              <Field
                helpText={HELP_TEXT.seed}
                label="Seed"
                inputMode="numeric"
                onChange={(value) =>
                  setGenerationSettings((current) => ({
                    ...current,
                    seed: clampIntegerInput(value),
                  }))
                }
                value={generationSettings.seed}
              />
            </div>
          </div>
          <div className="button-row section-actions">
            <button className="secondary-button" onClick={handleSavePrompt} type="button">
              Save recipe
            </button>
            <button
              className="tertiary-button"
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

      <section className="panel-block page-section">
        <div className="variant-row section-head">
          <div>
            <h3>Variants</h3>
            <div className="field-help">
              In single mode the first variant is used. In compare mode each row is generated side by side.
            </div>
          </div>
          <button
            className="secondary-button"
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
                  <div className="field-help">Model plus optional per-variant overrides.</div>
                </div>
                {index > 0 ? (
                  <button
                    className="danger-button"
                    onClick={() => setVariants((current) => current.filter((item) => item.id !== variant.id))}
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="inline-grid">
                <Field
                  label="Label"
                  onChange={(value) => updateVariant(variant.id, { label: value })}
                  value={variant.label}
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
                  <div className="field-help">Pricing shown is per 1M input and 1M output tokens.</div>
                </div>
                <div className="field-group">
                  <label htmlFor={`${variant.id}-prompt-source`}>Prompt source</label>
                  <select
                    id={`${variant.id}-prompt-source`}
                    onChange={(event) => updateVariant(variant.id, { promptSource: event.target.value })}
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
                  helpText={HELP_TEXT.temperature}
                  max="1"
                  min="0"
                  onChange={(value) =>
                    updateVariant(variant.id, {
                      temperature: clampDecimalInput(value, { min: 0, max: 1 }),
                    })
                  }
                  step="0.01"
                  type="number"
                  value={variant.temperature}
                />
                <Field
                  label="Top P override"
                  helpText={HELP_TEXT.topP}
                  max="1"
                  min="0"
                  onChange={(value) =>
                    updateVariant(variant.id, { topP: clampDecimalInput(value, { min: 0, max: 1 }) })
                  }
                  step="0.01"
                  type="number"
                  value={variant.topP}
                />
                <Field
                  label="Max tokens override"
                  onChange={(value) => updateVariant(variant.id, { maxTokens: value })}
                  type="number"
                  value={variant.maxTokens}
                />
                <Field
                  label="Seed override"
                  helpText={HELP_TEXT.seed}
                  inputMode="numeric"
                  onChange={(value) => updateVariant(variant.id, { seed: clampIntegerInput(value) })}
                  value={variant.seed}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="button-row section-actions">
          <button className="primary-button" onClick={handleGenerate} type="button">
            Generate
          </button>
          <button
            className="tertiary-button"
            onClick={() => downloadCsv("test-cases.csv", toCsv(testCases))}
            type="button"
          >
            Export saved cases
          </button>
        </div>
      </section>
    </>
  );
}

export function BatchSection(workspace) {
  const {
    batchSelection,
    handleBatchRun,
    handleSaveImportedCases,
    importedCases,
    promptDraft,
    promptTemplates,
    setBatchSelection,
    setImportedCases,
    testCases,
    variants,
  } = workspace;

  return (
    <>
      <div className="content-header">
        <div>
          <div className="section-label">Workspace</div>
          <h2>Batches</h2>
          <p>Run the same prompt stack across multiple saved or imported cases.</p>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={handleBatchRun} type="button">
            Run batch
          </button>
          <button
            className="tertiary-button"
            onClick={() => downloadCsv("saved-runs.csv", toCsv(serializeRunRows(workspace.runs)))}
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
            teamAffiliation, causeTags, messageLength.
          </div>
          <div className="field-group">
            <label htmlFor="csv-import">Upload CSV</label>
            <input
              accept=".csv,text/csv"
              id="csv-import"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                const text = await file.text();
                const parsed = parseCsv(text).map(workspace.shapeImportedCase);
                setImportedCases(parsed);
              }}
              type="file"
            />
          </div>
          {importedCases.length ? (
            <>
              <div className="callout section-note">{importedCases.length} imported cases are staged.</div>
              <div className="button-row section-actions">
                <button className="secondary-button" onClick={handleSaveImportedCases} type="button">
                  Save imported cases
                </button>
                <button
                  className="tertiary-button"
                  onClick={() => downloadCsv("imported-cases.csv", toCsv(importedCases))}
                  type="button"
                >
                  Export staged rows
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state section-note">Import a CSV to stage additional batch cases.</div>
          )}
        </section>
      </div>

      <section className="panel-block page-section">
        <h3>Current variant matrix</h3>
        <div className="field-help section-note">
          Batch runs reuse the same variant definitions from the Playground page.
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
                      ? promptDraft.name || "Current draft"
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

export function HistorySection(workspace) {
  const { filteredRuns, handleSaveRating, historySearch, selectedRun, selectedRunId, setHistorySearch, setSelectedRunId } =
    workspace;

  return (
    <>
      <div className="content-header">
        <div>
          <div className="section-label">Workspace</div>
          <h2>History</h2>
          <p>Review saved outputs, search experiments, and reopen a specific run quickly.</p>
        </div>
        <input
          className="search-input"
          onChange={(event) => setHistorySearch(event.target.value)}
          placeholder="Search runs, cases, or models"
          value={historySearch}
        />
      </div>

      <div className="two-column history-layout">
        <section className="panel-block">
          <h3>Saved runs</h3>
          {filteredRuns.length ? (
            <div className="history-list">
              {filteredRuns.map((run) => {
                const parts = formatHistoryDateParts(run.createdAt);
                return (
                  <button
                    className={`history-card ${selectedRunId === run.id ? "is-active" : ""}`}
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    type="button"
                  >
                    <div className="history-row">
                      <h4>{run.label}</h4>
                      <div className="tag-row">
                        <span className="tag-chip">{run.mode}</span>
                        <span className="tag-chip tag-chip-muted">{run.status}</span>
                      </div>
                    </div>
                    <div className="history-meta">
                      <span>ID {normalizeShortRunId(run.id)}</span>
                      <span>{run.results?.length || 0} variants</span>
                    </div>
                    <div className="history-footer">
                      <span className="history-date-stack">
                        <strong>{parts.date}</strong>
                        <span>{parts.time}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No runs match the current filter.</div>
          )}
        </section>

        <section className="panel-block">
          <div className="utility-row section-head">
            <h3>Selected run</h3>
            {selectedRun ? (
              <button
                className="tertiary-button"
                onClick={() => downloadCsv(`run-${selectedRun.id}.csv`, toCsv(serializeRunRows([selectedRun])))}
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
                {selectedRun.results?.length || 0} results · ID {normalizeShortRunId(selectedRun.id)}
              </div>
              <div className="result-grid section-actions">
                {(selectedRun.results || []).map((result) => (
                  <ResultCard key={result.id} onSaveRating={handleSaveRating} result={{ ...result, runId: selectedRun.id }} />
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

export function SettingsSection() {
  return (
    <>
      <div className="content-header">
        <div>
          <div className="section-label">Workspace</div>
          <h2>Settings</h2>
          <p>Reserved for workspace preferences and admin controls.</p>
        </div>
      </div>
      <section className="panel-block settings-empty">
        <h3>Nothing here yet</h3>
        <p>This page is intentionally empty for now.</p>
      </section>
    </>
  );
}

function Field({ helpText, label, onChange, type = "text", value, ...props }) {
  return (
    <div className="field-group">
      <label className="field-label">
        <span>{label}</span>
        {helpText ? <HelpTooltip text={helpText} /> : null}
      </label>
      <input onChange={(event) => onChange(event.target.value)} type={type} value={value} {...props} />
    </div>
  );
}

function TextAreaField({ label, onChange, value }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}

function HelpTooltip({ text }) {
  return (
    <span className="tooltip">
      <button
        aria-label="Show field help"
        className="help-button"
        data-tooltip={text}
        type="button"
      >
        ?
      </button>
    </span>
  );
}
