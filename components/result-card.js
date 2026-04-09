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

function formatCurrency(value) {
  if (value === null || value === undefined) {
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
];

export default function ResultCard({ result, onSaveRating, showRating = true }) {
  const [view, setView] = useState("cause");
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [rating, setRating] = useState({
    clarity: "3",
    specificity: "3",
    fundraiserRelevance: "3",
    emotionalResonance: "3",
    brandSafety: "3",
    overall: "3",
    winner: false,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveRating({
        variantResultId: result.id,
        runId: result.runId,
        rubric: {
          clarity: Number(rating.clarity),
          specificity: Number(rating.specificity),
          fundraiserRelevance: Number(rating.fundraiserRelevance),
          emotionalResonance: Number(rating.emotionalResonance),
          brandSafety: Number(rating.brandSafety),
          overall: Number(rating.overall),
        },
        notes: rating.notes,
        winner: rating.winner,
      });
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
              [
                "Generation Settings",
                JSON.stringify(result.generationSettings || {}, null, 2),
              ],
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
                    value={String(rating[key])}
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
                onChange={(event) =>
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
                  onCheckedChange={(checked) =>
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
