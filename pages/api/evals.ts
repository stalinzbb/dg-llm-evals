import type { NextApiRequest, NextApiResponse } from "next";

import { deleteEval, listEvals, saveEval } from "@/lib/store";
import type { ApiErrorResponse } from "@/lib/types/api";
import type { EvalDefinition } from "@/lib/types/eval";

interface EvalsResponse {
  evals: EvalDefinition[];
  saved?: EvalDefinition;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EvalsResponse | ApiErrorResponse>,
) {
  try {
    if (req.method === "GET") {
      res.status(200).json({ evals: await listEvals() });
      return;
    }

    if (req.method === "POST") {
      const saved = await saveEval((req.body || {}) as Partial<EvalDefinition>);
      res.status(200).json({ evals: await listEvals(), saved });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = (req.body || {}) as { id?: string };
      if (!id) {
        res.status(400).json({ error: "An eval id is required." });
        return;
      }
      res.status(200).json({ evals: await deleteEval(id) });
      return;
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save eval.";
    res.status(500).json({ error: message || "Failed to save eval." });
  }
}
