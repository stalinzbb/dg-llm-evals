import type { NextApiRequest, NextApiResponse } from "next";

import { executeBatchRun, executeEvalRun } from "@/lib/runner";
import { getRequestApiKey } from "@/pages/api/generate";
import type {
  ApiErrorResponse,
  BatchRunRequest,
  EvalRunRequest,
  RunResponse,
} from "@/lib/types/api";

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
    const body = req.body as (BatchRunRequest & EvalRunRequest) | undefined;
    const options = { apiKey: getRequestApiKey(req) };
    const isEvalRun = Boolean(body?.evalId || body?.evalDraft);
    const run = isEvalRun
      ? await executeEvalRun(body as EvalRunRequest, options)
      : await executeBatchRun(body as BatchRunRequest, options);
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
