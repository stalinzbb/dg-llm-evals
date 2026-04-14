import type {
  GenerationSettings,
  ModelOption,
  NormalizedVariant,
  Run,
  TestCase,
  Variant,
  WorkspacePage,
} from "@/lib/types/domain";
import type { WorkspaceState } from "@/lib/types/workspace";

export function downloadCsv(filename: string, csvString: string): void;
export function createInitialVariant(enabledModelIds?: string[]): Variant;
export function shapeImportedCase(record: Record<string, string>): TestCase;
export function serializeRunRows(runs: Run[]): Record<string, unknown>[];
export function formatModelOption(model: ModelOption): string;
export function formatShortId(value: string, length?: number): string;
export function useWorkspaceState(defaultPage?: WorkspacePage): WorkspaceState;
