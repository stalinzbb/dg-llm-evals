import { getBootstrapData, savePromptTemplate } from "@/lib/store";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const payload = await getBootstrapData();
      res.status(200).json({ promptTemplates: payload.promptTemplates });
      return;
    }

    if (req.method === "POST") {
      await savePromptTemplate(req.body);
      const payload = await getBootstrapData();
      res.status(200).json({ promptTemplates: payload.promptTemplates });
      return;
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save prompt template." });
  }
}
