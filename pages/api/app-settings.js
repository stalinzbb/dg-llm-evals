import { getAppSettings, saveAppSettings } from "@/lib/store";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const appSettings = await getAppSettings();
      res.status(200).json({ appSettings });
      return;
    }

    if (req.method === "POST") {
      const appSettings = await saveAppSettings(req.body);
      res.status(200).json({ appSettings });
      return;
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save app settings." });
  }
}
