import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DrawerShell from "@/components/drawer-shell";
import { BadgeCheckIcon, BatchRunBoltIcon, BoltIcon, ShuffleIcon } from "@/components/icons";
import LibraryDrawer from "@/components/library-drawer";
import ResultCard from "@/components/result-card";
import WorkspacePageHeader from "@/components/workspace-page-header";
import {
  createInitialVariant,
  downloadCsv,
  formatModelOption,
  formatShortId,
  serializeRunRows,
} from "@/lib/workspace";
import { DEFAULT_GENERATION_SETTINGS, MODEL_OPTIONS } from "@/lib/constants";
import { parseCsv, toCsv } from "@/lib/csv";
import {
  getOrganizationTypeOptions,
  getTeamActivityConfig,
  getTeamAffiliationConfig,
  normalizeTaxonomySelection,
} from "@/lib/taxonomy";
import {
  getModelConfigurationState,
  getSourcePoolSummary,
  sanitizeModelConfigurationIds,
} from "@/lib/workspace-selectors";

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

function getAffiliationSelectValue(teamAffiliation, teamAffiliationConfig) {
  if (teamAffiliationConfig.mode !== "select") {
    return "";
  }

  if (teamAffiliationConfig.options.includes(teamAffiliation)) {
    return teamAffiliation;
  }

  if (teamAffiliationConfig.allowsOther && teamAffiliation) {
    return "Other";
  }

  return "";
}

// ---------------------------------------------------------------------------
// Local UI primitives
// ---------------------------------------------------------------------------

function Field({
  helpText,
  label,
  onChange,
  trailingAdornment = null,
  type = "text",
  value,
  ...props
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="flex items-center gap-1.5">
        <span>{label}</span>
        {helpText ? <HelpTooltip text={helpText} /> : null}
      </Label>
      <div className="relative">
        <Input
          className={trailingAdornment ? "pr-8" : ""}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          value={value}
          {...props}
        />
        {trailingAdornment ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailingAdornment}</div>
        ) : null}
      </div>
    </div>
  );
}

function TextAreaField({ label, onChange, value }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}

function HelpTooltip({ text }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="Show field help"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] text-muted-foreground hover:bg-muted/80"
        type="button"
      >
        ?
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">{text}</TooltipContent>
    </Tooltip>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <Card className={`gap-0 ${className}`}>
      <CardContent className="grid gap-5 p-5">{children}</CardContent>
    </Card>
  );
}

