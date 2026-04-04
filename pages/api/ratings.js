import { getRunById, saveRating } from "@/lib/store";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    await saveRating(req.body);
    const run = await getRunById(req.body.runId);
    res.status(200).json({ run });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save rating." });
  }
}
