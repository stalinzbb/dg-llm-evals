import type {
  ApiErrorResponse,
  AppSettingsResponse,
  BatchRunRequest,
  BootstrapResponse,
  GenerateRunRequest,
  PromptTemplatesResponse,
  RunResponse,
  RunsResponse,
  SaveRatingRequest,
  SourcePoolImportResponse,
  SourcePoolRandomResponse,
  SourcePoolSampleResponse,
  SourcePoolStatsResponse,
  TestCasesResponse,
  WorkspaceSettingsResponse,
} from "@/lib/types/api";
import type { AppSettings, PromptTemplate, TestCase, WorkspaceSettings } from "@/lib/types/domain";

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    const payload = (await response.json()) as T | ApiErrorResponse;
    if (!response.ok) {
      throw new Error((payload as ApiErrorResponse).error || "Request failed.");
    }
    return payload as T;
  }

  const text = await response.text();
  const normalizedText = text.trim();

  if (!response.ok) {
    if (normalizedText.includes("Authentication Required")) {
      throw new Error(
        "Request was blocked by deployment protection. Sign in to the preview deployment or disable Vercel Authentication for that environment.",
      );
    }

    if (normalizedText.startsWith("Request Entity Too Large")) {
      throw new Error("Upload failed because the request body is too large. Split the CSV into smaller files.");
    }

    throw new Error(normalizedText.slice(0, 240) || "Request failed.");
  }

  throw new Error(
    `Expected JSON but received ${contentType || "an unknown response type"}. ${normalizedText.slice(0, 160)}`,
  );
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  return readJson<T>(await fetch(input, init));
}

export function fetchBootstrap() {
  return requestJson<BootstrapResponse>("/api/bootstrap");
}

export function saveAppSettingsRequest(appSettings: AppSettings) {
  return requestJson<AppSettingsResponse>("/api/app-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appSettings),
  });
}

export function saveWorkspaceSettingsRequest(settings: Partial<WorkspaceSettings>) {
  return requestJson<WorkspaceSettingsResponse>("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

export function saveTestCasesRequest(entries: TestCase[] | TestCase) {
  return requestJson<TestCasesResponse>("/api/test-cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });
}

export function deleteTestCaseRequest(id: string) {
  return requestJson<TestCasesResponse>("/api/test-cases", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export function savePromptTemplateRequest(prompt: PromptTemplate) {
  return requestJson<PromptTemplatesResponse>("/api/prompt-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prompt),
  });
}

export function deletePromptTemplateRequest(id: string) {
  return requestJson<PromptTemplatesResponse>("/api/prompt-templates", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export function generateRunRequest(payload: GenerateRunRequest) {
  return requestJson<RunResponse>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function batchRunRequest(payload: BatchRunRequest) {
  return requestJson<RunResponse>("/api/batch-runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchRunsRequest() {
  return requestJson<RunsResponse>("/api/runs");
}

export function saveRatingRequest(payload: SaveRatingRequest) {
  return requestJson<RunResponse>("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchSourcePoolStatsRequest() {
  return requestJson<SourcePoolStatsResponse>("/api/source-pool");
}

export function importSourcePoolChunkRequest(entries: Record<string, string>[], replace: boolean) {
  return requestJson<SourcePoolImportResponse>("/api/source-pool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "import",
      entries,
      replace,
    }),
  });
}

export function randomSourcePoolRowRequest(verificationFilter: "any" | "verified" | "unverified" = "any") {
  return requestJson<SourcePoolRandomResponse>("/api/source-pool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "random", verificationFilter }),
  });
}

export function sampleSourcePoolRequest(options: {
  count: number;
  verificationFilter: "any" | "verified" | "unverified";
}) {
  return requestJson<SourcePoolSampleResponse>("/api/source-pool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sample",
      count: options.count,
      verificationFilter: options.verificationFilter,
    }),
  });
}
