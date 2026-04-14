import type { NextApiRequest, NextApiResponse } from "next";

import { filterEnabledModelIds } from "@/lib/constants";
import { saveWorkspaceSettings } from "@/lib/store";
import type { ApiErrorResponse, WorkspaceSettingsResponse } from "@/lib/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkspaceSettingsResponse | ApiErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const enabledModelIds = filterEnabledModelIds((req.body as { enabledModelIds?: string[] })?.enabledModelIds);
    if (!enabledModelIds.length) {
      res.status(400).json({ error: "At least one runnable model must stay enabled." });
      return;
    }

    const settings = await saveWorkspaceSettings({ enabledModelIds });
    res.status(200).json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings.";
    res.status(500).json({ error: message || "Failed to save settings." });
  }
}
