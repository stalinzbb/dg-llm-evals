import { parseCsv } from "@/lib/csv";
import {
  getRandomSourcePoolRecord,
  getSourcePoolStats,
  importSourcePool,
  sampleSourcePool,
} from "@/lib/store";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const stats = await getSourcePoolStats();
      res.status(200).json({ stats });
      return;
    }

    if (req.method === "POST") {
      const action = req.body?.action || "stats";

      if (action === "import") {
        const csvText = req.body?.csvText || "";
        const records = parseCsv(csvText);
        const payload = await importSourcePool(records);
        res.status(200).json(payload);
        return;
      }

      if (action === "random") {
        const verificationFilter = req.body?.verificationFilter || "any";
        const row = await getRandomSourcePoolRecord(verificationFilter);
        res.status(200).json({ row });
        return;
      }

      if (action === "sample") {
        const payload = await sampleSourcePool({
          count: Number(req.body?.count) || 1,
          verificationFilter: req.body?.verificationFilter || "any",
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
    res.status(500).json({ error: error.message || "Source pool request failed." });
  }
}
