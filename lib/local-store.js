import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { createDefaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import {
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";
import {
  applyVerificationFilter,
  buildSourcePoolStats,
  normalizeSourcePoolRecord,
  sampleSourcePoolRecords,
} from "@/lib/source-pool";

const RUNTIME_DIRECTORY = process.env.VERCEL
  ? path.join(os.tmpdir(), "dg-llm-evals")
  : path.join(process.cwd(), ".runtime");
const DATA_PATH = path.join(RUNTIME_DIRECTORY, "dg-llm-evals.json");

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function baseTemplateRecord() {
  const template = normalizePromptTemplate(DEFAULT_PROMPT_TEMPLATE);
  return {
    id: "prompt_default",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...template,
  };
}

function baseCaseRecord() {
  const testCase = normalizeTestCase(DEFAULT_TEST_CASE);
  return {
    id: "case_default",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...testCase,
  };
}

function createSeedData() {
  return {
    appSettings: {
      id: "workspace_default",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: createDefaultAppSettings(),
    },
    testCases: [baseCaseRecord()],
    promptTemplates: [baseTemplateRecord()],
    runs: [],
    variantResults: [],
    ratings: [],
    sourcePool: [],
  };
}

function normalizeWorkspaceSettings(settings = {}) {
  return {
    enabledModelIds: normalizeEnabledModelIds(settings.enabledModelIds),
  };
}

function sortSavedItems(items, defaultId) {
  return [...items].sort((a, b) => {
    if (a.id === defaultId) {
      return -1;
    }
    if (b.id === defaultId) {
      return 1;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });

  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify(createSeedData(), null, 2));
  }
}

async function readData() {
  await ensureDataFile();
  const file = await fs.readFile(DATA_PATH, "utf8");
  const parsed = JSON.parse(file);
  return {
    ...createSeedData(),
    ...parsed,
  };
}

async function writeData(data) {
  await ensureDataFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

function hydrateRuns(data) {
  return data.runs
    .map((run) => ({
      ...run,
      results: data.variantResults.filter((result) => result.runId === run.id),
      ratings: data.ratings.filter((rating) => rating.runId === run.id),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getBootstrapData() {
  const data = await readData();
  return {
    storageMode: "local",
    appSettingsStorageMode: "browser",
    appSettings: normalizeAppSettings(data.appSettings?.payload),
    workspaceSettingsStorageMode: "browser",
    settings: normalizeWorkspaceSettings(data.settings),
    testCases: data.testCases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    promptTemplates: data.promptTemplates.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    ),
    runs: hydrateRuns(data),
    sourcePoolStats: buildSourcePoolStats(data.sourcePool || []),
  };
}

export async function getWorkspaceSettings() {
  const data = await readData();
  return normalizeWorkspaceSettings(data.settings);
}

export async function saveWorkspaceSettings(entry) {
  const data = await readData();
  const settings = normalizeWorkspaceSettings(entry);
  data.settings = settings;
  await writeData(data);
  return settings;
}

export async function listTestCasesByIds(ids) {
  const data = await readData();
  return data.testCases.filter((item) => ids.includes(item.id));
}

export async function getPromptTemplateById(id) {
  const data = await readData();
  return data.promptTemplates.find((item) => item.id === id) || null;
}

export async function getAppSettings() {
  const data = await readData();
  return normalizeAppSettings(data.appSettings?.payload);
}

export async function saveAppSettings(entry) {
  const data = await readData();
  const now = new Date().toISOString();
  data.appSettings = {
    id: data.appSettings?.id || "workspace_default",
    createdAt: data.appSettings?.createdAt || now,
    updatedAt: now,
    payload: normalizeAppSettings(entry),
  };
  await writeData(data);
  return data.appSettings.payload;
}

export async function saveTestCases(entries) {
  const items = Array.isArray(entries) ? entries : [entries];
  const data = await readData();
  const saved = [];

  items.forEach((entry) => {
    const now = new Date().toISOString();
    const normalized = normalizeTestCase(entry);
    const record = {
      ...normalized,
      id: normalized.id || createId("case"),
      createdAt: entry.createdAt || now,
      updatedAt: now,
    };
    data.testCases = data.testCases.filter((item) => item.id !== record.id).concat(record);
    saved.push(record);
  });

  await writeData(data);
  return saved;
}

export async function savePromptTemplate(entry) {
  const data = await readData();
  const now = new Date().toISOString();
  const normalized = normalizePromptTemplate(entry);
  const record = {
    ...normalized,
    id: normalized.id || createId("prompt"),
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  data.promptTemplates = data.promptTemplates.filter((item) => item.id !== record.id).concat(record);
  await writeData(data);
  return record;
}

export async function deleteTestCase(id) {
  if (id === "case_default") {
    throw new Error("The default case cannot be deleted.");
  }

  const data = await readData();
  data.testCases = data.testCases.filter((item) => item.id !== id);
  await writeData(data);
  return sortSavedItems(data.testCases, "case_default");
}

export async function deletePromptTemplate(id) {
  if (id === "prompt_default") {
    throw new Error("The default recipe cannot be deleted.");
  }

  const data = await readData();
  data.promptTemplates = data.promptTemplates.filter((item) => item.id !== id);
  await writeData(data);
  return sortSavedItems(data.promptTemplates, "prompt_default");
}

export async function createRun(record) {
  const data = await readData();
  const now = new Date().toISOString();
  const run = {
    id: createId("run"),
    createdAt: now,
    updatedAt: now,
    ...record,
  };
  data.runs.unshift(run);
  await writeData(data);
  return run;
}

export async function updateRun(runId, patch) {
  const data = await readData();
  const run = data.runs.find((item) => item.id === runId);
  if (!run) {
    throw new Error(`Run ${runId} not found.`);
  }
  Object.assign(run, patch, { updatedAt: new Date().toISOString() });
  await writeData(data);
  return run;
}

export async function addVariantResult(result) {
  const data = await readData();
  const record = {
    id: createId("variant"),
    createdAt: new Date().toISOString(),
    ...result,
  };
  data.variantResults.push(record);
  await writeData(data);
  return record;
}

export async function saveRating(entry) {
  const data = await readData();
  const now = new Date().toISOString();
  const record = {
    id: entry.id || createId("rating"),
    createdAt: entry.createdAt || now,
    updatedAt: now,
    ...entry,
  };
  data.ratings = data.ratings.filter((item) => item.id !== record.id).concat(record);
  await writeData(data);
  return record;
}

export async function getRunById(runId) {
  const data = await readData();
  const run = hydrateRuns(data).find((item) => item.id === runId);
  return run || null;
}

export async function getSourcePoolStats() {
  const data = await readData();
  return buildSourcePoolStats(data.sourcePool || []);
}

export async function importSourcePool(entries, options = {}) {
  const data = await readData();
  const { replace = true } = options;
  const items = Array.isArray(entries) ? entries : [entries];
  const importBatchId = `import_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const imported = [];
  let skipped = 0;

  items.forEach((entry, index) => {
    const record = normalizeSourcePoolRecord(entry, index, importBatchId);
    if (!record) {
      skipped += 1;
      return;
    }

    imported.push({
      ...record,
      createdAt: now,
      updatedAt: now,
    });
  });

  data.sourcePool = replace ? imported : [...(data.sourcePool || []), ...imported];
  await writeData(data);

  return {
    importBatchId,
    importedCount: imported.length,
    skippedCount: skipped,
    stats: buildSourcePoolStats(data.sourcePool || []),
  };
}

export async function getRandomSourcePoolRecord(verificationFilter = "any") {
  const data = await readData();
  const filtered = applyVerificationFilter(data.sourcePool || [], verificationFilter);
  return sampleSourcePoolRecords(filtered, 1)[0] || null;
}

export async function sampleSourcePool({
  count = 1,
  verificationFilter = "any",
} = {}) {
  const data = await readData();
  const filtered = applyVerificationFilter(data.sourcePool || [], verificationFilter);
  const sampled = sampleSourcePoolRecords(filtered, count);

  return {
    requestedCount: count,
    actualCount: sampled.length,
    rows: sampled,
    stats: buildSourcePoolStats(filtered),
  };
}
