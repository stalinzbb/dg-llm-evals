import { createClient } from "@supabase/supabase-js";

import { createDefaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import {
  DEFAULT_ENABLED_MODEL_IDS,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_TEST_CASE,
  normalizeEnabledModelIds,
} from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";
import {
  buildSourcePoolStats,
  normalizeSourcePoolRecord,
} from "@/lib/source-pool";

const TABLES = {
  appSettings: "app_settings",
  testCases: "test_cases",
  promptTemplates: "prompt_templates",
  workspaceSettings: "workspace_settings",
  runs: "runs",
  variantResults: "variant_results",
  ratings: "ratings",
  sourcePool: "source_pool",
};

function isMissingRelationError(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function selectAll(client, table) {
  const { data, error } = await client.from(table).select("*");
  if (error) {
    throw error;
  }
  return data || [];
}

function normalizeWorkspaceSettings(settings = {}) {
  return {
    enabledModelIds: normalizeEnabledModelIds(settings.enabledModelIds),
  };
}

async function ensureSeeds(client) {
  const [appSettingsRows, cases, prompts] = await Promise.all([
    selectAll(client, TABLES.appSettings),
    selectAll(client, TABLES.testCases),
    selectAll(client, TABLES.promptTemplates),
  ]);

  if (!appSettingsRows.length) {
    const seededSettings = {
      id: "workspace_default",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload: createDefaultAppSettings(),
    };
    await client.from(TABLES.appSettings).insert(seededSettings);
  }

  if (!cases.length) {
    const seededCase = {
      id: "case_default",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload: normalizeTestCase(DEFAULT_TEST_CASE),
      name: DEFAULT_TEST_CASE.name,
    };
    await client.from(TABLES.testCases).insert(seededCase);
  }

  if (!prompts.length) {
    const seededPrompt = {
      id: "prompt_default",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload: normalizePromptTemplate(DEFAULT_PROMPT_TEMPLATE),
      name: DEFAULT_PROMPT_TEMPLATE.name,
      is_active: true,
    };
    await client.from(TABLES.promptTemplates).insert(seededPrompt);
  }

  const { data: settings, error: settingsError } = await client
    .from(TABLES.workspaceSettings)
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (settingsError && settingsError.code !== "PGRST116" && !isMissingRelationError(settingsError)) {
    throw settingsError;
  }

  if (!settings && !isMissingRelationError(settingsError)) {
    await client.from(TABLES.workspaceSettings).upsert({
      id: "default",
      payload: normalizeWorkspaceSettings({ enabledModelIds: DEFAULT_ENABLED_MODEL_IDS }),
      updated_at: new Date().toISOString(),
    });
  }
}

function hydrateRecords(rows) {
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.payload || {}),
  }));
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

