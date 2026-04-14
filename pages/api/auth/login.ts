import type { NextApiRequest, NextApiResponse } from "next";

import type { ApiErrorResponse, AuthSuccessResponse } from "@/lib/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthSuccessResponse | ApiErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  if (!configuredPassword) {
    res.status(200).json({ ok: true });
    return;
  }

  if ((req.body as { password?: string }).password !== configuredPassword) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `dg_eval_gate=${encodeURIComponent(
      configuredPassword,
    )}; Max-Age=43200; Path=/; HttpOnly; SameSite=Lax${secureFlag}`,
  );

  res.status(200).json({ ok: true });
}
