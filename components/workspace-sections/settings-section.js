import { useEffect, useState } from "react";

import WorkspacePageHeader from "@/components/workspace-page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODEL_OPTIONS } from "@/lib/constants";
import {
  getModelConfigurationState,
  getSourcePoolSummary,
  sanitizeModelConfigurationIds,
} from "@/lib/workspace-selectors";

import { SectionCard, SectionHead } from "./primitives";

export function SettingsSection({
  enabledModelIds,
  handleImportSourcePool,
  handleSaveSettings,
  sourcePoolImporting,
  sourcePoolStats,
}) {
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
          <SectionHead subtitle={sourcePoolSummary} title="Source Pool Management" />
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
