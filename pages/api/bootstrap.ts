import type { NextApiRequest, NextApiResponse } from "next";

import { normalizeRuns } from "@/lib/runs";
import { getBootstrapData, listDatasets, listEvals } from "@/lib/store";
import type { ApiErrorResponse, BootstrapResponse } from "@/lib/types/api";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<BootstrapResponse | ApiErrorResponse>,
) {
  try {
    const payload = await getBootstrapData();
    res.status(200).json({
      ...payload,
      runs: normalizeRuns(payload.runs),
      // When the Supabase evals/datasets tables are missing, fall back to the seeded local store.
      evals: payload.evals?.length ? payload.evals : await listEvals(),
      datasets: payload.datasets?.length ? payload.datasets : await listDatasets(),
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      gateEnabled: Boolean(process.env.APP_ACCESS_PASSWORD),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bootstrap data.";
    res.status(500).json({ error: message || "Failed to load bootstrap data." });
  }
}
