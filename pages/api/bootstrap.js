import { getBootstrapData } from "@/lib/store";

export default async function handler(_req, res) {
  try {
    const payload = await getBootstrapData();
    res.status(200).json({
      ...payload,
      sourcePoolStats: payload?.sourcePoolStats || { total: 0, verified: 0, unverified: 0 },
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      gateEnabled: Boolean(process.env.APP_ACCESS_PASSWORD),
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load bootstrap data." });
  }
}
