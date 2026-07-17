import { createClient } from "@supabase/supabase-js";

import { createDefaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import { DEFAULT_ENABLED_MODEL_IDS, normalizeEnabledModelIds } from "@/lib/constants";
import { normalizeDataset, normalizeEvalDefinition } from "@/lib/eval";
import { createSeedDatasets, createSeedEvals } from "@/lib/seed-evals";

const TABLES = {
  appSettings: "app_settings",
  workspaceSettings: "workspace_settings",
  runs: "runs",
  variantResults: "variant_results",
  ratings: "ratings",
  evals: "evals",
  datasets: "datasets",
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

async function selectAllOptional(client, table) {
  const { data, error } = await client.from(table).select("*");
  if (isMissingRelationError(error)) {
    return { data: [], missing: true };
  }
  if (error) {
    throw error;
  }
  return { data: data || [], missing: false };
}

async function maybeSingleOptional(query) {
  const { data, error } = await query;
  if (isMissingRelationError(error)) {
    return { data: null, missing: true };
  }
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return { data: data || null, missing: false };
}

function normalizeWorkspaceSettings(settings = {}) {
  return {
    enabledModelIds: normalizeEnabledModelIds(settings.enabledModelIds),
  };
}

async function ensureSeeds(client) {
  const { data: appSettingsRows, missing: appSettingsMissing } = await selectAllOptional(
    client,
    TABLES.appSettings,
  );

  if (!appSettingsMissing && !appSettingsRows.length) {
    await client.from(TABLES.appSettings).insert({
      id: "workspace_default",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload: createDefaultAppSettings(),
    });
  }

  const [{ data: evalRows, missing: evalsMissing }, { data: datasetRows, missing: datasetsMissing }] =
    await Promise.all([
      selectAllOptional(client, TABLES.evals),
      selectAllOptional(client, TABLES.datasets),
    ]);

  if (!datasetsMissing && !datasetRows.length) {
    await client.from(TABLES.datasets).insert(
      createSeedDatasets().map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        payload: dataset,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    );
  }

  if (!evalsMissing && !evalRows.length) {
    await client.from(TABLES.evals).insert(
      createSeedEvals().map((evalDefinition) => ({
        id: evalDefinition.id,
        name: evalDefinition.name,
        payload: evalDefinition,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    );
  }

  const { data: settings, missing: workspaceSettingsMissing } = await maybeSingleOptional(
    client.from(TABLES.workspaceSettings).select("*").eq("id", "default").maybeSingle(),
  );

  if (!workspaceSettingsMissing && !settings) {
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

function sortByUpdatedAtDesc(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
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

  const [
    { data: appSettingsRows, missing: appSettingsMissing },
    { data: workspaceSettingsRow, missing: workspaceSettingsMissing },
    runs,
    variantResults,
    ratings,
    { data: evalRows },
    { data: datasetRows },
  ] = await Promise.all([
    selectAllOptional(client, TABLES.appSettings),
    maybeSingleOptional(client.from(TABLES.workspaceSettings).select("*").eq("id", "default").maybeSingle()),
    selectAll(client, TABLES.runs),
    selectAll(client, TABLES.variantResults),
    selectAll(client, TABLES.ratings),
    selectAllOptional(client, TABLES.evals),
    selectAllOptional(client, TABLES.datasets),
  ]);

  return {
    storageMode: "supabase",
    appSettingsStorageMode: appSettingsMissing ? "browser" : "supabase",
    appSettings: normalizeAppSettings(appSettingsRows[0]?.payload),
    workspaceSettingsStorageMode: workspaceSettingsMissing ? "browser" : "supabase",
    settings: normalizeWorkspaceSettings(workspaceSettingsRow?.payload),
    runs: hydrateRuns(runs, variantResults, ratings),
    evals: sortByUpdatedAtDesc(hydrateRecords(evalRows || [])),
    datasets: sortByUpdatedAtDesc(hydrateRecords(datasetRows || [])),
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

export async function getAppSettings() {
  const client = getClient();
  if (!client) {
    return null;
  }

  await ensureSeeds(client);
  const { data } = await maybeSingleOptional(
    client.from(TABLES.appSettings).select("*").eq("id", "workspace_default").maybeSingle(),
  );
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

  if (isMissingRelationError(error)) {
    return normalizeAppSettings(entry);
  }

  if (error) {
    throw error;
  }

  return normalizeAppSettings(data.payload);
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

async function listPayloadRecords(table) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const { data, missing } = await selectAllOptional(client, table);
  if (missing) {
    // Table not created yet (schema.sql not applied) — let the local store handle it.
    return null;
  }
  return sortByUpdatedAtDesc(hydrateRecords(data));
}

async function getPayloadRecordById(table, id) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const { data } = await maybeSingleOptional(
    client.from(table).select("*").eq("id", id).maybeSingle(),
  );
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

async function savePayloadRecord(table, record, entry) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const now = new Date().toISOString();
  const row = {
    id: record.id,
    name: record.name,
    payload: record,
    created_at: entry.createdAt || now,
    updated_at: now,
  };
  const { data, error } = await client.from(table).upsert(row, { onConflict: "id" }).select("*").single();
  if (isMissingRelationError(error)) {
    return null;
  }
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

async function deletePayloadRecord(table, id) {
  const client = getClient();
  if (!client) {
    return null;
  }
  const { error } = await client.from(table).delete().eq("id", id);
  if (error && !isMissingRelationError(error)) {
    throw error;
  }
  return listPayloadRecords(table);
}

export async function listEvals() {
  return listPayloadRecords(TABLES.evals);
}

export async function getEvalById(id) {
  return getPayloadRecordById(TABLES.evals, id);
}

export async function saveEval(entry) {
  const normalized = normalizeEvalDefinition(entry);
  const record = { ...normalized, id: normalized.id || createId("eval") };
  return savePayloadRecord(TABLES.evals, record, entry);
}

export async function deleteEval(id) {
  return deletePayloadRecord(TABLES.evals, id);
}

export async function listDatasets() {
  return listPayloadRecords(TABLES.datasets);
}

export async function getDatasetById(id) {
  return getPayloadRecordById(TABLES.datasets, id);
}

export async function saveDataset(entry) {
  const normalized = normalizeDataset(entry);
  const record = { ...normalized, id: normalized.id || createId("dataset") };
  return savePayloadRecord(TABLES.datasets, record, entry);
}

export async function deleteDataset(id) {
  return deletePayloadRecord(TABLES.datasets, id);
}
