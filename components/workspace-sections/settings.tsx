import { useEffect, useState } from "react";

import { readStoredOpenRouterKey, writeStoredOpenRouterKey } from "@/lib/workspace-browser";

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
  sanitizeModelConfigurationIds,
} from "@/lib/workspace-selectors";
import type { SettingsSectionProps } from "@/lib/types/workspace";

import { SectionCard, SectionHead } from "./section-primitives";

export function SettingsSection({
  enabledModelIds,
  handleSaveSettings,
}: SettingsSectionProps) {
  const [draftEnabledModelIds, setDraftEnabledModelIds] = useState(() =>
    sanitizeModelConfigurationIds(enabledModelIds),
  );
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState("");

  useEffect(() => {
    setDraftEnabledModelIds(sanitizeModelConfigurationIds(enabledModelIds));
  }, [enabledModelIds]);

  useEffect(() => {
    const storedKey = readStoredOpenRouterKey();
    setApiKeyDraft(storedKey);
    setApiKeySaved(Boolean(storedKey));
  }, []);

  function handleSaveApiKey() {
    writeStoredOpenRouterKey(apiKeyDraft);
    setApiKeySaved(Boolean(apiKeyDraft.trim()));
    setApiKeyStatus(
      apiKeyDraft.trim()
        ? "Key saved in this browser. It is sent with each run and never stored on the server."
        : "Key removed from this browser.",
    );
  }

  const { enabledRunnableCount, hasChanges, selectedEnabledIds } = getModelConfigurationState(
    draftEnabledModelIds,
    enabledModelIds,
  );
  function handleModelToggle(modelValue: string, checked: boolean) {
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
              <Button onClick={handleSaveApiKey} size="sm" type="button">
                Save key
              </Button>
            }
            subtitle="Bring your own OpenRouter API key. Stored only in this browser's localStorage and attached per-request; without it, runs use the server key if configured, otherwise mock output."
            title="OpenRouter API Key"
          />
          <div className="grid gap-1.5">
            <Label htmlFor="openrouter-key">API key {apiKeySaved ? "(saved in this browser)" : ""}</Label>
            <Input
              autoComplete="off"
              id="openrouter-key"
              onChange={(event) => setApiKeyDraft(event.target.value)}
              placeholder="sk-or-v1-…"
              type="password"
              value={apiKeyDraft}
            />
            {apiKeyStatus ? <p className="text-xs text-muted-foreground">{apiKeyStatus}</p> : null}
            <p className="text-xs text-muted-foreground">
              Get a key at openrouter.ai — one key unlocks every model in the list below.
            </p>
          </div>
        </SectionCard>

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
              <AlertDescription>At least one runnable model must stay enabled.</AlertDescription>
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
      </div>
    </>
  );
}
