import * as localStore from "@/lib/local-store";
import * as supabaseStore from "@/lib/supabase-store";

async function withFallback(method, ...args) {
  try {
    const supabaseResult = await supabaseStore[method](...args);
    if (supabaseResult !== null) {
      return supabaseResult;
    }
  } catch (error) {
    console.error(`Supabase store failed for ${method}, falling back to local store.`, error);
  }

  return localStore[method](...args);
}

export function getBootstrapData(...args) {
  return withFallback("getBootstrapData", ...args);
}

export function getAppSettings(...args) {
  return withFallback("getAppSettings", ...args);
}

export function listTestCasesByIds(...args) {
  return withFallback("listTestCasesByIds", ...args);
}

export function getPromptTemplateById(...args) {
  return withFallback("getPromptTemplateById", ...args);
}

export function saveTestCases(...args) {
  return withFallback("saveTestCases", ...args);
}

export function saveAppSettings(...args) {
  return withFallback("saveAppSettings", ...args);
}

export function savePromptTemplate(...args) {
  return withFallback("savePromptTemplate", ...args);
}

export function createRun(...args) {
  return withFallback("createRun", ...args);
}

export function updateRun(...args) {
  return withFallback("updateRun", ...args);
}

export function addVariantResult(...args) {
  return withFallback("addVariantResult", ...args);
}

export function saveRating(...args) {
  return withFallback("saveRating", ...args);
}

export function getRunById(...args) {
  return withFallback("getRunById", ...args);
}
