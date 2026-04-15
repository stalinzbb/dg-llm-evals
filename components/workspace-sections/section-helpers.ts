import { formatShortId } from "@/lib/workspace";
import type { TestCase, WorkspaceSettings } from "@/lib/types/domain";

export const HELP_TEXT = {
  temperature:
    "Controls randomness. Lower values stay more deterministic, while higher values allow more variation in tone and phrasing.",
  topP:
    "Limits sampling to the most likely token choices within a probability mass. Lower values make responses tighter and more focused.",
  seed:
    "Sets the sampling starting point. Reusing the same seed can help reproduce similar outputs when the rest of the settings stay the same.",
} as const;

export function formatHistoryDateParts(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  };
}

export function normalizeShortRunId(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return formatShortId(value.replace(/^run_/, ""), 6);
}

export function clampDecimalInput(value: string, { min, max }: { min: number; max: number }) {
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

export function clampIntegerInput(value: string) {
  if (value === "") {
    return "";
  }

  const sanitized = value.replace(/[^\d-]/g, "");
  if (sanitized === "-" || /^-?\d+$/.test(sanitized)) {
    return sanitized;
  }

  return value.slice(0, -1);
}

export function getAffiliationSelectValue(
  teamAffiliation: TestCase["teamAffiliation"],
  teamAffiliationConfig: Pick<WorkspaceSettings, never> & {
    allowsOther: boolean;
    mode: "select" | "freeform";
    options: string[];
  },
) {
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
