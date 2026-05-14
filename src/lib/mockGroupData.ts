// Mock group data for Network → Groups tab

export interface Group {
  id: string;
  name: string;
  userCount: number;
  creator: string;
  dateCreated: Date;
}

const NAMES = [
  "sam calmes",
  "Group modal closes",
  "Thurs - Group (1 user w 1w/out Reviewer role)",
  "Thurs - Group (1 user w/out reviewer role)",
  "Thurs - Group (no users)",
  "Advocate only group",
  "Legal Review Team (All Assigned Reviewer Role)",
  "Media Approvals Group (1/2 are Reviewers)",
  "Test Group 01/06/2026",
  "Request Testing Group",
  "tell testing group",
  "wer",
  "Marketing Champions",
  "Brand Stewards",
  "EMEA Influencers",
  "NA Athletes",
  "APAC Creators",
  "Q1 Launch Squad",
  "Internal QA Pool",
  "Onboarding Cohort",
  "Press & Analyst",
  "Beta Reviewers",
  "External Partners",
  "Executive Visibility",
  "Pilot Test Group",
];

const CREATORS = [
  "Sam Calmes (GF Admin)",
  "Greg Lindahl TestAdmin",
  "Amber Johnson (Admin)",
  "Test514 Auto467",
  "Tell Vickers (Producer)",
  "cristi admin",
  "Maria Chen (Admin)",
];

function pickCreator(i: number): string {
  return CREATORS[i % CREATORS.length];
}

export const mockGroups: Group[] = NAMES.map((name, i) => ({
  id: `g${i}`,
  name,
  userCount: (i * 7) % 12,
  creator: pickCreator(i),
  dateCreated: new Date(2026 - Math.floor(i / 10), (i * 3) % 12, ((i * 5) % 28) + 1),
}));

export function getUniqueGroupCreators(): string[] {
  return Array.from(new Set(mockGroups.map(g => g.creator)));
}
