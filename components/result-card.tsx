import type { ChangeEvent } from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_RUBRIC_CRITERIA } from "@/lib/eval";
import type { SaveRatingRequest } from "@/lib/types/api";
import type { RunMetrics, RunResult } from "@/lib/types/domain";
import type { RubricCriterion } from "@/lib/types/eval";

function formatCurrency(value: RunMetrics["estimatedCost"]) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  return `$${value.toFixed(6)}`;
}

interface ResultCardProps {
  onSaveRating?: (payload: SaveRatingRequest) => Promise<void>;
  result: RunResult;
  /** Rubric criteria to rate against; defaults to the generic rubric. */
  rubric?: RubricCriterion[];
  showRating?: boolean;
}

export default function ResultCard({
  result,
  onSaveRating,
  rubric,
  showRating = true,
}: ResultCardProps) {
  const criteria = rubric?.length ? rubric : DEFAULT_RUBRIC_CRITERIA;
  const [view, setView] = useState<"output" | "full">("output");
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [winner, setWinner] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasWrappedOutput =
    Boolean(result.wrappedOutput) && result.wrappedOutput !== result.output;
  const variableEntries = Object.entries(result.variableValues || {});

  async function handleSave() {
    if (!onSaveRating) {
      return;
    }

    setSaving(true);
    try {
      await onSaveRating(({
        notes,
        rubric: Object.fromEntries(
          criteria.map((criterion) => [criterion.key, Number(scores[criterion.key] ?? "3")]),
        ),
        runId: result.runId,
        variantResultId: result.id,
        winner,
      } as unknown) as SaveRatingRequest);
      setNotes("");
    } finally {
      setSaving(false);
    }
  }

  const message = view === "output" ? result.output : result.wrappedOutput;
  const characterCount =
    view === "output"
      ? result.metrics?.outputCharacters || 0
      : result.metrics?.wrappedOutputCharacters || 0;

  return (
    <Card className="gap-0 py-0">
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">{result.variantLabel}</p>
            <p className="text-xs text-muted-foreground">
              {result.model} · {result.promptTemplateName || "Current draft"} · result ID{" "}
              {result.id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {result.isVerified ? <Badge variant="secondary">Verified org</Badge> : null}
            <Badge variant="outline">
              <strong>{result.provider}</strong>
              <span className="ml-1 font-normal">provider</span>
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            [String(result.metrics?.promptTokens ?? 0), "input tokens"],
            [String(result.metrics?.completionTokens ?? 0), "output tokens"],
            [formatCurrency(result.metrics?.estimatedCost ?? null), "est. cost"],
            [`${result.metrics?.latencyMs ?? 0}ms`, "latency"],
          ].map(([value, label]) => (
            <Badge key={label} className="gap-1 font-normal" variant="outline">
              <strong className="font-semibold">{value}</strong> {label}
            </Badge>
          ))}
        </div>

        {variableEntries.length ? (
          <div className="flex flex-wrap gap-1.5">
            {variableEntries.map(([key, value]) => (
              <Badge className="gap-1 font-normal" key={key} variant="secondary">
                <span className="font-mono">{key}</span>
                <span className="max-w-[180px] truncate">{value}</span>
                {result.variableSources?.[key] === "random" ? <span title="Randomly sampled">🎲</span> : null}
              </Badge>
            ))}
          </div>
        ) : null}

        {hasWrappedOutput ? (
          <div className="flex gap-1">
            <Button
              onClick={() => setView("output")}
              size="sm"
              type="button"
              variant={view === "output" ? "secondary" : "ghost"}
            >
              Output only
            </Button>
            <Button
              onClick={() => setView("full")}
              size="sm"
              type="button"
              variant={view === "full" ? "secondary" : "ghost"}
            >
              With prefix/suffix
            </Button>
          </div>
        ) : null}

        <div className="min-h-[80px] rounded-lg bg-muted p-3 font-mono text-sm whitespace-pre-wrap">
          {result.error ? `Error: ${result.error}` : message}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{characterCount} characters in this view</span>
          <span>
            {result.caseName}
            {result.sourceType ? ` · ${result.sourceType.replace(/_/g, " ")}` : ""}
          </span>
        </div>

        <div>
          <Button
            onClick={() => setShowRequestDetails((current) => !current)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {showRequestDetails ? "Hide Prompt Details" : "Show Prompt Details"}
          </Button>
        </div>

        {showRequestDetails ? (
          <div className="grid gap-3">
            {[
              ["Model", result.model || "N/A"],
              ["System Prompt", result.systemPrompt || "N/A"],
              ["User Prompt", result.userPrompt || "N/A"],
              ["Generation Settings", JSON.stringify(result.generationSettings || {}, null, 2)],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <div className="rounded-md bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
                  {value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {showRating ? (
          <div className="grid gap-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-3">
              {criteria.map((criterion) => (
                <div key={criterion.key} className="grid gap-1.5">
                  <Label htmlFor={`${result.id}-${criterion.key}`}>{criterion.label}</Label>
                  <Select
                    onValueChange={(value) =>
                      setScores((current) => ({ ...current, [criterion.key]: value }))
                    }
                    value={scores[criterion.key] ?? "3"}
                  >
                    <SelectTrigger className="w-full" id={`${result.id}-${criterion.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: criterion.max - criterion.min + 1 },
                        (_, i) => criterion.min + i,
                      ).map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${result.id}-notes`}>Review notes</Label>
              <Textarea
                id={`${result.id}-notes`}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
                placeholder="Why is this good or weak? What should change in the prompt?"
                value={notes}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={winner}
                  id={`${result.id}-winner`}
                  onCheckedChange={(checked: boolean) => setWinner(Boolean(checked))}
                />
                <Label htmlFor={`${result.id}-winner`}>Mark as preferred output</Label>
              </div>
              <Button disabled={saving} onClick={handleSave} size="sm" type="button" variant="outline">
                {saving ? "Saving…" : "Save rating"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
