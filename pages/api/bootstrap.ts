import type { NextApiRequest, NextApiResponse } from "next";

import { getBootstrapData } from "@/lib/store";
import type { ApiErrorResponse, BootstrapResponse } from "@/lib/types/api";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<BootstrapResponse | ApiErrorResponse>,
) {
  try {
    const payload = await getBootstrapData();
    res.status(200).json({
      ...payload,
      sourcePoolStats: payload?.sourcePoolStats || { total: 0, verified: 0, unverified: 0 },
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      gateEnabled: Boolean(process.env.APP_ACCESS_PASSWORD),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bootstrap data.";
    res.status(500).json({ error: message || "Failed to load bootstrap data." });
  }
}
