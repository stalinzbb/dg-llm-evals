import { useMemo, useState } from "react";

import { BatchRunBoltIcon } from "@/components/icons";
import WorkspacePageHeader from "@/components/workspace-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { downloadCsv, formatModelOption } from "@/lib/workspace";

import { EmptyState, Field, SectionCard, SectionHead, SubSection } from "./section-primitives";

const SKIP_COLUMN = "__skip__";
const PREVIEW_ROW_LIMIT = 5;

export function BatchSection({
  activeEvalId,
  availableModelOptions,
  batchGenerating,
  datasets,
  evals,
  handleEvalBatchRun,
  setActiveEvalId,
  updateVariant,
  variants,
}: BatchSectionProps) {
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [label, setLabel] = useState("");

  const activeEval = useMemo(
    () => evals.find((item) => item.id === activeEvalId) || evals[0] || null,
    [evals, activeEvalId],
  );
  const datasetsById = useMemo(() => new Map(datasets.map((dataset) => [dataset.id, dataset])), [datasets]);
  const headers = csvRows.length ? Object.keys(csvRows[0]) : [];

  // Manual values reset when the active eval changes (derived-state-reset pattern).
  const [manualState, setManualState] = useState<{
    evalId: string | null;
    values: Record<string, string>;
  }>({ evalId: null, values: {} });
  if ((activeEval?.id || null) !== manualState.evalId) {
    setManualState({ evalId: activeEval?.id || null, values: {} });
  }
  const manualValues = manualState.values;
  const setManualValue = (key: string, value: string) =>
    setManualState((current) => ({ ...current, values: { ...current.values, [key]: value } }));

  function autoMapColumns(rows: Record<string, string>[]) {
    if (!rows.length || !activeEval) return {};
    const mapping: Record<string, string> = {};
    const variableKeys = activeEval.variables.map((variable) => variable.key);
    for (const header of Object.keys(rows[0])) {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = variableKeys.find(
        (key) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedHeader,
      );
      mapping[header] = match || SKIP_COLUMN;
    }
    return mapping;
  }

  function handleCsvFile(file: File) {
    void file.text().then((text) => {
      const rows = parseCsv(text);
      setCsvRows(rows);
      setCsvFileName(file.name);
      setColumnMapping(autoMapColumns(rows));
    });
  }

  const mappedVariableKeys = new Set(
    Object.values(columnMapping).filter((value) => value !== SKIP_COLUMN),
  );

  const unmappedVariables = (activeEval?.variables || []).filter(
    (variable) => !mappedVariableKeys.has(variable.key),
  );

  const runnable = Boolean(activeEval && csvRows.length && !batchGenerating);

  function runBatch() {
    if (!activeEval) return;
    void handleEvalBatchRun({
      evalId: activeEval.id,
      templateId: activeEval.templates[0]?.id,
      manualValues,
      csvRows,
      columnMapping: Object.fromEntries(
        Object.entries(columnMapping).filter(([, value]) => value !== SKIP_COLUMN),
      ),
      label: label || `${activeEval.name} · batch of ${csvRows.length}`,
    });
  }

  function downloadTemplateCsv() {
    if (!activeEval) return;
    const sample = Object.fromEntries(
      activeEval.variables.map((variable) => [variable.key, variable.defaultValue || ""]),
    );
    downloadCsv(`${activeEval.name.replace(/\s+/g, "-").toLowerCase()}-batch-template.csv`, toCsv([sample]));
  }

  if (!activeEval) {
    return (
      <>
        <WorkspacePageHeader description="Run an eval over many CSV rows at once." title="Batches" />
        <SectionCard>
          <EmptyState>No evals available. Create one in the Eval Builder first.</EmptyState>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <WorkspacePageHeader
        description="Upload a CSV where each row is one run. Columns map to the eval's variables; every row runs through each model variant."
        title="Batches"
      />

      <div className="grid gap-6">
        <SectionCard>
          <SectionHead
            action={
              <Button onClick={downloadTemplateCsv} size="sm" type="button" variant="ghost">
                Download CSV template
              </Button>
            }
            subtitle="Pick the eval, then upload data."
            title="Eval & Data"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="batch-eval">Eval</Label>
              <Select onValueChange={(value) => setActiveEvalId(value)} value={activeEval.id || ""}>
                <SelectTrigger className="w-full" id="batch-eval">
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
            <div className="grid gap-1.5">
              <Label htmlFor="batch-csv">CSV file</Label>
              <Input
                accept=".csv,text/csv"
                id="batch-csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleCsvFile(file);
                  event.target.value = "";
                }}
                type="file"
              />
              {csvFileName ? (
                <p className="text-xs text-muted-foreground">
                  {csvFileName} · {csvRows.length} rows
                </p>
              ) : null}
            </div>
          </div>

          {headers.length ? (
            <SubSection title="Column mapping">
              <div className="grid gap-2 md:grid-cols-2">
                {headers.map((header) => (
                  <div className="grid grid-cols-[1fr_1fr] items-center gap-2" key={header}>
                    <span className="truncate font-mono text-xs">{header}</span>
                    <Select
                      onValueChange={(value) =>
                        setColumnMapping((current) => ({ ...current, [header]: value }))
                      }
                      value={columnMapping[header] || SKIP_COLUMN}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SKIP_COLUMN}>Ignore column</SelectItem>
                        {activeEval.variables.map((variable) => (
                          <SelectItem key={variable.key} value={variable.key}>
                            {`{{${variable.key}}}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </SubSection>
          ) : null}

          {unmappedVariables.length ? (
            <SubSection title="Variables not covered by the CSV">
              <div className="grid gap-3 md:grid-cols-2">
                {unmappedVariables.map((variable) => {
                  const dataset = variable.datasetId ? datasetsById.get(variable.datasetId) : null;
                  const isRandom = variable.defaultSource === "random";
                  return (
                    <Field
                      key={variable.key}
                      label={`${variable.label || variable.key}${variable.required ? " *" : ""}`}
                      onChange={(value) => setManualValue(variable.key, value)}
                      placeholder={
                        isRandom
                          ? `Blank = random per row from “${dataset?.name || "dataset"}”`
                          : variable.defaultValue
                            ? `Default: ${variable.defaultValue}`
                            : "Applied to every row"
                      }
                      value={manualValues[variable.key] ?? ""}
                    />
                  );
                })}
              </div>
            </SubSection>
          ) : null}

          {csvRows.length ? (
            <SubSection title={`Preview (first ${Math.min(PREVIEW_ROW_LIMIT, csvRows.length)} rows)`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHead key={header}>
                          <span className="font-mono text-xs">{header}</span>
                          {columnMapping[header] && columnMapping[header] !== SKIP_COLUMN ? (
                            <Badge className="ml-1 font-mono text-[0.6rem]" variant="secondary">
                              {`{{${columnMapping[header]}}}`}
                            </Badge>
                          ) : null}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvRows.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => (
                      <TableRow key={index}>
                        {headers.map((header) => (
                          <TableCell className="max-w-[220px] truncate text-xs" key={header}>
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SubSection>
          ) : (
            <EmptyState>Upload a CSV to preview rows here.</EmptyState>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHead subtitle="Each CSV row runs once per variant below." title="Models & Run" />
          <div className="grid gap-3 md:grid-cols-2">
            {variants.map((variant) => (
              <div className="grid gap-1.5" key={variant.id}>
                <Label htmlFor={`batch-${variant.id}-model`}>{variant.label}</Label>
                <Select
                  onValueChange={(value) => updateVariant(variant.id, { model: value })}
                  value={variant.model}
                >
                  <SelectTrigger className="w-full" id={`batch-${variant.id}-model`}>
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
            ))}
          </div>

          <div className="grid gap-3 border-t pt-4 md:grid-cols-[1fr_auto]">
            <Field label="Run label (optional)" onChange={setLabel} value={label} />
            <div className="flex items-end">
              <Button disabled={!runnable} onClick={runBatch} type="button">
                <BatchRunBoltIcon />
                {batchGenerating
                  ? "Running batch…"
                  : `Run ${csvRows.length || 0} × ${variants.length} generations`}
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
