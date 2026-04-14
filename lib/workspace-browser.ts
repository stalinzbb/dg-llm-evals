import { normalizeAppSettings } from "@/lib/app-settings";
import { normalizeEnabledModelIds } from "@/lib/constants";
import type { AppSettings, Theme, WorkspaceSettings } from "@/lib/types/domain";

export const APP_SETTINGS_STORAGE_KEY = "dg-evals-app-settings-v1";
export const MODEL_SETTINGS_STORAGE_KEY = "dg-evals-model-settings-v1";
export const THEME_STORAGE_KEY = "dg-evals-theme";

export function readBrowserAppSettings(fallback: AppSettings): AppSettings {
  if (typeof window === "undefined") {
    return normalizeAppSettings(fallback);
  }

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    return raw ? normalizeAppSettings(JSON.parse(raw)) : normalizeAppSettings(fallback);
  } catch {
    return normalizeAppSettings(fallback);
  }
}

export function writeBrowserAppSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeAppSettings(settings)));
}

export function readBrowserModelSettings(
  fallback: WorkspaceSettings,
): WorkspaceSettings {
  if (typeof window === "undefined") {
    return {
      enabledModelIds: normalizeEnabledModelIds(fallback?.enabledModelIds),
    };
  }

  try {
    const raw = window.localStorage.getItem(MODEL_SETTINGS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WorkspaceSettings) : fallback;
    return {
      enabledModelIds: normalizeEnabledModelIds(parsed?.enabledModelIds),
    };
  } catch {
    return {
      enabledModelIds: normalizeEnabledModelIds(fallback?.enabledModelIds),
    };
  }
}

export function writeBrowserModelSettings(settings: WorkspaceSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    MODEL_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      enabledModelIds: normalizeEnabledModelIds(settings?.enabledModelIds),
    }),
  );
}

export function applyThemePreference(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
}

export function writeStoredTheme(theme: Theme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
