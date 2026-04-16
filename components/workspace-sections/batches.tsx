import WorkspacePageHeader from "@/components/workspace-page-header";
import { BatchRunBoltIcon, BadgeCheckIcon, BoltIcon } from "@/components/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseCsv, toCsv } from "@/lib/csv";
import type { BatchSectionProps } from "@/lib/types/workspace";
import { createInitialVariant, downloadCsv, formatModelOption } from "@/lib/workspace";
import { getSourcePoolSummary } from "@/lib/workspace-selectors";

import {
  EmptyState,
  Field,
  HelpTooltip,
  SectionCard,
  SectionHead,
  SubSection,
} from "./section-primitives";

export function BatchSection({
  availableModelOptions,
  batchGenerating,
  batchSampleCount,
  batchSelection,
  batchVerificationFilter,
  enabledModelIds,
  handleBatchRun,
  handleSaveImportedCases,
  importedCases,
  promptTemplates,
  setBatchSampleCount,
  setBatchSelection,
  setBatchVerificationFilter,
  setImportedCases,
  setVariants,
  shapeImportedCase,
  sourcePoolStats,
  testCases,
  updateVariant,
  variants,
}: BatchSectionProps) {
  const sourcePoolSummary = getSourcePoolSummary(sourcePoolStats);

  return (
    <>
      <WorkspacePageHeader
        actions={
          <Button
            disabled={batchGenerating || !promptTemplates.length}
            onClick={() => void handleBatchRun()}
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
        <SectionCard>
          <SectionHead
            action={
              <Button
                disabled={batchGenerating || !promptTemplates.length || !batchSelection.length}
                onClick={() =>
                  void handleBatchRun({
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
                  <TableRow key={testCase.id ?? `${testCase.organizationName}-${testCase.teamName}`}>
                    <TableCell>
                      <Checkbox
                        checked={Boolean(testCase.id && batchSelection.includes(testCase.id))}
                        onCheckedChange={(checked) =>
                          setBatchSelection(
                            !testCase.id
                              ? batchSelection
                              : checked
                                ? [...batchSelection, testCase.id]
                                : batchSelection.filter((id) => id !== testCase.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>{testCase.teamName}</TableCell>
                    <TableCell>{testCase.organizationName}</TableCell>
                    <TableCell>{testCase.isVerified ? <BadgeCheckIcon /> : null}</TableCell>
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
          <SectionCard>
            <SectionHead
              action={
                <Button
                  disabled={batchGenerating || !promptTemplates.length || !importedCases.length}
                  onClick={() =>
                    void handleBatchRun({
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
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  void file.text().then((text) => {
                    const parsed = parseCsv(text).map(shapeImportedCase);
                    setImportedCases(parsed);
                  });
                  event.target.value = "";
                }}
                type="file"
              />
            </div>
            {importedCases.length ? (
              <>
                <Alert>
                  <AlertDescription>{importedCases.length} imported cases are staged.</AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => void handleSaveImportedCases()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Save imported cases
                  </Button>
                  <Button
                    onClick={() => downloadCsv("imported-cases.csv", toCsv(importedCases))}
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
                    void handleBatchRun({
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
                Source-pool batch rows get 1-3 random cause tags automatically and are used only
                for that run.
              </p>
            </SubSection>
          </SectionCard>
        </div>

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
                        onValueChange={(value) => updateVariant(variant.id, { promptSource: value })}
                        value={variant.promptSource}
                      >
                        <SelectTrigger className="w-full" id={`${variant.id}-batch-prompt-source`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {promptTemplates.map((template) => (
                            <SelectItem
                              key={template.id ?? template.name}
                              value={template.id ?? "current"}
                            >
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
        </SectionCard>
      </div>
    </>
  );
}
