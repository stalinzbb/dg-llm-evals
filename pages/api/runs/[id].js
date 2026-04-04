import { getRunById } from "@/lib/store";

export default async function handler(req, res) {
  try {
    const run = await getRunById(req.query.id);
    if (!run) {
      res.status(404).json({ error: "Run not found." });
      return;
    }
    res.status(200).json({ run });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch run." });
  }
}
