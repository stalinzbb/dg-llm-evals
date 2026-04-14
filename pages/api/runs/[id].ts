import type { NextApiRequest, NextApiResponse } from "next";

import { getRunById } from "@/lib/store";
import type { ApiErrorResponse, RunResponse } from "@/lib/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RunResponse | ApiErrorResponse>,
) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const run = await getRunById(id || "");
    if (!run) {
      res.status(404).json({ error: "Run not found." });
      return;
    }
    res.status(200).json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch run.";
    res.status(500).json({ error: message || "Failed to fetch run." });
  }
}