function SectionHead({ title, subtitle = null, action = null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="grid gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}

// ---------------------------------------------------------------------------
// PlaygroundSection
// ---------------------------------------------------------------------------

export function PlaygroundSection(workspace) {
  const {
    availableModelOptions,
    causeTagOptions,
    caseDraft,
    enabledModelIds,
    generationSettings,
    handleGenerate,
    handleRandomizeCauseTags,
    handleRandomizeCaseFromSourcePool,
    handleSaveCase,
    handleDeleteCase,
    handleSavePrompt,
    handleDeletePrompt,
    normalizeTestCase,
    playgroundMode,
    playgroundGenerating,
    playgroundRandomizing,
    playgroundRun,
    promptDraft,
    promptTemplates,
    setCaseDraft,
    setGenerationSettings,
    setPromptDraft,
    setVariants,
    testCases,
    updateVariant,
    variants,
    canSaveCase,
    canSavePrompt,
    sourcePoolStats,
  } = workspace;
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
        {/* Data Variables */}
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
                <p className={`mt-1.5 text-xs ${causeTagError ? "text-destructive" : "text-muted-foreground"}`}>
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

        {/* Prompt */}
        <SectionCard>
          <SectionHead title="Prompt" />

          <div className="grid gap-4">
            <SubSection title="Template">
              <div className="grid gap-3">
                <Field
                  label="Label"
                  onChange={(value) =>
                    setPromptDraft((current) => ({ ...current, name: value }))
                  }
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
                    setPromptDraft((current) => ({ ...current, messageLengthInstruction: value }))
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

      {/* Model Selection */}
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
                      onValueChange={(value) =>
                        updateVariant(variant.id, { promptSource: value })
                      }
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
                        setVariants((current) =>
                          current.filter((item) => item.id !== variant.id),
                        )
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

// ---------------------------------------------------------------------------
// BatchSection
// ---------------------------------------------------------------------------

export function BatchSection(workspace) {
  const {
    availableModelOptions,
    batchGenerating,
    batchSampleCount,
    batchVerificationFilter,
    batchSelection,
    enabledModelIds,
    handleBatchRun,
    handleSaveImportedCases,
    importedCases,
    promptTemplates,
    setBatchSampleCount,
    setBatchVerificationFilter,
    setBatchSelection,
    setImportedCases,
    setVariants,
    shapeImportedCase,
    sourcePoolStats,
    testCases,
    updateVariant,
    variants,
  } = workspace;
  const sourcePoolSummary = getSourcePoolSummary(sourcePoolStats);

  return (
    <>
      <WorkspacePageHeader
        actions={
          <Button
            disabled={batchGenerating || !promptTemplates.length}
            onClick={() => handleBatchRun()}
            type="button"
          >
            <BatchRunBoltIcon />
            {batchGenerating ? "Running…" : "Run Batch"}
          </Button>
        }
        description="Run the same prompt stack across multiple saved or imported cases."
        title="Batches"
      />

      <div className="grid gap-6">
        {/* Saved cases */}
        <SectionCard>
          <SectionHead
            action={
              <Button
                disabled={batchGenerating || !promptTemplates.length || !batchSelection.length}
                onClick={() =>
                  handleBatchRun({
                    includeSavedCases: true,
                    includeImportedCases: false,
                    includeSourcePool: false,
                  })
                }
                size="sm"
                type="button"
              >
                <BoltIcon />
                {batchGenerating ? "Running…" : "Run"}
              </Button>
            }
            title="Playground saved cases"
          />
          {testCases.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Use</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Org Name</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Affiliation</TableHead>
                  <TableHead>Causes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((testCase) => (
                  <TableRow key={testCase.id}>
                    <TableCell>
                      <Checkbox
                        checked={batchSelection.includes(testCase.id)}
                        onCheckedChange={(checked) =>
                          setBatchSelection((current) =>
                            checked
                              ? [...current, testCase.id]
                              : current.filter((id) => id !== testCase.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>{testCase.teamName}</TableCell>
                    <TableCell>{testCase.organizationName}</TableCell>
                    <TableCell>
                      {testCase.isVerified ? <BadgeCheckIcon /> : null}
                    </TableCell>
                    <TableCell>{testCase.teamAffiliation}</TableCell>
                    <TableCell>{testCase.causeTags.join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState>No saved cases yet.</EmptyState>
          )}
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* CSV Import */}
          <SectionCard>
            <SectionHead
              action={
                <Button
                  disabled={
                    batchGenerating || !promptTemplates.length || !importedCases.length
                  }
                  onClick={() =>
                    handleBatchRun({
                      includeSavedCases: false,
                      includeImportedCases: true,
                      includeSourcePool: false,
                    })
                  }
                  size="sm"
                  type="button"
                >
                  <BoltIcon />
                  {batchGenerating ? "Running…" : "Run"}
                </Button>
              }
              title="CSV import"
            />
            <p className="text-xs text-muted-foreground">
              Expected headers: TEAM NAME, ORGANIZATION_NAME, ORGANIZATION_UUID,
              ORGANIZATION_TYPE, TEAM_ACTIVITY, TEAM_AFFILIATION.
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="csv-import">Upload CSV</Label>
              <Input
                accept=".csv,text/csv"
                id="csv-import"
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
                <Alert>
                  <AlertDescription>
                    {importedCases.length} imported cases are staged.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveImportedCases}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Save imported cases
                  </Button>
                  <Button
                    onClick={() =>
                      downloadCsv("imported-cases.csv", toCsv(importedCases))
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Export staged rows
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState>Import a CSV to stage additional batch cases.</EmptyState>
            )}
          </SectionCard>

          {/* Source Pool */}
          <SectionCard>
            <SectionHead
              action={
                <Button
                  disabled={
                    batchGenerating ||
                    !promptTemplates.length ||
                    (Number(batchSampleCount) || 0) <= 0
                  }
                  onClick={() =>
                    handleBatchRun({
                      includeSavedCases: false,
                      includeImportedCases: false,
                      includeSourcePool: true,
                    })
                  }
                  size="sm"
                  type="button"
                >
                  <BoltIcon />
                  {batchGenerating ? "Running…" : "Run"}
                </Button>
              }
              subtitle={sourcePoolSummary}
              title="Source Pool"
            />

            <SubSection title="Batch Sampling">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Random sample count"
                  onChange={setBatchSampleCount}
                  type="number"
                  value={batchSampleCount}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="batch-verification-filter">Verification Filter</Label>
                  <Select
                    onValueChange={setBatchVerificationFilter}
                    value={batchVerificationFilter}
                  >
                    <SelectTrigger className="w-full" id="batch-verification-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="verified">Verified only</SelectItem>
                      <SelectItem value="unverified">Unverified only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Source-pool batch rows get 1-3 random cause tags automatically and are used
                only for that run.
              </p>
            </SubSection>
          </SectionCard>
        </div>

        {/* Batch run configuration */}
        <SectionCard>
          <SectionHead
            action={
              <Button
                disabled={!promptTemplates.length}
                onClick={() =>
                  setVariants((current) => [
                    ...current,
                    {
                      ...createInitialVariant(enabledModelIds),
                      label: `Variant ${current.length + 1}`,
                      promptSource: promptTemplates[0]?.id || "current",
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
            subtitle="Choose the saved prompt and model for each batch variant. Prompts must be saved in Playground first."
            title="Batch run configuration"
          />

          {!promptTemplates.length ? (
            <Alert variant="destructive">
              <AlertDescription>
                Save at least one prompt in Playground before running a batch.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4">
            {variants.map((variant, index) => (
              <Card className="gap-0" key={variant.id}>
                <CardContent className="grid gap-4 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {variant.label}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Field
                      label="Label"
                      onChange={(value) => updateVariant(variant.id, { label: value })}
                      value={variant.label}
                    />
                    <div className="grid gap-1.5">
                      <Label htmlFor={`${variant.id}-batch-prompt-source`}>Saved Prompt</Label>
                      <Select
                        onValueChange={(value) =>
                          updateVariant(variant.id, { promptSource: value })
                        }
                        value={variant.promptSource}
                      >
                        <SelectTrigger
                          className="w-full"
                          id={`${variant.id}-batch-prompt-source`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {promptTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label
                        className="flex items-center gap-1.5"
                        htmlFor={`${variant.id}-batch-model`}
                      >
                        <span>Model</span>
                        <HelpTooltip text="Pricing is shown in the menu as cost per 1M input and 1M output tokens." />
                      </Label>
                      <Select
                        onValueChange={(value) => updateVariant(variant.id, { model: value })}
                        value={variant.model}
                      >
                        <SelectTrigger className="w-full" id={`${variant.id}-batch-model`}>
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
                  {index > 0 ? (
                    <div className="flex justify-end">
                      <Button
                        onClick={() =>
                          setVariants((current) =>
                            current.filter((item) => item.id !== variant.id),
                          )
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
        </SectionCard>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// HistorySection
// ---------------------------------------------------------------------------

export function HistorySection(workspace) {
  const {
    filteredRuns,
    handleSaveRating,
    historySearch,
    selectedRun,
    selectedRunId,
    setHistorySearch,
    setSelectedRunId,
  } = workspace;

  return (
    <>
      <WorkspacePageHeader
        actions={
          <Input
            className="w-64"
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Search runs, cases, or models"
            value={historySearch}
          />
        }
        description="Review saved outputs, search experiments, and reopen a specific run quickly."
        title="History"
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Run list */}
        <SectionCard>
          <SectionHead title="Saved runs" />
          {filteredRuns.length ? (
            <div className="grid gap-2">
              {filteredRuns.map((run) => {
                const parts = formatHistoryDateParts(run.createdAt);
                return (
                  <button
                    className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${
                      selectedRunId === run.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-snug">{run.label}</h4>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge className="text-[0.65rem]" variant="outline">
                          {run.mode}
                        </Badge>
                        <Badge className="text-[0.65rem]" variant="secondary">
                          {run.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>ID {normalizeShortRunId(run.id)}</span>
                      <span>{run.results?.length || 0} variants</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <strong className="font-medium text-foreground">{parts.date}</strong>{" "}
                      {parts.time}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState>No runs match the current filter.</EmptyState>
          )}
        </SectionCard>

        {/* Selected run detail */}
        <SectionCard>
          <SectionHead
            action={
              selectedRun ? (
                <Button
                  onClick={() =>
                    downloadCsv(
                      `run-${selectedRun.id}.csv`,
                      toCsv(serializeRunRows([selectedRun])),
                    )
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Export selected run
                </Button>
              ) : null
            }
            title="Selected run"
          />
          {selectedRun ? (
            <div className="grid gap-4">
              <Alert>
                <AlertDescription>
                  <strong>{selectedRun.label}</strong> · {selectedRun.mode} ·{" "}
                  {selectedRun.results?.length || 0} results · ID{" "}
                  {normalizeShortRunId(selectedRun.id)}
                  {selectedRun.results?.some((result) => result.isVerified)
                    ? " · Includes verified organizations"
                    : ""}
                </AlertDescription>
              </Alert>
              <div className="grid gap-4">
                {(selectedRun.results || []).map((result) => (
                  <ResultCard
                    key={result.id}
                    onSaveRating={handleSaveRating}
                    result={{ ...result, runId: selectedRun.id }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>Generate or batch-run something to populate history.</EmptyState>
          )}
        </SectionCard>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// SettingsSection
// ---------------------------------------------------------------------------

export function SettingsSection(workspace) {
  const {
    enabledModelIds,
    handleImportSourcePool,
    handleSaveSettings,
    sourcePoolImporting,
    sourcePoolStats,
  } = workspace;
  const [draftEnabledModelIds, setDraftEnabledModelIds] = useState(() =>
    sanitizeModelConfigurationIds(enabledModelIds),
  );

  useEffect(() => {
    setDraftEnabledModelIds(sanitizeModelConfigurationIds(enabledModelIds));
  }, [enabledModelIds]);

  const { enabledRunnableCount, hasChanges, selectedEnabledIds } = getModelConfigurationState(
    draftEnabledModelIds,
    enabledModelIds,
  );
  const sourcePoolSummary = getSourcePoolSummary(sourcePoolStats);

  function handleModelToggle(modelValue, checked) {
    setDraftEnabledModelIds((current) => {
      const currentIds = sanitizeModelConfigurationIds(current);
      if (checked) {
        return [...currentIds, modelValue];
      }
      return currentIds.filter((value) => value !== modelValue);
    });
  }

  return (
    <>
      <WorkspacePageHeader
        description="Configure which models are available to future Playground and Batch runs."
        title="Settings"
      />

      <div className="grid gap-6">
        <SectionCard>
          <SectionHead
            action={
              <Button
                disabled={!hasChanges || enabledRunnableCount === 0}
                onClick={() => handleSaveSettings({ enabledModelIds: selectedEnabledIds })}
                type="button"
              >
                Save settings
              </Button>
            }
            subtitle="Enabled models appear in the Playground picker and are reused by Batch runs through the shared variant matrix."
            title="Model Configuration"
          />

          {enabledRunnableCount === 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                At least one runnable model must stay enabled.
              </AlertDescription>
            </Alert>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enabled</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODEL_OPTIONS.map((model) => {
                const isChecked = selectedEnabledIds.includes(model.value);
                const isLocked = Boolean(model.unavailable);
                return (
                  <TableRow key={model.value}>
                    <TableCell>
                      <Checkbox
                        checked={isChecked}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          handleModelToggle(model.value, Boolean(checked))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <strong className="font-medium">{model.label}</strong>
                      <p className="text-xs text-muted-foreground">{model.value}</p>
                    </TableCell>
                    <TableCell>{model.provider}</TableCell>
                    <TableCell>
                      {model.unavailable
                        ? model.note || "Unavailable"
                        : `$${model.input}/$${model.output} per 1M in/out`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard>
          <SectionHead
            subtitle={sourcePoolSummary}
            title="Source Pool Management"
          />
          <p className="text-xs text-muted-foreground">
            Expected headers: TEAM NAME, ORGANIZATION_NAME, ORGANIZATION_UUID, ORGANIZATION_TYPE,
            TEAM_ACTIVITY, TEAM_AFFILIATION.
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="source-pool-import">Upload Source CSV</Label>
            <Input
              accept=".csv,text/csv"
              id="source-pool-import"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleImportSourcePool(file);
                }
                event.target.value = "";
              }}
              type="file"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {sourcePoolImporting
              ? "Importing and replacing the current source pool…"
              : "Uploading replaces the current source pool."}
          </p>
        </SectionCard>
      </div>
    </>
  );
}
