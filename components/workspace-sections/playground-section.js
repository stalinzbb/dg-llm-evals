import { useState } from "react";

import DrawerShell from "@/components/drawer-shell";
import { BadgeCheckIcon, BoltIcon, ShuffleIcon } from "@/components/icons";
import LibraryDrawer from "@/components/library-drawer";
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
import {
  createInitialVariant,
  downloadCsv,
  formatModelOption,
} from "@/lib/workspace";
import { DEFAULT_GENERATION_SETTINGS } from "@/lib/constants";
import { toCsv } from "@/lib/csv";
import {
  getOrganizationTypeOptions,
  getTeamActivityConfig,
  getTeamAffiliationConfig,
  normalizeTaxonomySelection,
} from "@/lib/taxonomy";

import {
  EmptyState,
  Field,
  HelpTooltip,
  SectionCard,
  SectionHead,
  SubSection,
  TextAreaField,
} from "./primitives";
import {
  clampDecimalInput,
  clampIntegerInput,
  getAffiliationSelectValue,
  HELP_TEXT,
} from "./shared";

export function PlaygroundSection({
  availableModelOptions,
  canSaveCase,
  canSavePrompt,
  caseDraft,
  causeTagOptions,
  enabledModelIds,
  generationSettings,
  handleDeleteCase,
  handleDeletePrompt,
  handleGenerate,
  handleRandomizeCaseFromSourcePool,
  handleRandomizeCauseTags,
  handleSaveCase,
  handleSavePrompt,
  normalizeTestCase,
  playgroundGenerating,
  playgroundMode,
  playgroundRandomizing,
  playgroundRun,
  promptDraft,
  promptTemplates,
  setCaseDraft,
  setGenerationSettings,
  setPromptDraft,
  setVariants,
  sourcePoolStats,
  testCases,
  updateVariant,
  variants,
}) {
  const [causeTagError, setCauseTagError] = useState("");
  const [dismissedResultKey, setDismissedResultKey] = useState("");
  const [isCaseLibraryOpen, setIsCaseLibraryOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSharedModelParamsEnabled, setIsSharedModelParamsEnabled] = useState(false);

  const organizationTypeOptions = getOrganizationTypeOptions();
  const teamActivityConfig = getTeamActivityConfig(caseDraft.organizationType);
  const teamAffiliationConfig = getTeamAffiliationConfig(
    caseDraft.organizationType,
    caseDraft.teamActivity,
  );
  const affiliationSelectValue = getAffiliationSelectValue(
    caseDraft.teamAffiliation,
    teamAffiliationConfig,
  );
  const latestResultKey = playgroundGenerating ? "__pending__" : playgroundRun?.id || "";
  const isResultDrawerOpen = Boolean(latestResultKey) && latestResultKey !== dismissedResultKey;

  function handleCauseTagToggle(tag) {
    const exists = caseDraft.causeTags.includes(tag);

    if (exists) {
      setCaseDraft((current) => ({
        ...current,
        causeTags: current.causeTags.filter((item) => item !== tag),
      }));
      setCauseTagError("");
      return;
    }

    if (caseDraft.causeTags.length >= 3) {
      setCauseTagError("Select up to 3 cause tags.");
      return;
    }

    setCaseDraft((current) => ({
      ...current,
      causeTags: [...current.causeTags, tag],
    }));
    setCauseTagError("");
  }

  function handleSharedModelParamsToggle(enabled) {
    setIsSharedModelParamsEnabled(enabled);
    if (!enabled) {
      setGenerationSettings(DEFAULT_GENERATION_SETTINGS);
    }
  }

  function handleVariantOverrideToggle(variantId, enabled) {
    updateVariant(variantId, {
      useOverrides: enabled,
      ...(enabled
        ? {}
        : {
            temperature: "",
            topP: "",
            maxTokens: "",
            seed: "",
          }),
    });
  }

  return (
    <>
      <WorkspacePageHeader
        description="Run fundraiser generations from the current variant set. Adding more variants automatically enables side-by-side comparison."
        title="Playground"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <SectionHead
            action={
              <Button
                disabled={!sourcePoolStats.total || playgroundRandomizing}
                onClick={handleRandomizeCaseFromSourcePool}
                size="sm"
                type="button"
                variant="outline"
              >
                <ShuffleIcon />
                {playgroundRandomizing ? "Randomizing…" : "Randomize"}
              </Button>
            }
            subtitle={
              sourcePoolStats.total
                ? `${sourcePoolStats.total} source rows loaded · ${sourcePoolStats.verified} verified`
                : "Upload a source CSV in Batches to enable randomization."
            }
            title="Data Variables"
          />

          <div className="grid gap-4">
            <SubSection title="Event Names">
              <div className="grid gap-3">
                <Field
                  label="Organization name"
                  onChange={(value) =>
                    setCaseDraft((current) => ({ ...current, organizationName: value }))
                  }
                  trailingAdornment={
                    caseDraft.sourceType === "source_pool" && caseDraft.isVerified ? (
                      <span className="text-emerald-500">
                        <BadgeCheckIcon />
                      </span>
                    ) : null
                  }
                  value={caseDraft.organizationName}
                />
                <Field
                  label="Team name"
                  onChange={(value) =>
                    setCaseDraft((current) => ({ ...current, teamName: value }))
                  }
                  value={caseDraft.teamName}
                />
              </div>
            </SubSection>

            <SubSection title="Taxonomy Info">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="organization-type">Organization Type</Label>
                  <Select
                    onValueChange={(value) =>
                      setCaseDraft((current) => ({
                        ...current,
                        ...normalizeTaxonomySelection({
                          ...current,
                          organizationType: value,
                          teamActivity: "",
                          teamAffiliation: "",
                        }),
                      }))
                    }
                    value={caseDraft.organizationType}
                  >
                    <SelectTrigger className="w-full" id="organization-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypeOptions.map((organizationType) => (
                        <SelectItem key={organizationType} value={organizationType}>
                          {organizationType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {teamActivityConfig.mode === "select" ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor="team-activity">Team Activity</Label>
                    <Select
                      onValueChange={(value) =>
                        setCaseDraft((current) => ({
                          ...current,
                          ...normalizeTaxonomySelection({
                            ...current,
                            teamActivity: value,
                            teamAffiliation: "",
                          }),
                        }))
                      }
                      value={caseDraft.teamActivity}
                    >
                      <SelectTrigger className="w-full" id="team-activity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teamActivityConfig.options.map((teamActivity) => (
                          <SelectItem key={teamActivity} value={teamActivity}>
                            {teamActivity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Field
                    label="Team Activity"
                    onChange={(value) =>
                      setCaseDraft((current) => ({ ...current, teamActivity: value }))
                    }
                    value={caseDraft.teamActivity}
                  />
                )}

                {teamAffiliationConfig.mode === "select" ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor="team-affiliation">Team Affiliation</Label>
                    <Select
                      onValueChange={(value) =>
                        setCaseDraft((current) => ({
                          ...current,
                          teamAffiliation: value === "Other" ? "Other" : value,
                        }))
                      }
                      value={affiliationSelectValue}
                    >
                      <SelectTrigger className="w-full" id="team-affiliation">
                        <SelectValue placeholder="Select affiliation" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamAffiliationConfig.options.map((teamAffiliation) => (
                          <SelectItem key={teamAffiliation} value={teamAffiliation}>
                            {teamAffiliation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Options are filtered from the taxonomy CSV for the selected organization
                      type and activity.
                    </p>
                  </div>
                ) : (
                  <Field
                    label="Team Affiliation"
                    onChange={(value) =>
                      setCaseDraft((current) => ({ ...current, teamAffiliation: value }))
                    }
                    value={caseDraft.teamAffiliation}
                  />
                )}

                {teamAffiliationConfig.mode === "select" && affiliationSelectValue === "Other" ? (
                  <Field
                    label="Other Team Affiliation"
                    onChange={(value) =>
                      setCaseDraft((current) => ({ ...current, teamAffiliation: value }))
                    }
                    value={caseDraft.teamAffiliation === "Other" ? "" : caseDraft.teamAffiliation}
                  />
                ) : null}
              </div>
            </SubSection>

            <SubSection title="Cause Tags">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="sr-only">Cause tags</span>
                  <Button
                    aria-label="Randomize cause tags"
                    onClick={handleRandomizeCauseTags}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <ShuffleIcon />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {causeTagOptions.map((tag) => {
                    const selected = caseDraft.causeTags.includes(tag);
                    return (
                      <Button
                        key={tag}
                        onClick={() => handleCauseTagToggle(tag)}
                        size="xs"
                        type="button"
                        variant={selected ? "default" : "outline"}
                      >
                        {tag}
                      </Button>
                    );
                  })}
                </div>
                <p
                  className={`mt-1.5 text-xs ${causeTagError ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {causeTagError || "Up to 3 tags in the prompt payload."}
                </p>
              </div>
            </SubSection>
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Button
              disabled={!canSaveCase}
              onClick={() => handleSaveCase(normalizeTestCase(caseDraft))}
              size="sm"
              type="button"
              variant="outline"
            >
              Save case
            </Button>
            <Button
              onClick={() => setIsCaseLibraryOpen(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              View all cases
            </Button>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHead title="Prompt" />

          <div className="grid gap-4">
            <SubSection title="Template">
              <div className="grid gap-3">
                <Field
                  label="Label"
                  onChange={(value) => setPromptDraft((current) => ({ ...current, name: value }))}
                  value={promptDraft.name}
                />
                <TextAreaField
                  label="User"
                  onChange={(value) =>
                    setPromptDraft((current) => ({ ...current, userPromptTemplate: value }))
                  }
                  value={promptDraft.userPromptTemplate}
                />
                <TextAreaField
                  label="System"
                  onChange={(value) =>
                    setPromptDraft((current) => ({ ...current, systemPrompt: value }))
                  }
                  value={promptDraft.systemPrompt}
                />
                <Field
                  label="Message Length"
                  onChange={(value) =>
                    setPromptDraft((current) => ({
                      ...current,
                      messageLengthInstruction: value,
                    }))
                  }
                  value={promptDraft.messageLengthInstruction}
                />
              </div>
            </SubSection>

            <SubSection title="Message Parts">
              <div className="grid gap-3">
                <TextAreaField
                  label="Prefix"
                  onChange={(value) =>
                    setPromptDraft((current) => ({ ...current, prefixText: value }))
                  }
                  value={promptDraft.prefixText}
                />
                <TextAreaField
                  label="Suffix"
                  onChange={(value) =>
                    setPromptDraft((current) => ({ ...current, suffixText: value }))
                  }
                  value={promptDraft.suffixText}
                />
              </div>
            </SubSection>

            <SubSection title="Model Parameters">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Enable shared generation parameters for this run.
                </p>
                <Switch
                  checked={isSharedModelParamsEnabled}
                  onCheckedChange={handleSharedModelParamsToggle}
                />
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
                        temperature: clampDecimalInput(value, { min: 0, max: 1 }),
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={generationSettings.temperature}
                  />
                  <Field
                    label="Max Tokens"
                    onChange={(value) =>
                      setGenerationSettings((current) => ({ ...current, maxTokens: value }))
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
                        topP: clampDecimalInput(value, { min: 0, max: 1 }),
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

          <div className="flex items-center gap-2 border-t pt-4">
            <Button
              disabled={!canSavePrompt}
              onClick={handleSavePrompt}
              size="sm"
              type="button"
              variant="outline"
            >
              Save Prompt
            </Button>
            <Button
              onClick={() => setIsPromptLibraryOpen(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              View all Prompts
            </Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-6">
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
              ? "Comparison is active. Each variant is generated side by side for the same fundraiser input."
              : "Single mode is active. Add another variant to enable side-by-side comparison."
          }
          title="Model Selection"
        />

        <div className="grid gap-4">
          {variants.map((variant, index) => (
            <Card className="gap-0" key={variant.id}>
              <CardContent className="grid gap-4 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {variant.label}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field
                    label="Label"
                    onChange={(value) => updateVariant(variant.id, { label: value })}
                    value={variant.label}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${variant.id}-prompt-source`}>Prompt Source</Label>
                    <Select
                      onValueChange={(value) => updateVariant(variant.id, { promptSource: value })}
                      value={variant.promptSource}
                    >
                      <SelectTrigger className="w-full" id={`${variant.id}-prompt-source`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current draft</SelectItem>
                        {promptTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                          <SelectItem
                            disabled={model.unavailable}
                            key={model.value}
                            value={model.value}
                          >
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
                      onCheckedChange={(enabled) =>
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
                            temperature: clampDecimalInput(value, { min: 0, max: 1 }),
                          })
                        }
                        step="0.01"
                        type="number"
                        value={variant.temperature}
                      />
                      <Field
                        label="Max Tokens Override"
                        onChange={(value) => updateVariant(variant.id, { maxTokens: value })}
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
                            topP: clampDecimalInput(value, { min: 0, max: 1 }),
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

        <div className="flex items-center gap-2 border-t pt-4">
          <Button
            disabled={playgroundGenerating}
            onClick={() => {
              setDismissedResultKey("");
              handleGenerate();
            }}
            type="button"
          >
            <BoltIcon />
            {playgroundGenerating ? "Running…" : "Run"}
          </Button>
          <Button
            disabled={playgroundGenerating}
            onClick={() => downloadCsv("test-cases.csv", toCsv(testCases))}
            size="sm"
            type="button"
            variant="ghost"
          >
            Export saved cases
          </Button>
        </div>
      </SectionCard>

      {isResultDrawerOpen ? (
        <DrawerShell
          helperText="Showing the current playground response only. It is not saved to history."
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

      {isCaseLibraryOpen ? (
        <LibraryDrawer
          emptyState="No saved cases yet."
          helperText="Select a saved case to load it into the editor."
          items={testCases}
          onClose={() => setIsCaseLibraryOpen(false)}
          onDelete={handleDeleteCase}
          onSelect={(testCase) => {
            setCaseDraft(normalizeTestCase(testCase));
            setIsCaseLibraryOpen(false);
          }}
          title="Saved Cases"
          type="case"
        />
      ) : null}

      {isPromptLibraryOpen ? (
        <LibraryDrawer
          emptyState="No saved recipes yet."
          helperText="Select a saved recipe to load it into the prompt editor."
          items={promptTemplates}
          onClose={() => setIsPromptLibraryOpen(false)}
          onDelete={handleDeletePrompt}
          onSelect={(template) => {
            setPromptDraft(template);
            setIsPromptLibraryOpen(false);
          }}
          title="Saved Recipes"
          type="prompt"
        />
      ) : null}
    </>
  );
}
