export const CAUSE_TAG_OPTIONS = [
  "Travel",
  "Fees",
  "Equipment",
  "Supplies",
  "Facilites",
  "Scholarships",
  "Celebration",
  "Tournament",
];

export const MODEL_OPTIONS = [
  {
    label: "Gemini 3.1 Pro",
    value: "google/gemini-3.1-pro-preview",
    input: 2,
    output: 12,
    provider: "Google",
  },
  {
    label: "Gemini 3.1 Flash",
    value: "google/gemini-3.1-flash",
    unavailable: true,
    note: "Not currently listed as an OpenRouter model ID",
    provider: "Google",
  },
  {
    label: "Gemini 3.1 Flash Lite",
    value: "google/gemini-3.1-flash-lite-preview",
    input: 0.25,
    output: 1.5,
    provider: "Google",
  },
  {
    label: "GPT-5.4",
    value: "openai/gpt-5.4",
    input: 2.5,
    output: 15,
    provider: "OpenAI",
  },
  {
    label: "GPT-5.4 Mini",
    value: "openai/gpt-5.4-mini",
    input: 0.75,
    output: 4.5,
    provider: "OpenAI",
  },
  {
    label: "Claude Sonnet 4.6",
    value: "anthropic/claude-sonnet-4.6",
    input: 3,
    output: 15,
    provider: "Anthropic",
  },
  {
    label: "Claude Haiku 4.5",
    value: "anthropic/claude-haiku-4.5",
    input: 1,
    output: 5,
    provider: "Anthropic",
  },
  {
    label: "MiniMax M2.5",
    value: "minimax/minimax-m2.5",
    input: 0.118,
    output: 0.99,
    provider: "MiniMax",
  },
  {
    label: "MiniMax M2",
    value: "minimax/minimax-m2",
    input: 0.255,
    output: 1,
    provider: "MiniMax",
  },
  {
    label: "MiniMax M2 Flash",
    value: "minimax/minimax-m2-flash",
    unavailable: true,
    note: "Not currently listed as an OpenRouter model ID",
    provider: "MiniMax",
  },
  {
    label: "GLM 5",
    value: "z-ai/glm-5",
    input: 0.72,
    output: 2.3,
    provider: "Z.ai",
  },
  {
    label: "GLM 4 Turbo",
    value: "z-ai/glm-4-turbo",
    unavailable: true,
    note: "Not currently listed as an OpenRouter model ID",
    provider: "Z.ai",
  },
  {
    label: "GLM 4.7 Flash",
    value: "z-ai/glm-4.7-flash",
    input: 0.06,
    output: 0.4,
    provider: "Z.ai",
  },
  {
    label: "Kimi K2.5",
    value: "moonshotai/kimi-k2.5",
    input: 0.3827,
    output: 1.72,
    provider: "Moonshot AI",
  },
  {
    label: "Kimi K2",
    value: "moonshotai/kimi-k2",
    input: 0.55,
    output: 2.2,
    provider: "Moonshot AI",
  },
  {
    label: "Kimi K2 Flash",
    value: "moonshotai/kimi-k2-flash",
    unavailable: true,
    note: "Not currently listed as an OpenRouter model ID",
    provider: "Moonshot AI",
  },
];

export const DEFAULT_ENABLED_MODEL_IDS = MODEL_OPTIONS.filter((model) => !model.unavailable).map(
  (model) => model.value,
);

export function getRunnableModelOptions() {
  return MODEL_OPTIONS.filter((model) => !model.unavailable);
}

export function filterEnabledModelIds(input = []) {
  const validModelIds = new Set(getRunnableModelOptions().map((model) => model.value));
  const requestedIds = Array.isArray(input) ? input : [];
  return requestedIds.filter((value, index) => {
    return typeof value === "string" && validModelIds.has(value) && requestedIds.indexOf(value) === index;
  });
}

export function normalizeEnabledModelIds(input = []) {
  const normalizedIds = filterEnabledModelIds(input);

  return normalizedIds.length ? normalizedIds : DEFAULT_ENABLED_MODEL_IDS;
}

export function getEnabledModelOptions(enabledModelIds = DEFAULT_ENABLED_MODEL_IDS) {
  const enabledIds = new Set(normalizeEnabledModelIds(enabledModelIds));
  return getRunnableModelOptions().filter((model) => enabledIds.has(model.value));
}

export function getDefaultEnabledModelId(enabledModelIds = DEFAULT_ENABLED_MODEL_IDS) {
  return getEnabledModelOptions(enabledModelIds)[0]?.value || DEFAULT_ENABLED_MODEL_IDS[0] || "";
}

export const MODEL_PRICING = Object.fromEntries(
  getRunnableModelOptions().map((model) => [
    model.value,
    { input: model.input, output: model.output },
  ]),
);

export const DEFAULT_TEST_CASE = {
  name: "",
  organizationName: "North Ridge Booster Club",
  teamName: "Girls Volleyball",
  organizationType: "Sports & Athletics",
  teamActivity: "Volleyball",
  teamAffiliation: "High School",
  causeTags: ["Travel", "Fees", "Equipment"],
  messageLength: "80-120 words",
};

export const DEFAULT_PROMPT_TEMPLATE = {
  name: "Default fundraiser recipe",
  systemPrompt:
    "Double Good is a virtual fundraising platform that enables groups, teams, and youth-oriented causes to raise funds through a 4-day Pop-Up Store model. Sellers create personalized online stores to sell fresh, made-to-order popcorn, with 50% of proceeds directly supporting their cause. This virtual method provides 3x more sales than traditional fundraising methods. Organizers create an event in the app, share an event code with participants, and each seller creates a Pop-Up Store link to share during the short 4-day fundraiser. You are personalizing the organizer's invite message to a potential seller. Return only the middle section of the note. Make it warm, encouraging, child-safe, and motivating so the seller feels invited to join, help the cause, and make an impact. Use only the provided fields. If selected_cause_tags are provided, treat them as organizer-approved details and weave at least one of them naturally into the message. Do not invent facts, dates, destinations, goals, incentives, or logistics that are not provided. Do not include links, event codes, sign-off lines, or step-by-step joining instructions because the suffix already covers how to join. You may use emojis sparingly if they help the message feel warm and personal. Keep the response readable and engaging within the character budget provided. If the provided fields are insufficient, return EMPTY.",
  userPromptTemplate:
    "The final message has three parts:\n1. Prefix: already written and explains when the fundraiser is happening.\n2. Your middle section: explain why the seller should join, participate, and help the cause.\n3. Suffix: already written and explains how to join.\nThe full final message must be no more than ${INVITE_TEAM_MESSAGE_MAX_LENGTH} display characters.\nYour section may use up to ${maxMiddleLength} display characters.\nPrefix: \"${getPromptPrefix(context)}\"\nSuffix: \"${getPromptSuffix(options, context)}\"\nProvided data:\n${getStructuredPrompt(context, maxMiddleLength)}",
  prefixText: "Hey Team! Our Double Good fundraiser runs from April 6 - 10",
  suffixText:
    "\n\n\nWe're selling Double Good's award-winning popcorn and earning 50% of every sale.\n\n\nVisit our fundraising page to learn more on how to get started.\n\n\n" +
    "dgpopup.store/random-store-link",
  messageLengthInstruction: "80-120 words",
  isActive: true,
};

export const DEFAULT_GENERATION_SETTINGS = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 180,
  seed: "",
};

export const DEFAULT_RUBRIC = {
  clarity: 3,
  specificity: 3,
  fundraiserRelevance: 3,
  emotionalResonance: 3,
  brandSafety: 3,
  overall: 3,
};
