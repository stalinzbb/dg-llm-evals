import type { NextApiRequest, NextApiResponse } from "next";

import { getRunById, saveRating } from "@/lib/store";
import type { ApiErrorResponse, RunResponse, SaveRatingRequest } from "@/lib/types/api";

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
    const payload = req.body as SaveRatingRequest;
    await saveRating(payload);
    const run = await getRunById(payload.runId);
    if (!run) {
      res.status(404).json({ error: "Run not found." });
      return;
    }
    res.status(200).json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save rating.";
    res.status(500).json({ error: message || "Failed to save rating." });
  }
}
