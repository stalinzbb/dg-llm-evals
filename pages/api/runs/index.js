import { getBootstrapData } from "@/lib/store";

export default async function handler(_req, res) {
  try {
    const payload = await getBootstrapData();
    res.status(200).json({ runs: payload.runs });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch runs." });
  }
}
