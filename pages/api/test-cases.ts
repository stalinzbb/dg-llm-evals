import type { NextApiRequest, NextApiResponse } from "next";

import { deleteTestCase, getBootstrapData, saveTestCases } from "@/lib/store";
import type { ApiErrorResponse, TestCasesResponse } from "@/lib/types/api";
import type { TestCase } from "@/lib/types/domain";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestCasesResponse | ApiErrorResponse>,
) {
  try {
    if (req.method === "GET") {
      const payload = await getBootstrapData();
      res.status(200).json({ testCases: payload.testCases });
      return;
    }

    if (req.method === "POST") {
      const body = req.body as { entries?: TestCase[] } | TestCase | undefined;
      const entries = body && "entries" in body ? (body.entries ?? body) : body;
      await saveTestCases((entries || []) as TestCase[] | TestCase);
      const payload = await getBootstrapData();
      res.status(200).json({ testCases: payload.testCases });
      return;
    }

    if (req.method === "DELETE") {
      await deleteTestCase((req.body as { id: string }).id);
      const payload = await getBootstrapData();
      res.status(200).json({ testCases: payload.testCases });
      return;
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save test cases.";
    res.status(500).json({ error: message || "Failed to save test cases." });
  }
}
