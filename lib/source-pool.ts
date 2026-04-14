import { CAUSE_TAG_OPTIONS } from "@/lib/constants";
import { normalizeTaxonomySelection } from "@/lib/taxonomy";
import type { SourcePoolRecord, SourcePoolStats } from "@/lib/types/domain";

function cleanCsvCell(value: unknown) {
  const trimmed = `${value ?? ""}`.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function createSourceRecordId(index: number) {
  return `source_${index + 1}_${crypto.randomUUID()}`;
}

export function normalizeSourcePoolRecord(
  input: Record<string, unknown> = {},
  index = 0,
  importBatchId = "",
): SourcePoolRecord | null {
  const organizationName = cleanCsvCell(input.ORGANIZATION_NAME || input.organizationName);
  const teamName = cleanCsvCell(input["TEAM NAME"] || input.teamName);
  const organizationUuid = cleanCsvCell(input.ORGANIZATION_UUID || input.organizationUuid);
  const taxonomy = normalizeTaxonomySelection({
    organizationType: cleanCsvCell(input.ORGANIZATION_TYPE || input.organizationType),
    teamActivity: cleanCsvCell(input.TEAM_ACTIVITY || input.teamActivity),
    teamAffiliation: cleanCsvCell(input.TEAM_AFFILIATION || input.teamAffiliation),
  });
  const inferredName = [organizationName, teamName].filter(Boolean).join(" · ");

  if (!inferredName) {
    return null;
  }

  return {
    id: typeof input.id === "string" ? input.id : createSourceRecordId(index),
    importBatchId:
      typeof input.importBatchId === "string"
        ? input.importBatchId
        : importBatchId || `import_${crypto.randomUUID()}`,
    name: inferredName,
    organizationName,
    teamName,
    organizationUuid: organizationUuid || null,
    isVerified: Boolean(organizationUuid),
    organizationType: taxonomy.organizationType,
    teamActivity: taxonomy.teamActivity,
    teamAffiliation: taxonomy.teamAffiliation,
  };
}

export function buildSourcePoolStats(records: SourcePoolRecord[] = []): SourcePoolStats {
  const total = records.length;
  const verified = records.filter((record) => record.isVerified).length;

  return {
    total,
    verified,
    unverified: total - verified,
  };
}

export function randomizeCauseTags(): string[] {
  const targetCount = Math.floor(Math.random() * 3) + 1;
  const pool = [...CAUSE_TAG_OPTIONS];
  const tags: string[] = [];

  while (pool.length && tags.length < targetCount) {
    const index = Math.floor(Math.random() * pool.length);
    const selected = pool.splice(index, 1)[0];
    if (selected) {
      tags.push(selected);
    }
  }

  return tags;
}

export function applyVerificationFilter(
  records: SourcePoolRecord[] = [],
  verificationFilter = "any",
): SourcePoolRecord[] {
  if (verificationFilter === "verified") {
    return records.filter((record) => record.isVerified);
  }
  if (verificationFilter === "unverified") {
    return records.filter((record) => !record.isVerified);
  }
  return records;
}

export function sampleSourcePoolRecords(records: SourcePoolRecord[] = [], count = 1): SourcePoolRecord[] {
  const pool = [...records];
  const sampled: SourcePoolRecord[] = [];

  while (pool.length && sampled.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const selected = pool.splice(index, 1)[0];
    if (selected) {
      sampled.push(selected);
    }
  }

  return sampled;
}