function hydrateRuns(runRows, variantRows, ratingRows) {
  return runRows
    .map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      mode: row.mode,
      label: row.label,
      status: row.status,
      payload: row.payload || {},
      results: variantRows
        .filter((result) => result.run_id === row.id)
        .map((result) => ({
          id: result.id,
          createdAt: result.created_at,
          ...result.payload,
        })),
      ratings: ratingRows
        .filter((rating) => rating.run_id === row.id)
        .map((rating) => ({
          id: rating.id,
          createdAt: rating.created_at,
          updatedAt: rating.updated_at,
          ...rating.payload,
        })),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getBootstrapData() {
  const client = getClient();
  if (!client) {
    return null;
  }

  await ensureSeeds(client);

  const [appSettingsRows, testCases, promptTemplates, settingsRow, runs, variantResults, ratings] =
    await Promise.all([
      selectAll(client, TABLES.appSettings),
      selectAll(client, TABLES.testCases),
      selectAll(client, TABLES.promptTemplates),
      client.from(TABLES.workspaceSettings).select("*").eq("id", "default").maybeSingle(),
      selectAll(client, TABLES.runs),
      selectAll(client, TABLES.variantResults),
      selectAll(client, TABLES.ratings),
    ]);

  if (settingsRow.error && settingsRow.error.code !== "PGRST116" && !isMissingRelationError(settingsRow.error)) {
    throw settingsRow.error;
  }

  const { count: sourcePoolCount, error: sourcePoolCountError } = await client
    .from(TABLES.sourcePool)
    .select("*", { count: "exact", head: true });
  if (sourcePoolCountError && !isMissingRelationError(sourcePoolCountError)) {
    throw sourcePoolCountError;
  }

  const { count: verifiedCount, error: verifiedCountError } = await client
    .from(TABLES.sourcePool)
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true);
  if (verifiedCountError && !isMissingRelationError(verifiedCountError)) {
    throw verifiedCountError;
  }

  return {
    storageMode: "supabase",
    appSettings: normalizeAppSettings(appSettingsRows[0]?.payload),
    settings: normalizeWorkspaceSettings(settingsRow.data?.payload),
    testCases: hydrateRecords(testCases),
    promptTemplates: hydrateRecords(promptTemplates),
    runs: hydrateRuns(runs, variantResults, ratings),
    sourcePoolStats: {
      total: sourcePoolCount || 0,
      verified: verifiedCount || 0,
      unverified: Math.max(0, (sourcePoolCount || 0) - (verifiedCount || 0)),
    },
  };
}

export async function getWorkspaceSettings() {
  const client = getClient();
  if (!client) {
    return null;
  }

  await ensureSeeds(client);
  const { data, error } = await client
    .from(TABLES.workspaceSettings)
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error && error.code !== "PGRST116" && !isMissingRelationError(error)) {
    throw error;
  }

  return normalizeWorkspaceSettings(data?.payload);
}

export async function saveWorkspaceSettings(entry) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const settings = normalizeWorkspaceSettings(entry);
  const { data, error } = await client
    .from(TABLES.workspaceSettings)
    .upsert({
      id: "default",
      payload: settings,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (isMissingRelationError(error)) {
    return settings;
  }

  if (error) {
    throw error;
  }

  return normalizeWorkspaceSettings(data?.payload);
}

export async function listTestCasesByIds(ids) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.from(TABLES.testCases).select("*").in("id", ids);
  if (error) {
    throw error;
  }
  return hydrateRecords(data || []);
}

export async function getPromptTemplateById(id) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.from(TABLES.promptTemplates).select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    ...(data.payload || {}),
  };
}

export async function getAppSettings() {
  const client = getClient();
  if (!client) {
    return null;
  }

  await ensureSeeds(client);

  const { data, error } = await client
    .from(TABLES.appSettings)
    .select("*")
    .eq("id", "workspace_default")
    .maybeSingle();
  if (error && error.code !== "PGRST116" && !isMissingRelationError(error)) {
    throw error;
  }

  return normalizeAppSettings(data?.payload);
}

export async function saveAppSettings(entry) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const now = new Date().toISOString();
  const payload = {
    id: "workspace_default",
    updated_at: now,
    payload: normalizeAppSettings(entry),
  };
  const { data, error } = await client
    .from(TABLES.appSettings)
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeAppSettings(data.payload);
}

export async function saveTestCases(entries) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const items = Array.isArray(entries) ? entries : [entries];
  const payload = items.map((entry) => {
    const now = new Date().toISOString();
    const normalized = normalizeTestCase(entry);
    return {
      id: normalized.id || createId("case"),
      name: normalized.name,
      payload: normalized,
      created_at: entry.createdAt || now,
      updated_at: now,
    };
  });

  const { data, error } = await client
    .from(TABLES.testCases)
    .upsert(payload, { onConflict: "id" })
    .select("*");

  if (error) {
    throw error;
  }

  return hydrateRecords(data || []);
}

