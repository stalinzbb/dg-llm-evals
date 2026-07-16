import { useMemo, useState } from "react";

import WorkspacePageHeader from "@/components/workspace-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseCsv } from "@/lib/csv";
import { DEFAULT_RUBRIC_CRITERIA, normalizeEvalDefinition } from "@/lib/eval";
import { renderTemplate, validateTemplate } from "@/lib/template";
import type { Dataset, EvalDefinition, EvalPromptTemplate, VariableDefinition } from "@/lib/types/eval";
import type { EvalsSectionProps } from "@/lib/types/workspace";

import { EmptyState, Field, SectionCard, SectionHead, SubSection, TextAreaField } from "./section-primitives";

const NONE_DATASET = "__none__";

function createBlankEval(): EvalDefinition {
  return normalizeEvalDefinition({
    name: "New eval",
    description: "",
    variables: [
      { key: "topic", label: "Topic", defaultSource: "manual", datasetId: null, defaultValue: "", required: true },
    ],
    templates: [
      {
        id: "template-1",
        name: "Template 1",
        systemPrompt: "You are a helpful writing assistant.",
        userPromptTemplate: "Write about {{topic}}.",
        prefixText: "",
        suffixText: "",
      },
    ],
    rubric: DEFAULT_RUBRIC_CRITERIA,
  });
}

function buildPreviewValues(evalDraft: EvalDefinition, datasets: Dataset[]): Record<string, string> {
  const datasetsById = new Map(datasets.map((dataset) => [dataset.id, dataset]));
  const values: Record<string, string> = {};
  for (const variable of evalDraft.variables) {
    const dataset = variable.datasetId ? datasetsById.get(variable.datasetId) : null;
    values[variable.key] =
      variable.defaultValue || dataset?.values[0] || `<${variable.label || variable.key}>`;
  }
  return values;
}

