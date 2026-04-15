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
import type { SaveRatingRequest } from "@/lib/types/api";
import type { RunMetrics, RunResult } from "@/lib/types/domain";

function formatCurrency(value: RunMetrics["estimatedCost"]) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  return `$${value.toFixed(6)}`;
}

const RATING_FIELDS = [
  ["clarity", "Clarity"],
  ["specificity", "Specificity"],
  ["fundraiserRelevance", "Fundraiser relevance"],
  ["emotionalResonance", "Emotional resonance"],
  ["brandSafety", "Brand safety"],
  ["overall", "Overall"],
] as const;

type RatingFieldKey = (typeof RATING_FIELDS)[number][0];

interface RatingDraft extends Record<RatingFieldKey, string> {
  notes: string;
  winner: boolean;
}

const INITIAL_RATING: RatingDraft = {
  brandSafety: "3",
  clarity: "3",
  emotionalResonance: "3",
  fundraiserRelevance: "3",
  notes: "",
  overall: "3",
  specificity: "3",
  winner: false,
};

interface ResultCardProps {
  onSaveRating?: (payload: SaveRatingRequest) => Promise<void>;
  result: RunResult;
  showRating?: boolean;
}

export default function ResultCard({
  result,
  onSaveRating,
  showRating = true,
}: ResultCardProps) {
  const [view, setView] = useState<"cause" | "full">("cause");
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [rating, setRating] = useState<RatingDraft>(INITIAL_RATING);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!onSaveRating) {
      return;
    }

    setSaving(true);
    try {
      await onSaveRating(({
        notes: rating.notes,
        rubric: {
          brandSafety: Number(rating.brandSafety),
          clarity: Number(rating.clarity),
          emotionalResonance: Number(rating.emotionalResonance),
          fundraiserRelevance: Number(rating.fundraiserRelevance),
          overall: Number(rating.overall),
          specificity: Number(rating.specificity),
        },
        runId: result.runId,
        variantResultId: result.id,
        winner: rating.winner,
      } as unknown) as SaveRatingRequest);
      setRating((current) => ({ ...current, notes: "" }));
    } finally {
      setSaving(false);
    }
  }

  const message = view === "cause" ? result.causeStatement : result.fullMessage;
  const characterCount =
    view === "cause"
      ? result.metrics?.causeOnlyCharacters || 0
      : result.metrics?.fullMessageCharacters || 0;

  return (
    <Card className="gap-0">
      <CardContent className="grid gap-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">{result.variantLabel}</p>
            <p className="text-xs text-muted-foreground">
              {result.model} · {result.promptTemplateName || "Current draft recipe"} · result ID{" "}
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

        <div className="flex gap-1">
          <Button
            onClick={() => setView("cause")}
            size="sm"
            type="button"
            variant={view === "cause" ? "secondary" : "ghost"}
          >
            Cause only
          </Button>
          <Button
            onClick={() => setView("full")}
            size="sm"
            type="button"
            variant={view === "full" ? "secondary" : "ghost"}
          >
            Full message
          </Button>
        </div>

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
              {RATING_FIELDS.map(([key, label]) => (
                <div key={key} className="grid gap-1.5">
                  <Label htmlFor={`${result.id}-${key}`}>{label}</Label>
                  <Select
                    onValueChange={(value) =>
                      setRating((current) => ({ ...current, [key]: value }))
                    }
                    value={rating[key]}
                  >
                    <SelectTrigger className="w-full" id={`${result.id}-${key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((value) => (
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
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setRating((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Why is this good or weak? What should change in the prompt?"
                value={rating.notes}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={rating.winner}
                  id={`${result.id}-winner`}
                  onCheckedChange={(checked: boolean) =>
                    setRating((current) => ({ ...current, winner: Boolean(checked) }))
                  }
                />
                <Label htmlFor={`${result.id}-winner`}>Mark as preferred output</Label>
              </div>
              <Button
                disabled={saving}
                onClick={handleSave}
                size="sm"
                type="button"
                variant="outline"
              >
                {saving ? "Saving…" : "Save rating"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
