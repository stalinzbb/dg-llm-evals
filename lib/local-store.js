import { promises as fs } from "fs";
import path from "path";

import { DEFAULT_PROMPT_TEMPLATE, DEFAULT_TEST_CASE } from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";

const DATA_PATH = path.join(process.cwd(), ".runtime", "dg-llm-evals.json");

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
    testCases: [baseCaseRecord()],
    promptTemplates: [baseTemplateRecord()],
    runs: [],
    variantResults: [],
    ratings: [],
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
    testCases: sortSavedItems(data.testCases, "case_default"),
    promptTemplates: sortSavedItems(data.promptTemplates, "prompt_default"),
    runs: hydrateRuns(data),
  };
}

export async function listTestCasesByIds(ids) {
  const data = await readData();
  return data.testCases.filter((item) => ids.includes(item.id));
}

export async function getPromptTemplateById(id) {
  const data = await readData();
  return data.promptTemplates.find((item) => item.id === id) || null;
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
