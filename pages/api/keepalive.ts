import type { NextApiRequest, NextApiResponse } from "next";

import { createClient } from "@supabase/supabase-js";

/**
 * Lightweight endpoint for uptime pings. Performs one cheap Supabase query so
 * free-tier projects are not paused for inactivity. Hit it on a schedule
 * (e.g. the GitHub Actions workflow in .github/workflows/keepalive.yml).
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    res.status(200).json({ ok: true, storage: "local", pinged: false });
    return;
  }

  try {
    const client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.from("app_settings").select("id").limit(1);
    if (error) {
      throw error;
    }
    res.status(200).json({ ok: true, storage: "supabase", pinged: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Keepalive query failed.";
    res.status(500).json({ ok: false, error: message });
  }
}
