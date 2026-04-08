import { filterEnabledModelIds } from "@/lib/constants";
import { saveWorkspaceSettings } from "@/lib/store";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const enabledModelIds = filterEnabledModelIds(req.body?.enabledModelIds);
    if (!enabledModelIds.length) {
      res.status(400).json({ error: "At least one runnable model must stay enabled." });
      return;
    }

    const settings = await saveWorkspaceSettings({ enabledModelIds });
    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save settings." });
  }
}
