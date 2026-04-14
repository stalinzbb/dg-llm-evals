import type { NextApiRequest, NextApiResponse } from "next";

import { getAppSettings, saveAppSettings } from "@/lib/store";
import type { ApiErrorResponse, AppSettingsResponse } from "@/lib/types/api";
import type { AppSettings } from "@/lib/types/domain";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AppSettingsResponse | ApiErrorResponse>,
) {
  try {
    if (req.method === "GET") {
      const appSettings = await getAppSettings();
      res.status(200).json({ appSettings });
      return;
    }

    if (req.method === "POST") {
      const appSettings = await saveAppSettings(req.body as Partial<AppSettings>);
      res.status(200).json({ appSettings });
      return;
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save app settings.";
    res.status(500).json({ error: message || "Failed to save app settings." });
  }
}