export async function savePromptTemplate(entry) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const now = new Date().toISOString();
  const normalized = normalizePromptTemplate(entry);
  const payload = {
    id: normalized.id || createId("prompt"),
    name: normalized.name,
    is_active: normalized.isActive,
    payload: normalized,
    created_at: entry.createdAt || now,
    updated_at: now,
  };
  const { data, error } = await client
    .from(TABLES.promptTemplates)
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    ...(data.payload || {}),
  };
}

export async function deleteTestCase(id) {
  const client = getClient();
  if (!client) {
    return null;
  }
  if (id === "case_default") {
    throw new Error("The default case cannot be deleted.");
  }

  const { error } = await client.from(TABLES.testCases).delete().eq("id", id);
  if (error) {
    throw error;
  }

  const { data, error: listError } = await client.from(TABLES.testCases).select("*");
  if (listError) {
    throw listError;
  }

  return sortSavedItems(hydrateRecords(data || []), "case_default");
}

export async function deletePromptTemplate(id) {
  const client = getClient();
  if (!client) {
    return null;
  }
  if (id === "prompt_default") {
    throw new Error("The default recipe cannot be deleted.");
  }

  const { error } = await client.from(TABLES.promptTemplates).delete().eq("id", id);
  if (error) {
    throw error;
  }

  const { data, error: listError } = await client.from(TABLES.promptTemplates).select("*");
  if (listError) {
    throw listError;
  }

  return sortSavedItems(hydrateRecords(data || []), "prompt_default");
}

export async function createRun(record) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const now = new Date().toISOString();
  const payload = {
    id: createId("run"),
    created_at: now,
    updated_at: now,
    mode: record.mode,
    label: record.label,
    status: record.status,
    payload: record.payload,
  };
  const { data, error } = await client.from(TABLES.runs).insert(payload).select("*").single();
  if (error) {
    throw error;
  }
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    mode: data.mode,
    label: data.label,
    status: data.status,
    payload: data.payload,
  };
}

export async function updateRun(runId, patch) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client
    .from(TABLES.runs)
    .update({
      ...("mode" in patch ? { mode: patch.mode } : {}),
      ...("label" in patch ? { label: patch.label } : {}),
      ...("status" in patch ? { status: patch.status } : {}),
      ...("payload" in patch ? { payload: patch.payload } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    mode: data.mode,
    label: data.label,
    status: data.status,
    payload: data.payload,
  };
}

export async function addVariantResult(entry) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const payload = {
    id: createId("variant"),
    created_at: new Date().toISOString(),
    run_id: entry.runId,
    model: entry.model,
    variant_label: entry.variantLabel,
    payload: entry,
  };
  const { data, error } = await client
    .from(TABLES.variantResults)
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return {
    id: data.id,
    createdAt: data.created_at,
    ...data.payload,
  };
}

export async function saveRating(entry) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const now = new Date().toISOString();
  const payload = {
    id: entry.id || createId("rating"),
    run_id: entry.runId,
    variant_result_id: entry.variantResultId || null,
    comparison_key: entry.comparisonKey || null,
    created_at: entry.createdAt || now,
    updated_at: now,
    payload: entry,
  };
  const { data, error } = await client
    .from(TABLES.ratings)
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    ...data.payload,
  };
}

export async function getRunById(runId) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const [runRows, variantRows, ratingRows] = await Promise.all([
    client.from(TABLES.runs).select("*").eq("id", runId),
    client.from(TABLES.variantResults).select("*").eq("run_id", runId),
    client.from(TABLES.ratings).select("*").eq("run_id", runId),
  ]);

  if (runRows.error) {
    throw runRows.error;
  }
  if (variantRows.error) {
    throw variantRows.error;
  }
  if (ratingRows.error) {
    throw ratingRows.error;
  }

  return (
    hydrateRuns(runRows.data || [], variantRows.data || [], ratingRows.data || []).find(
      (item) => item.id === runId,
    ) || null
  );
}

