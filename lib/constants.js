export const CAUSE_TAG_OPTIONS = [
  "tournament",
  "fees",
  "equipment",
  "travel",
  "scholarships",
  "uniforms",
  "facilities",
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

export const MODEL_PRICING = Object.fromEntries(
  MODEL_OPTIONS.filter((model) => !model.unavailable).map((model) => [
    model.value,
    { input: model.input, output: model.output },
  ]),
);

export const DEFAULT_TEST_CASE = {
  name: "",
  organizationName: "North Ridge Booster Club",
  teamName: "Girls Volleyball",
  organizationType: "School Booster Club",
  teamActivity: "Regional tournaments",
  teamAffiliation: "Public high school athletics",
  causeTags: ["travel", "fees", "equipment"],
  messageLength: "80-120 words",
};

export const DEFAULT_PROMPT_TEMPLATE = {
  name: "Default fundraiser recipe",
  systemPrompt:
    "You write concise, donor-friendly fundraiser cause statements for sports and school teams. Ground the message in the supplied facts, stay specific, and avoid exaggeration or invented details.",
  userPromptTemplate:
    "Write a cause statement for the fundraiser using the details below. Make it warm, credible, and easy to scan. Keep the tone appreciative and community-oriented.",
  prefixText: "Hi! We are fundraising for ",
  suffixText:
    "Thanks for supporting our team and helping us keep opportunities accessible for every athlete.",
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
