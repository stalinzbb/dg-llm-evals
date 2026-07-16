import { normalizeDataset, normalizeEvalDefinition } from "@/lib/eval";
import type { Dataset, EvalDefinition } from "@/lib/types/eval";

export const SEED_DATASET_ID = "dataset_cause_tags";
export const SEED_EVAL_ID = "eval_fundraiser_invite";

/**
 * Example eval recreating the original fundraiser cause-invite evaluator so a
 * fresh install demonstrates variables, datasets, and templates end to end.
 */
export function createSeedDatasets(): Dataset[] {
  return [
    normalizeDataset({
      id: SEED_DATASET_ID,
      name: "Cause tags",
      description: "Reasons a team might be fundraising.",
      values: [
        "Travel",
        "Fees",
        "Equipment",
        "Supplies",
        "Facilities",
        "Scholarships",
        "Celebration",
        "Tournament",
      ],
    }),
  ];
}

export function createSeedEvals(): EvalDefinition[] {
  return [
    normalizeEvalDefinition({
      id: SEED_EVAL_ID,
      name: "Fundraiser cause invite",
      description:
        "Example eval: generate the middle section of a fundraiser invite message from organization details.",
      variables: [
        { key: "org.name", label: "Organization name", defaultSource: "manual", defaultValue: "North Ridge Booster Club", datasetId: null, required: true },
        { key: "team.name", label: "Team name", defaultSource: "manual", defaultValue: "Girls Volleyball", datasetId: null, required: true },
        { key: "org.type", label: "Organization type", defaultSource: "manual", defaultValue: "Sports & Athletics", datasetId: null, required: false },
        { key: "team.activity", label: "Team activity", defaultSource: "manual", defaultValue: "Volleyball", datasetId: null, required: false },
        { key: "team.affiliation", label: "Team affiliation", defaultSource: "manual", defaultValue: "High School", datasetId: null, required: false },
        { key: "cause", label: "Cause tag", defaultSource: "random", datasetId: SEED_DATASET_ID, defaultValue: "", required: false },
        { key: "message.length", label: "Desired message length", defaultSource: "manual", defaultValue: "80-120 words", datasetId: null, required: false },
      ],
      templates: [
        {
          id: "template-1",
          name: "Default invite recipe",
          systemPrompt:
            "You are personalizing a fundraiser organizer's invite message to a potential seller. The fundraiser is a 4-day online pop-up store where supporters buy products and a share of proceeds supports the cause. Return only the middle section of the note. Make it warm, encouraging, child-safe, and motivating so the seller feels invited to join, help the cause, and make an impact. Use only the provided fields. If a cause is provided, treat it as an organizer-approved detail and weave it naturally into the message. Do not invent facts, dates, destinations, goals, incentives, or logistics that are not provided. Do not include links, event codes, sign-off lines, or joining instructions because the prefix and suffix already cover them. You may use emojis sparingly. If the provided fields are insufficient, return EMPTY.",
          userPromptTemplate:
            "The final message has three parts:\n1. Prefix: already written and explains when the fundraiser is happening.\n2. Your middle section: explain why the seller should join, participate, and help the cause.\n3. Suffix: already written and explains how to join.\n\nProvided data:\nOrganization Name: {{org.name}}\nTeam Name: {{team.name}}\nOrganization Type: {{org.type}}\nTeam Activity: {{team.activity}}\nTeam Affiliation: {{team.affiliation}}\nReason for Fundraiser: {{cause}}\nDesired Message Length: {{message.length}}",
          prefixText: "Hey Team! Our fundraiser runs from April 6 - 10.",
          suffixText:
            "\n\nWe're selling award-winning treats and earning 50% of every sale.\n\nVisit our fundraising page to learn how to get started.",
        },
      ],
      rubric: [
        { key: "clarity", label: "Clarity", min: 1, max: 5 },
        { key: "specificity", label: "Specificity", min: 1, max: 5 },
        { key: "fundraiserRelevance", label: "Fundraiser relevance", min: 1, max: 5 },
        { key: "emotionalResonance", label: "Emotional resonance", min: 1, max: 5 },
        { key: "brandSafety", label: "Brand safety", min: 1, max: 5 },
        { key: "overall", label: "Overall", min: 1, max: 5 },
      ],
    }),
  ];
}