export async function getSourcePoolStats() {
  const client = getClient();
  if (!client) {
    return null;
  }

  const { count: total, error: totalError } = await client
    .from(TABLES.sourcePool)
    .select("*", { count: "exact", head: true });
  if (totalError && totalError.code !== "42P01") {
    throw totalError;
  }

  const { count: verified, error: verifiedError } = await client
    .from(TABLES.sourcePool)
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true);
  if (verifiedError && verifiedError.code !== "42P01") {
    throw verifiedError;
  }

  return {
    total: total || 0,
    verified: verified || 0,
    unverified: Math.max(0, (total || 0) - (verified || 0)),
  };
}

export async function importSourcePool(entries, options = {}) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const { replace = true } = options;
  const items = Array.isArray(entries) ? entries : [entries];
  const importBatchId = `import_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const normalized = [];
  let skippedCount = 0;

  items.forEach((entry, index) => {
    const record = normalizeSourcePoolRecord(entry, index, importBatchId);
    if (!record) {
      skippedCount += 1;
      return;
    }
    normalized.push({
      id: record.id,
      import_batch_id: record.importBatchId,
      name: record.name,
      organization_name: record.organizationName,
      team_name: record.teamName,
      organization_uuid: record.organizationUuid,
      is_verified: record.isVerified,
      organization_type: record.organizationType,
      team_activity: record.teamActivity,
      team_affiliation: record.teamAffiliation,
      payload: record,
      created_at: now,
      updated_at: now,
    });
  });

  if (replace) {
    await client.from(TABLES.sourcePool).delete().neq("id", "__never__");
  }

  if (normalized.length) {
    const { error } = await client.from(TABLES.sourcePool).insert(normalized);
    if (error) {
      throw error;
    }
  }

  const stats = await getSourcePoolStats();

  return {
    importBatchId,
    importedCount: normalized.length,
    skippedCount,
    stats: stats || buildSourcePoolStats(normalized.map((item) => item.payload)),
  };
}

function hydrateSourcePoolRecord(row) {
  return {
    id: row.id,
    importBatchId: row.import_batch_id,
    name: row.name,
    organizationName: row.organization_name,
    teamName: row.team_name,
    organizationUuid: row.organization_uuid,
    isVerified: row.is_verified,
    organizationType: row.organization_type,
    teamActivity: row.team_activity,
    teamAffiliation: row.team_affiliation,
    ...(row.payload || {}),
  };
}

export async function getRandomSourcePoolRecord(verificationFilter = "any") {
  const client = getClient();
  if (!client) {
    return null;
  }

  let query = client.from(TABLES.sourcePool).select("*");
  if (verificationFilter === "verified") {
    query = query.eq("is_verified", true);
  } else if (verificationFilter === "unverified") {
    query = query.eq("is_verified", false);
  }

  const { data, error } = await query.limit(500);
  if (error) {
    throw error;
  }

  if (!data?.length) {
    return null;
  }

  return hydrateSourcePoolRecord(data[Math.floor(Math.random() * data.length)]);
}

export async function sampleSourcePool({
  count = 1,
  verificationFilter = "any",
} = {}) {
  const client = getClient();
  if (!client) {
    return null;
  }

  let query = client.from(TABLES.sourcePool).select("*");
  if (verificationFilter === "verified") {
    query = query.eq("is_verified", true);
  } else if (verificationFilter === "unverified") {
    query = query.eq("is_verified", false);
  }

  const { data, error } = await query.limit(Math.max(count * 5, count, 500));
  if (error) {
    throw error;
  }

  const rows = (data || []).map(hydrateSourcePoolRecord);
  const pool = [...rows];
  const sampled = [];

  while (pool.length && sampled.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    sampled.push(pool.splice(index, 1)[0]);
  }

  return {
    requestedCount: count,
    actualCount: sampled.length,
    rows: sampled,
    stats: buildSourcePoolStats(rows),
  };
}
