import type { NextApiRequest, NextApiResponse } from "next";

import { executeEvalRun } from "@/lib/runner";
import { getRequestApiKey } from "@/pages/api/generate";
import type { ApiErrorResponse, EvalRunRequest, RunResponse } from "@/lib/types/api";

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
    const body = req.body as EvalRunRequest;
    if (!body?.csvRows?.length) {
      res.status(400).json({ error: "Import a CSV with at least one row to run a batch." });
      return;
    }
    const run = await executeEvalRun(body, { apiKey: getRequestApiKey(req) });
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
