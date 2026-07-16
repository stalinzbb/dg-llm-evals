import type { NextApiRequest, NextApiResponse } from "next";

import { deleteDataset, listDatasets, saveDataset } from "@/lib/store";
import type { ApiErrorResponse } from "@/lib/types/api";
import type { Dataset } from "@/lib/types/eval";

interface DatasetsResponse {
  datasets: Dataset[];
  saved?: Dataset;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DatasetsResponse | ApiErrorResponse>,
) {
  try {
    if (req.method === "GET") {
      res.status(200).json({ datasets: await listDatasets() });
      return;
    }

    if (req.method === "POST") {
      const saved = await saveDataset((req.body || {}) as Partial<Dataset>);
      res.status(200).json({ datasets: await listDatasets(), saved });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = (req.body || {}) as { id?: string };
      if (!id) {
        res.status(400).json({ error: "A dataset id is required." });
        return;
      }
      res.status(200).json({ datasets: await deleteDataset(id) });
      return;
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save dataset.";
    res.status(500).json({ error: message || "Failed to save dataset." });
  }
}
