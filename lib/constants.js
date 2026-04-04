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
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
];

export const MODEL_PRICING = {
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
  "anthropic/claude-3.5-haiku": { input: 0.8, output: 4 },
  "google/gemini-2.0-flash-001": { input: 0.1, output: 0.4 },
  "meta-llama/llama-3.3-70b-instruct": { input: 0.59, output: 0.79 },
};

export const DEFAULT_TEST_CASE = {
  name: "Spring travel push",
  organizationName: "North Ridge Booster Club",
  teamName: "Girls Volleyball",
  organizationType: "School Booster Club",
  teamActivity: "Regional tournaments",
  teamAffiliation: "Public high school athletics",
  causeTags: ["travel", "fees", "equipment"],
  messageLength: "80-120 words",
};

export const DEFAULT_PROMPT_TEMPLATE = {
  name: "Balanced fundraiser ask",
  systemPrompt:
    "You write concise, donor-friendly fundraiser cause statements for sports and school teams. Ground the message in the supplied facts, stay specific, and avoid exaggeration or invented details.",
  userPromptTemplate:
    "Write a cause statement for the fundraiser using the details below. Make it warm, credible, and easy to scan. Keep the tone appreciative and community-oriented.",
  prefixText: "Hi! We are fundraising for ",
  suffixText:
    "Thanks for supporting our team and helping us keep opportunities accessible for every athlete.",
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
