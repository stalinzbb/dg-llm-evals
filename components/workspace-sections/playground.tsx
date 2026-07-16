import { useMemo, useState } from "react";

import DrawerShell from "@/components/drawer-shell";
import { BoltIcon, ShuffleIcon } from "@/components/icons";
import ResultCard from "@/components/result-card";
import WorkspacePageHeader from "@/components/workspace-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_GENERATION_SETTINGS } from "@/lib/constants";
import { normalizeEvalDefinition } from "@/lib/eval";
import { validateTemplate } from "@/lib/template";
import type { EvalDefinition } from "@/lib/types/eval";
import type { PlaygroundSectionProps } from "@/lib/types/workspace";
import { createInitialVariant, formatModelOption } from "@/lib/workspace";

import { EmptyState, Field, HelpTooltip, SectionCard, SectionHead, SubSection, TextAreaField } from "./section-primitives";
import { clampDecimalInput, clampIntegerInput, HELP_TEXT } from "./section-helpers";

export function PlaygroundSection({
  activeEvalId,
  availableModelOptions,
  datasets,
  enabledModelIds,
  evals,
  generationSettings,
  handleEvalGenerate,
  handleSaveEval,
  playgroundGenerating,
  playgroundMode,
  playgroundRun,
  setActiveEvalId,
  setActivePage,
  setGenerationSettings,
  setVariants,
  updateVariant,
  variants,
}: PlaygroundSectionProps) {
  const [dismissedResultKey, setDismissedResultKey] = useState("");
  const [isSharedModelParamsEnabled, setIsSharedModelParamsEnabled] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const activeEval = useMemo(
    () => evals.find((item) => item.id === activeEvalId) || evals[0] || null,
    [evals, activeEvalId],
  );

  // Draft state resets when the active eval changes (derived-state-reset pattern).
  const [draftState, setDraftState] = useState<{
    evalId: string | null;
    evalDraft: EvalDefinition | null;
    templateId: string;
    manualValues: Record<string, string>;
  }>({ evalId: null, evalDraft: null, templateId: "", manualValues: {} });

  if ((activeEval?.id || null) !== draftState.evalId) {
    setDraftState({
      evalId: activeEval?.id || null,
      evalDraft: activeEval ? normalizeEvalDefinition(activeEval) : null,
      templateId: activeEval?.templates[0]?.id || "",
      manualValues: {},
    });
  }

  const { evalDraft, templateId, manualValues } = draftState;
  const setEvalDraft = (updater: (current: EvalDefinition | null) => EvalDefinition | null) =>
    setDraftState((current) => ({ ...current, evalDraft: updater(current.evalDraft) }));
  const setTemplateId = (value: string) =>
    setDraftState((current) => ({ ...current, templateId: value }));
  const setManualValue = (key: string, value: string) =>
    setDraftState((current) => ({
      ...current,
      manualValues: { ...current.manualValues, [key]: value },
    }));
  const clearManualValues = () =>
    setDraftState((current) => ({ ...current, manualValues: {} }));

  const workingEval = evalDraft;
  const template =
    workingEval?.templates.find((item) => item.id === templateId) || workingEval?.templates[0] || null;

  const validation = useMemo(() => {
    if (!workingEval || !template) return null;
    return validateTemplate(template.userPromptTemplate, workingEval.variables);
  }, [workingEval, template]);

  const datasetsById = useMemo(() => new Map(datasets.map((dataset) => [dataset.id, dataset])), [datasets]);

  const latestResultKey = playgroundGenerating ? "__pending__" : playgroundRun?.id || "";
  const isResultDrawerOpen = Boolean(latestResultKey) && latestResultKey !== dismissedResultKey;

  const missingRequired = (workingEval?.variables || []).filter((variable) => {
    if (!variable.required) return false;
    const manual = manualValues[variable.key]?.trim();
    if (manual) return false;
    if (variable.defaultSource === "random") {
      const dataset = variable.datasetId ? datasetsById.get(variable.datasetId) : null;
      return !dataset?.values.length;
    }
    return !variable.defaultValue;
  });

  function parseSharedDecimalInput(value: string, options: { fallback: number; max: number; min: number }) {
    const nextValue = clampDecimalInput(value, { min: options.min, max: options.max });
    return nextValue === "" ? options.fallback : Number(nextValue);
  }

  function parseSharedIntegerInput(value: string, fallback: number) {
    const nextValue = clampIntegerInput(value);
    return nextValue === "" || nextValue === "-" ? fallback : Number(nextValue);
  }

  function parseVariantDecimalInput(value: string, options: { max: number; min: number }) {
    const nextValue = clampDecimalInput(value, { min: options.min, max: options.max });
    return nextValue === "" ? "" : Number(nextValue);
  }

  function parseVariantIntegerInput(value: string) {
    const nextValue = clampIntegerInput(value);
    return nextValue === "" || nextValue === "-" ? "" : Number(nextValue);
  }

  function handleSharedModelParamsToggle(enabled: boolean) {
    setIsSharedModelParamsEnabled(enabled);
    if (!enabled) {
      setGenerationSettings(DEFAULT_GENERATION_SETTINGS);
    }
  }

  function handleVariantOverrideToggle(variantId: string, enabled: boolean) {
    updateVariant(variantId, {
      useOverrides: enabled,
      ...(enabled ? {} : { maxTokens: "", seed: "", temperature: "", topP: "" }),
    });
  }

  function patchTemplateDraft(patch: Partial<NonNullable<typeof template>>) {
    if (!template) return;
    setEvalDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        templates: current.templates.map((item) =>
          item.id === template.id ? { ...item, ...patch } : item,
        ),
      };
    });
  }

  function runEval() {
    if (!workingEval) return;
    setDismissedResultKey("");
    void handleEvalGenerate({
      mode: playgroundMode,
      evalId: null,
      evalDraft: { ...workingEval, id: workingEval.id },
      templateId: template?.id,
      manualValues,
      label: workingEval.name,
    });
  }

  if (!workingEval) {
    return (
      <>
        <WorkspacePageHeader
          description="Run an eval against one or more models."
          title="Playground"
        />
        <SectionCard>
          <EmptyState>
            No evals available.{" "}
            <Button onClick={() => setActivePage("evals")} size="sm" type="button" variant="outline">
              Create one in the Eval Builder
            </Button>
          </EmptyState>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <WorkspacePageHeader
        description="Fill the eval's variables, pick models, and run. Adding more variants automatically enables side-by-side comparison."
        title="Playground"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <SectionHead
            action={
              <Button onClick={() => setActivePage("evals")} size="sm" type="button" variant="ghost">
                Edit in Builder
              </Button>
            }
            subtitle={workingEval.description || "Values below feed the {{variables}} in the prompt template."}
            title="Eval & Variables"
          />

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="active-eval">Eval</Label>
              <Select
                items={Object.fromEntries(evals.map((item) => [item.id || "", item.name]))}
                onValueChange={(value) => setActiveEvalId(value)}
                value={activeEval?.id || ""}
              >
                <SelectTrigger className="w-full" id="active-eval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {evals.map((item) => (
                    <SelectItem key={item.id} value={item.id || ""}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {workingEval.templates.length > 1 ? (
              <div className="grid gap-1.5">
                <Label htmlFor="active-template">Template</Label>
                <Select
                  items={Object.fromEntries(workingEval.templates.map((item) => [item.id, item.name]))}
                  onValueChange={setTemplateId}
                  value={template?.id || ""}
                >
                  <SelectTrigger className="w-full" id="active-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workingEval.templates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <SubSection title="Variables">
              <div className="grid gap-3">
                {workingEval.variables.map((variable) => {
                  const dataset = variable.datasetId ? datasetsById.get(variable.datasetId) : null;
                  const isRandom = variable.defaultSource === "random";
                  return (
                    <div className="grid gap-1" key={variable.key}>
                      <Field
                        label={`${variable.label || variable.key}${variable.required ? " *" : ""}`}
                        onChange={(value) => setManualValue(variable.key, value)}
                        placeholder={
                          isRandom
                            ? `Leave blank to sample randomly from “${dataset?.name || "dataset"}” (${dataset?.values.length || 0} values)`
                            : variable.defaultValue
                              ? `Default: ${variable.defaultValue}`
                              : undefined
                        }
                        value={manualValues[variable.key] ?? ""}
                      />
                      <p className="text-xs text-muted-foreground">
                        <code className="font-mono">{`{{${variable.key}}}`}</code>
                        {isRandom
                          ? ` · random from ${dataset?.name || "missing dataset"}`
                          : variable.defaultValue
                            ? ` · defaults to “${variable.defaultValue}”`
                            : ""}
                      </p>
                    </div>
                  );
                })}
                {!workingEval.variables.length ? (
                  <EmptyState>This eval has no variables. The template runs as-is.</EmptyState>
                ) : null}
              </div>
            </SubSection>

            <SubSection title="Prompt template">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Edit the template for this run. Use “Save changes to eval” to persist edits.
                </p>
                <Switch checked={showTemplateEditor} onCheckedChange={setShowTemplateEditor} />
              </div>
              {showTemplateEditor && template ? (
                <div className="grid gap-3">
                  <TextAreaField
                    label="System prompt"
                    onChange={(value) => patchTemplateDraft({ systemPrompt: value })}
                    value={template.systemPrompt}
                  />
                  <TextAreaField
                    label="User prompt"
                    onChange={(value) => patchTemplateDraft({ userPromptTemplate: value })}
                    value={template.userPromptTemplate}
                  />
                  {validation?.errors.length ? (
                    <p className="text-xs text-destructive">
                      {validation.errors.map((issue) => issue.message).join(" ")}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={!workingEval.id}
                      onClick={() => void handleSaveEval(workingEval)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Save changes to eval
                    </Button>
                  </div>
                </div>
              ) : null}
            </SubSection>

            <SubSection title="Model Parameters">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Enable shared generation parameters for this run.
                </p>
                <Switch checked={isSharedModelParamsEnabled} onCheckedChange={handleSharedModelParamsToggle} />
              </div>
              {isSharedModelParamsEnabled ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    helpText={HELP_TEXT.temperature}
                    label="Temperature"
                    max="1"
                    min="0"
                    onChange={(value) =>
                      setGenerationSettings((current) => ({
                        ...current,
                        temperature: parseSharedDecimalInput(value, {
                          fallback: current.temperature,
                          max: 1,
                          min: 0,
                        }),
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={generationSettings.temperature}
                  />
                  <Field
                    label="Max Tokens"
                    onChange={(value) =>
                      setGenerationSettings((current) => ({
                        ...current,
                        maxTokens: parseSharedIntegerInput(value, current.maxTokens),
                      }))
                    }
                    type="number"
                    value={generationSettings.maxTokens}
                  />
                  <Field
                    helpText={HELP_TEXT.topP}
                    label="Top P"
                    max="1"
                    min="0"
                    onChange={(value) =>
                      setGenerationSettings((current) => ({
                        ...current,
                        topP: parseSharedDecimalInput(value, {
                          fallback: current.topP,
                          max: 1,
                          min: 0,
                        }),
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={generationSettings.topP}
                  />
                  <Field
                    helpText={HELP_TEXT.seed}
                    inputMode="numeric"
                    label="Seed"
                    onChange={(value) =>
                      setGenerationSettings((current) => ({
                        ...current,
                        seed: clampIntegerInput(value),
                      }))
                    }
                    value={generationSettings.seed}
                  />
                </div>
              ) : null}
            </SubSection>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHead
            action={
              <Button
                onClick={() =>
                  setVariants((current) => [
                    ...current,
                    {
                      ...createInitialVariant(enabledModelIds),
                      label: `Variant ${current.length + 1}`,
                    },
                  ])
                }
                size="sm"
                type="button"
                variant="outline"
              >
                Add variant
              </Button>
            }
            subtitle={
              playgroundMode === "compare"
                ? "Comparison is active. Each variant runs side by side on the same variable values."
                : "Single mode is active. Add another variant to enable side-by-side comparison."
            }
            title="Models"
          />

          <div className="grid gap-4">
            {variants.map((variant, index) => (
              <Card className="gap-0" key={variant.id}>
                <CardContent className="grid gap-4 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Label"
                      onChange={(value) => updateVariant(variant.id, { label: value })}
                      value={variant.label}
                    />
                    <div className="grid gap-1.5">
                      <Label className="flex items-center gap-1.5" htmlFor={`${variant.id}-model`}>
                        <span>Model</span>
                        <HelpTooltip text="Pricing is shown in the menu as cost per 1M input and 1M output tokens." />
                      </Label>
                      <Select
                        onValueChange={(value) => updateVariant(variant.id, { model: value })}
                        value={variant.model}
                      >
                        <SelectTrigger className="w-full" id={`${variant.id}-model`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModelOptions.map((model) => (
                            <SelectItem disabled={model.unavailable} key={model.value} value={model.value}>
                              {formatModelOption(model)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Override Model Parameters
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Show and apply per-variant generation overrides.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(variant.useOverrides)}
                        onCheckedChange={(enabled: boolean) =>
                          handleVariantOverrideToggle(variant.id, enabled)
                        }
                      />
                    </div>
                    {variant.useOverrides ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Field
                          helpText={HELP_TEXT.temperature}
                          label="Temperature Override"
                          max="1"
                          min="0"
                          onChange={(value) =>
                            updateVariant(variant.id, {
                              temperature: parseVariantDecimalInput(value, { min: 0, max: 1 }),
                            })
                          }
                          step="0.01"
                          type="number"
                          value={variant.temperature}
                        />
                        <Field
                          label="Max Tokens Override"
                          onChange={(value) =>
                            updateVariant(variant.id, { maxTokens: parseVariantIntegerInput(value) })
                          }
                          type="number"
                          value={variant.maxTokens}
                        />
                        <Field
                          helpText={HELP_TEXT.topP}
                          label="Top P Override"
                          max="1"
                          min="0"
                          onChange={(value) =>
                            updateVariant(variant.id, {
                              topP: parseVariantDecimalInput(value, { min: 0, max: 1 }),
                            })
                          }
                          step="0.01"
                          type="number"
                          value={variant.topP}
                        />
                        <Field
                          helpText={HELP_TEXT.seed}
                          inputMode="numeric"
                          label="Seed Override"
                          onChange={(value) =>
                            updateVariant(variant.id, { seed: clampIntegerInput(value) })
                          }
                          value={variant.seed}
                        />
                      </div>
                    ) : null}
                  </div>

                  {index > 0 ? (
                    <div className="flex justify-end">
                      <Button
                        onClick={() =>
                          setVariants((current) => current.filter((item) => item.id !== variant.id))
                        }
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-2 border-t pt-4">
            {missingRequired.length ? (
              <p className="text-xs text-destructive">
                Missing required values: {missingRequired.map((variable) => variable.label || variable.key).join(", ")}
              </p>
            ) : null}
            {validation && !validation.valid ? (
              <p className="text-xs text-destructive">Fix template errors before running.</p>
            ) : null}
            <div className="flex items-center gap-2">
              <Button
                disabled={playgroundGenerating || Boolean(missingRequired.length) || (validation ? !validation.valid : false)}
                onClick={runEval}
                type="button"
              >
                <BoltIcon />
                {playgroundGenerating ? "Running…" : "Run"}
              </Button>
              <Button
                onClick={clearManualValues}
                size="sm"
                type="button"
                variant="ghost"
              >
                <ShuffleIcon />
                Clear values
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>

      {isResultDrawerOpen ? (
        <DrawerShell
          helperText="Showing the current playground response. It is also saved to history."
          onClose={() => setDismissedResultKey(latestResultKey)}
          title="Latest Result"
        >
          {playgroundGenerating ? (
            <EmptyState>Generating results…</EmptyState>
          ) : playgroundRun ? (
            <div className="grid gap-4">
              {(playgroundRun.results || []).map((result) => (
                <ResultCard key={result.id} result={result} showRating={false} />
              ))}
            </div>
          ) : (
            <EmptyState>Run to open the latest result here.</EmptyState>
          )}
        </DrawerShell>
      ) : null}
    </>
  );
}
