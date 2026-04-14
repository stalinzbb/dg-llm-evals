import type { NextApiRequest, NextApiResponse } from "next";

import { executePlaygroundRun } from "@/lib/runner";
import type { ApiErrorResponse, GenerateRunRequest, RunResponse } from "@/lib/types/api";

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
    const run = await executePlaygroundRun(req.body as GenerateRunRequest);
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
