import ResultCard from "@/components/result-card";
import WorkspacePageHeader from "@/components/workspace-page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv, serializeRunRows } from "@/lib/workspace";
import { toCsv } from "@/lib/csv";

import { EmptyState, SectionCard, SectionHead } from "./section-primitives";
import { formatHistoryDateParts, normalizeShortRunId } from "./section-helpers";

export function HistorySection({
  filteredRuns,
  handleSaveRating,
  historySearch,
  selectedRun,
  selectedRunId,
  setHistorySearch,
  setSelectedRunId,
}) {
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

        <SectionCard>
          <SectionHead
            action={
              selectedRun ? (
                <Button
                  onClick={() =>
                    downloadCsv(`run-${selectedRun.id}.csv`, toCsv(serializeRunRows([selectedRun])))
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
