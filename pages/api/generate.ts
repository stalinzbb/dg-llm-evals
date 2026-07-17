import type { NextApiRequest, NextApiResponse } from "next";

import { executeEvalRun } from "@/lib/runner";
import type { ApiErrorResponse, EvalRunRequest, RunResponse } from "@/lib/types/api";

export function getRequestApiKey(req: NextApiRequest): string | null {
  const header = req.headers["x-openrouter-key"];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.trim() || null;
}

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
    const run = await executeEvalRun(req.body as EvalRunRequest, {
      apiKey: getRequestApiKey(req),
    });
    if (!run) {
      res.status(500).json({ error: "Generation completed without a run payload." });
      return;
    }
    res.status(200).json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    res.status(500).json({ error: message || "Generation failed." });
  }
}
