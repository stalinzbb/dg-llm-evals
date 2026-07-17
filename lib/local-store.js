import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { createDefaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import { normalizeEnabledModelIds } from "@/lib/constants";
import { normalizeDataset, normalizeEvalDefinition } from "@/lib/eval";
import { createSeedDatasets, createSeedEvals } from "@/lib/seed-evals";

const RUNTIME_DIRECTORY = process.env.VERCEL
  ? path.join(os.tmpdir(), "dg-llm-evals")
  : path.join(process.cwd(), ".runtime");
const DATA_PATH = path.join(RUNTIME_DIRECTORY, "dg-llm-evals.json");

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function stampRecord(record) {
  const now = new Date().toISOString();
  return { createdAt: now, updatedAt: now, ...record };
}

function createSeedEvalRecords() {
  return createSeedEvals().map(stampRecord);
}

function createSeedDatasetRecords() {
  return createSeedDatasets().map(stampRecord);
}

function createSeedData() {
  return {
    appSettings: {
      id: "workspace_default",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: createDefaultAppSettings(),
    },
    runs: [],
    variantResults: [],
    ratings: [],
    evals: createSeedEvalRecords(),
    datasets: createSeedDatasetRecords(),
  };
}

function normalizeWorkspaceSettings(settings = {}) {
  return {
    enabledModelIds: normalizeEnabledModelIds(settings.enabledModelIds),
  };
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
  const data = {
    ...createSeedData(),
    ...parsed,
  };
  if (!Array.isArray(data.evals) || !data.evals.length) {
    data.evals = createSeedEvalRecords();
  }
  if (!Array.isArray(data.datasets) || !data.datasets.length) {
    data.datasets = createSeedDatasetRecords();
  }
  return data;
}

async function writeData(data) {
  await ensureDataFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

function sortByUpdatedAt(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
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
    runs: hydrateRuns(data),
    evals: sortByUpdatedAt(data.evals || []),
    datasets: sortByUpdatedAt(data.datasets || []),
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

export async function listEvals() {
  const data = await readData();
  return sortByUpdatedAt(data.evals || []);
}

export async function getEvalById(id) {
  const data = await readData();
  return (data.evals || []).find((item) => item.id === id) || null;
}

export async function saveEval(entry) {
  const data = await readData();
  const now = new Date().toISOString();
  const normalized = normalizeEvalDefinition(entry);
  const record = {
    ...normalized,
    id: normalized.id || createId("eval"),
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  data.evals = (data.evals || []).filter((item) => item.id !== record.id).concat(record);
  await writeData(data);
  return record;
}

export async function deleteEval(id) {
  const data = await readData();
  data.evals = (data.evals || []).filter((item) => item.id !== id);
  await writeData(data);
  return sortByUpdatedAt(data.evals);
}

export async function listDatasets() {
  const data = await readData();
  return sortByUpdatedAt(data.datasets || []);
}

export async function getDatasetById(id) {
  const data = await readData();
  return (data.datasets || []).find((item) => item.id === id) || null;
}

export async function saveDataset(entry) {
  const data = await readData();
  const now = new Date().toISOString();
  const normalized = normalizeDataset(entry);
  const record = {
    ...normalized,
    id: normalized.id || createId("dataset"),
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  data.datasets = (data.datasets || []).filter((item) => item.id !== record.id).concat(record);
  await writeData(data);
  return record;
}

export async function deleteDataset(id) {
  const data = await readData();
  data.datasets = (data.datasets || []).filter((item) => item.id !== id);
  await writeData(data);
  return sortByUpdatedAt(data.datasets);
}
