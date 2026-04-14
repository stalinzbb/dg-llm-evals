import type { NextApiRequest, NextApiResponse } from "next";

import { executeBatchRun } from "@/lib/runner";
import type { ApiErrorResponse, BatchRunRequest, RunResponse } from "@/lib/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RunResponse | ApiErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const run = await executeBatchRun(req.body as BatchRunRequest);
    if (!run) {
      res.status(500).json({ error: "Batch run completed without a run payload." });
      return;
    }
    res.status(200).json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Batch run failed.";
    res.status(500).json({ error: message || "Batch run failed." });
  }
}
