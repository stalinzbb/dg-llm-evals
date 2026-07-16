import type {
  ApiErrorResponse,
  AppSettingsResponse,
  BootstrapResponse,
  EvalRunRequest,
  RunResponse,
  RunsResponse,
  SaveRatingRequest,
  WorkspaceSettingsResponse,
} from "@/lib/types/api";
import type { AppSettings, WorkspaceSettings } from "@/lib/types/domain";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";
import { readStoredOpenRouterKey } from "@/lib/workspace-browser";

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

function buildGenerationHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = readStoredOpenRouterKey();
  if (apiKey) {
    headers["x-openrouter-key"] = apiKey;
  }
  return headers;
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

export function generateRunRequest(payload: EvalRunRequest) {
  return requestJson<RunResponse>("/api/generate", {
    method: "POST",
    headers: buildGenerationHeaders(),
    body: JSON.stringify(payload),
  });
}

export function batchRunRequest(payload: EvalRunRequest) {
  return requestJson<RunResponse>("/api/batch-runs", {
    method: "POST",
    headers: buildGenerationHeaders(),
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

export function fetchEvalsRequest() {
  return requestJson<{ evals: EvalDefinition[] }>("/api/evals");
}

export function saveEvalRequest(entry: Partial<EvalDefinition>) {
  return requestJson<{ evals: EvalDefinition[]; saved?: EvalDefinition }>("/api/evals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export function deleteEvalRequest(id: string) {
  return requestJson<{ evals: EvalDefinition[] }>("/api/evals", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export function fetchDatasetsRequest() {
  return requestJson<{ datasets: Dataset[] }>("/api/datasets");
}

export function saveDatasetRequest(entry: Partial<Dataset>) {
  return requestJson<{ datasets: Dataset[]; saved?: Dataset }>("/api/datasets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export function deleteDatasetRequest(id: string) {
  return requestJson<{ datasets: Dataset[] }>("/api/datasets", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
