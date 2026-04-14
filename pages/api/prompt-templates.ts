import type { NextApiRequest, NextApiResponse } from "next";

import { deletePromptTemplate, getBootstrapData, savePromptTemplate } from "@/lib/store";
import type { ApiErrorResponse, PromptTemplatesResponse, SavePromptTemplateRequest } from "@/lib/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PromptTemplatesResponse | ApiErrorResponse>,
) {
  try {
    if (req.method === "GET") {
      const payload = await getBootstrapData();
      res.status(200).json({ promptTemplates: payload.promptTemplates });
      return;
    }

    if (req.method === "POST") {
      await savePromptTemplate(req.body as SavePromptTemplateRequest);
      const payload = await getBootstrapData();
      res.status(200).json({ promptTemplates: payload.promptTemplates });
      return;
    }

    if (req.method === "DELETE") {
      await deletePromptTemplate((req.body as { id: string }).id);
      const payload = await getBootstrapData();
      res.status(200).json({ promptTemplates: payload.promptTemplates });
      return;
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save prompt template.";
    res.status(500).json({ error: message || "Failed to save prompt template." });
  }
}
