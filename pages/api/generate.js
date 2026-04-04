import { executePlaygroundRun } from "@/lib/runner";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const run = await executePlaygroundRun(req.body);
    res.status(200).json({ run });
  } catch (error) {
    res.status(500).json({ error: error.message || "Generation failed." });
  }
}
