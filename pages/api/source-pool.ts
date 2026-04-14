import type { NextApiRequest, NextApiResponse } from "next";

import { parseCsv } from "@/lib/csv";
import {
  getRandomSourcePoolRecord,
  getSourcePoolStats,
  importSourcePool,
  sampleSourcePool,
} from "@/lib/store";
import type {
  ApiErrorResponse,
  SourcePoolImportResponse,
  SourcePoolRandomResponse,
  SourcePoolRequest,
  SourcePoolSampleResponse,
  SourcePoolStatsResponse,
} from "@/lib/types/api";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

type SourcePoolResponse =
  | SourcePoolStatsResponse
  | SourcePoolImportResponse
  | SourcePoolRandomResponse
  | SourcePoolSampleResponse
  | ApiErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SourcePoolResponse>,
) {
  try {
    if (req.method === "GET") {
      const stats = await getSourcePoolStats();
      res.status(200).json({ stats });
      return;
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as {
        action?: SourcePoolRequest["action"];
        entries?: Record<string, string>[];
        csvText?: string;
        replace?: boolean;
        verificationFilter?: "any" | "verified" | "unverified";
        count?: number | string;
      };
      const action = body.action || "stats";

      if (action === "import") {
        const replace = body.replace !== false;
        const entries = Array.isArray(body.entries) ? body.entries : parseCsv(body.csvText || "");
        const payload = await importSourcePool(entries, { replace });
        res.status(200).json(payload);
        return;
      }

      if (action === "random") {
        const verificationFilter = body.verificationFilter || "any";
        const row = await getRandomSourcePoolRecord(verificationFilter);
        res.status(200).json({ row });
        return;
      }

      if (action === "sample") {
        const payload = await sampleSourcePool({
          count: Number(body.count) || 1,
          verificationFilter: body.verificationFilter || "any",
        });
        res.status(200).json(payload);
        return;
      }

      res.status(400).json({ error: "Unknown source-pool action." });
      return;
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Source pool request failed.";
    res.status(500).json({ error: message || "Source pool request failed." });
  }
}
