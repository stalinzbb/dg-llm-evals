import { deleteTestCase, getBootstrapData, saveTestCases } from "@/lib/store";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const payload = await getBootstrapData();
      res.status(200).json({ testCases: payload.testCases });
      return;
    }

    if (req.method === "POST") {
      const entries = req.body.entries || req.body;
      await saveTestCases(entries);
      const payload = await getBootstrapData();
      res.status(200).json({ testCases: payload.testCases });
      return;
    }

    if (req.method === "DELETE") {
      await deleteTestCase(req.body.id);
      const payload = await getBootstrapData();
      res.status(200).json({ testCases: payload.testCases });
      return;
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save test cases." });
  }
}
