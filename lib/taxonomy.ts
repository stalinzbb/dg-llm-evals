interface TeamActivityEntry {
  teamActivity: string;
  teamAffiliations: string[];
}

interface OrganizationTaxonomyEntry {
  organizationType: string;
  activities: TeamActivityEntry[];
}

interface TeamActivityConfig {
  mode: "text" | "select";
  options: string[];
}

interface TeamAffiliationConfig extends TeamActivityConfig {
  allowsOther: boolean;
}

const OPEN_TEXT = "Open Text";
const OTHER = "Other";

export const TAXONOMY_OPTIONS: OrganizationTaxonomyEntry[] = [
  {
    organizationType: "Arts & Culture",
    activities: [
      { teamActivity: "Arts Education", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Audio/Visual", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Band", teamAffiliations: ["High School", OTHER] },
      { teamActivity: "Choir", teamAffiliations: ["High School", OTHER] },
      { teamActivity: "Dance", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Music", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Orchestra", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Performing Arts Center", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Speech & Debate", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Show Choir", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Theatre", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Visual Arts", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Other (No Open Text)", teamAffiliations: [OPEN_TEXT] },
    ],
  },
  {
    organizationType: "Associations, Clubs & Community",
    activities: [
      { teamActivity: "Alumni Associations", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Community Organizations", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Corporate Foundations", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Cultural Social Club", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Diversity, Equity & Inclusion", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Fraternal Societies & Lodges", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Grantmaking Foundations", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Military & Veterans Organizations", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Parks & Playgrounds", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Public Foundations", teamAffiliations: [OPEN_TEXT] },
      {
        teamActivity: "Service & Leadership",
        teamAffiliations: ["Jack and Jill of America", "The Links", OTHER],
      },
      { teamActivity: "Other (No Open Text)", teamAffiliations: [OPEN_TEXT] },
    ],
  },
  {
    organizationType: "Education & Academics",
    activities: [
      { teamActivity: "Pre-K", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "DECA", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Elementary School", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Future Business Leaders of America", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "High School", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Higher Education", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Middle School", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Parent & Teacher Groups", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Preschools & Daycare", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Scholarships & Student Financial Aid", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Science Olympiad", teamAffiliations: ["High School", OTHER] },
      { teamActivity: "SkillsUSA", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Stayover or Day Camps", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Student Council & Student Government", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Student Services", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Other", teamAffiliations: [OPEN_TEXT] },
    ],
  },
  {
    organizationType: "Health & Wellness",
    activities: [
      { teamActivity: "American Red Cross", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Community Health", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Hospitals & Health Centers", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Patient & Family Support", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Research", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Other", teamAffiliations: [OPEN_TEXT] },
    ],
  },
  {
    organizationType: "Religious Organization",
    activities: [
      { teamActivity: "Interfaith Coalitions", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Ministry", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Place of Worship", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Youth Group", teamAffiliations: [OPEN_TEXT] },
      { teamActivity: "Other", teamAffiliations: [OPEN_TEXT] },
    ],
  },
  {
    organizationType: "Sororities & Fraternities",
    activities: [
      {
        teamActivity: "Fraternities",
        teamAffiliations: [
          "Alpha Phi Alpha",
          "Kappa Alpha Psi",
          "Omega Psi Phi",
          "Phi Beta Sigma",
          "Iota Phi Theta",
          OTHER,
        ],
      },
      {
        teamActivity: "Sororities",
        teamAffiliations: [
          "Alpha Kappa Alpha",
          "Delta Sigma Theta",
          "Sigma Gamma Rho",
          "Zeta Phi Beta",
          OTHER,
        ],
      },
    ],
  },
  {
    organizationType: "Sports & Athletics",
    activities: [
      { teamActivity: "All Sports", teamAffiliations: ["High School", OTHER] },
      {
        teamActivity: "Baseball",
        teamAffiliations: ["AAU", "Babe Ruth League", "High School", "Little League", "Travel", OTHER],
      },
      { teamActivity: "Basketball", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Bowling", teamAffiliations: ["AAU", "High School", OTHER] },
      {
        teamActivity: "Cheerleading",
        teamAffiliations: [
          "AAU",
          "All Star USASF",
          "All Star Other",
          "AYF",
          "Pop Warner",
          "Recreational",
          "School",
          "USA Cheer",
          OTHER,
        ],
      },
      { teamActivity: "Cross Country", teamAffiliations: ["High School", OTHER] },
      {
        teamActivity: "Dance",
        teamAffiliations: ["All Star", "AAU", "Competitive", "Recreational", "High School", OTHER],
      },
      { teamActivity: "Equestrian", teamAffiliations: [OPEN_TEXT] },
      {
        teamActivity: "Esports",
        teamAffiliations: ["College", "High School", "Middle School", "Professional", OTHER],
      },
      {
        teamActivity: "Football",
        teamAffiliations: ["AAU", "AYF", "High School", "NFL Flag Football", "Pop Warner", "Youth League Other", OTHER],
      },
      { teamActivity: "Golf", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Gymnastics", teamAffiliations: ["AAU", "High School", "USAG", OTHER] },
      { teamActivity: "Ice Hockey", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Lacrosse", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Rugby", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Soccer", teamAffiliations: ["AAU", "High School", "US Youth Soccer", OTHER] },
      { teamActivity: "Softball", teamAffiliations: ["AAU", "High School", "Travel", OTHER] },
      { teamActivity: "Swimming & Other Water Sports", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Tennis & Other Racquet Sports", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Track & Field", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Unified Sports", teamAffiliations: ["High School", OTHER] },
      { teamActivity: "Volleyball", teamAffiliations: ["AAU", "JVA", "High School", OTHER] },
      { teamActivity: "Wrestling", teamAffiliations: ["AAU", "High School", OTHER] },
      { teamActivity: "Other", teamAffiliations: [OPEN_TEXT] },
    ],
  },
  {
    organizationType: "Other",
    activities: [{ teamActivity: OPEN_TEXT, teamAffiliations: [] }],
  },
];

export const DEFAULT_TAXONOMY_SELECTION = {
  organizationType: "Sports & Athletics",
  teamActivity: "Volleyball",
  teamAffiliation: "High School",
};

function findOrganizationEntry(organizationType: string): OrganizationTaxonomyEntry {
  return (
    TAXONOMY_OPTIONS.find((entry) => entry.organizationType === organizationType) ||
    TAXONOMY_OPTIONS.find(
      (entry) => entry.organizationType === DEFAULT_TAXONOMY_SELECTION.organizationType,
    ) ||
    TAXONOMY_OPTIONS[0]
  );
}

function findActivityEntry(organizationType: string, teamActivity: string): TeamActivityEntry | null {
  const organizationEntry = findOrganizationEntry(organizationType);
  return (
    organizationEntry.activities.find((activity) => activity.teamActivity === teamActivity) ||
    organizationEntry.activities[0] ||
    null
  );
}

export function getOrganizationTypeOptions(): string[] {
  return TAXONOMY_OPTIONS.map((entry) => entry.organizationType);
}

export function getTeamActivityConfig(organizationType: string): TeamActivityConfig {
  const organizationEntry = findOrganizationEntry(organizationType);
  const activities = organizationEntry?.activities || [];
  const isOpenText = activities.length === 1 && activities[0]?.teamActivity === OPEN_TEXT;

  return {
    mode: isOpenText ? "text" : "select",
    options: isOpenText ? [] : activities.map((activity) => activity.teamActivity),
  };
}

export function getTeamAffiliationConfig(
  organizationType: string,
  teamActivity: string,
): TeamAffiliationConfig {
  const teamActivityConfig = getTeamActivityConfig(organizationType);
  if (teamActivityConfig.mode === "text") {
    return { mode: "text", options: [], allowsOther: true };
  }

  const activityEntry = findActivityEntry(organizationType, teamActivity);
  const teamAffiliations = activityEntry?.teamAffiliations || [];
  const isOpenText = teamAffiliations.length === 0 || (teamAffiliations.length === 1 && teamAffiliations[0] === OPEN_TEXT);

  return {
    mode: isOpenText ? "text" : "select",
    options: isOpenText ? [] : teamAffiliations,
    allowsOther: !isOpenText && teamAffiliations.includes(OTHER),
  };
}

export function normalizeTaxonomySelection(input: {
  organizationType?: string;
  teamActivity?: string;
  teamAffiliation?: string;
} = {}) {
  const organizationTypeInput = input.organizationType?.trim();
  const organizationType = getOrganizationTypeOptions().includes(organizationTypeInput ?? "")
    ? organizationTypeInput ?? DEFAULT_TAXONOMY_SELECTION.organizationType
    : DEFAULT_TAXONOMY_SELECTION.organizationType;

  const activityConfig = getTeamActivityConfig(organizationType);
  const rawTeamActivity = input.teamActivity?.trim() || "";
  const defaultTeamActivity =
    organizationType === DEFAULT_TAXONOMY_SELECTION.organizationType &&
    activityConfig.options.includes(DEFAULT_TAXONOMY_SELECTION.teamActivity)
      ? DEFAULT_TAXONOMY_SELECTION.teamActivity
      : activityConfig.options[0] || "";
  const teamActivity =
    activityConfig.mode === "text"
      ? rawTeamActivity
      : activityConfig.options.includes(rawTeamActivity)
        ? rawTeamActivity
        : defaultTeamActivity;

  const affiliationConfig = getTeamAffiliationConfig(organizationType, teamActivity);
  const rawTeamAffiliation = input.teamAffiliation?.trim() || "";
  const defaultTeamAffiliation =
    organizationType === DEFAULT_TAXONOMY_SELECTION.organizationType &&
    teamActivity === DEFAULT_TAXONOMY_SELECTION.teamActivity &&
    affiliationConfig.options.includes(DEFAULT_TAXONOMY_SELECTION.teamAffiliation)
      ? DEFAULT_TAXONOMY_SELECTION.teamAffiliation
      : affiliationConfig.options.find((option) => option !== OTHER) ||
        affiliationConfig.options[0] ||
        "";
  let teamAffiliation = "";

  if (affiliationConfig.mode === "text") {
    teamAffiliation = rawTeamAffiliation;
  } else if (affiliationConfig.options.includes(rawTeamAffiliation)) {
    teamAffiliation = rawTeamAffiliation;
  } else if (rawTeamAffiliation && affiliationConfig.allowsOther) {
    teamAffiliation = rawTeamAffiliation;
  } else {
    teamAffiliation = defaultTeamAffiliation;
  }

  return {
    organizationType,
    teamActivity,
    teamAffiliation,
  };
}