export function EvalsSection({
  datasets,
  evals,
  handleDeleteDataset,
  handleDeleteEval,
  handleSaveDataset,
  handleSaveEval,
  setActiveEvalId,
  setActivePage,
}: EvalsSectionProps) {
  const [draft, setDraft] = useState<EvalDefinition | null>(null);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [datasetDraft, setDatasetDraft] = useState<Dataset | null>(null);
  const [datasetValuesText, setDatasetValuesText] = useState("");
  const [csvColumns, setCsvColumns] = useState<Record<string, string[]> | null>(null);
  const TEMPLATE_TEXTAREA_ID = "eval-user-prompt-template";

  const template: EvalPromptTemplate | null = draft?.templates[activeTemplateIndex] || null;

  const validation = useMemo(() => {
    if (!draft || !template) return null;
    return validateTemplate(template.userPromptTemplate, draft.variables);
  }, [draft, template]);

  const preview = useMemo(() => {
    if (!draft || !template) return "";
    return renderTemplate(template.userPromptTemplate, buildPreviewValues(draft, datasets)).output;
  }, [draft, template, datasets]);

  function openEval(evalDefinition: EvalDefinition) {
    setDraft(normalizeEvalDefinition(evalDefinition));
    setActiveTemplateIndex(0);
  }

  function patchDraft(patch: Partial<EvalDefinition>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function patchVariable(index: number, patch: Partial<VariableDefinition>) {
    setDraft((current) => {
      if (!current) return current;
      const variables = current.variables.map((variable, i) =>
        i === index ? { ...variable, ...patch } : variable,
      );
      return { ...current, variables };
    });
  }

  function patchTemplate(patch: Partial<EvalPromptTemplate>) {
    setDraft((current) => {
      if (!current) return current;
      const templates = current.templates.map((item, i) =>
        i === activeTemplateIndex ? { ...item, ...patch } : item,
      );
      return { ...current, templates };
    });
  }

  function insertVariableToken(key: string) {
    const token = `{{${key}}}`;
    const textarea = document.getElementById(TEMPLATE_TEXTAREA_ID) as HTMLTextAreaElement | null;
    if (!template) return;
    if (!textarea) {
      patchTemplate({ userPromptTemplate: `${template.userPromptTemplate}${token}` });
      return;
    }
    const start = textarea.selectionStart ?? template.userPromptTemplate.length;
    const end = textarea.selectionEnd ?? start;
    const next =
      template.userPromptTemplate.slice(0, start) + token + template.userPromptTemplate.slice(end);
    patchTemplate({ userPromptTemplate: next });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
    });
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await handleSaveEval(draft);
      if (saved) {
        setDraft(normalizeEvalDefinition(saved));
      }
    } finally {
      setSaving(false);
    }
  }

  function openDataset(dataset: Dataset) {
    setDatasetDraft(dataset);
    setDatasetValuesText(dataset.values.join("\n"));
    setCsvColumns(null);
  }

  function handleDatasetCsvFile(file: File) {
    void file.text().then((text) => {
      const rows = parseCsv(text);
      if (!rows.length) return;
      const headers = Object.keys(rows[0]);
      const columns: Record<string, string[]> = {};
      for (const header of headers) {
        columns[header] = rows.map((row) => `${row[header] ?? ""}`.trim()).filter(Boolean);
      }
      if (headers.length === 1) {
        appendDatasetValues(columns[headers[0]]);
        setCsvColumns(null);
      } else {
        setCsvColumns(columns);
      }
    });
  }

  function appendDatasetValues(values: string[]) {
    setDatasetValuesText((current) => {
      const existing = current.split("\n").map((value) => value.trim()).filter(Boolean);
      return [...new Set([...existing, ...values])].join("\n");
    });
  }

  async function saveDatasetDraft() {
    if (!datasetDraft) return;
    const values = datasetValuesText.split("\n").map((value) => value.trim()).filter(Boolean);
    const saved = await handleSaveDataset({ ...datasetDraft, values });
    if (saved) {
      openDataset(saved);
    }
  }

  return (
    <>
      <WorkspacePageHeader
        description="Define evals: variables, value datasets, prompt templates with {{variable}} tokens, and a scoring rubric."
        title="Eval Builder"
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="grid content-start gap-6">
          <SectionCard>
            <SectionHead
              action={
                <Button onClick={() => openEval(createBlankEval())} size="sm" type="button" variant="outline">
                  New eval
                </Button>
              }
              title="Evals"
            />
            {evals.length ? (
              <div className="grid gap-2">
                {evals.map((item) => (
                  <button
                    className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${
                      draft?.id === item.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    key={item.id}
                    onClick={() => openEval(item)}
                    type="button"
                  >
                    <h4 className="text-sm font-medium leading-snug">{item.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.variables.length} variables · {item.templates.length} template
                      {item.templates.length === 1 ? "" : "s"}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState>No evals yet. Create one to get started.</EmptyState>
            )}
          </SectionCard>

          <SectionCard>
            <SectionHead
              action={
                <Button
                  onClick={() => openDataset({ id: null, name: "New dataset", description: "", values: [] })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  New dataset
                </Button>
              }
              subtitle="Reusable value lists for random sourcing."
              title="Datasets"
            />
            {datasets.length ? (
              <div className="grid gap-2">
                {datasets.map((dataset) => (
                  <button
                    className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${
                      datasetDraft?.id === dataset.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    key={dataset.id}
                    onClick={() => openDataset(dataset)}
                    type="button"
                  >
                    <h4 className="text-sm font-medium leading-snug">{dataset.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{dataset.values.length} values</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState>No datasets yet.</EmptyState>
            )}
          </SectionCard>
        </div>

        <div className="grid content-start gap-6">
          {draft ? (
            <SectionCard>
              <SectionHead
                action={
                  <div className="flex items-center gap-2">
                    {draft.id ? (
                      <>
                        <Button
                          onClick={() => {
                            setActiveEvalId(draft.id || "");
                            setActivePage("playground");
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Open in Playground
                        </Button>
                        <Button
                          onClick={() => {
                            void handleDeleteEval(draft.id || "");
                            setDraft(null);
                          }}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                    <Button disabled={saving} onClick={() => void saveDraft()} size="sm" type="button">
                      {saving ? "Saving…" : "Save eval"}
                    </Button>
                  </div>
                }
                subtitle={draft.id ? `ID ${draft.id}` : "Unsaved draft"}
                title={draft.name || "Untitled eval"}
              />

              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Name" onChange={(value) => patchDraft({ name: value })} value={draft.name} />
                  <Field
                    label="Description"
                    onChange={(value) => patchDraft({ description: value })}
                    value={draft.description}
                  />
                </div>

                <SubSection title="Variables">
                  <div className="grid gap-2">
                    {draft.variables.map((variable, index) => (
                      <div
                        className="grid items-end gap-2 rounded-lg border p-3 md:grid-cols-[1fr_1fr_130px_1fr_1fr_auto]"
                        key={index}
                      >
                        <Field
                          label="Key"
                          onChange={(value) => patchVariable(index, { key: value })}
                          value={variable.key}
                        />
                        <Field
                          label="Label"
                          onChange={(value) => patchVariable(index, { label: value })}
                          value={variable.label}
                        />
                        <div className="grid gap-1.5">
                          <Label>Source</Label>
                          <Select
                            onValueChange={(value) =>
                              patchVariable(index, { defaultSource: value as "manual" | "random" })
                            }
                            value={variable.defaultSource}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual entry</SelectItem>
                              <SelectItem value="random">Random from dataset</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Dataset</Label>
                          <Select
                            onValueChange={(value) =>
                              patchVariable(index, { datasetId: value === NONE_DATASET ? null : value })
                            }
                            value={variable.datasetId || NONE_DATASET}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_DATASET}>None</SelectItem>
                              {datasets.map((dataset) => (
                                <SelectItem key={dataset.id || dataset.name} value={dataset.id || ""}>
                                  {dataset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Field
                          label="Default value"
                          onChange={(value) => patchVariable(index, { defaultValue: value })}
                          value={variable.defaultValue}
                        />
                        <div className="flex items-center gap-3 pb-1">
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              checked={variable.required}
                              id={`required-${index}`}
                              onCheckedChange={(checked) =>
                                patchVariable(index, { required: Boolean(checked) })
                              }
                            />
                            <Label className="text-xs" htmlFor={`required-${index}`}>
                              Required
                            </Label>
                          </div>
                          <Button
                            onClick={() =>
                              patchDraft({ variables: draft.variables.filter((_, i) => i !== index) })
                            }
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Button
                        onClick={() =>
                          patchDraft({
                            variables: [
                              ...draft.variables,
                              {
                                key: `var${draft.variables.length + 1}`,
                                label: "",
                                defaultSource: "manual",
                                datasetId: null,
                                defaultValue: "",
                                required: false,
                              },
                            ],
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Add variable
                      </Button>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Prompt template">
                  {draft.templates.length > 1 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {draft.templates.map((item, index) => (
                        <Button
                          key={item.id}
                          onClick={() => setActiveTemplateIndex(index)}
                          size="xs"
                          type="button"
                          variant={index === activeTemplateIndex ? "default" : "outline"}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  {template ? (
                    <div className="grid gap-3">
                      <Field
                        label="Template name"
                        onChange={(value) => patchTemplate({ name: value })}
                        value={template.name}
                      />
                      <TextAreaField
                        label="System prompt"
                        onChange={(value) => patchTemplate({ systemPrompt: value })}
                        value={template.systemPrompt}
                      />
                      <div className="grid gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Label>User prompt · insert variable:</Label>
                          {draft.variables.map((variable) => (
                            <Button
                              key={variable.key}
                              onClick={() => insertVariableToken(variable.key)}
                              size="xs"
                              type="button"
                              variant="outline"
                            >
                              {`{{${variable.key}}}`}
                            </Button>
                          ))}
                        </div>
                        <Textarea
                          className="min-h-[160px] font-mono text-sm"
                          id={TEMPLATE_TEXTAREA_ID}
                          onChange={(event) => patchTemplate({ userPromptTemplate: event.target.value })}
                          value={template.userPromptTemplate}
                        />
                        {validation?.errors.length ? (
                          <p className="text-xs text-destructive">
                            {validation.errors.map((issue) => issue.message).join(" ")}
                          </p>
                        ) : null}
                        {validation?.warnings.length ? (
                          <p className="text-xs text-muted-foreground">
                            {validation.warnings.map((issue) => issue.message).join(" ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <TextAreaField
                          label="Prefix (optional, wraps output)"
                          onChange={(value) => patchTemplate({ prefixText: value })}
                          value={template.prefixText}
                        />
                        <TextAreaField
                          label="Suffix (optional, wraps output)"
                          onChange={(value) => patchTemplate({ suffixText: value })}
                          value={template.suffixText}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Preview with sample values</Label>
                        <div className="rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
                          {preview || "Nothing to preview yet."}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            const nextIndex = draft.templates.length + 1;
                            patchDraft({
                              templates: [
                                ...draft.templates,
                                { ...template, id: `template-${nextIndex}`, name: `Template ${nextIndex}` },
                              ],
                            });
                            setActiveTemplateIndex(draft.templates.length);
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Duplicate as new template
                        </Button>
                        {draft.templates.length > 1 ? (
                          <Button
                            onClick={() => {
                              patchDraft({
                                templates: draft.templates.filter((_, i) => i !== activeTemplateIndex),
                              });
                              setActiveTemplateIndex(0);
                            }}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            Remove this template
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </SubSection>

                <SubSection title="Rubric">
                  <div className="grid gap-2">
                    {draft.rubric.map((criterion, index) => (
                      <div className="grid items-end gap-2 md:grid-cols-[1fr_1fr_auto]" key={index}>
                        <Field
                          label="Key"
                          onChange={(value) =>
                            patchDraft({
                              rubric: draft.rubric.map((item, i) =>
                                i === index ? { ...item, key: value } : item,
                              ),
                            })
                          }
                          value={criterion.key}
                        />
                        <Field
                          label="Label"
                          onChange={(value) =>
                            patchDraft({
                              rubric: draft.rubric.map((item, i) =>
                                i === index ? { ...item, label: value } : item,
                              ),
                            })
                          }
                          value={criterion.label}
                        />
                        <Button
                          onClick={() =>
                            patchDraft({ rubric: draft.rubric.filter((_, i) => i !== index) })
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div>
                      <Button
                        onClick={() =>
                          patchDraft({
                            rubric: [...draft.rubric, { key: "", label: "", min: 1, max: 5 }],
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Add criterion
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scores are 1–5. The rubric drives the rating form shown for this eval&apos;s runs.
                    </p>
                  </div>
                </SubSection>
              </div>
            </SectionCard>
          ) : (
            <SectionCard>
              <EmptyState>Select an eval on the left or create a new one.</EmptyState>
            </SectionCard>
          )}

          {datasetDraft ? (
            <SectionCard>
              <SectionHead
                action={
                  <div className="flex items-center gap-2">
                    {datasetDraft.id ? (
                      <Button
                        onClick={() => {
                          void handleDeleteDataset(datasetDraft.id || "");
                          setDatasetDraft(null);
                        }}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    ) : null}
                    <Button onClick={() => void saveDatasetDraft()} size="sm" type="button">
                      Save dataset
                    </Button>
                  </div>
                }
                subtitle="One value per line. Random-sourced variables sample from these values."
                title={datasetDraft.name || "Untitled dataset"}
              />
              <div className="grid gap-3">
                <Field
                  label="Name"
                  onChange={(value) => setDatasetDraft((current) => (current ? { ...current, name: value } : current))}
                  value={datasetDraft.name}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="dataset-values">
                    Values{" "}
                    <Badge className="ml-1 font-normal" variant="outline">
                      {datasetValuesText.split("\n").filter((value) => value.trim()).length}
                    </Badge>
                  </Label>
                  <Textarea
                    className="min-h-[140px] font-mono text-sm"
                    id="dataset-values"
                    onChange={(event) => setDatasetValuesText(event.target.value)}
                    value={datasetValuesText}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dataset-csv">Import values from CSV</Label>
                  <Input
                    accept=".csv,text/csv"
                    id="dataset-csv"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleDatasetCsvFile(file);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                  {csvColumns ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Pick a column to import:</span>
                      {Object.entries(csvColumns).map(([header, values]) => (
                        <Button
                          key={header}
                          onClick={() => {
                            appendDatasetValues(values);
                            setCsvColumns(null);
                          }}
                          size="xs"
                          type="button"
                          variant="outline"
                        >
                          {header} ({values.length})
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </>
  );
}
