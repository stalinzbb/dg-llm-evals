import type { NextApiRequest, NextApiResponse } from "next";

import { getBootstrapData } from "@/lib/store";
import type { ApiErrorResponse, RunsResponse } from "@/lib/types/api";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<RunsResponse | ApiErrorResponse>,
) {
  try {
    const payload = await getBootstrapData();
    res.status(200).json({ runs: payload.runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch runs.";
    res.status(500).json({ error: message || "Failed to fetch runs." });
  }
}
