import { createClient } from "@supabase/supabase-js";

import { DEFAULT_PROMPT_TEMPLATE, DEFAULT_TEST_CASE } from "@/lib/constants";
import { normalizePromptTemplate, normalizeTestCase } from "@/lib/prompt";

const TABLES = {
  testCases: "test_cases",
  promptTemplates: "prompt_templates",
  runs: "runs",
  variantResults: "variant_results",
  ratings: "ratings",
};

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

async function ensureSeeds(client) {
  const [cases, prompts] = await Promise.all([
    selectAll(client, TABLES.testCases),
    selectAll(client, TABLES.promptTemplates),
  ]);

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

  const [testCases, promptTemplates, runs, variantResults, ratings] = await Promise.all([
    selectAll(client, TABLES.testCases),
    selectAll(client, TABLES.promptTemplates),
    selectAll(client, TABLES.runs),
    selectAll(client, TABLES.variantResults),
    selectAll(client, TABLES.ratings),
  ]);

  return {
    storageMode: "supabase",
    testCases: sortSavedItems(hydrateRecords(testCases), "case_default"),
    promptTemplates: sortSavedItems(hydrateRecords(promptTemplates), "prompt_default"),
    runs: hydrateRuns(runs, variantResults, ratings),
  };
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
